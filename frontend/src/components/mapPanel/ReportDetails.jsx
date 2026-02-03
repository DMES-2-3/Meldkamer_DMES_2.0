import React from "react";
import { getPriorityColor, getReportStatusColor, normalizePriority, normalizeReportStatus } from "../../utils";

export function ReportDetails({ report }) {
  return (
    <div className="report-details">
      <div className="report-details-title">Report #{report.id}</div>
      <div className="report-details-row"><strong>Prioriteit:</strong> <span className="report-badge" style={{ backgroundColor: getPriorityColor(report.priority) }}>{normalizePriority(report.priority)}</span></div>
      <div className="report-details-row"><strong>Status:</strong> <span className="report-badge" style={{ backgroundColor: getReportStatusColor(report.status) }}>{normalizeReportStatus(report.status)}</span></div>
      <div><strong>Event:</strong> {report.event}</div>
      <div><strong>Locatie:</strong> {report.location}</div>
      <div><strong>Team:</strong> {report.team}</div>
      {report.note && <div><strong>Notitie:</strong> {report.note}</div>}
    </div>
  );
}
