import React from "react";
import { getPriorityColor, getColorForMarker } from "../../utils";

export const getTeamsForMarker = (marker, reports = []) => {
  if (!marker?.reportId || !Array.isArray(reports)) return [];
  const report = reports.find(r => r.id.toString() === marker.reportId.toString());
  if (!report) return [];
  return Array.isArray(report.team) ? report.team : [report.team].filter(Boolean);
};

export function MarkerIcon({ color, onClick, onDoubleClick }) {
  return (
    <svg width="24" height="32" viewBox="0 0 24 32" onClick={onClick} onDoubleClick={onDoubleClick} className="marker-icon">
      <path d="M12 0C7.6 0 4 3.6 4 8c0 5.4 8 16 8 16s8-10.6 8-16c0-4.4-3.6-8-8-8z" fill={color} stroke="#fff" strokeWidth="2" />
      <circle cx="12" cy="8" r="3" fill="#fff" />
    </svg>
  );
}

export function MarkerLabel({ reportId, label, reports }) {
  const teams = getTeamsForMarker({ reportId }, reports);
  return (
    <div style={{ position: "absolute", bottom: "100%", left: "50%", transform: "translateX(-50%)", pointerEvents: "none", textAlign: "center", zIndex: 30 }}>
      <div style={{ display: "inline-block", background: "rgba(0,0,0,0.75)", color: "#fff", padding: "4px 8px", borderRadius: "4px", whiteSpace: "nowrap", fontSize: "12px" }}>
        {reportId ? `(${reportId}) ` : ""}{label}
        {teams.length > 0 && <div style={{ fontSize: "10px", marginTop: "2px" }}>Teams: {teams.join(", ")}</div>}
      </div>
      <div style={{ width: 0, height: 0, borderLeft: "5px solid transparent", borderRight: "5px solid transparent", borderTop: "5px solid rgba(0,0,0,0.75)", margin: "0 auto" }} />
    </div>
  );
}