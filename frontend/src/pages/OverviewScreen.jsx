import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Section from "../components/layout/Section";
import OverviewTable from "../components/OverviewTable";
import { getReports, saveReport } from "../services/reportsApi";
import { getUnits, updateUnit } from "../services/unitsApi";

export default function OverviewScreen() {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Alt + N om een nieuwe melding te maken
      if (e.altKey && e.key.toLowerCase() === 'n') {
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

  const reloadData = useCallback(async () => {
    setLoading(true);
    try {
      const [reportsData, unitsData] = await Promise.all([
        getReports(),
        getUnits(),
      ]);
      setReports(reportsData);
      setUnits(unitsData);
    } catch (error) {
      console.error("Failed to fetch data:", error);
      // Optionally set an error state here
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reloadData();
  }, [reloadData]);

  const mappedUnits = useMemo(() => {
    if (!units) return [];
    return units.map((u) => ({
      ...u,
      id: u.aidTeamId || u.id,
      name: u.aidTeamName || u.name,
      teamName: u.aidTeamName || u.name,
    }));
  }, [units]);

  useEffect(() => {
    const stored = localStorage.getItem("selected_event");
    if (!stored) {
      navigate("/events");
      return;
    }
    try {
      const parsed = JSON.parse(stored);
      setSelectedEvent(parsed);
    } catch {
      navigate("/events");
      return;
    }
  }, [navigate]);

  const availableUnits = useMemo(() => {
    return mappedUnits.filter((u) => {
      const isAvailable = u.status === "AVAILABLE";
      const isForEvent =
        selectedEvent && selectedEvent.id
          ? u.eventId === selectedEvent.id
          : true;
      return isAvailable && isForEvent;
    });
  }, [mappedUnits, selectedEvent]);

  const { newReports, inProgressReports, closedReports } = useMemo(() => {
    const newR = [];
    const inProgressR = [];
    const closedR = [];

    (reports || []).forEach((wrapper) => {
      const report = wrapper.Report ?? wrapper;

      // Filter by event
      if (
        selectedEvent &&
        selectedEvent.name &&
        report.NameEvent &&
        report.NameEvent !== selectedEvent.name
      ) {
        return;
      }

      const status = (report.Status || "").toLowerCase();

      if (status === "in behandeling") {
        inProgressR.push(wrapper);
      } else if (status === "gesloten" || status === "closed") {
        closedR.push(wrapper);
      } else {
        newR.push(wrapper);
      }
    });

    const sortByTime = (a, b) => {
      const reportA = a.Report ?? a;
      const reportB = b.Report ?? b;
      const timeA = (reportA.Time || "").toString();
      const timeB = (reportB.Time || "").toString();
      return timeA.localeCompare(timeB);
    };

    newR.sort(sortByTime);
    inProgressR.sort(sortByTime);
    closedR.sort(sortByTime);

    return {
      newReports: newR,
      inProgressReports: inProgressR,
      closedReports: closedR,
    };
  }, [reports, selectedEvent]);

  const handleReportClick = (report) => {
    // It's better to navigate with the original report data if possible
    const originalWrapper = reports.find(
      (r) => (r.Report ?? r).id === report.id,
    );
    navigate("/melding", { state: { report: originalWrapper || report } });
  };

  const handleStatusUpdate = async (report) => {
    if (!report?.id) return;

    const originalWrapper = reports.find(
      (r) => (r.Report ?? r).id === report.id,
    );
    if (!originalWrapper) return;
    const originalReport = originalWrapper.Report ?? originalWrapper;

    let newStatus = "";
    if (originalReport.Status === "Open") newStatus = "In behandeling";
    else if (originalReport.Status === "In behandeling") newStatus = "Gesloten";

    if (!newStatus) return;

    // If closing the report, also set the team status to AVAILABLE
    if (newStatus === "Gesloten") {
      const teamName = originalReport.Team;
      if (teamName) {
        const team = mappedUnits.find((u) => u.name === teamName);
        if (team) {
          const payload = { ...team, status: "AVAILABLE" };
          delete payload.id;
          delete payload.name;
          delete payload.teamName;
          await updateUnit(team.id, payload);
        }
      }
    }

    const updatedReport = { ...originalReport, Status: newStatus };
    await saveReport(updatedReport);
    reloadData();
  };

  const handleTeamUpdate = async (report, newTeamName) => {
    if (!report?.id) return;

    const originalWrapper = reports.find(
      (r) => (r.Report ?? r).id === report.id,
    );
    if (!originalWrapper) return;
    const originalReport = originalWrapper.Report ?? originalWrapper;

    const oldTeamName = originalReport.Team;

    if (oldTeamName === newTeamName) return;

    // 1. Release the old team
    if (oldTeamName) {
      const oldTeam = mappedUnits.find((u) => u.name === oldTeamName);
      if (oldTeam) {
        const payload = { ...oldTeam, status: "AVAILABLE" };
        delete payload.id;
        delete payload.name;
        delete payload.teamName;
        await updateUnit(oldTeam.id, payload);
      }
    }

    // 2. Occupy the new team
    if (newTeamName) {
      const newTeam = mappedUnits.find((u) => u.name === newTeamName);
      if (newTeam) {
        const payload = { ...newTeam, status: "NOTIFICATION" };
        delete payload.id;
        delete payload.name;
        delete payload.teamName;
        await updateUnit(newTeam.id, payload);
      }
    }

    const updatedReport = { ...originalReport, Team: newTeamName };
    await saveReport(updatedReport);
    reloadData();
  };

  const handlePriorityUpdate = async (report, newPriority) => {
    if (!report?.id) return;

    const originalWrapper = reports.find(
      (r) => (r.Report ?? r).id === report.id,
    );
    if (!originalWrapper) return;
    const originalReport = originalWrapper.Report ?? originalWrapper;

    const updatedReport = { ...originalReport, Prioriteit: newPriority };
    await saveReport(updatedReport);
    reloadData();
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <Section title="Nieuwe meldingen" color="#00A651">
        <OverviewTable
          reports={newReports}
          units={availableUnits}
          placeholderRows={5}
          onRowClick={handleReportClick}
          onStatusUpdate={handleStatusUpdate}
          onTeamUpdate={handleTeamUpdate}
          onPriorityUpdate={handlePriorityUpdate}
        />
      </Section>

      <Section title="Lopende meldingen" color="#F7941D">
        <OverviewTable
          reports={inProgressReports}
          units={availableUnits}
          placeholderRows={5}
          onRowClick={handleReportClick}
          onStatusUpdate={handleStatusUpdate}
          onTeamUpdate={handleTeamUpdate}
          onPriorityUpdate={handlePriorityUpdate}
        />
      </Section>

      <Section title="Gesloten meldingen" color="#9B9B9B">
        <OverviewTable
          reports={closedReports}
          units={availableUnits}
          placeholderRows={5}
          onRowClick={handleReportClick}
          onStatusUpdate={handleStatusUpdate}
          onTeamUpdate={handleTeamUpdate}
          onPriorityUpdate={handlePriorityUpdate}
        />
      </Section>
    </div>
  );
}
