import { useState, useEffect, useCallback } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";

import { AuthProvider } from "./contexts/AuthContext";
import { NotepadProvider } from "./contexts/NotepadContexts";
import { getReports } from "./services/reportsApi";
import { getUnits, getWorkers } from "./services/unitsApi";

import TopNav from "./components/layout/TopNav";
import Protected from "./components/protected";
import FloatingNotepad from "./components/FloatingNotepad";

import Dashboard from "./pages/dashboard";
import EventsPage from "./pages/EventsPage";
import Login from "./pages/login";
import OverviewScreen from "./pages/OverviewScreen";
import Register from "./pages/register";
import ReportScreen from "./pages/ReportScreen";
import UnitsPage from "./pages/UnitsPage";
import ExportPage from "./pages/Export";
import MapPopoutScreen from "./pages/mapPopoutScreen";

function AppContent({ reports, setReports, units, setUnits, workers, setWorkers, reloadData, showKladblok, setShowKladblok, kladblokContext }) {
  const location = useLocation();

  useEffect(() => {
    reloadData();
  }, [location.pathname, reloadData]);

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />

      {/* Default route redirects to login */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* Admin-only register route */}
      <Route
        path="/register"
        element={<Protected Component={Register} adminOnly />}
      />

      {/* Protected "evenementen" route (no TopNav) */}
      <Route
        path="/evenementen"
        element={<Protected Component={EventsPage} />}
      />

      {/* Map Pop-out route */}
      <Route
        path="/map-popout"
        element={
          <MapPopoutScreen
            reports={reports}
            reloadData={reloadData}
            setReports={setReports}
            units={units}
            setUnits={setUnits}
          />
        }
      />

      {/* All other routes WITH top navigation */}
      <Route
        path="/*"
        element={
          <Protected
            Component={() => (
              <div className="app-content">
                <TopNav onOpenNotepad={() => setShowKladblok(true)} />
                <Routes>
                  <Route
                    path="melding"
                    element={<ReportScreen reloadData={reloadData} />}
                  />
                  <Route
                    path="overzicht"
                    element={
                      <OverviewScreen
                        reports={reports}
                        units={units}
                        reloadData={reloadData}
                      />
                    }
                  />
                  <Route path="eenheden" element={<UnitsPage units={units} workers={workers} reloadData={reloadData} />} />
                  <Route path="rapportage" element={<ExportPage />} />
                  <Route
                    path="dashboard"
                    element={
                      <Dashboard
                        reports={reports}
                        reloadData={reloadData}
                        setReports={setReports}
                        units={units}
                        setUnits={setUnits}
                        workers={workers}
                        setWorkers={setWorkers}
                      />
                    }
                  />
                  {/* Redirect unknown sub-routes to a default page */}
                  <Route
                    path="*"
                    element={<Navigate to="/evenementen" replace />}
                  />
                </Routes>
                <FloatingNotepad
                  open={showKladblok}
                  context={kladblokContext}
                  onClose={() => setShowKladblok(false)}
                />
              </div>
            )}
          />
        }
      />
    </Routes>
  );
}

function App() {
  const [reports, setReports] = useState([]);
  const [units, setUnits] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [showKladblok, setShowKladblok] = useState(false);
  const [kladblokContext, setKladblokContext] = useState(null);

  const openGlobalNotepad = useCallback(() => {
    const stored = localStorage.getItem("selected_event");

    if (!stored) {
      alert("Geen event geselecteerd.");
      return;
    }

    try {
      const parsed = JSON.parse(stored);
      setKladblokContext({
        type: "event",
        eventName: parsed.name || parsed.eventName,
      });
      setShowKladblok(true);
    } catch (err) {
      console.error("Failed to parse selected_event", err);
      alert("Kon geselecteerd event niet laden.");
    }
  }, []);

  const onOpenReportNotepad = (reportId) =>
  {
    if (!reportId) return;
    setKladblokContext({ type: "report", reportId });
    setShowKladblok(true);
  };

  useEffect(() => {
    const handleGlobalKladblok = (e) => {
      if (e.altKey && e.key.toLowerCase() === "k") {
        e.preventDefault();

        const stored = localStorage.getItem("selected_event");
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            setKladblokContext({
              type: "event",
              eventName: parsed.name || parsed.eventName,
            });
          } catch (err) {}
        }

        setShowKladblok((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleGlobalKladblok);
    return () => window.removeEventListener("keydown", handleGlobalKladblok);
  }, []);

  const reloadData = useCallback(async () => {
    try {
      const stored = localStorage.getItem("selected_event");
      let eventId = null;
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          eventId = parsed.id;
        } catch (err) {}
      }

      const reportsData = await getReports(eventId);
      const unitsData = await getUnits(eventId);
      const workersData = await getWorkers({ eventId });
      setReports(reportsData || []);
      const finalUnits = Array.isArray(unitsData?.data) ? unitsData.data : Array.isArray(unitsData) ? unitsData : [];
      setUnits(finalUnits);
      const finalWorkers = Array.isArray(workersData?.data) ? workersData.data : Array.isArray(workersData) ? workersData : [];
      setWorkers(finalWorkers);
    } catch (err) {
      console.error("Failed to load overview data", err);
    }
  }, []);

  useEffect(() => {
    reloadData();

    const handleStorage = (e) => {
      if (e.key === "shared_report_update" || e.key === "selected_event") {
        reloadData();
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener("storage", handleStorage);
    };
  }, [reloadData]);

  return (
    <AuthProvider>
      <NotepadProvider>
        <BrowserRouter>
          <AppContent
            reports={reports}
            setReports={setReports}
            units={units}
            setUnits={setUnits}
            workers={workers}
            setWorkers={setWorkers}
            reloadData={reloadData}
            showKladblok={showKladblok}
            setShowKladblok={setShowKladblok}
            kladblokContext={kladblokContext}
          />
        </BrowserRouter>
      </NotepadProvider>
    </AuthProvider>
  );
}

export default App;
