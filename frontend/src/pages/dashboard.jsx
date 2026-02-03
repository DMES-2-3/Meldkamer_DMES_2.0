import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { saveReport } from "../services/reportsApi";
import MapPanel from "../components/mapPanel/MapPanel";
import TeamsTableContainer from "../components/TeamsTableContainer";
import AidWorkersTableContainer from "../components/AidWorkerTableContainer";
import ReportsTableContainer from "../components/ReportsTableContainer";
import FilterControls from "../components/FilterControls";
import Legend from "../components/Legend";
import { MAPS, MAIN_TABS, REPORT_TABS } from "../utils";
import { useNotepad } from "../contexts/NotepadContexts";
import "../Dashboard.css";

export default function Dashboard({ reports, reloadData, setReports }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentMap, setCurrentMap] = useState(MAPS[0].src);
  const [mapColorMode, setMapColorMode] = useState("priority"); // "priority" or "status"
  const [mainTab, setMainTab] = useState(MAIN_TABS.TEAMS);
  const [reportsTab, setReportsTab] = useState(REPORT_TABS.ALL);
  const [statusFilter, setStatusFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [showKladblok, setShowKladblok] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState(null);
  const { notes, setNotes } = useNotepad();
  const notepadRef = useRef(null);

  // Get selected event from localStorage
  React.useEffect(() => {
    const stored = localStorage.getItem("selected_event");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setSelectedEventId(parsed.id);
      } catch (e) {
        console.error("Failed to parse selected_event from localStorage", e);
      }
    }
  }, []);

  useEffect(() => {
    window._reports = reports;
    console.log("Dashboard reports: ", reports);
  }, [reports]);

  const mapPanelRef = useRef(null);
  const [isResizing, setIsResizing] = useState(false);
  const [showCreateReport, setShowCreateReport] = useState(false);

  const mainTabs = [
    { value: MAIN_TABS.TEAMS, label: "Teams" },
    { value: MAIN_TABS.AIDWORKERS, label: "Hulpverleners" },
    { value: MAIN_TABS.REPORTS, label: "Meldingen" },
  ];

  const reportSubTabs = [
    { value: REPORT_TABS.ALL, label: "All" },
    { value: REPORT_TABS.TEAM, label: "Team" },
    { value: REPORT_TABS.STATUS, label: "Status" },
    { value: REPORT_TABS.PRIORITY, label: "Priority" },
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
        prevReports.map((r) => (r.Report.id === id ? updatedWrapper : r)),
      );

      await reloadData();
    } catch (err) {
      console.error("Failed to update report location:", err);
      alert("Updaten locatie mislukt: " + err.message);
    }
  };

  return (
    <div className="dashboard">
      <div className="resizable-map-panel" ref={mapPanelRef}>
        <MapPanel
          onMapSelect={setCurrentMap}
          pendingReport={null}
          onRequestMarkerAdd={null}
          selectedEventId={selectedEventId}
          reports={reports}
          updateReportLocation={updateReportLocation}
          colorMode={mapColorMode}
          initialMapType={location.state?.openMapType}
        />
        <div className="resize-handle" onMouseDown={startResize} />
      </div>

      <div className="dashboard-right">
        {/* Main tabs */}
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

        {/* Tab content */}
        {mainTab === MAIN_TABS.TEAMS && <TeamsTableContainer />}
        {mainTab === MAIN_TABS.AIDWORKERS && <AidWorkersTableContainer />}
        {mainTab === MAIN_TABS.REPORTS && (
          <>
            {/* Subtabs and filters */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 12,
              }}
            >
              <div className="subtabs">
                {reportSubTabs.map((t) => (
                  <button
                    key={t.value}
                    className={
                      reportsTab === t.value ? "subtab active-subtab" : "subtab"
                    }
                    onClick={() => setReportsTab(t.value)}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              <button
                className="btn-small"
                style={{
                  background: "#22c55e",
                  color: "white",
                  fontWeight: 500,
                }}
                onClick={() => navigate("/melding")}
              >
                + Nieuwe Melding
              </button>
            </div>

            <FilterControls
              statusFilter={statusFilter}
              priorityFilter={priorityFilter}
              onStatusChange={setStatusFilter}
              onPriorityChange={setPriorityFilter}
            />

            <ReportsTableContainer
              reportsTab={reportsTab}
              statusFilter={statusFilter}
              priorityFilter={priorityFilter}
            />
          </>
        )}

      <Legend
        colorMode={mapColorMode}        
        setColorMode={setMapColorMode}  
        onOpenNotepad={() => {
          setShowKladblok(true);         
          setTimeout(() => {
            if (notepadRef.current) {
              notepadRef.current.scrollIntoView({ behavior: "smooth" });
              notepadRef.current.focus();
            }
          }, 100); 
        }}
      />
        {/* Notepad modal */}
          {showKladblok && (
            <div className="modal-backdrop" onClick={() => setShowKladblok(false)}>
              <div className="modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h2>Kladblok</h2>
                  <button className="modal-close" onClick={() => setShowKladblok(false)}>
                    ×
                  </button>
                </div>
                <textarea
                  className="notepad"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Schrijf notitie"
                />
              </div>
            </div>
          )}
      </div>
    </div>
  );
}
