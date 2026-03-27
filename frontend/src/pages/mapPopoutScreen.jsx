import React, { useEffect, useState } from "react";
import MapPanel from "../components/mapPanel/MapPanel";
import { saveReport } from "../services/reportsApi";

export default function MapPopoutScreen({
  reports,
  reloadData,
  setReports,
}) {
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [mapColorMode, setMapColorMode] = useState(() => {
    return localStorage.getItem("dashboard_mapColorMode") || "priority";
  });
  const [activeLegendFilters, setActiveLegendFilters] = useState(() => {
    const saved = localStorage.getItem("dashboard_activeLegendFilters");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse activeLegendFilters", e);
      }
    }
    return {
      status: [],
      priority: [],
    };
  });

  useEffect(() => {
    document.title = "Map Pop-out";

    const loadSelectedEvent = () => {
      const stored = localStorage.getItem("selected_event");
      if (stored) {
        try {
          setSelectedEvent(JSON.parse(stored));
        } catch (e) {
          console.error("Failed to parse selected_event", e);
        }
      }
    };

    loadSelectedEvent();

    const onStorage = (e) => {
      if (e.key === "selected_event") {
        loadSelectedEvent();
      }
      if (e.key === "dashboard_mapColorMode") {
        setMapColorMode(e.newValue || "priority");
      }
      if (e.key === "dashboard_activeLegendFilters") {
        if (e.newValue) {
          try {
            setActiveLegendFilters(JSON.parse(e.newValue));
          } catch (err) {
            console.error("Failed to parse activeLegendFilters from storage event", err);
          }
        } else {
          setActiveLegendFilters({ status: [], priority: [] });
        }
      }
    };

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const handleMapsUpdate = (maps) => {
    if (!selectedEvent) return;
    const updatedEvent = { ...selectedEvent, maps };
    setSelectedEvent(updatedEvent);
    localStorage.setItem("selected_event", JSON.stringify(updatedEvent));
  };

  const updateReportLocation = async (id, newLocation) => {
    const reportWrapperToUpdate = reports.find((r) => r.Report.id === id);
    if (!reportWrapperToUpdate) return;

    const updatedWrapper = {
      ...reportWrapperToUpdate,
      Report: {
        ...reportWrapperToUpdate.Report,
        Location: newLocation,
      },
    };

    try {
      await saveReport(updatedWrapper.Report);

      setReports((prevReports) =>
        prevReports.map((r) => (r.Report.id === id ? updatedWrapper : r))
      );

      await reloadData();
    } catch (err) {
      console.error("Failed to update report location:", err);
      alert("Updaten locatie mislukt: " + err.message);
    }
  };

  return (
    <div style={{ width: "100vw", height: "100vh", margin: 0, padding: 0, overflow: "hidden", display: "flex" }}>
      <MapPanel
        onMapSelect={() => {}}
        pendingReport={null}
        onRequestMarkerAdd={null}
        selectedEventId={selectedEvent?.id}
        initialMaps={selectedEvent?.maps || []}
        onMapsUpdate={handleMapsUpdate}
        reports={reports}
        updateReportLocation={updateReportLocation}
        colorMode={mapColorMode}
        initialMapType="PDF"
        isPopout={true}
        activeLegendFilters={activeLegendFilters}
      />
    </div>
  );
}