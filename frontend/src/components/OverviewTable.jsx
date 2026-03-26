import React from "react";
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

const OverviewTable = ({ reports = [], units = [], placeholderRows = 5, onRowClick, onStatusUpdate, onTeamUpdate, onPriorityUpdate }) => {
  const hasData = reports.length > 0;

  const dataRows = hasData
    ? reports.map((r, index) => {
    const base = r.Report ?? r;
    const mapped = mapReportToRow(base);
    return { id: index, raw: base, ...mapped };
      })
    : [];

  const extraEmptyRows = Math.max(placeholderRows - dataRows.length, 0);

  return (
    <table className="overview-table">
      <thead>
        <tr>
          {headers.map((h) => (
            <th key={h}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {dataRows.map((row) => (
          <tr
            key={row.id}
            onClick={onRowClick ? () => onRowClick(row.raw) : undefined}
            style={{ cursor: onRowClick ? "pointer" : "default" }}
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