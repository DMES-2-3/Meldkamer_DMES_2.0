import React, { useState, useEffect } from "react";
import { getWorkers, createUnit, updateUnit } from "../services/unitsApi";
import { UNIT_STATUSES } from "../constants";

// ---------------------------------------------------------------------------
// Status helpers
// ---------------------------------------------------------------------------

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

const UNIT_STATUS_OPTIONS = Object.entries(UNIT_STATUSES).map(
  ([value, { label }]) => ({
    value,
    label,
    className: getStatusLabelClass(value),
  })
);

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
// TeamModal Component
// ---------------------------------------------------------------------------

export default function TeamModal({ 
  team, 
  eventId, 
  onClose, 
  onSaved,
  isMapContext = false,
  onDeleteMarker
}) {
  const isEdit = !!team;

  const [form, setForm] = useState({
    teamName: team?.name ?? "",
    callNumber: team?.callNumber ?? "",
    status: team?.status ?? "AVAILABLE",
    note: team?.note ?? "",
  });
  
  const [selectedWorkerIds, setSelectedWorkerIds] = useState(
    team?.workers?.map((w) => w.id) ?? []
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
          all.filter((w) => !w.isActive || currentIds.has(w.id))
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
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  const validate = () => {
    const e = {};
    if (!form.teamName.trim()) e.teamName = "Verplicht";
    if (!form.status) e.status = "Verplicht";
    if (selectedWorkerIds.length < 1) {
      e.workers = "Selecteer minimaal 1 hulpverlener";
    }
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

  const handleDeleteMarker = () => {
    if (window.confirm("Weet je zeker dat je deze team marker wilt verwijderen?")) {
      if (onDeleteMarker) onDeleteMarker(team.markerId || team.id);
      onClose();
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
            options={UNIT_STATUS_OPTIONS}
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

      <div className="up-modal-footer" style={{ display: "flex", gap: "10px" }}>
        {isMapContext && onDeleteMarker && (
          <button
            className="up-btn up-btn-danger"
            onClick={handleDeleteMarker}
            disabled={saving}
            style={{ marginRight: "auto" }}
          >
            Verwijder Marker
          </button>
        )}
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