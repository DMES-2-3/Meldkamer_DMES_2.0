import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { saveReport } from "../services/reportsApi";
import MapPanel from "../components/mapPanel/MapPanel";
import Legend from "../components/Legend";
import TeamsTableContainer from "../components/TeamsTableContainer";
import AidWorkersTableContainer from "../components/AidWorkerTableContainer";
import ReportsTableContainer from "../components/ReportsTableContainer";
import FilterControls from "../components/FilterControls";
import FloatingNotepad from "../components/FloatingNotepad";
import { MAPS, MAIN_TABS, REPORT_TABS } from "../utils/utils";
import "../Dashboard.css";

export default function Dashboard({ reports, reloadData, setReports }) {
  const navigate = useNavigate();
  const location = useLocation();

  const [currentMap, setCurrentMap] = useState(MAPS[0].src);
  const [mapColorMode, setMapColorMode] = useState("priority"); // "priority" or "status"
  const [mainTab, setMainTab] = useState(MAIN_TABS.TEAMS);
  const [reportsTab, setReportsTab] = useState(REPORT_TABS.ALL);

  // FIX: gebruik overal "Alles" i.p.v. "All"
  const [statusFilter, setStatusFilter] = useState("Alles");
  const [priorityFilter, setPriorityFilter] = useState("Alles");

  const [activeLegendFilters, setActiveLegendFilters] = useState({
    status: [],
    priority: [],
  });

  const [showKladblok, setShowKladblok] = useState(false);
  const [kladblokContext, setKladblokContext] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);

  React.useEffect(() => {
    const stored = localStorage.getItem("selected_event");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setSelectedEvent(parsed);
      } catch (e) {
        console.error("Failed to parse selected_event from localStorage", e);
      }
    }
  }, []);

  const onOpenNotepad = () => {
    const eventName = selectedEvent?.name;
    if (!eventName) {
      alert("Geen event geselecteerd.");
      return;
    }
    setKladblokContext({ type: "event", eventName: selectedEvent.name });
    setShowKladblok(true);
  };

  const onOpenReportNotepad = (reportId) => {
    if (!reportId) return;
    setKladblokContext({ type: "report", reportId });
    setShowKladblok(true);
  };

  useEffect(() => {
    window._reports = reports;
    console.log("Dashboard reports: ", reports);
  }, [reports]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.altKey && e.key.toLowerCase() === "n") {
        e.preventDefault();
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur();
        }
        navigate("/melding");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [navigate]);

  const mapPanelRef = useRef(null);
  const [isResizing, setIsResizing] = useState(false);

  const mainTabs = [
    { value: MAIN_TABS.TEAMS, label: "Teams" },
    { value: MAIN_TABS.AIDWORKERS, label: "Hulpverleners" },
    { value: MAIN_TABS.REPORTS, label: "Meldingen" },
  ];

  const reportSubTabs = [
    { value: REPORT_TABS.ALL, label: "Alles" },
    { value: REPORT_TABS.TEAM, label: "Team" },
    { value: REPORT_TABS.STATUS, label: "Status" },
    { value: REPORT_TABS.PRIORITY, label: "Prioriteit" },
  ];

  const startResize = (e) => {
    e.preventDefault();
    setIsResizing(true);
    document.addEventListener("mousemove", handleResize);
    document.addEventListener("mouseup", stopResize);
  };

  const handleResize = (e) => {
    if (!mapPanelRef.current) return;
    const newWidth = e.clientX;
    const minWidth = 300;
    const maxWidth = window.innerWidth * 0.8;
    if (newWidth > minWidth && newWidth < maxWidth) {
      mapPanelRef.current.style.flex = `0 0 ${newWidth}px`;
    }
  };

  const stopResize = () => {
    setIsResizing(false);
    document.removeEventListener("mousemove", handleResize);
    document.removeEventListener("mouseup", stopResize);
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

  const handleMapsUpdate = (maps) => {
    const newSelectedEvent = { ...selectedEvent, maps };
    setSelectedEvent(newSelectedEvent);
    localStorage.setItem("selected_event", JSON.stringify(newSelectedEvent));
  };

  return (
    <div className="dashboard">
      <div className="resizable-map-panel" ref={mapPanelRef}>
        <MapPanel
          onMapSelect={setCurrentMap}
          pendingReport={null}
          onRequestMarkerAdd={null}
          selectedEventId={selectedEvent?.id}
          initialMaps={selectedEvent?.maps || []}
          onMapsUpdate={handleMapsUpdate}
          reports={reports}
          updateReportLocation={updateReportLocation}
          colorMode={mapColorMode}
          activeLegendFilters={activeLegendFilters}
          initialMapType={location.state?.openMapType}
        />
        <div className="resize-handle" onMouseDown={startResize} />
      </div>

      <div className="dashboard-right">
        <div className="tabs">
          {mainTabs.map((tab) => (
            <button
              key={tab.value}
              className={mainTab === tab.value ? "tab active-tab" : "tab"}
              onClick={() => setMainTab(tab.value)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {mainTab === MAIN_TABS.TEAMS && <TeamsTableContainer />}
        {mainTab === MAIN_TABS.AIDWORKERS && (
          <AidWorkersTableContainer selectedEventId={selectedEvent?.id} />
        )}
        {mainTab === MAIN_TABS.REPORTS && (
          <>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 12,
                paddingRight: 8,
              }}
            >
              <FilterControls
                statusFilter={statusFilter}
                priorityFilter={priorityFilter}
                onStatusChange={setStatusFilter}
                onPriorityChange={setPriorityFilter}
              />
              <button
                className="btn-small"
                style={{
                  background: "#14a84b",
                  color: "white",
                  fontWeight: 600,
                  border: "none",
                  borderRadius: 6,
                  padding: "4px 10px",
                  cursor: "pointer",
                }}
                onClick={() => navigate("/melding")}
              >
                Nieuwe Melding
              </button>
            </div>

            <ReportsTableContainer
              reportsTab={reportsTab}
              statusFilter={statusFilter}
              priorityFilter={priorityFilter}
              onOpenReportNotepad={onOpenReportNotepad}
            />
          </>
        )}

        <div className="legend-buttons">
          <Legend
            colorMode={mapColorMode}
            setColorMode={setMapColorMode}
            activeLegendFilters={activeLegendFilters}
            setActiveLegendFilters={setActiveLegendFilters}
          />
        </div>
        <div className="notepad-button">
          <button className="btn-small" onClick={onOpenNotepad}>
            Kladblok
          </button>
        </div>
        <FloatingNotepad
          open={showKladblok}
          context={kladblokContext}
          onClose={() => setShowKladblok(false)}
        />
      </div>
    </div>
  );
}