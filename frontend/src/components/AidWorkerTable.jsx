import React from "react";

export default function AidWorkersTable({ workers }) {
  if (!workers.length) return <p>No aid workers available</p>;

  return (
    <div className="team-table-wrapper" style={{ maxHeight: "260px", overflowY: "auto" }}>
      <table className="team-table">
        <thead>
          <tr>
            <th>Status</th>
            <th>Call Number</th>
            <th>Name</th>
            <th>Role</th>
            <th>Team</th>
          </tr>
        </thead>
        <tbody>
          {workers.map(w => (
            <tr key={w.id} title={w.note}>
              <td>
                <span
                  className="status-dot"
                  style={{ backgroundColor: w.color }}
                />
                {w.status}
              </td>
              <td>{w.callNumber || w.id}</td>
              <td>{w.name}</td>
              <td>{w.role}</td>
              <td>{w.teamName || 'N/A'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
