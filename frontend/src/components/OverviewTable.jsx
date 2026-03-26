import React, { useState, useMemo } from "react";
import PriorityDisplay from "./PriorityDisplay";
import TeamSelect from "./TeamSelect";


const headers = ["Tijd", "Gemeld door", "Onderwerp", "Melding", "Team", "Prioriteit", "Actie"];

export const mapReportToRow = (report) => {
  if (!report) return {};

  return {
    time: report.Time ?? "", // API can later add an exact time field
    reportedBy: report.ReportedBy ?? "",
    subject: report.Subject ?? "",
    message: report.Note ?? "", // use Note as the longer description
    team: report.Team ?? "",
    priority: report.Prioriteit ?? "",
    status: report.Status ?? "",
  };
};

const OverviewTable = ({ reports = [], units = [], placeholderRows = 5, onRowClick, onStatusUpdate, onTeamUpdate, onPriorityUpdate, onDropReport }) => {
  const [sortTime, setSortTime] = useState("desc");
  const [sortPriority, setSortPriority] = useState(null);

  const hasData = reports.length > 0;

  const dataRows = useMemo(() => {
    if (!hasData) return [];
    
    const mapped = reports.map((r, index) => {
      const base = r.Report ?? r;
      const mappedRow = mapReportToRow(base);
      return { id: index, raw: base, ...mappedRow };
    });

    const getPrioWeight = (p) => {
      const lower = (p || "").toLowerCase();
      if (lower === "hoog") return 3;
      if (lower === "gemiddeld") return 2;
      if (lower === "laag") return 1;
      return 0;
    };

    return mapped.sort((a, b) => {
      // Prioritize priority sort if active
      if (sortPriority) {
        const weightA = getPrioWeight(a.priority);
        const weightB = getPrioWeight(b.priority);
        if (weightA !== weightB) {
          return sortPriority === "desc" ? weightB - weightA : weightA - weightB;
        }
      }

      // Then sort by time (always active)
      const timeA = a.time || "";
      const timeB = b.time || "";
      if (timeA !== timeB) {
        return sortTime === "desc" ? timeB.localeCompare(timeA) : timeA.localeCompare(timeB);
      }
      return 0;
    });
  }, [reports, hasData, sortTime, sortPriority]);

  const extraEmptyRows = Math.max(placeholderRows - dataRows.length, 0);

  const handleHeaderClick = (h) => {
    if (h === "Tijd") {
      setSortTime((prev) => (prev === "desc" ? "asc" : "desc"));
    } else if (h === "Prioriteit") {
      setSortPriority((prev) => {
        if (prev === null) return "desc";
        if (prev === "desc") return "asc";
        return null;
      });
    }
  };

  return (
    <table 
      className="overview-table"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        if (onDropReport) {
          try {
            const data = JSON.parse(e.dataTransfer.getData("application/json"));
            onDropReport(data);
          } catch (err) {
            console.error("Failed to parse dropped report data", err);
          }
        }
      }}
    >
      <thead>
        <tr>
          {headers.map((h) => (
            <th 
              key={h} 
              onClick={() => handleHeaderClick(h)}
              style={{ cursor: (h === "Tijd" || h === "Prioriteit") ? "pointer" : "default", display: "table-cell", verticalAlign: "middle" }}
            >
              <div style={{ display: "inline-flex", alignItems: "center" }}>
                {h}
                {h === "Tijd" && (
                  <svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 292.4 292.4" style={{ marginLeft: '6px', transform: sortTime === "desc" ? "none" : "rotate(180deg)", fill: "#6b7280" }}>
                    <path d="M287 69.4a17.6 17.6 0 0 0-13-5.4H18.4c-5 0-9.3 1.8-12.9 5.4A17.6 17.6 0 0 0 0 82.2c0 5 1.8 9.3 5.4 12.9l128 127.9c3.6 3.6 7.8 5.4 12.8 5.4s9.2-1.8 12.8-5.4L287 95c3.5-3.5 5.4-7.8 5.4-12.8 0-5-1.9-9.2-5.5-12.8z"/>
                  </svg>
                )}
                {h === "Prioriteit" && sortPriority && (
                  <svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 292.4 292.4" style={{ marginLeft: '6px', transform: sortPriority === "desc" ? "none" : "rotate(180deg)", fill: "#6b7280" }}>
                    <path d="M287 69.4a17.6 17.6 0 0 0-13-5.4H18.4c-5 0-9.3 1.8-12.9 5.4A17.6 17.6 0 0 0 0 82.2c0 5 1.8 9.3 5.4 12.9l128 127.9c3.6 3.6 7.8 5.4 12.8 5.4s9.2-1.8 12.8-5.4L287 95c3.5-3.5 5.4-7.8 5.4-12.8 0-5-1.9-9.2-5.5-12.8z"/>
                  </svg>
                )}
              </div>
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {dataRows.map((row) => (
          <tr
            key={row.id}
            onClick={onRowClick ? () => onRowClick(row.raw) : undefined}
            style={{ cursor: onRowClick ? "pointer" : "default" }}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData("application/json", JSON.stringify(row.raw));
            }}
          >
            <td>{row.time}</td>
            <td>{row.reportedBy}</td>
            <td>{row.subject}</td>
            <td>{row.message}</td>
            <td>
              {onTeamUpdate ? (
                <div onClick={(e) => e.stopPropagation()}>
                  <TeamSelect 
                    units={units} 
                    value={row.team} 
                    onChange={(val) => onTeamUpdate(row.raw, val)}
                    className="table-select"
                  />
                </div>
              ) : (
                row.team
              )}
            </td>
            <td>
              {onPriorityUpdate ? (
                <div
                  className="priority-flags"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    className={`flag green ${
                      (row.priority || "").toLowerCase() === "laag" ? "active" : ""
                    }`}
                    onClick={() => onPriorityUpdate(row.raw, "Laag")}
                  >
                    ⚑
                  </button>
                  <button
                    className={`flag orange ${
                      (row.priority || "").toLowerCase() === "gemiddeld" ? "active" : ""
                    }`}
                    onClick={() => onPriorityUpdate(row.raw, "Gemiddeld")}
                  >
                    ⚑
                  </button>
                  <button
                    className={`flag red ${
                      (row.priority || "").toLowerCase() === "hoog" ? "active" : ""
                    }`}
                    onClick={() => onPriorityUpdate(row.raw, "Hoog")}
                  >
                    ⚑
                  </button>
                </div>
              ) : (
                <PriorityDisplay priority={row.priority} />
              )}
            </td>
            <td>
              {onStatusUpdate && (row.status === "Open" || row.status === "In behandeling") && (
                <button 
                  className="btn-action"
                  onClick={(e) => {
                    e.stopPropagation();
                    onStatusUpdate(row.raw);
                  }}
                >
                  {row.status === "Open" ? "Starten" : "Sluiten"}
                </button>
              )}
            </td>
          </tr>
        ))}

        {/* Add some empty rows to keep the grid looking like the design */}
        {Array.from({ length: extraEmptyRows }).map((_, i) => (
          <tr key={`empty-${i}`}>
            {headers.map((h) => (
              <td key={h}></td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default OverviewTable;