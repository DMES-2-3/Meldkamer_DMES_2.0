import React, { useState, useEffect } from "react";

export default function LinkReportModal({
  isOpen,
  onClose,
  reports,
  selectedEvent,
  onLink,
  onCreateNew,
}) {
  const [selectedReportId, setSelectedReportId] = useState("");

  // Reset selection when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedReportId("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleLink = () => {
    if (selectedReportId) {
      onLink(selectedReportId);
    }
  };

  const filteredReports = reports
  ?.map(r => r.Report || r) 
  ?.filter(r => !selectedEvent || r.NameEvent === selectedEvent.name)
  ?.sort((a, b) => (b.id || 0) - (a.id || 0));

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Marker toevoegen</h3>
          <button className="modal-close" onClick={onClose} aria-label="Sluiten">
            &times;
          </button>
        </div>
        
        <div style={{ marginBottom: "1.5rem", marginTop: "1rem" }}>
          <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600", color: "#374151" }}>
            Koppel aan bestaande melding:
          </label>
          <select
            value={selectedReportId}
            onChange={(e) => setSelectedReportId(e.target.value)}
            style={{ 
              width: "100%", 
              padding: "0.5rem", 
              borderRadius: "6px", 
              border: "1px solid #d1d5db",
              fontSize: "14px",
              outline: "none",
              backgroundColor: "#f9fafb"
            }}
          >
            <option value="">-- Selecteer een melding --</option>
            {filteredReports?.map((r) => (
              <option key={r.id} value={r.id}>
                {r.Time || ""} - {r.Subject || "Geen onderwerp"}
              </option>
            ))}
          </select>
        </div>
        
        <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
          <button 
            onClick={onClose} 
            style={{ 
              padding: "8px 16px", 
              borderRadius: "6px", 
              border: "none", 
              cursor: "pointer",
              fontWeight: "600",
              backgroundColor: "#f3f4f6",
              color: "#374151",
              transition: "background-color 0.2s"
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = "#e5e7eb"}
            onMouseOut={(e) => e.target.style.backgroundColor = "#f3f4f6"}
          >
            Annuleren
          </button>
          
          <button 
            onClick={handleLink} 
            disabled={!selectedReportId} 
            style={{ 
              padding: "8px 16px", 
              borderRadius: "6px", 
              border: "none", 
              cursor: selectedReportId ? "pointer" : "not-allowed",
              fontWeight: "600",
              backgroundColor: selectedReportId ? "#3b82f6" : "#9ca3af",
              color: "white",
              transition: "background-color 0.2s"
            }}
            onMouseOver={(e) => {
              if (selectedReportId) e.target.style.backgroundColor = "#2563eb";
            }}
            onMouseOut={(e) => {
              if (selectedReportId) e.target.style.backgroundColor = "#3b82f6";
            }}
          >
            Koppel
          </button>
          
          <button 
            onClick={onCreateNew} 
            style={{ 
              padding: "8px 16px", 
              borderRadius: "6px", 
              border: "none", 
              cursor: "pointer",
              fontWeight: "600",
              backgroundColor: "#10b981",
              color: "white",
              transition: "background-color 0.2s"
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = "#059669"}
            onMouseOut={(e) => e.target.style.backgroundColor = "#10b981"}
          >
            Nieuwe Melding
          </button>
        </div>
      </div>
    </div>
  );
}