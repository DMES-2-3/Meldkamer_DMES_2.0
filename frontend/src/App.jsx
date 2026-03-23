import { useState, useEffect, useCallback } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { AuthProvider } from "./contexts/AuthContext";
import { NotepadProvider } from "./contexts/NotepadContexts";
import { getReports, getUnits } from "./services/reportsApi";

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

function App() {
  const [reports, setReports] = useState([]);
  const [units, setUnits] = useState([]);
  const [showKladblok, setShowKladblok] = useState(false);
  const [kladblokContext, setKladblokContext] = useState(null);

  useEffect(() => {
    const handleGlobalKladblok = (e) => {
      // Alt + K for opening/closing the notepad
      if (e.altKey && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        const stored = localStorage.getItem("selected_event");
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            setKladblokContext({ type: "event", eventName: parsed.name || parsed.eventName });
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
      const reportsData = await getReports();
      const unitsData = await getUnits();
      setReports(reportsData || []);
      setUnits(unitsData || []);
    } catch (err) {
      console.error("Failed to load overview data", err);
    }
  }, []);

  useEffect(() => {
    reloadData();

    const handleStorage = (e) => {
      if (e.key === "shared_report_update") {
        reloadData();
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [reloadData]);

  return (
    <AuthProvider>
      <NotepadProvider>
        <BrowserRouter>
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
                      <TopNav />
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
                        <Route path="eenheden" element={<UnitsPage />} />
                        <Route path="rapportage" element={<ExportPage />} />
                        <Route
                          path="dashboard"
                          element={
                            <Dashboard
                              reports={reports}
                              reloadData={reloadData}
                              setReports={setReports}
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
        </BrowserRouter>
      </NotepadProvider>
    </AuthProvider>
  );
}

export default App;
