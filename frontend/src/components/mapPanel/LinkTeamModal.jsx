import React, { useState, useEffect } from "react";

export default function LinkTeamModal({
  isOpen,
  onClose,
  teams,
  onLink,
}) {
  const [selectedTeamId, setSelectedTeamId] = useState("");

  // Reset selection when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedTeamId("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleLink = () => {
    if (selectedTeamId) {
      onLink(selectedTeamId);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Team Marker toevoegen</h3>
          <button className="modal-close" onClick={onClose} aria-label="Sluiten">
            &times;
          </button>
        </div>
        
        <div style={{ marginBottom: "1.5rem", marginTop: "1rem" }}>
          <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600", color: "#374151" }}>
            Selecteer een team:
          </label>
          <select
            value={selectedTeamId}
            onChange={(e) => setSelectedTeamId(e.target.value)}
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
            <option value="">-- Selecteer een team --</option>
            {teams
              ?.sort((a, b) => a.name.localeCompare(b.name))
              ?.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name || "Naamloos team"}
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
            disabled={!selectedTeamId} 
            style={{ 
              padding: "8px 16px", 
              borderRadius: "6px", 
              border: "none", 
              cursor: selectedTeamId ? "pointer" : "not-allowed",
              fontWeight: "600",
              backgroundColor: selectedTeamId ? "#3b82f6" : "#9ca3af",
              color: "white",
              transition: "background-color 0.2s"
            }}
            onMouseOver={(e) => {
              if (selectedTeamId) e.target.style.backgroundColor = "#2563eb";
            }}
            onMouseOut={(e) => {
              if (selectedTeamId) e.target.style.backgroundColor = "#3b82f6";
            }}
          >
            Toevoegen
          </button>
        </div>
      </div>
    </div>
  );
}