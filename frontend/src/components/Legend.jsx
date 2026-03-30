import React from "react";
import {
  TEAM_STATUS_COLORS,
  REPORT_STATUS_COLORS,
  PRIORITY_COLORS,
  LegendItem,
} from "../utils/utils";

// Deze component toont een legenda met de betekenis van kleuren voor teams, hulpverleners en meldingen.

export default function Legend({ colorMode, setColorMode, activeLegendFilters, setActiveLegendFilters }) {
  const toggleFilter = (type, value) => {
    setActiveLegendFilters((prev) => {
      const list = prev[type];
      let newFilters;

      if (list.includes(value)) {
        newFilters = {
          ...prev,
          [type]: list.filter((v) => v !== value)
        };
      }
      else {
        newFilters = {
          ...prev,
          [type]: [...list, value]
        };
      }

      console.log("Active filters:", newFilters);

      return newFilters;
    });
  };

  return (
    <div className="legend">
      <h3>Teams & Hulpverleners – Status</h3>
      <div className="legend-grid">
        <LegendItem
          color="#10B981"
          label="Beschikbaar"
          onClick={() => toggleFilter("teams", "available")}
          active={activeLegendFilters.teams?.includes("available")}
        />
        <LegendItem
          color="#F59E0B"
          label="Bezet"
          onClick={() => toggleFilter("teams", "busy")}
          active={activeLegendFilters.teams?.includes("busy")}
        />
        <LegendItem
          color="#3B82F6"
          label="Wacht"
          onClick={() => toggleFilter("teams", "wait")}
          active={activeLegendFilters.teams?.includes("wait")}
        />
        <LegendItem
          color="#6B7280"
          label="Niet beschikbaar"
          onClick={() => toggleFilter("teams", "unavailable")}
          active={activeLegendFilters.teams?.includes("unavailable")}
        />
      </div>

      <h3
        className={colorMode === "status" ? "active" : ""}
        onClick={() => setColorMode("status")}
      >
        Status
      </h3>
      <div className="legend-grid">
         <LegendItem
          color={REPORT_STATUS_COLORS.open}
          label="Open"
          onClick={() => toggleFilter("status", "open")}
          active={activeLegendFilters.status.includes("open")}
        />
        <LegendItem
          color={REPORT_STATUS_COLORS["in progress"]}
          label="In behandeling"
          onClick={() => toggleFilter("status", "in progress")}
          active={activeLegendFilters.status.includes("in progress")}
        />
        <LegendItem
          color={REPORT_STATUS_COLORS.closed}
          label="Gesloten"
          onClick={() => toggleFilter("status", "closed")}
          active={activeLegendFilters.status.includes("closed")}
        />
      </div>

      <h3
        className={colorMode === "priority" ? "active" : ""}
        onClick={() => setColorMode("priority")}
      >
        Prioriteit
      </h3>
      <div className="legend-grid">
        <LegendItem
          color={PRIORITY_COLORS.green}
          label="Laag"
          onClick={() => toggleFilter("priority", "green")}
          active={activeLegendFilters.priority.includes("green")}
        />
        <LegendItem
          color={PRIORITY_COLORS.orange}
          label="Gemiddeld"
          onClick={() => toggleFilter("priority", "orange")}
          active={activeLegendFilters.priority.includes("orange")}
        />
        <LegendItem
          color={PRIORITY_COLORS.red}
          label="Hoog"
          onClick={() => toggleFilter("priority", "red")}
          active={activeLegendFilters.priority.includes("red")}
        />
      </div>
    </div>
  );
}
