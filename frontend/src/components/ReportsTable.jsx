import React from "react";
import { useNavigate } from "react-router-dom";
import { getStatusColorForReport, getPriorityColor } from "../utils/utils";

export default function ReportsTable({ reports }) {
  const navigate = useNavigate();

  if (!reports.length) return <p>Geen meldingen beschikbaar</p>;

  return (
    <div
      className="team-table-wrapper"
      style={{ maxHeight: "260px", overflowY: "auto" }}
    >
      <table className="team-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Onderwerp</th>
            <th>Locatie</th>
            <th>Tijd</th>
            <th>Status</th>
            <th>Prioriteit</th>
            <th>Ambulance Nodig</th>
            <th>Beschrijving</th>
            <th>Team</th>
          </tr>
        </thead>

        <tbody>
          {reports.map((r) => (
            <tr
              key={r.id}
              style={{ cursor: "pointer" }}
              title="Open melding"
              onClick={() => navigate("/melding", { state: { report: r } })}
            >
              <td>{r.id}</td>
              <td>{r.Subject}</td>
              <td>{r.Location}</td>
              <td>{r.Time}</td>
              <td>
                <span
                  className="status-dot"
                  style={{ backgroundColor: getStatusColorForReport(r.Status) }}
                />
                {r.Status}
              </td>
              <td>
                <span
                  className="status-dot"
                  style={{ backgroundColor: getPriorityColor(r.Prioriteit) }}
                />
                {r.Prioriteit}
              </td>
              <td>{r.Ambulance ? "Ja" : "Nee"}</td>
              <td>{r.Note}</td>
              <td>{r.Team || "N/A"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}