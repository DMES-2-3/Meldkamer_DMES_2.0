import React, { useState, useEffect } from "react";
import { STATUS_TRANSLATIONS, PRIORITY_TRANSLATIONS } from "../../utils/utils";

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
  const [markerLabel, setMarkerLabel] = useState("");
  const [linkedReportId, setLinkedReportId] = useState("");
  const [labelManuallyEdited, setLabelManuallyEdited] = useState(false);

  const getDefaultLabelFromReport = (report) =>
    report?.event || report?.description || "";

  useEffect(() => {
    setMarkerLabel(editingMarker?.label || "");
    setLinkedReportId(editingMarker?.reportId || "");
    setLabelManuallyEdited(false);
  }, [editingMarker]);

  useEffect(() => {
    if (!editingMarker || labelManuallyEdited || !linkedReportId) return;

    const report = localReports.find(
      (r) => r.id && r.id.toString() === linkedReportId.toString()
    );

    if (report) setMarkerLabel(getDefaultLabelFromReport(report));
  }, [linkedReportId, localReports, editingMarker, labelManuallyEdited]);

  if (!show) return null;

  const linkedReport = editingMarker
    ? localReports.find(
        (r) => r.id && r.id.toString() === (linkedReportId || "").toString()
      )
    : null;

  const handleSave = () => {
    if (!editingMarker) return; 
    onSave({
      ...editingMarker,
      label: markerLabel.trim(),
      reportId: linkedReportId || null,
    });
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{editingMarker ? "Marker Details" : "Markers"}</h3>
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
              const report = marker.reportId
                ? localReports.find(
                    (r) => r.id && r.id.toString() === marker.reportId.toString()
                  )
                : null;

              return (
                <div
                  key={marker.id}
                  className="marker-list-item"
                  onClick={() => onEditMarker(marker)}
                >
                  <strong>{marker.label}</strong>
                  {report && (
                    <span className="ellipsis" style={{ marginLeft: 8, fontSize: 12, opacity: 0.7 }}>
                      ({report.event || report.description || `Melding ${marker.reportId}`})
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
              <div className="report-details-row">
                <span className="label">Marker Label:</span>
                <input
                  className="form-input"
                  value={markerLabel}
                  onChange={(e) => {
                    setMarkerLabel(e.target.value);
                    setLabelManuallyEdited(true);
                  }}
                />
              </div>

              <div className="report-details-row">
                <span className="label">Gekoppelde melding:</span>
                <select
                  className="form-input"
                  value={linkedReportId || ""}
                  onChange={(e) => setLinkedReportId(e.target.value)}
                >
                  <option value="">-- Selecteer melding --</option>
                  {localReports
                    .filter((r) => r.id && r.eventId === selectedEventId)
                    .map((report) => (
                      <option key={report.id} value={report.id}>
                        {report.event || report.description || `Report ${report.id}`}
                      </option>
                    ))}
                </select>
              </div>

              {linkedReport && (
                <div className="report-details" style={{ marginTop: 12 }}>
                  <div>
                    <b>Evenement:</b> {linkedReport.event}
                  </div>
                  <div>
                    <b>Beschrijving:</b>{" "}
                    <span className="ellipsis">{linkedReport.description || "-"}</span>
                  </div>
                  <div>
                    <b>Status:</b> 
                    {linkedReport.status
                      ? STATUS_TRANSLATIONS[linkedReport.status.toLowerCase()] || linkedReport.status
                      : "-"}
                  </div>
                  <div>
                    <b>Prioriteit:</b>
                    {linkedReport.priority
                      ? PRIORITY_TRANSLATIONS[linkedReport.priority.toLowerCase()] || linkedReport.priority
                      : "-"}
                  </div>
                </div>
              )}
            </div>

            <div className="marker-form-actions">
              <button className="btn-save" onClick={handleSave}>
                Opslaan
              </button>
              <button
                className="btn-delete"
                onClick={() => onDelete(editingMarker.id)}
              >
                Verwijderen
              </button>
              <button
                className="btn-cancel"
                onClick={() => onEditMarker(null)}
              >
                Terug naar lijst
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
