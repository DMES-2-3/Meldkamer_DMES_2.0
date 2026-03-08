import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  saveReport,
  getAidWorkers,
  deleteReport,
} from "../services/reportsApi";
import { getUnits, updateUnit } from "../services/unitsApi";
import TeamSelect from "../components/TeamSelect";
import { useNotepad } from "../contexts/NotepadContexts";

// Module-level constant: stable for useEffect dependency analysis
const DEFAULT_FORM_STATE = {
  ReportedBy: "", // Default to a valid user firstname to prevent backend errors
  NameEvent: "",
  Subject: "",
  Location: "",
  Note: "",
  Notepad: "",
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
  Time: new Date().toTimeString().slice(0, 5),
};

export default function ReportScreen({ reloadData }) {
  const location = useLocation();
  const navigate = useNavigate();
  const initialReport = location.state?.report;
  const fromGoogleMaps = location.state?.from === "google-maps";
  const fromPdfMap = location.state?.from === "pdf-map";
  const originalReportData = React.useRef(null);

  const [units, setUnits] = useState([]);
  const [aidWorkers, setAidWorkers] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [formData, setFormData] = useState(DEFAULT_FORM_STATE);
  const [currentTime, setCurrentTime] = useState(
    initialReport?.Report?.Time || new Date().toTimeString().slice(0, 5)
  );

  const { notes, setNotes, setActiveKey } = useNotepad();

  const reportId =
    formData.id ??
    initialReport?.Report?.id ??
    initialReport?.id ??
    null;

  const draftKey = React.useMemo(() => {
    let k = sessionStorage.getItem("draft_report_notepad_key");
    if (!k) {
      k = `notepad:report:draft:${Date.now()}-${Math.random().toString(16).slice(2)}`;
      sessionStorage.setItem("draft_report_notepad_key", k);
    }
    return k;
  }, []);

  useEffect(() => {
    const key = reportId ? `notepad:report:${reportId}` : draftKey;
    setActiveKey(key);

    return () => setActiveKey(null);
  }, [reportId, draftKey, setActiveKey]);
    
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const unitsData = await getUnits();
        const mappedUnits = (unitsData || []).map((u) => ({
          ...u,
          id: u.aidTeamId || u.id,
          name: u.aidTeamName || u.name,
        }));
        setUnits(mappedUnits);

        const workersData = await getAidWorkers();
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
    let base = { ...DEFAULT_FORM_STATE };

    const inner =
      initialReport && initialReport.Report
        ? initialReport.Report
        : initialReport;

    if (inner) {
      base = {
        ...DEFAULT_FORM_STATE,
        ...inner,
        id: inner.id ?? null,
        ReportedBy: inner.ReportedBy ?? inner.reporter ?? "",
        NameEvent: inner.NameEvent ?? inner.event ?? "",
        Subject: inner.Subject ?? inner.subject ?? "",
        Location: inner.Location ?? inner.location ?? "",
        Note: inner.Note ?? inner.note ?? "",
        Prioriteit: inner.Prioriteit ?? inner.priority ?? "",
        Status: inner.Status ?? inner.status ?? "",
        Team: inner.Team ?? inner.team ?? "",
        SITrap: { ...DEFAULT_FORM_STATE.SITrap, ...(inner.SITrap || {}) },
        AVPU: { ...DEFAULT_FORM_STATE.AVPU, ...(inner.AVPU || {}) },
        Assistance: {
          ...DEFAULT_FORM_STATE.Assistance,
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
  }, [initialReport, selectedEvent, units]);

  
  useEffect(() => {
    if (initialReport) return; 
    const interval = setInterval(() => {
      const now = new Date();
      const hours = now.getHours().toString().padStart(2, "0");
      const minutes = now.getMinutes().toString().padStart(2, "0");
      setCurrentTime(`${hours}:${minutes}`);
    }, 1000);
    return () => clearInterval(interval);
  }, [initialReport]);

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
    } else {
      navigate("/overzicht");
    }
  };

  const handleSave = async () => {
    try {
      const originalTeamName = originalReportData.current?.Team;
      const newTeamName = formData.Team;
      const originalAssistanceTeamName =
        originalReportData.current?.Assistance?.Team;
      const newAssistanceTeamName = formData.Assistance.Team;

      // 1. If main team was changed, set old team to AVAILABLE
      if (originalTeamName && originalTeamName !== newTeamName) {
        const originalTeam = units.find((u) => u.name === originalTeamName);
        if (originalTeam) {
          const payload = { ...originalTeam, status: "AVAILABLE" };
          delete payload.id;
          delete payload.name;
          await updateUnit(originalTeam.id, payload);
        }
      }

      // 2. Set new main team's status based on report status
      if (newTeamName) {
        const newTeam = units.find((u) => u.name === newTeamName);
        if (newTeam) {
          const newStatus =
            formData.Status === "Gesloten" ? "AVAILABLE" : "NOTIFICATION";
          const payload = { ...newTeam, status: newStatus };
          delete payload.id;
          delete payload.name;
          await updateUnit(newTeam.id, payload);
        }
      }

      // 3. If assistance team was changed, set old team to AVAILABLE
      if (
        originalAssistanceTeamName &&
        originalAssistanceTeamName !== newAssistanceTeamName
      ) {
        const originalAssistanceTeam = units.find(
          (u) => u.name === originalAssistanceTeamName,
        );
        if (originalAssistanceTeam) {
          const payload = { ...originalAssistanceTeam, status: "AVAILABLE" };
          delete payload.id;
          delete payload.name;
          await updateUnit(originalAssistanceTeam.id, payload);
        }
      }

      // 4. Set new assistance team's status based on report status
      if (newAssistanceTeamName) {
        const newAssistanceTeam = units.find(
          (u) => u.name === newAssistanceTeamName,
        );
        if (newAssistanceTeam) {
          const newStatus =
            formData.Status === "Gesloten" ? "AVAILABLE" : "NOTIFICATION";
          const payload = { ...newAssistanceTeam, status: newStatus };
          delete payload.id;
          delete payload.name;
          await updateUnit(newAssistanceTeam.id, payload);
        }
      }

      const payload = { ...formData, Time: currentTime };

      const savedResult = await saveReport(payload);

      const newReportId =
        savedResult?.data?.id ??
        savedResult?.data?.notificationId ??
        savedResult?.id ??
        savedResult?.notificationId ??
        formData.id;

      if (newReportId) {
        const finalKey = `notepad:report:${newReportId}`;

        const draftStored = localStorage.getItem(draftKey);
        if (draftStored != null) {
          localStorage.setItem(finalKey, draftStored);
          localStorage.removeItem(draftKey);
        }

        sessionStorage.removeItem("draft_report_notepad_key");
      }

      // If coming from PDF map, attach the new report ID to the pending marker
      if (fromPdfMap) {
        try {
          const stored = sessionStorage.getItem("pendingPdfMarker");
          if (stored) {
            const pending = JSON.parse(stored);
            // Extract report ID from the saved result
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
      alert(`Opslaan mislukt: ${err.message}`);
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
        // Release the team associated with the report
        const teamName = formData.Team;
        if (teamName) {
          const team = units.find((u) => u.name === teamName);
          if (team) {
            const payload = { ...team, status: "AVAILABLE" };
            delete payload.id;
            delete payload.name;
            await updateUnit(team.id, payload);
          }
        }

        await deleteReport(formData.id);
        if (reloadData) await reloadData();
      }
      goBack();
    } catch (err) {
      console.error("Failed to delete report:", err);
      alert(`Verwijderen mislukt: ${err.message}`);
    }
  };

  const unitsForEvent = units.filter(
    (u) => u.eventId === selectedEvent?.id
  );

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
            <input
              type="time"
              className="time-input"
              value={currentTime}
              onChange={(e) => setCurrentTime(e.target.value)}
            />
            <div className="input-group">
              <label>Melder</label>
              <input
                type="text"
                placeholder="Naam van melder"
                value={formData.ReportedBy}
                onChange={(e) => handleChange("ReportedBy", e.target.value)}
              />
            </div>
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
              value={formData.Subject}
              onChange={(e) => handleChange("Subject", e.target.value)}
            />
          </div>

          <div className="input-group">
            <label>Locatie</label>
            <input
              type="text"
              value={formData.Location}
              onChange={(e) => handleChange("Location", e.target.value)}
            />
          </div>

          <div className="input-group full-height">
            <label>Beschrijving</label>
            <textarea
              value={formData.Note}
              onChange={(e) => handleChange("Note", e.target.value)}
            />
          </div>

          <div className="input-group priority-group">
            <label>Prioriteit:</label>
            <div className="priority-flags">
              <button
                className={`flag green ${formData.Prioriteit?.toLowerCase() === "laag" ? "active" : ""}`}
                onClick={() => handleChange("Prioriteit", "Laag")}
              >
                ⚑
              </button>
              <button
                className={`flag orange ${formData.Prioriteit?.toLowerCase() === "gemiddeld" ? "active" : ""}`}
                onClick={() => handleChange("Prioriteit", "Gemiddeld")}
              >
                ⚑
              </button>
              <button
                className={`flag red ${formData.Prioriteit?.toLowerCase() === "hoog" ? "active" : ""}`}
                onClick={() => handleChange("Prioriteit", "Hoog")}
              >
                ⚑
              </button>
            </div>
          </div>

          <div className="input-group">
            <TeamSelect
              units={unitsForEvent}
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
            <button className="btn-save" onClick={handleSave}>
              Opslaan
            </button>
            {formData.id && (
              <button className="btn-delete" onClick={handleDelete}>
                Verwijderen
              </button>
            )}
            <button className="btn-cancel" onClick={handleCancel}>
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
              value={formData.SITrap.Gender}
              onChange={(e) => handleSITrapChange("Gender", e.target.value)}
            >
              <option value="">Man / vrouw</option>
              <option value="Man">Man</option>
              <option value="Vrouw">Vrouw</option>
              <option value="X">X</option>
            </select>
          </div>

          <div className="input-group">
            <label>Gebeurtenis of ongevalsmechanisme</label>
            <textarea
              value={formData.SITrap.Event}
              onChange={(e) => handleSITrapChange("Event", e.target.value)}
            />
          </div>

          <div className="input-group">
            <label>Aandoeningen en letsels</label>
            <textarea
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
            <div className="input-group"
                  style={{ marginBottom: "12px" }}>
              <label>Optioneel extra team</label>
              <TeamSelect
                units={unitsForEvent}
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
            </div>
          </div>

          <div className="input-group priority-group">
            <label>Ambulance nodig?</label>
            <input
              type="checkbox"
              checked={formData.Ambulance}
              onChange={(e) => handleChange("Ambulance", e.target.checked)}
            />
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
            className="notepad"
            placeholder="Schrijf notitie"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
