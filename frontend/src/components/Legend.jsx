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
        <LegendItem color={TEAM_STATUS_COLORS.available} label="Beschikbaar" />
        <LegendItem color={TEAM_STATUS_COLORS.active} label="Actief" />
        <LegendItem color={TEAM_STATUS_COLORS.break} label="Pauze" />
        <LegendItem color={TEAM_STATUS_COLORS.busy} label="Bezet" />
      </div>

      <h3
        className={colorMode === "status" ? "active" : ""}
        onClick={() => setColorMode("status")}
      >
        Status
      </h3>
      <div className="legend-grid">
        <LegendItem color={REPORT_STATUS_COLORS.open} label="Open" />
        <LegendItem color={REPORT_STATUS_COLORS["in progress"]} label="In Progressie" />
        <LegendItem color={REPORT_STATUS_COLORS.closed} label="Gesloten" />
      </div>

      <h3
        className={colorMode === "priority" ? "active" : ""}
        onClick={() => setColorMode("priority")}
      >
        Prioriteit
      </h3>
      <div className="legend-grid">
        <LegendItem color={PRIORITY_COLORS.Green} label="Groen" />
        <LegendItem color={PRIORITY_COLORS.Yellow} label="Geel" />
        <LegendItem color={PRIORITY_COLORS.Red} label="Rood" />
      </div>

      <div className="legend-buttons">
        <button className="btn-small" onClick={onOpenNotepad}>
          Kladblok
        </button>
      </div>
    </div>
  );
}
