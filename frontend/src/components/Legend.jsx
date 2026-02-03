import React from "react";
import {
  TEAM_STATUS_COLORS,
  REPORT_STATUS_COLORS,
  PRIORITY_COLORS,
  LegendItem,
} from "../utils";

export default function Legend({ colorMode, setColorMode, onOpenNotepad }) {
  return (
    <div className="legend">
      <h3>Teams & Aid Workers – Status</h3>
      <div className="legend-grid">
        <LegendItem color={TEAM_STATUS_COLORS.available} label="Available" />
        <LegendItem color={TEAM_STATUS_COLORS.active} label="Active" />
        <LegendItem color={TEAM_STATUS_COLORS.break} label="On Break" />
        <LegendItem color={TEAM_STATUS_COLORS.busy} label="Busy" />
      </div>

      <h3
        className={colorMode === "status" ? "active" : ""}
        onClick={() => setColorMode("status")}
      >
        Reports – Status
      </h3>
      <div className="legend-grid">
        <LegendItem color={REPORT_STATUS_COLORS.open} label="Open" />
        <LegendItem color={REPORT_STATUS_COLORS["in progress"]} label="In Progress" />
        <LegendItem color={REPORT_STATUS_COLORS.closed} label="Closed" />
      </div>

      <h3
        className={colorMode === "priority" ? "active" : ""}
        onClick={() => setColorMode("priority")}
      >
        Reports – Priority
      </h3>
      <div className="legend-grid">
        <LegendItem color={PRIORITY_COLORS.Green} label="Green" />
        <LegendItem color={PRIORITY_COLORS.Yellow} label="Yellow" />
        <LegendItem color={PRIORITY_COLORS.Red} label="Red" />
      </div>

      <div className="legend-buttons">
        <button className="btn-small" onClick={onOpenNotepad}>
          Notepad
        </button>
      </div>
    </div>
  );
}
