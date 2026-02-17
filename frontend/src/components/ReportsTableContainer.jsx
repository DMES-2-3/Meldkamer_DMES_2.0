import React, { useState, useEffect } from "react";
import ReportsTable from "./ReportsTable";
import { getReports } from "../services/reportsApi";

// The 'reportsTab' prop is passed from the dashboard but its functionality is not implemented yet.
// It is included in the function signature to prevent potential prop-related errors.
export default function ReportsTableContainer({
  reportsTab,
  statusFilter,
  priorityFilter,
}) {
  const [allEventReports, setAllEventReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const storedEvent = localStorage.getItem("selected_event");
    let selectedEvent = null;
    if (storedEvent) {
      try {
        selectedEvent = JSON.parse(storedEvent);
      } catch (e) {
        console.error("Failed to parse selected_event from localStorage", e);
      }
    }

    const fetchReportsForEvent = async () => {
      setLoading(true);
      try {
        const fetchedReports = await getReports();
        const unwrappedReports = fetchedReports.map((r) => r.Report ?? r);

        if (selectedEvent && selectedEvent.name) {
          const eventReports = unwrappedReports.filter(
            (report) => report.NameEvent === selectedEvent.name,
          );
          setAllEventReports(eventReports);
        } else {
          setAllEventReports([]);
        }
        setError(null);
      } catch (err) {
        setError(err.message);
        setAllEventReports([]);
      } finally {
        setLoading(false);
      }
    };

    fetchReportsForEvent();
  }, []); // This effect fetches reports once when the component mounts.

  useEffect(() => {
    let reportsToFilter = [...allEventReports];

    if (statusFilter && statusFilter !== "All") {
      reportsToFilter = reportsToFilter.filter(
        (r) => r.Status === statusFilter,
      );
    }

    if (priorityFilter && priorityFilter !== "All") {
      reportsToFilter = reportsToFilter.filter(
        (r) => r.Prioriteit === priorityFilter,
      );
    }

    setFilteredReports(reportsToFilter);
  }, [allEventReports, statusFilter, priorityFilter]);

  if (loading) return <p>Rapporten laden...</p>;
  if (error) return <p style={{ color: "red" }}>Error: {error}</p>;
  if (!allEventReports.length)
    return <p>Geen rapporten beschikbaar voor dit evenement</p>;

  return <ReportsTable reports={filteredReports} />;
}
