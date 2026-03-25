import React from "react";
import { useNavigate } from "react-router-dom";

export default function MarkerModal({
  show,
  onClose,
  editingMarker,
  markers = [],
  localReports = [],
  selectedEventId,
  onSave,
  onDelete,
  onEditMarker,
}) {
  const navigate = useNavigate();

  if (!show) return null;

  // Look up full details for currently linked report
  const linkedReportId = editingMarker?.reportId || "";
  const linkedReportWrapper = editingMarker
    ? localReports.find(
        (r) => (r.Report?.id || r?.id)?.toString() === linkedReportId.toString()
      )
    : null;
  const linkedReport = linkedReportWrapper?.Report || linkedReportWrapper;

  const formatAVPU = (avpu) => {
    if (!avpu) return "-";
    const active = Object.keys(avpu).filter((k) => avpu[k] === true);
    return active.length > 0 ? active.join(", ") : "-";
  };

  const formatAssistance = (assistance) => {
    if (!assistance) return "-";
    const active = Object.keys(assistance).filter(
      (k) => k !== "Team" && assistance[k] === true
    );
    if (assistance.Team && typeof assistance.Team === "string") {
      active.push(`Team: ${assistance.Team}`);
    }
    return active.length > 0 ? active.join(", ") : "-";
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{editingMarker ? "Melding Details" : "Markers"}</h3>
          <button className="modal-close" onClick={onClose}>
            &times;
          </button>
        </div>

        {!editingMarker && (
          <div className="marker-list">
            {markers.length === 0 && (
              <p style={{ fontStyle: "italic", color: "#777" }}>
                Geen markers op de kaart
              </p>
            )}
            {markers.map((marker) => {
              const reportWrapper = marker.reportId
                ? localReports.find(
                    (r) => (r.Report?.id || r?.id)?.toString() === marker.reportId.toString()
                  )
                : null;
              const report = reportWrapper?.Report || reportWrapper;

              return (
                <div
                  key={marker.id}
                  className="marker-list-item"
                  onClick={() => onEditMarker(marker)}
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

        {editingMarker && (
          <>
            <div className="marker-edit-form">
              {linkedReport ? (
                <div className="report-details" style={{ marginTop: 12 }}>
                  <div style={{ marginBottom: "8px" }}>
                    <b>Tijd:</b> {linkedReport.time || linkedReport.Time || "-"}
                  </div>
                  <div style={{ marginBottom: "8px" }}>
                    <b>Onderwerp:</b> {linkedReport.subject || linkedReport.Subject || "-"}
                  </div>
                  <div style={{ marginBottom: "8px" }}>
                    <b>Locatie:</b> {linkedReport.location || linkedReport.Location || "-"}
                  </div>
                  <div style={{ marginBottom: "8px" }}>
                    <b>Prioriteit:</b> {linkedReport.priority || linkedReport.Prioriteit || "-"}
                  </div>
                  <div style={{ marginBottom: "8px" }}>
                    <b>Toegewezen team:</b> {linkedReport.team || linkedReport.Team || "-"}
                  </div>
                  <div style={{ marginBottom: "8px" }}>
                    <b>Status:</b> {linkedReport.status || linkedReport.Status || "-"}
                  </div>
                  <div style={{ marginBottom: "8px" }}>
                    <b>AVPU:</b> {formatAVPU(linkedReport.avpu || linkedReport.AVPU)}
                  </div>
                  <div style={{ marginBottom: "8px" }}>
                    <b>Assistentie:</b> {formatAssistance(linkedReport.assistance || linkedReport.Assistance)}
                  </div>
                  <div style={{ marginBottom: "8px" }}>
                    <b>Ambulance nodig:</b> {(linkedReport.ambulance || linkedReport.Ambulance) ? "Ja" : "Nee"}
                  </div>
                </div>
              ) : (
                <div style={{ marginTop: 12 }}>
                  <p>Geen gekoppelde melding gevonden voor deze marker.</p>
                </div>
              )}
            </div>

            <div className="marker-form-actions" style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
              <button
                className="btn-save"
                onClick={() => {
                  if (linkedReportWrapper) {
                    navigate("/melding", {
                      state: {
                        report: linkedReportWrapper,
                        from: "map",
                      },
                    });
                  }
                }}
                disabled={!linkedReportWrapper}
              >
                Bewerken
              </button>
              <button
                className="btn-delete"
                onClick={() => onDelete(editingMarker.id)}
              >
                Verwijderen
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}