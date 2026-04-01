import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getStoredMapState, broadcastMapState } from "../utils/mapSync";
import {
  saveReport,
  getAidWorkers,
  deleteReport,
  getReports,
} from "../services/reportsApi";
import { getUnits, updateUnit } from "../services/unitsApi";
import TeamSelect from "../components/TeamSelect";

const getCurrentTime = () => new Date().toTimeString().slice(0, 5);

const createDefaultFormState = () => ({
  ReportedBy: "",
  NameEvent: "",
  Subject: "",
  Location: "",
  Note: "",
  Notepad: "",
  Logbook: [],
  Team: "",
  Prioriteit: "Laag",
  Status: "Open",
  SITrap: {
    Gender: "",
    Event: "",
    Condition: "",
  },
  AVPU: {
    Alert: false,
    Verbal: false,
    Pain: false,
    Unresponsive: false,
  },
  Assistance: {
    Coordinator: false,
    Doctor: false,
    Spoedzorg: false,
    BasiszorgVPK: false,
    Team: "",
  },
  Ambulance: false,
  Time: getCurrentTime(),
});

export default function ReportScreen({ reloadData }) {
  const location = useLocation();
  const navigate = useNavigate();

  const subjectRef = React.useRef(null);
  const locationRef = React.useRef(null);
  const noteRef = React.useRef(null);
  const teamRef = React.useRef(null);
  const genderRef = React.useRef(null);
  const eventRef = React.useRef(null);
  const conditionRef = React.useRef(null);
  const notepadRef = React.useRef(null);

  const initialReport = location.state?.report;
  const fromGoogleMaps = location.state?.from === "google-maps";
  const fromPdfMap = location.state?.from === "pdf-map";
  const fromMap = location.state?.from === "map";
  const originalReportData = React.useRef(null);

  const [units, setUnits] = useState([]);
  const [aidWorkers, setAidWorkers] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [formData, setFormData] = useState(createDefaultFormState);

  const [reporterType, setReporterType] = useState("");
  const [customReporter, setCustomReporter] = useState("");

  const [isSaving, setIsSaving] = useState(false);
  const [logbookInput, setLogbookInput] = useState("");

  const handleAddLogbook = () => {
    if (!logbookInput.trim()) return;
    const newEntry = {
      time: getCurrentTime(),
      event: logbookInput.trim(),
    };
    setFormData((prev) => ({
      ...prev,
      Logbook: [...(prev.Logbook || []), newEntry],
    }));
    setLogbookInput("");
  };

  const handleRemoveLogbook = (indexToRemove) => {
    setFormData((prev) => ({
      ...prev,
      Logbook: (prev.Logbook || []).filter((_, idx) => idx !== indexToRemove),
    }));
  };

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const stored = localStorage.getItem("selected_event");
        let eventId = null;
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            eventId = parsed.id;
          } catch (e) {}
        }

        const unitsData = await getUnits(eventId);
        const mappedUnits = (unitsData || []).map((u) => ({
          ...u,
          id: u.aidTeamId || u.id,
          name: u.aidTeamName || u.name,
        }));
        setUnits(mappedUnits);

        const workersData = await getAidWorkers({ eventId });
        setAidWorkers(workersData);
      } catch (error) {
        console.error("Failed to fetch initial data:", error);
        setUnits([]);
        setAidWorkers([]);
      }
    };

    fetchInitialData();
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem("selected_event");
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored);
      setSelectedEvent(parsed);
    } catch {
      // ignore parse errors
    }
  }, []);

  useEffect(() => {
    let base = createDefaultFormState();

    const inner =
      initialReport && initialReport.Report
        ? initialReport.Report
        : initialReport;

    if (inner) {
      base = {
        ...createDefaultFormState(),
        ...inner,
        id: inner.id ?? null,
        ReportedBy: inner.ReportedBy ?? inner.reporter ?? "",
        NameEvent: inner.NameEvent ?? inner.event ?? "",
        Subject: inner.Subject ?? inner.subject ?? "",
        Location: inner.Location ?? inner.location ?? "",
        Note: inner.Note ?? inner.note ?? "",
        Notepad: inner.Notepad ?? inner.notepad ?? "",
        Prioriteit: inner.Prioriteit ?? inner.priority ?? "",
        Status: inner.Status ?? inner.status ?? "",
        Team: inner.Team ?? inner.team ?? "",
        Time: inner.Time ?? inner.time ?? getCurrentTime(),
        SITrap: { ...createDefaultFormState().SITrap, ...(inner.SITrap || {}) },
        AVPU: { ...createDefaultFormState().AVPU, ...(inner.AVPU || {}) },
        Assistance: {
          ...createDefaultFormState().Assistance,
          ...(inner.Assistance || {}),
        },
      };
      originalReportData.current = {
        Team: base.Team,
        Status: base.Status,
        Assistance: base.Assistance,
      };
    }

    if (
      selectedEvent &&
      (selectedEvent.name || selectedEvent.eventName) &&
      !base.NameEvent
    ) {
      base.NameEvent = selectedEvent.name || selectedEvent.eventName;
    }

    setFormData(base);

    const reporter = base.ReportedBy || "";

    const teamNames = unitsForEvent.map(u => u.name);

    if (teamNames.includes(reporter)) {
      setReporterType(reporter);
    }
    else if (reporter === "Beveiliging") {
      setReporterType("Beveiliging");
    }
    else if (reporter === "Organisatie") {
      setReporterType("Organisatie");
    }
    else if (reporter) {
      setReporterType("Anders");
      setCustomReporter(reporter);
    }
  }, [initialReport, selectedEvent, units]);

  const isExistingReport = !!(
    formData.id ??
    initialReport?.Report?.id ??
    initialReport?.id
  );

  useEffect(() => {
    const refreshTime = () => {
      if (!isExistingReport) {
        setFormData((prev) => ({
          ...prev,
          Time: getCurrentTime(),
        }));
      }
    };

    refreshTime();

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        refreshTime();
      }
    };

    const handleFocus = () => {
      refreshTime();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
    };
  }, [isExistingReport]);

  const handleChange = (field, value) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  const handleSITrapChange = (field, value) =>
    setFormData((prev) => ({
      ...prev,
      SITrap: { ...prev.SITrap, [field]: value },
    }));

  const handleAVPUChange = (field) =>
    setFormData((prev) => ({
      ...prev,
      AVPU: { ...prev.AVPU, [field]: !prev.AVPU[field] },
    }));

  const handleAssistanceChange = (field, value) =>
    setFormData((prev) => ({
      ...prev,
      Assistance: { ...prev.Assistance, [field]: value },
    }));

  const goBack = () => {
    if (fromGoogleMaps) {
      navigate("/dashboard", { state: { openMapType: "GoogleMaps" } });
    } else if (fromPdfMap) {
      navigate("/dashboard", { state: { openMapType: "PDF" } });
    } else if (fromMap) {
      navigate("/dashboard");
    } else {
      navigate("/overzicht");
    }
  };

  const handleSave = async () => {
    if (isSaving) return;

    setIsSaving(true);

    try {
      const originalTeamName = originalReportData.current?.Team;
      const newTeamName = formData.Team;
      const originalAssistanceTeamName =
        originalReportData.current?.Assistance?.Team;
      const newAssistanceTeamName = formData.Assistance.Team;

      const eventIdToFetch = selectedEvent?.id || selectedEvent?.eventId;
      const allReports = eventIdToFetch ? await getReports(eventIdToFetch) : [];
      const activeReports = allReports
        .map((r) => r.Report || r)
        .filter((r) => r.Status !== "Gesloten" && String(r.id) !== String(formData.id));

      const isTeamBusy = (teamName) => activeReports.some((r) => r.Team === teamName || r.Assistance?.Team === teamName);

      if (originalTeamName && originalTeamName !== newTeamName) {
        const originalTeam = units.find((u) => u.name === originalTeamName);
        if (originalTeam) {
          const newStatus = isTeamBusy(originalTeamName) ? (originalTeam.status === "AVAILABLE" ? "NOTIFICATION" : originalTeam.status) : "AVAILABLE";
          const payload = { ...originalTeam, status: newStatus };
          delete payload.id;
          delete payload.name;
          await updateUnit(originalTeam.id, payload);
        }
      }

      if (newTeamName) {
        const newTeam = units.find((u) => u.name === newTeamName);
        if (newTeam) {
          let newStatus = newTeam.status && newTeam.status !== "AVAILABLE" ? newTeam.status : "NOTIFICATION";
          if (formData.Status === "Gesloten") {
             newStatus = isTeamBusy(newTeamName) ? newStatus : "AVAILABLE";
          } else if (originalReportData.current?.Status === "Gesloten" && formData.Status !== "Gesloten") {
             newStatus = "NOTIFICATION";
          }
          const payload = { ...newTeam, status: newStatus };
          delete payload.id;
          delete payload.name;
          await updateUnit(newTeam.id, payload);
        }
      }

      if (
        originalAssistanceTeamName &&
        originalAssistanceTeamName !== newAssistanceTeamName
      ) {
        const originalAssistanceTeam = units.find(
          (u) => u.name === originalAssistanceTeamName,
        );
        if (originalAssistanceTeam) {
          const newStatus = isTeamBusy(originalAssistanceTeamName) ? (originalAssistanceTeam.status === "AVAILABLE" ? "NOTIFICATION" : originalAssistanceTeam.status) : "AVAILABLE";
          const payload = { ...originalAssistanceTeam, status: newStatus };
          delete payload.id;
          delete payload.name;
          await updateUnit(originalAssistanceTeam.id, payload);
        }
      }

      if (newAssistanceTeamName) {
        const newAssistanceTeam = units.find(
          (u) => u.name === newAssistanceTeamName,
        );
        if (newAssistanceTeam) {
          let newStatus = newAssistanceTeam.status && newAssistanceTeam.status !== "AVAILABLE" ? newAssistanceTeam.status : "NOTIFICATION";
          if (formData.Status === "Gesloten") {
             newStatus = isTeamBusy(newAssistanceTeamName) ? newStatus : "AVAILABLE";
          } else if (originalReportData.current?.Status === "Gesloten" && formData.Status !== "Gesloten") {
             newStatus = "NOTIFICATION";
          }
          const payload = { ...newAssistanceTeam, status: newStatus };
          delete payload.id;
          delete payload.name;
          await updateUnit(newAssistanceTeam.id, payload);
        }
      }

      const savedResult = await saveReport(formData);

      const newReportId =
        savedResult?.data?.id ??
        savedResult?.data?.notificationId ??
        savedResult?.id ??
        savedResult?.notificationId ??
        formData.id;

      if (newReportId) {
        localStorage.setItem("shared_report_update", Date.now().toString());
      }

      if (fromPdfMap) {
        try {
          const stored = sessionStorage.getItem("pendingPdfMarker");
          if (stored) {
            const pending = JSON.parse(stored);
            const newReportId =
              savedResult?.data?.id ??
              savedResult?.data?.notificationId ??
              savedResult?.id ??
              savedResult?.notificationId ??
              formData.id;

            if (newReportId) {
              const shortLabel = formData.Note || formData.Subject || "Marker";
              pending.reportId = newReportId.toString();
              pending.label =
                shortLabel.length > 25
                  ? shortLabel.slice(0, 25).trim() + "..."
                  : shortLabel;
              sessionStorage.setItem(
                "pendingPdfMarker",
                JSON.stringify(pending),
              );
            }
          }
        } catch {
          // ignore sessionStorage errors
        }
      }

      if (reloadData) await reloadData();
      goBack();
    } catch (err) {
      console.error("Failed to save report:", err);
      let errMsg = err.message || "";
      if (errMsg.toLowerCase().includes("data too long") || errMsg.includes("1406") || errMsg.toLowerCase().includes("invoer te groot")) {
        errMsg = "Fout: Invoer te groot.";
      } else {
        errMsg = "Fout: Kan gegevens niet opslaan. Probeer het later opnieuw.";
      }
      alert(`Opslaan mislukt: ${errMsg}`);
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (fromPdfMap) {
      sessionStorage.removeItem("pendingPdfMarker");
    }
    goBack();
  };

  const handleDelete = async () => {
    if (!window.confirm("Weet je zeker dat je deze melding wilt verwijderen?"))
      return;
    try {
      if (formData.id) {
        await deleteReport(formData.id);

        const mapState = getStoredMapState();
        if (mapState.markers) {
          const updatedMarkers = mapState.markers.filter(
            (m) => m.reportId !== formData.id.toString(),
          );
          broadcastMapState({ markers: updatedMarkers });
        }

        localStorage.setItem("shared_report_update", Date.now().toString());
        if (reloadData) await reloadData();
      }
      goBack();
    } catch (err) {
      console.error("Failed to delete report:", err);
      alert(`Verwijderen mislukt: ${err.message}`);
    }
  };

  const unitsForEvent = units.filter((u) => u.eventId === selectedEvent?.id);

  React.useEffect(() => {
    const handleGlobalSave = (e) => {
      if (e.ctrlKey && e.key === "Enter") {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener("keydown", handleGlobalSave);
    return () => window.removeEventListener("keydown", handleGlobalSave);
  });

  const availableUnitsForEvent = unitsForEvent.filter(
    (u) => u.status === "AVAILABLE",
  );

  const isCoordinates =
    formData.Location &&
    /^[-+]?\d{1,2}\.\d+,\s*[-+]?\d{1,3}\.\d+$/.test(formData.Location.trim());
  const isLocationReadOnly = fromGoogleMaps || isCoordinates;

  return (
    <div className="report-screen">
      {/* Melding Column */}
      <div className="report-column">
        <div className="column-header">
          <label>Melding</label>
          {selectedEvent && (
            <span style={{ marginLeft: "10px", fontWeight: "normal" }}>
              – {selectedEvent.name || selectedEvent.eventName}
            </span>
          )}
        </div>
        <div className="column-content">
          <div className="form-row">
            <div className="input-group">
              <label>Tijd</label>
              <input
                type="time"
                className="time-input"
                value={formData.Time}
                onChange={(e) => handleChange("Time", e.target.value)}
              />
            </div>

            <div className="input-group">
              <label>Melder</label>
              <select
                className="reporter-dropdown"
                value={reporterType}
                onChange={(e) => {
                  const value = e.target.value;
                  setReporterType(value);

                  if (value === "Anders") {
                    handleChange("ReportedBy", customReporter);
                  }
                  else {
                    setCustomReporter("");
                    handleChange("ReportedBy", value);
                  }
                }}
              >
                <option value="">Selecteer melder</option>

                {unitsForEvent.map((team) => (
                  <option key={team.id} value={team.name}>
                    {team.name}
                  </option>
                ))}

                <option value="Beveiliging">Beveiliging</option>
                <option value="Organisatie">Organisatie</option>
                <option value="Anders">Anders</option>
              </select>
            </div>

            {reporterType === "Anders" && (
              <div className="input-group">
                <label>Specificatie melder</label>
                <input
                  type="text"
                  className="custom-reporter-input"
                  placeholder="Bijv. roepnummer"
                  value={customReporter}
                  onChange={(e) => {
                    setCustomReporter(e.target.value);
                    handleChange("ReportedBy", e.target.value);
                  }}
                />
              </div>
            )}
          </div>

          <div className="input-group">
            <label>Naam evenement</label>
            <input
              type="text"
              value={formData.NameEvent}
              onChange={(e) => handleChange("NameEvent", e.target.value)}
              readOnly
            />
          </div>

          <div className="input-group">
            <label>Onderwerp</label>
            <input
              type="text"
              ref={subjectRef}
              value={formData.Subject}
              onChange={(e) => handleChange("Subject", e.target.value)}
            />
          </div>

          <div className="input-group">
            <label>
              Locatie
              {isLocationReadOnly && (
                <span
                  style={{
                    fontSize: "0.85em",
                    color: "#888",
                    marginLeft: "6px",
                  }}
                >
                  (Map Coördinaten)
                </span>
              )}
            </label>
            <input
              type="text"
              ref={locationRef}
              value={formData.Location}
              onChange={(e) => handleChange("Location", e.target.value)}
              readOnly={isLocationReadOnly}
              disabled={isLocationReadOnly}
              title={
                isLocationReadOnly
                  ? "Locked because it contains map coordinates"
                  : ""
              }
            />
          </div>

          <div className="input-group full-height">
            <label>Beschrijving</label>
            <textarea
              ref={noteRef}
              value={formData.Note}
              onChange={(e) => handleChange("Note", e.target.value)}
            />
          </div>

          <div className="input-group priority-group">
            <label>Prioriteit:</label>
            <div className="priority-flags">
              <button
                className={`flag green ${
                  formData.Prioriteit?.toLowerCase() === "laag" ? "active" : ""
                }`}
                onClick={() => handleChange("Prioriteit", "Laag")}
              >
                ⚑
              </button>
              <button
                className={`flag orange ${
                  formData.Prioriteit?.toLowerCase() === "gemiddeld"
                    ? "active"
                    : ""
                }`}
                onClick={() => handleChange("Prioriteit", "Gemiddeld")}
              >
                ⚑
              </button>
              <button
                className={`flag red ${
                  formData.Prioriteit?.toLowerCase() === "hoog" ? "active" : ""
                }`}
                onClick={() => handleChange("Prioriteit", "Hoog")}
              >
                ⚑
              </button>
            </div>
          </div>

          <div className="input-group" ref={teamRef} tabIndex={-1}>
            <TeamSelect
              units={availableUnitsForEvent}
              value={formData.Team}
              onChange={(val) => handleChange("Team", val)}
            />
          </div>

          <div className="input-group">
            <select
              value={formData.Status}
              onChange={(e) => handleChange("Status", e.target.value)}
            >
              <option value="Open">Open</option>
              <option value="In behandeling">In behandeling</option>
              <option value="Gesloten">Gesloten</option>
            </select>
          </div>

          <div className="button-row">
            <button
              className="btn-save"
              onClick={handleSave}
              disabled={isSaving}
            >
              Opslaan
            </button>
            {formData.id && (
              <button
                className="btn-delete"
                onClick={handleDelete}
                disabled={isSaving}
              >
                Verwijderen
              </button>
            )}
            <button
              className="btn-cancel"
              onClick={handleCancel}
              disabled={isSaving}
            >
              Annuleren
            </button>
          </div>
        </div>
      </div>

      {/* SITRAP Column */}
      <div className="report-column">
        <div className="column-header">
          <label>SITRAP</label>
        </div>
        <div className="column-content">
          <div className="input-group">
            <select
              ref={genderRef}
              value={formData.SITrap.Gender}
              onChange={(e) => handleSITrapChange("Gender", e.target.value)}
            >
              <option value="">Man / Vrouw</option>
              <option value="Man">Man</option>
              <option value="Vrouw">Vrouw</option>
              <option value="X">Anders</option>
            </select>
          </div>

          <div className="input-group">
            <label>Gebeurtenis of ongevalsmechanisme</label>
            <textarea
              ref={eventRef}
              value={formData.SITrap.Event}
              onChange={(e) => handleSITrapChange("Event", e.target.value)}
            />
          </div>

          <div className="input-group">
            <label>Aandoeningen en letsels</label>
            <textarea
              ref={conditionRef}
              value={formData.SITrap.Condition}
              onChange={(e) => handleSITrapChange("Condition", e.target.value)}
            />
          </div>

          <div className="section-block">
            <div className="section-title">
              <h3>AVPU</h3>
            </div>
            <div className="checkbox-list">
              {["Alert", "Verbal", "Pain", "Unresponsive"].map((field) => (
                <label key={field}>
                  <input
                    type="checkbox"
                    checked={formData.AVPU[field]}
                    onChange={() => handleAVPUChange(field)}
                  />{" "}
                  {field}
                </label>
              ))}
            </div>
          </div>

          <div className="section-block">
            <div className="section-title">
              <h3>Assistentie</h3>
            </div>
            <div className="input-group" style={{ marginBottom: "12px" }}>
              <label>Optioneel extra team</label>
              <TeamSelect
                units={availableUnitsForEvent}
                value={formData.Assistance.Team}
                onChange={(val) => handleAssistanceChange("Team", val)}
              />
            </div>
            <div className="checkbox-list">
              <label>
                <input
                  type="checkbox"
                  checked={formData.Assistance.Coordinator}
                  onChange={() =>
                    handleAssistanceChange(
                      "Coordinator",
                      !formData.Assistance.Coordinator,
                    )
                  }
                />{" "}
                Coordinator
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={formData.Assistance.Doctor}
                  onChange={() =>
                    handleAssistanceChange(
                      "Doctor",
                      !formData.Assistance.Doctor,
                    )
                  }
                />{" "}
                Dokter
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={formData.Assistance.Spoedzorg}
                  onChange={() =>
                    handleAssistanceChange(
                      "Spoedzorg",
                      !formData.Assistance.Spoedzorg,
                    )
                  }
                />{" "}
                Spoedzorg
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={formData.Assistance.BasiszorgVPK}
                  onChange={() =>
                    handleAssistanceChange(
                      "BasiszorgVPK",
                      !formData.Assistance.BasiszorgVPK,
                    )
                  }
                />{" "}
                Basiszorg VPK
              </label>
              <div className="priority-extra-assistance">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.Ambulance}
                    onChange={(e) =>
                      handleChange("Ambulance", e.target.checked)
                    }
                  />
                  Ambulance nodig?
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Notepad Column */}
      <div className="report-column">
        <div className="column-header">
          <label>Kladblok</label>
        </div>
        <div className="column-content full-height notepad-column">
          <textarea
            ref={notepadRef}
            className="notepad"
            placeholder="Schrijf notitie"
            value={formData.Notepad}
            onChange={(e) => handleChange("Notepad", e.target.value)}
            style={{ flex: 1, minHeight: "200px" }}
          />

          <div
            className="logbook-section"
            style={{
              marginTop: "20px",
              display: "flex",
              flexDirection: "column",
              flexShrink: 0,
            }}
          >
            <div className="column-header" style={{ marginBottom: "10px" }}>
              <label>Logboek</label>
            </div>
            <div
              className="input-group"
              style={{
                flexDirection: "row",
                gap: "10px",
                marginBottom: "10px",
              }}
            >
              <input
                type="text"
                value={logbookInput}
                onChange={(e) => setLogbookInput(e.target.value)}
                placeholder="Nieuwe gebeurtenis..."
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddLogbook();
                  }
                }}
              />
              <button
                className="btn-action"
                onClick={handleAddLogbook}
                type="button"
                style={{
                  flex: "0 0 auto",
                  padding: "8px 16px",
                  fontSize: "14px",
                }}
              >
                Log
              </button>
            </div>
            <div
              className="logbook-timeline"
              style={{
                maxHeight: "400px",
                overflowY: "auto",
                border: "1px solid #d1d5db",
                borderRadius: "4px",
                padding: "10px 12px",
                background: "#f9fafb",
                minHeight: "400px",
                fontSize: "14px",
              }}
            >
              {(formData.Logbook || []).map((entry, idx) => (
                <div
                  key={idx}
                  style={{
                    marginBottom: "6px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                  }}
                >
                  <div>
                    <strong style={{ color: "#374151" }}>{entry.time}</strong>{" "}
                    <span style={{ color: "#4b5563" }}>- {entry.event}</span>
                  </div>
                  <button
                    onClick={() => handleRemoveLogbook(idx)}
                    title="Verwijderen"
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "#dc2626",
                      cursor: "pointer",
                      fontWeight: "bold",
                      padding: "0 4px",
                      lineHeight: "1",
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
              {(!formData.Logbook || formData.Logbook.length === 0) && (
                <div style={{ color: "#9ca3af", fontStyle: "italic" }}>
                  Geen logboek items...
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
