import React from "react";

export default function TeamsTable({ teams }) {
  return (
    <>
      <h2>Mobiele Teams</h2>
      <div className="team-table-wrapper">
        <table className="team-table">
          <thead>
            <tr>
              <th>Status</th>
              <th>Roepnummer</th>
              <th>Naam team</th>
            </tr>
          </thead>
          <tbody>
            {teams.map((t) => (
              <tr key={t.id} title={t.note}>
                <td>
                  <span
                    className="status-dot"
                    style={{ backgroundColor: t.color }}
                  />
                  {t.statusLabel}
                </td>
                <td>{t.callNumber}</td>
                <td>{t.name}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
