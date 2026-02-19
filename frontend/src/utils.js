export const MAIN_TABS = {
  TEAMS: "Teams",
  AIDWORKERS: "Hulpverleners",
  REPORTS: "Rapporten",
};

export const REPORT_TABS = {
  ALL: "Alles",
  TEAM: "Team",
  STATUS: "Status",
  PRIORITY: "Prioriteit",
};

export const FILTER_OPTIONS = {
  status: ["Alles", "Open", "In behandeling", "Gesloten"],
  priority: ["Alles", "Hoog", "Gemiddeld", "Laag"],
};

export const MAPS = [
  { name: "Map1", src: "/maps/placeholderMap.pdf" },
  { name: "Map2", src: "/maps/placeholderMap2.pdf" },
  { name: "Map3", src: "/maps/placeholderMap3.pdf" },
];

export const TEAM_STATUS_COLORS = {
  available: "#22c55e",
  active: "#f97316",
  break: "#3b82f6",
  busy: "#ef4444",
  default: "#9ca3af",
};

export const REPORT_STATUS_COLORS = {
  open: "#fbbf24",
  "in progress": "#a855f7",
  closed: "#15803d",
  default: "#9ca3af",
};

export const PRIORITY_COLORS = {
  green: "#15803d",   // laag
  orange: "#fbbf24",  // gemiddeld
  red: "#b91c1c",     // hoog
  default: "#d1d5db",
};

export const normalizeTeamStatus = (status) => {
  if (!status) return "available";
  const s = status.toString().toLowerCase();
  if (s === "beschikbaar") return "available";
  if (s === "actief") return "active";
  if (s === "pauze") return "break";
  if (s === "bezet") return "busy";
  return s;
};

export const normalizeReportStatus = (status) => {
  if (!status) return "open";
  const s = status.toString().toLowerCase();
  if (s === "registered") return "open";
  if (s === "in behandeling") return "in progress";
  if (s === "gesloten") return "closed";
  return s;
};

export const normalizePriority = (priority) => {
  if (!priority) return "green";

  const p = priority.toString().trim().toLowerCase();

  // UI labels
  if (p === "hoog") return "red";
  if (p === "gemiddeld") return "orange";
  if (p === "laag") return "green";

  // backend enums
  if (p === "red") return "red";
  if (p === "orange") return "orange";
  if (p === "green") return "green";

  if (p === "red") return "red";
  if (p === "orange") return "orange";
  if (p === "green") return "green";

  return "green";
};

export const getTeamStatusColor = (status) =>
  TEAM_STATUS_COLORS[normalizeTeamStatus(status)] || TEAM_STATUS_COLORS.default;

export const getReportStatusColor = (status) =>
  REPORT_STATUS_COLORS[normalizeReportStatus(status)] ||
  REPORT_STATUS_COLORS.default;

export const getStatusColorForReport = getReportStatusColor;

export const getPriorityColor = (priority) =>
  PRIORITY_COLORS[normalizePriority(priority)] || PRIORITY_COLORS.default;

export const LegendItem = ({ color, label }) => (
  <div className="legend-item">
    <span className="legend-dot" style={{ backgroundColor: color }} />
    <span>{label}</span>
  </div>
);

export function getSelectedEvent(navigate) {
  const stored = localStorage.getItem("selected_event");
  if (!stored) {
    navigate("/events");
    return null;
  }
  try {
    return JSON.parse(stored);
  } catch {
    navigate("/events");
    return null;
  }
}

export const createMarkerIcon = (color = "#FF0000") => {
  const icon = {
    url:
      "data:image/svg+xml;charset=UTF-8," +
      encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24">
          <path fill="${color}" stroke="black" stroke-width="1"
            d="M12 2C8.1 2 5 5.1 5 9c0 5.2 7 13 7 13s7-7.8 7-13c0-3.9-3.1-7-7-7z"/>
          <circle cx="12" cy="9" r="3.5" fill="white"/>
        </svg>
      `),
  };
  if (window.google?.maps?.Size) {
    icon.scaledSize = new window.google.maps.Size(36, 36);
  }
  return icon;
};
export const getTeamsForMarker = (marker, reports = []) => {
  if (!marker?.reportId || !Array.isArray(reports)) return [];
  const report = reports.find(
    (r) => r.id.toString() === marker.reportId.toString(),
  );
  if (!report) return [];
  return Array.isArray(report.team)
    ? report.team
    : [report.team].filter(Boolean);
};
