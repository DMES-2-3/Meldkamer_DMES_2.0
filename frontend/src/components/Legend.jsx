import React from "react";
import {
  TEAM_STATUS_COLORS,
  REPORT_STATUS_COLORS,
  PRIORITY_COLORS,
  LegendItem,
} from "../utils";

// Deze component toont een legenda met de betekenis van kleuren voor teams, hulpverleners en meldingen.
// Deze component wordt momenteel niet gebruikt.

export default function Legend({ colorMode, setColorMode}) {
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
        <LegendItem color={PRIORITY_COLORS.green} label="Laag" />
        <LegendItem color={PRIORITY_COLORS.orange} label="Gemiddeld" />
        <LegendItem color={PRIORITY_COLORS.red} label="Hoog" />
      </div>
    </div>
  );
}
