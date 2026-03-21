import React, { useState } from "react";

export default function TeamsTable({ teams, onStatusClick }) {
  const [openRow, setOpenRow] = useState(null);

  const toggleRow = (id) => {
    setOpenRow(openRow === id ? null : id);
  };

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
              <React.Fragment key={t.id}>
                <tr className="team-row" onClick={() => toggleRow(t.id)}>
                  <td>
                    <button
                      type="button"
                      className="status-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onStatusClick?.(t);
                      }}
                      title="Klik om status te wijzigen"
                    >
                      <span
                        className="status-dot"
                        style={{ backgroundColor: t.color }}
                      />
                      {t.statusLabel}
                    </button>
                  </td>

                  <td>{t.callNumber || "N/A"}</td>
                  <td>{t.name}</td>
                </tr>

                {openRow === t.id && (
                  <tr className="team-extra-row">
                    <td colSpan="3">
                      <div className="team-extra-grid">
                        <div className="team-extra-block">
                          <div className="team-extra-title">Hulpverleners</div>

                          {t.workers && t.workers.length > 0 ? (
                            <ul className="team-workers-list">
                              {t.workers.map((w) => (
                                <li key={w.id}>
                                  {w.firstName} {w.lastName} (
                                  {w.callNumber || w.callSign || "N/A"})
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <div>N/A</div>
                          )}
                        </div>

                        <div className="team-extra-block">
                          <div className="team-extra-title">Notitie</div>

                          <div className="team-extra-content">
                            {t.note || "N/A"}
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}