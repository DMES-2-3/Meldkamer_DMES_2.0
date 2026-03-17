import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  getUnits,
  getUnit,
  createUnit,
  updateUnit,
  deleteUnit,
  getWorkers,
  createWorker,
  updateWorker,
  deleteWorker,
} from "../services/unitsApi";
import { STATUSES, UNIT_STATUSES } from "../constants";
import "../UnitsPage.css";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STATUS_OPTIONS = Object.entries(UNIT_STATUSES).map(
  ([value, { label }]) => ({
    value,
    label,
  }),
);

const getStatusLabelClass = (status) => {
  switch (status) {
    case "AVAILABLE":
      return "label-green";
    case "NOTIFICATION":
      return "label-yellow";
    case "WAIT":
      return "label-blue";
    case "ACTIVE":
      return "label-green";
    case "BUSY":
      return "label-yellow";
    default:
      return "label-gray";
  }
};

const statusLabel = (status) =>
  UNIT_STATUSES[status]?.label ?? STATUSES[status]?.label ?? status;

// ---------------------------------------------------------------------------
// SectionCards — dark header bar + cards grid
// ---------------------------------------------------------------------------

function SectionCards({ title, accent, items, emptyMsg }) {
  return (
    <section className="up-section">
      <div className="up-section-header" style={{ background: accent }}>
        <span>{title}</span>
        <span className="up-section-count">{items.length}</span>
      </div>
      <div className="up-cards-wrapper">
        {items.length === 0 ? (
          <div className="up-td-empty">{emptyMsg}</div>
        ) : (
          <div className="units-unit-list">
            {items}
          </div>
        )}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Reusable form primitives
// ---------------------------------------------------------------------------

function Field({ label, error, children }) {
  return (
    <div className="up-field">
      {label && <label className="up-field-label">{label}</label>}
      {children}
      {error && <span className="up-field-error">{error}</span>}
    </div>
  );
}

function TextInput({ value, onChange, placeholder, disabled }) {
  return (
    <input
      className="up-input"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
    />
  );
}

function SelectInput({ value, onChange, options, placeholder, disabled }) {
  return (
    <select
      className="up-input"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

// ---------------------------------------------------------------------------
// Modal shell
// ---------------------------------------------------------------------------

function Modal({ title, onClose, children }) {
  return (
    <div className="up-modal-backdrop" onClick={onClose}>
      <div className="up-modal" onClick={(e) => e.stopPropagation()}>
        <div className="up-modal-header">
          <h2 className="up-modal-title">{title}</h2>
          <button className="up-modal-close" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="up-modal-body">{children}</div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Delete confirm modal
// ---------------------------------------------------------------------------

function DeleteModal({ label, onClose, onConfirm, deleting }) {
  return (
    <Modal title="Verwijderen bevestigen" onClose={onClose}>
      <p className="up-delete-msg">
        Weet je zeker dat je <strong>{label}</strong> wilt verwijderen?
      </p>
      <div className="up-modal-footer">
        <button
          className="up-btn up-btn-secondary"
          onClick={onClose}
          disabled={deleting}
        >
          Annuleren
        </button>
        <button
          className="up-btn up-btn-danger"
          onClick={onConfirm}
          disabled={deleting}
        >
          {deleting ? "Verwijderen…" : "Verwijderen"}
        </button>
      </div>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Worker modal — add / edit
// ---------------------------------------------------------------------------

function WorkerModal({ worker, eventId, onClose, onSaved }) {
  const isEdit = !!worker;

  const [form, setForm] = useState({
    firstName: worker?.firstName ?? "",
    lastName: worker?.lastName ?? "",
    callNumber: worker?.callNumber ?? "",
    workerType: worker?.workerType ?? "",
    status: worker?.status ?? "AVAILABLE",
    note: worker?.note ?? "",
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState("");

  const set = (field) => (val) => setForm((f) => ({ ...f, [field]: val }));

  const validate = () => {
    const e = {};
    if (!form.firstName.trim()) e.firstName = "Verplicht";
    if (!form.lastName.trim()) e.lastName = "Verplicht";
    if (!form.callNumber.trim()) e.callNumber = "Verplicht";
    if (!form.workerType.trim()) e.workerType = "Verplicht";
    if (!form.status) e.status = "Verplicht";
    return e;
  };

  const handleSave = async () => {
    const e = validate();
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }
    setSaving(true);
    setApiError("");
    try {
      const payload = { ...form, eventId };
      isEdit
        ? await updateWorker(worker.id, payload)
        : await createWorker(payload);
      onSaved();
    } catch (err) {
      setApiError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title={isEdit ? "Hulpverlener bewerken" : "Hulpverlener toevoegen"}
      onClose={onClose}
    >
      {apiError && <div className="up-api-error">{apiError}</div>}

      <div className="up-form-grid">
        <Field label="Voornaam" error={errors.firstName}>
          <TextInput
            value={form.firstName}
            onChange={set("firstName")}
            placeholder="Jan"
          />
        </Field>
        <Field label="Achternaam" error={errors.lastName}>
          <TextInput
            value={form.lastName}
            onChange={set("lastName")}
            placeholder="de Vries"
          />
        </Field>
        <Field label="Roepnummer" error={errors.callNumber}>
          <TextInput
            value={form.callNumber}
            onChange={set("callNumber")}
            placeholder="A-01"
          />
        </Field>
        <Field label="Type" error={errors.workerType}>
          <TextInput
            value={form.workerType}
            onChange={set("workerType")}
            placeholder="bv. EHBO, BHV, Arts…"
          />
        </Field>
        <Field label="Status" error={errors.status}>
          <SelectInput
            value={form.status}
            onChange={set("status")}
            options={STATUS_OPTIONS}
            placeholder="Kies status…"
          />
        </Field>
        <Field label="Notitie">
          <TextInput
            value={form.note}
            onChange={set("note")}
            placeholder="Optionele notitie"
          />
        </Field>
      </div>

      <div className="up-modal-footer">
        <button
          className="up-btn up-btn-secondary"
          onClick={onClose}
          disabled={saving}
        >
          Annuleren
        </button>
        <button
          className="up-btn up-btn-primary"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? "Opslaan…" : isEdit ? "Opslaan" : "Toevoegen"}
        </button>
      </div>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Team modal — add / edit  (checkbox worker picker)
// ---------------------------------------------------------------------------

function TeamModal({ team, eventId, onClose, onSaved }) {
  const isEdit = !!team;

  const [form, setForm] = useState({
    teamName: team?.name ?? "",
    callNumber: team?.callNumber ?? "",
    status: team?.status ?? "AVAILABLE",
    note: team?.note ?? "",
  });
  const [selectedWorkerIds, setSelectedWorkerIds] = useState(
    team?.workers?.map((w) => w.id) ?? [],
  );
  const [availableWorkers, setAvailableWorkers] = useState([]);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState("");
  const [loadingWorkers, setLoadingWorkers] = useState(true);

  const set = (field) => (val) => setForm((f) => ({ ...f, [field]: val }));

  useEffect(() => {
    const load = async () => {
      try {
        setLoadingWorkers(true);
        const res = await getWorkers({ eventId });
        const all = Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res)
            ? res
            : [];
        const currentIds = new Set(team?.workers?.map((w) => w.id) ?? []);
        setAvailableWorkers(
          all.filter((w) => !w.isActive || currentIds.has(w.id)),
        );
      } catch {
        setAvailableWorkers([]);
      } finally {
        setLoadingWorkers(false);
      }
    };
    load();
  }, [eventId, team]);

  const toggleWorker = (id) =>
    setSelectedWorkerIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );

  const validate = () => {
    const e = {};
    if (!form.teamName.trim()) e.teamName = "Verplicht";
    if (!form.status) e.status = "Verplicht";
    if (selectedWorkerIds.length < 1)
      e.workers = "Selecteer minimaal 1 hulpverlener";
    return e;
  };

  const handleSave = async () => {
    const e = validate();
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }
    setSaving(true);
    setApiError("");
    try {
      const payload = { ...form, workerIds: selectedWorkerIds, eventId };
      isEdit ? await updateUnit(team.id, payload) : await createUnit(payload);
      onSaved();
    } catch (err) {
      setApiError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={isEdit ? "Team bewerken" : "Team aanmaken"} onClose={onClose}>
      {apiError && <div className="up-api-error">{apiError}</div>}

      <div className="up-form-grid">
        <Field label="Teamnaam" error={errors.teamName}>
          <TextInput
            value={form.teamName}
            onChange={set("teamName")}
            placeholder="Team Alpha"
          />
        </Field>
        <Field label="Roepnummer">
          <TextInput
            value={form.callNumber}
            onChange={set("callNumber")}
            placeholder="T-01"
          />
        </Field>
        <Field label="Status" error={errors.status}>
          <SelectInput
            value={form.status}
            onChange={set("status")}
            options={STATUS_OPTIONS}
            placeholder="Kies status…"
          />
        </Field>
        <Field label="Notitie">
          <TextInput
            value={form.note}
            onChange={set("note")}
            placeholder="Optionele notitie"
          />
        </Field>
      </div>

      <div className="up-worker-picker">
        <div className="up-worker-picker-header">
          <span className="up-worker-picker-title">Hulpverleners</span>
          <span className="up-worker-picker-count">
            {selectedWorkerIds.length} geselecteerd
          </span>
        </div>
        {errors.workers && (
          <div className="up-field-error up-field-error--standalone">
            {errors.workers}
          </div>
        )}
        {loadingWorkers ? (
          <div className="up-worker-picker-loading">Laden…</div>
        ) : availableWorkers.length === 0 ? (
          <div className="up-worker-picker-empty">
            Geen beschikbare hulpverleners. Voeg eerst hulpverleners toe op het
            tabblad Hulpverleners.
          </div>
        ) : (
          <div className="up-worker-picker-list">
            {availableWorkers.map((w) => {
              const checked = selectedWorkerIds.includes(w.id);
              return (
                <label
                  key={w.id}
                  className={`up-worker-option ${checked ? "up-worker-option--checked" : ""}`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleWorker(w.id)}
                  />
                  <span className="up-worker-option-name">
                    {w.firstName} {w.lastName}
                  </span>
                  <span className="up-worker-option-meta">
                    {w.callNumber} · {w.workerType}
                  </span>
                </label>
              );
            })}
          </div>
        )}
      </div>

      <div className="up-modal-footer">
        <button
          className="up-btn up-btn-secondary"
          onClick={onClose}
          disabled={saving}
        >
          Annuleren
        </button>
        <button
          className="up-btn up-btn-primary"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? "Opslaan…" : isEdit ? "Opslaan" : "Aanmaken"}
        </button>
      </div>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Workers tab
// Two sections: "Geen Team" (unassigned) and "In Team" (assigned)
// ---------------------------------------------------------------------------

function WorkersTab({ eventId }) {
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchWorkers = useCallback(async () => {
    try {
      setError("");
      setLoading(true);
      const res = await getWorkers({ eventId });
      const list = Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res)
          ? res
          : [];
      setWorkers(list);
    } catch (err) {
      setError("Fout bij ophalen hulpverleners: " + err.message);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    fetchWorkers();
  }, [fetchWorkers]);

  const handleDeleteConfirm = async () => {
    setDeleting(true);
    try {
      await deleteWorker(deleteTarget.id);
      setDeleteTarget(null);
      fetchWorkers();
    } catch (err) {
      setError("Fout bij verwijderen: " + err.message);
    } finally {
      setDeleting(false);
    }
  };

  const renderWorkerCard = (w, isAssigned) => (
    <div key={w.id} className="unit-card" onClick={() => setEditTarget(w)}>
      <div className="unit-card-header">
        <span className="unit-team-name">{w.firstName} {w.lastName}</span>
        <span
          className="up-delete-icon"
          onClick={(ev) => {
            ev.stopPropagation();
            setDeleteTarget(w);
          }}
          title="Verwijderen"
        >
          🗑
        </span>
      </div>
      <div className="unit-card-body">
        <span className={`unit-label ${getStatusLabelClass(w.status)}`}>{w.callNumber}</span>
        <span style={{ fontSize: '13px', fontWeight: 500 }}>{w.workerType}</span>
      </div>
      {isAssigned && (
        <div style={{ marginTop: '-4px' }}>
          <span className="up-team-badge">{w.teamName}</span>
        </div>
      )}
      <div className="unit-card-footer">
        <span className={`up-status-pill up-status-pill--${w.status?.toLowerCase()}`}>
          {statusLabel(w.status)}
        </span>
        <span className="up-td-muted" style={{ fontSize: '12px' }}>
          {w.updatedAt
            ? new Date(w.updatedAt).toLocaleTimeString("nl-NL", {
                hour: "2-digit",
                minute: "2-digit",
              })
            : ""}
        </span>
      </div>
      {w.note && <div className="up-td-note">{w.note}</div>}
    </div>
  );

  const unassigned = workers.filter((w) => !w.teamId);
  const assigned = workers.filter((w) => !!w.teamId);

  const unassignedCards = unassigned.map(w => renderWorkerCard(w, false));
  const assignedCards = assigned.map(w => renderWorkerCard(w, true));

  return (
    <div className="up-tab-content">
      <div className="up-tab-toolbar">
        <span className="up-tab-count">{workers.length} hulpverlener(s)</span>
        <button
          className="up-btn up-btn-primary"
          onClick={() => setShowAdd(true)}
        >
          + Toevoegen
        </button>
      </div>

      {error && <div className="up-api-error">{error}</div>}

      {loading ? (
        <div className="up-loading">Laden…</div>
      ) : workers.length === 0 ? (
        <div className="up-empty">
          Nog geen hulpverleners. Klik op "+ Toevoegen" om te beginnen.
        </div>
      ) : (
        <>
          <SectionCards
            title="Geen Team"
            accent="#6b7280"
            items={unassignedCards}
            emptyMsg="Alle hulpverleners zijn ingedeeld in een team"
          />
          <SectionCards
            title="In Team"
            accent="#1e1b4b"
            items={assignedCards}
            emptyMsg="Nog geen hulpverleners ingedeeld in een team"
          />
        </>
      )}

      {showAdd && (
        <WorkerModal
          eventId={eventId}
          onClose={() => setShowAdd(false)}
          onSaved={() => {
            setShowAdd(false);
            fetchWorkers();
          }}
        />
      )}
      {editTarget && (
        <WorkerModal
          worker={editTarget}
          eventId={eventId}
          onClose={() => setEditTarget(null)}
          onSaved={() => {
            setEditTarget(null);
            fetchWorkers();
          }}
        />
      )}
      {deleteTarget && (
        <DeleteModal
          label={`${deleteTarget.firstName} ${deleteTarget.lastName}`}
          deleting={deleting}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDeleteConfirm}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Teams tab
// Three sections:
//   "Aangemeld"      — AVAILABLE + NOTIFICATION
//   "Wacht"            — WAIT only
//   "Afgemeld" — SHORT_BREAK + LONG_BREAK + UNAVAILABLE
// ---------------------------------------------------------------------------

function TeamsTab({ eventId }) {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchTeams = useCallback(async () => {
    try {
      setError("");
      setLoading(true);
      const res = await getUnits(eventId);
      const list = Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res)
          ? res
          : [];
      setTeams(list);
    } catch (err) {
      setError("Fout bij ophalen teams: " + err.message);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  const handleEditClick = async (team) => {
    try {
      const res = await getUnit(team.id);
      setEditTarget(res?.data ?? res);
    } catch {
      setEditTarget(team);
    }
  };

  const handleDeleteConfirm = async () => {
    setDeleting(true);
    try {
      await deleteUnit(deleteTarget.id);
      setDeleteTarget(null);
      fetchTeams();
    } catch (err) {
      setError("Fout bij verwijderen: " + err.message);
    } finally {
      setDeleting(false);
    }
  };

  const renderTeamCard = (t) => {
    const workerCount = t.workerCount ?? t.workers?.length ?? 0;
    return (
      <div key={t.id} className="unit-card" onClick={() => handleEditClick(t)}>
        <div className="unit-card-header">
          <span className="unit-team-name">{t.name}</span>
          <span
            className="up-delete-icon"
            onClick={(ev) => {
              ev.stopPropagation();
              setDeleteTarget(t);
            }}
            title="Verwijderen"
          >
            🗑
          </span>
        </div>
        <div className="unit-card-body">
          {t.callNumber ? (
            <span className={`unit-label ${getStatusLabelClass(t.status)}`}>
              {t.callNumber}
            </span>
          ) : (
            <span className="up-td-muted">—</span>
          )}
          <span className="up-team-badge">
            {workerCount} hulpverlener{workerCount !== 1 ? "s" : ""}
          </span>
        </div>
        <div className="unit-card-footer">
          <span className={`up-status-pill up-status-pill--${t.status?.toLowerCase()}`}>
            {statusLabel(t.status)}
          </span>
          <span className="up-td-muted" style={{ fontSize: '12px' }}>
            {t.updatedAt
              ? new Date(t.updatedAt).toLocaleTimeString("nl-NL", {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : ""}
          </span>
        </div>
        {t.note && <div className="up-td-note">{t.note}</div>}
      </div>
    );
  };

  const wachtrij = teams.filter((t) => t.status === "WAIT");
  const aangemeld = teams.filter((t) => ["AVAILABLE", "NOTIFICATION"].includes(t.status));
  const afgemeld = teams.filter((t) => ["SHORT_BREAK", "LONG_BREAK", "SIGNED_OUT"].includes(t.status));

  return (
    <div className="up-tab-content">
      <div className="up-tab-toolbar">
        <span className="up-tab-count">{teams.length} team(s)</span>
        <button
          className="up-btn up-btn-primary"
          onClick={() => setShowAdd(true)}
        >
          + Aanmaken
        </button>
      </div>

      {error && <div className="up-api-error">{error}</div>}

      {loading ? (
        <div className="up-loading">Laden…</div>
      ) : teams.length === 0 ? (
        <div className="up-empty">
          Nog geen teams. Voeg eerst hulpverleners toe, daarna kun je hier een
          team aanmaken.
        </div>
      ) : (
        <>
          <SectionCards
            title="Aangemeld"
            accent="#1e1b4b"
            items={aangemeld.map(renderTeamCard)}
            emptyMsg="Geen aangemelde teams"
          />
          <SectionCards
            title="Wachtrij"
            accent="#1d6fb5"
            items={wachtrij.map(renderTeamCard)}
            emptyMsg="Geen teams in de wachtrij"
          />
          <SectionCards
            title="Afgemeld"
            accent="#6b7280"
            items={afgemeld.map(renderTeamCard)}
            emptyMsg="Geen afgemelde teams"
          />
        </>
      )}

      {showAdd && (
        <TeamModal
          eventId={eventId}
          onClose={() => setShowAdd(false)}
          onSaved={() => {
            setShowAdd(false);
            fetchTeams();
          }}
        />
      )}
      {editTarget && (
        <TeamModal
          team={editTarget}
          eventId={eventId}
          onClose={() => setEditTarget(null)}
          onSaved={() => {
            setEditTarget(null);
            fetchTeams();
          }}
        />
      )}
      {deleteTarget && (
        <DeleteModal
          label={deleteTarget.name}
          deleting={deleting}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDeleteConfirm}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page root
// ---------------------------------------------------------------------------

export default function UnitsPage() {
  const navigate = useNavigate();
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [activeTab, setActiveTab] = useState("teams");

  useEffect(() => {
    const stored = localStorage.getItem("selected_event");
    if (!stored) {
      navigate("/events");
      return;
    }
    try {
      setSelectedEvent(JSON.parse(stored));
    } catch {
      navigate("/events");
    }
  }, [navigate]);

  if (!selectedEvent) return null;

  return (
    <div className="units-wrapper">
      <div className="up-tabs">
        <button
          className={`up-tab ${activeTab === "teams" ? "up-tab--active" : ""}`}
          onClick={() => setActiveTab("teams")}
        >
          Teams
        </button>
        <button
          className={`up-tab ${activeTab === "workers" ? "up-tab--active" : ""}`}
          onClick={() => setActiveTab("workers")}
        >
          Hulpverleners
        </button>
      </div>

      {activeTab === "teams" ? (
        <TeamsTab eventId={selectedEvent.id} />
      ) : (
        <WorkersTab eventId={selectedEvent.id} />
      )}
    </div>
  );
}
