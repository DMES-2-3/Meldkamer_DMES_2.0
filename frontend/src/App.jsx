import { useState, useEffect, useCallback } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { NotepadProvider } from "./contexts/NotepadContexts";
import { getReports, getUnits } from "./services/reportsApi";

import TopNav from "./components/layout/TopNav";
import Protected from "./components/protected";

import Dashboard from "./pages/dashboard";
import EventsPage from "./pages/EventsPage";
import Login from "./pages/login";
import OverviewScreen from "./pages/OverviewScreen";
import Register from "./pages/register";
import ReportScreen from "./pages/ReportScreen";
import UnitsPage from "./pages/UnitsPage";
import ExportPage from "./pages/Export";

function App() {
  const [reports, setReports] = useState([]);
  const [units, setUnits] = useState([]);

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
  }, [reloadData]);

  return (
    <NotepadProvider>
      <BrowserRouter>
        <Routes>
          {/* Login and Register routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Default route redirects to login */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Protected "evenementen" route (no TopNav), from HEAD, protected */}
          <Route
            path="/evenementen"
            element={<Protected Component={EventsPage} />}
          />

          {/* All other routes WITH top navigation, from HEAD, protected */}
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
                      <Route
                        path="rapportage"
                        element={<ExportPage/>}
                      />
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
                  </div>
                )}
              />
            }
          />
        </Routes>
      </BrowserRouter>
    </NotepadProvider>
  );
}

export default App;
