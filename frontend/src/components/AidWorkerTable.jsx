import React, { useState } from "react";

export default function AidWorkersTable({ workers, onStatusClick }) {
  const [selectedWorker, setSelectedWorker] = useState(null);

  if (!workers.length) return <p>Geen aid workers beschikbaar</p>;

  return (
    <>
      <div className="team-table-wrapper">
        <table className="team-table">
          <thead>
            <tr>
              <th>Status</th>
              <th>Roepnummer</th>
              <th>Naam</th>
              <th>Rol</th>
              <th>Team</th>
            </tr>
          </thead>
          <tbody>
            {workers.map((w) => (
              <tr
                key={w.id}
                onClick={() => setSelectedWorker(w)}
                className="clickable-row"
              >
                <td>
                  <button
                    type="button"
                    className="status-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onStatusClick?.(w);
                    }}
                    title="Klik om status te wijzigen"
                  >
                    <span
                      className="status-dot"
                      style={{ backgroundColor: w.color }}
                    />
                    {w.statusLabel || w.status}
                  </button>
                </td>
                <td>{w.callNumber || w.id}</td>
                <td>{w.name}</td>
                <td>{w.role}</td>
                <td>{w.teamName || "N/A"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedWorker && (
        <div
          className="modal-backdrop"
          onClick={() => setSelectedWorker(null)}
        >
          <div
            className="modal note-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>Notitie</h3>
              <button
                className="modal-close"
                onClick={() => setSelectedWorker(null)}
              >
                ×
              </button>
            </div>

            <div className="note-modal-content">
              <p className="note-worker-name">{selectedWorker.name}</p>
              <p className="note-text">
                {selectedWorker.note || "Geen notitie beschikbaar"}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}