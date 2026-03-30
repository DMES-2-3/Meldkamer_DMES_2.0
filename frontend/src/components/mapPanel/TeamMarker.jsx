import React from "react";
import { getStatusColor } from "../TeamsTableContainer";

export const getTeamMarkerColor = (team) => {
  if (!team || !team.status) return "#6B7280"; // default gray
  return getStatusColor(team.status);
};

const getShortLabel = (name, maxLength = 25) => {
  if (!name) return "";
  return name.length <= maxLength
    ? name
    : name.slice(0, maxLength).trim() + "...";
};

export function TeamMarker({
  marker,
  teams = [],
  isSelected = false,
  onMouseDown,
}) {
  const team = teams.find(
    (t) => t.id?.toString() === marker.teamId?.toString()
  );
  
  const color = getTeamMarkerColor(team);
  const label = getShortLabel(team?.name || marker.label);

  return (
    <div
      style={{
        left: marker.x,
        top: marker.y,
        position: "absolute",
        zIndex: isSelected ? 20 : 10,
      }}
      onMouseDown={(e) => onMouseDown && onMouseDown(e, marker)}
    >
      <svg width="24" height="32" viewBox="0 0 24 32">
        <path
          d="M12 0C7.6 0 4 3.6 4 8c0 5.4 8 16 8 16s8-10.6 8-16c0-4.4-3.6-8-8-8z"
          fill={color}
          stroke="#fff"
          strokeWidth="2"
        />
        {/* Person icon */}
        <path
          d="M12 3a2.5 2.5 0 100 5 2.5 2.5 0 000-5zm-4.5 9a4.5 4.5 0 019 0v1h-9v-1z"
          fill="#fff"
        />
      </svg>
      <div className="marker-label">{label}</div>
    </div>
  );
}

export default TeamMarker;