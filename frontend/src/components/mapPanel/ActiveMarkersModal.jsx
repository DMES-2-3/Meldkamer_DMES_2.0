import React from "react";

export default function ActiveMarkersModal({
  show,
  onClose,
  markers = [],
  localReports = [],
  onMarkerClick,
}) {
  if (!show) return null;

  const reportMarkers = markers.filter((m) => !m.teamId);
  const teamMarkers = markers.filter((m) => m.teamId);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Actieve Markers</h3>
          <button className="modal-close" onClick={onClose}>
            &times;
          </button>
        </div>

        <div className="marker-list">
          {markers.length === 0 && (
            <p style={{ fontStyle: "italic", color: "#777" }}>
              Geen markers op de kaart
            </p>
          )}

          {reportMarkers.length > 0 && (
            <div style={{ marginBottom: "16px" }}>
              <h4 style={{ margin: "0 0 8px 0", color: "#374151" }}>Meldingen</h4>
              {reportMarkers.map((marker) => {
                const reportWrapper = marker.reportId
                  ? localReports.find(
                      (r) => (r.Report?.id || r?.id)?.toString() === marker.reportId?.toString()
                    )
                  : null;
                const report = reportWrapper?.Report || reportWrapper;

                return (
                  <div
                    key={marker.id}
                    className="marker-list-item"
                    onClick={() => {
                      if (onMarkerClick) onMarkerClick(marker);
                      onClose();
                    }}
                    style={{ cursor: "pointer" }}
                  >
                    <strong>{marker.label}</strong>
                    {report && (
                      <span className="ellipsis" style={{ marginLeft: 8, fontSize: 12, opacity: 0.7 }}>
                        ({report.Subject || report.subject || `Melding ${marker.reportId}`})
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {teamMarkers.length > 0 && (
            <div>
              <h4 style={{ margin: "0 0 8px 0", color: "#374151" }}>Teams</h4>
              {teamMarkers.map((marker) => (
                <div
                  key={marker.id}
                  className="marker-list-item"
                  onClick={() => {
                    if (onMarkerClick) onMarkerClick(marker);
                    onClose();
                  }}
                  style={{ cursor: "pointer" }}
                >
                  <strong>{marker.label}</strong>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}