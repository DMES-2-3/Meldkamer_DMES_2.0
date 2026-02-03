import React from "react";
import { getStatusColorForReport, getPriorityColor } from "../utils";

export default function ReportsTable({ reports }) {
  if (!reports.length) return <p>No reports available</p>;

  return (
    <div
      className="team-table-wrapper"
      style={{ maxHeight: "260px", overflowY: "auto" }}
    >
      <table className="team-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Subject</th>
            <th>Location</th>
            <th>Time</th>
            <th>Status</th>
            <th>Priority</th>
            <th>Ambulance Needed</th>
            <th>Description</th>
            <th>Aid Team</th>
          </tr>
        </thead>
        <tbody>
          {reports.map((r) => (
            <tr key={r.id}>
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
              <td>{r.Ambulance ? "Yes" : "No"}</td>
              <td>{r.Note}</td>
              <td>{r.Team || "N/A"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
