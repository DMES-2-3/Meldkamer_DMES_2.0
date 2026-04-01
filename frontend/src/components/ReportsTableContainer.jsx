import React, { useState, useEffect } from "react";
import ReportsTable from "./ReportsTable";

// The 'reportsTab' prop is passed from the dashboard but its functionality is not implemented yet.
// It is included in the function signature to prevent potential prop-related errors.
export default function ReportsTableContainer({
  reportsTab,
  statusFilter,
  priorityFilter,
  reports = [],
}) {
  const [allEventReports, setAllEventReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);

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

    const unwrappedReports = reports.map((r) => r.Report ?? r);

    if (selectedEvent && selectedEvent.name) {
      const eventReports = unwrappedReports.filter(
        (report) => report.NameEvent === selectedEvent.name,
      );
      setAllEventReports(eventReports);
    } else {
      setAllEventReports([]);
    }
  }, [reports]);

  useEffect(() => {
    let reportsToFilter = [...allEventReports];

    if (statusFilter && statusFilter !== "Alles") {
      reportsToFilter = reportsToFilter.filter(
        (r) => r.Status === statusFilter,
      );
    }

    if (priorityFilter && priorityFilter !== "Alles") {
      reportsToFilter = reportsToFilter.filter(
        (r) => r.Prioriteit === priorityFilter,
      );
    }

    setFilteredReports(reportsToFilter);
  }, [allEventReports, statusFilter, priorityFilter]);

  if (!allEventReports.length)
    return <p>Geen meldingen beschikbaar voor dit evenement</p>;

  return <ReportsTable reports={filteredReports} />;
}
