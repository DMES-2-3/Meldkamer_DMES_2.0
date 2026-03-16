import React, { useEffect, useState } from "react";
import MapPanel from "../components/mapPanel/MapPanel";
import { saveReport } from "../services/reportsApi";

export default function MapPopoutScreen({
  reports,
  reloadData,
  setReports,
}) {
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [mapColorMode, setMapColorMode] = useState("priority");

  useEffect(() => {
    document.title = "Map Pop-out";

    const stored = localStorage.getItem("selected_event");
    if (stored) {
      try {
        setSelectedEvent(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse selected_event", e);
      }
    }
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
    <div style={{ width: "100vw", height: "100vh", margin: 0, padding: 0, overflow: "hidden" }}>
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
      />
    </div>
  );
}