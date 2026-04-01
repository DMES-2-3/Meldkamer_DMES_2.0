import React from "react";
import { REPORT_STATUS_COLORS, PRIORITY_COLORS, normalizePriority, normalizeReportStatus } from "../../utils/utils";

const getShortLabel = (description, maxLength = 25) => {
  if (!description) return "";
  return description.length <= maxLength
    ? description
    : description.slice(0, maxLength).trim() + "...";
};

export const getMarkerColor = (marker, reports = [], colorMode = "priority") => {
  if (!marker.reportId) return PRIORITY_COLORS.default;

  const reportWrapper = reports.find(
    (r) => (r.Report?.id || r?.id)?.toString() === marker.reportId.toString()
  );
  const report = reportWrapper?.Report || reportWrapper;

  if (!report) return PRIORITY_COLORS.default;

  if (colorMode === "status") {
    const normalized = normalizeReportStatus(report.status || report.Status);
    return REPORT_STATUS_COLORS[normalized] || REPORT_STATUS_COLORS.default;
  }

  const normalized = normalizePriority(report.priority || report.Prioriteit);
  return PRIORITY_COLORS[normalized] || PRIORITY_COLORS.default;
};

export function Marker({
  marker,
  reports = [],
  colorMode = "priority",
  isSelected = false,
  onMouseDown,
}) {
  const color = getMarkerColor(marker, reports, colorMode);
  
  const report = reports.find(
    (r) => (r.Report?.id || r?.id)?.toString() === marker.reportId?.toString()
  );
  const subject = report?.Report?.Subject || report?.Subject;
  
  const label = getShortLabel(subject || marker.label);

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
        <circle cx="12" cy="8" r="3" fill="#fff" />
      </svg>
      <div className="marker-label">{label}</div>
    </div>
  );
}

export default Marker;