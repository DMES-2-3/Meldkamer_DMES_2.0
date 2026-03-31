import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Section from "../components/layout/Section";
import OverviewTable from "../components/OverviewTable";
import { saveReport } from "../services/reportsApi";
import { updateUnit } from "../services/unitsApi";

export default function OverviewScreen({ reports, units, reloadData }) {
  const navigate = useNavigate();
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

    return {
      newReports: newR,
      inProgressReports: inProgressR,
      closedReports: closedR,
    };
  }, [reports, selectedEvent]);

  const isTeamBusyWithOtherReports = (teamName, currentReportId) => {
    return (reports || []).some((wrapper) => {
      const r = wrapper.Report ?? wrapper;
      return (
        String(r.id) !== String(currentReportId) &&
        r.Status !== "Gesloten" &&
        (r.Team === teamName || r.Assistance?.Team === teamName)
      );
    });
  };

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

    // If closing the report, also set the team status to AVAILABLE if not busy
    if (newStatus === "Gesloten") {
      const teamName = originalReport.Team;
      if (teamName) {
        const team = mappedUnits.find((u) => u.name === teamName);
        if (team) {
          const isBusy = isTeamBusyWithOtherReports(teamName, originalReport.id);
          const payload = { ...team, status: isBusy ? "NOTIFICATION" : "AVAILABLE" };
          delete payload.id;
          delete payload.name;
          delete payload.teamName;
          await updateUnit(team.id, payload);
        }
      }
      const assistanceTeamName = originalReport.Assistance?.Team;
      if (assistanceTeamName) {
        const assistanceTeam = mappedUnits.find((u) => u.name === assistanceTeamName);
        if (assistanceTeam) {
          const isBusy = isTeamBusyWithOtherReports(assistanceTeamName, originalReport.id);
          const payload = { ...assistanceTeam, status: isBusy ? "NOTIFICATION" : "AVAILABLE" };
          delete payload.id;
          delete payload.name;
          delete payload.teamName;
          await updateUnit(assistanceTeam.id, payload);
        }
      }
    }

    const updatedReport = { ...originalReport, Status: newStatus };
    await saveReport(updatedReport);
    localStorage.setItem("shared_report_update", Date.now().toString());
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
        const isBusy = isTeamBusyWithOtherReports(oldTeamName, originalReport.id);
        const payload = { ...oldTeam, status: isBusy ? "NOTIFICATION" : "AVAILABLE" };
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
    localStorage.setItem("shared_report_update", Date.now().toString());
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
    localStorage.setItem("shared_report_update", Date.now().toString());
    reloadData();
  };

  const handleDropReport = async (report, targetStatus) => {
    if (!report?.id) return;

    const originalWrapper = reports.find(
      (r) => (r.Report ?? r).id === report.id,
    );
    if (!originalWrapper) return;
    const originalReport = originalWrapper.Report ?? originalWrapper;

    const currentStatus = originalReport.Status || "Open";
    if (currentStatus === targetStatus) return;

    // If closing the report, also set the team status to AVAILABLE if not busy
    if (targetStatus === "Gesloten") {
      const teamName = originalReport.Team;
      if (teamName) {
        const team = mappedUnits.find((u) => u.name === teamName);
        if (team) {
          const isBusy = isTeamBusyWithOtherReports(teamName, originalReport.id);
          const payload = { ...team, status: isBusy ? "NOTIFICATION" : "AVAILABLE" };
          delete payload.id;
          delete payload.name;
          delete payload.teamName;
          await updateUnit(team.id, payload);
        }
      }
      const assistanceTeamName = originalReport.Assistance?.Team;
      if (assistanceTeamName) {
        const assistanceTeam = mappedUnits.find((u) => u.name === assistanceTeamName);
        if (assistanceTeam) {
          const isBusy = isTeamBusyWithOtherReports(assistanceTeamName, originalReport.id);
          const payload = { ...assistanceTeam, status: isBusy ? "NOTIFICATION" : "AVAILABLE" };
          delete payload.id;
          delete payload.name;
          delete payload.teamName;
          await updateUnit(assistanceTeam.id, payload);
        }
      }
    } else if (currentStatus === "Gesloten" && targetStatus !== "Gesloten") {
      // Reopening a report sets the team back to NOTIFICATION
      const teamName = originalReport.Team;
      if (teamName) {
        const team = mappedUnits.find((u) => u.name === teamName);
        if (team) {
          const payload = { ...team, status: "NOTIFICATION" };
          delete payload.id;
          delete payload.name;
          delete payload.teamName;
          await updateUnit(team.id, payload);
        }
      }
      const assistanceTeamName = originalReport.Assistance?.Team;
      if (assistanceTeamName) {
        const assistanceTeam = mappedUnits.find((u) => u.name === assistanceTeamName);
        if (assistanceTeam) {
          const payload = { ...assistanceTeam, status: "NOTIFICATION" };
          delete payload.id;
          delete payload.name;
          delete payload.teamName;
          await updateUnit(assistanceTeam.id, payload);
        }
      }
    }

    const updatedReport = { ...originalReport, Status: targetStatus };
    await saveReport(updatedReport);
    localStorage.setItem("shared_report_update", Date.now().toString());
    reloadData();
  };

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
          onDropReport={(report) => handleDropReport(report, "Open")}
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
          onDropReport={(report) => handleDropReport(report, "In behandeling")}
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
          onDropReport={(report) => handleDropReport(report, "Gesloten")}
        />
      </Section>
    </div>
  );
}
