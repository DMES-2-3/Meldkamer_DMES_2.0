import React, { useState } from "react";
import { createWorker, updateWorker } from "../services/unitsApi";
import { STATUSES } from "../constants";

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

const WORKER_STATUS_OPTIONS = Object.entries(STATUSES).map(
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
          <button type="button" className="up-modal-close" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="up-modal-body">{children}</div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// WorkerModal Component
// ---------------------------------------------------------------------------

export default function WorkerModal({ worker, eventId, onClose, onSaved }) {
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

  const handleSave = async (eEvent) => {
    if (eEvent && eEvent.preventDefault) {
      eEvent.preventDefault();
    }
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
      let errMsg = err.message || "";
      if (errMsg.toLowerCase().includes("data too long") || errMsg.includes("1406") || errMsg.toLowerCase().includes("invoer te groot")) {
        errMsg = "Fout: Invoer te groot.";
      } else {
        errMsg = "Fout: Kan gegevens niet opslaan. Probeer het later opnieuw.";
      }
      setApiError(errMsg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={isEdit ? "Hulpverlener bewerken" : "Hulpverlener aanmaken"} onClose={onClose}>
      <form onSubmit={handleSave}>
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
            placeholder="Jansen"
          />
        </Field>

        <Field label="Roepnummer" error={errors.callNumber}>
          <TextInput
            value={form.callNumber}
            onChange={set("callNumber")}
            placeholder="H-01"
          />
        </Field>

        <Field label="Functie" error={errors.workerType}>
          <TextInput
            value={form.workerType}
            onChange={set("workerType")}
            placeholder="Arts / Verpleegkundige"
          />
        </Field>

        <Field label="Status" error={errors.status}>
          <SelectInput
            value={form.status}
            onChange={set("status")}
            options={WORKER_STATUS_OPTIONS}
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
          type="button"
          className="up-btn up-btn-secondary"
          onClick={onClose}
          disabled={saving}
        >
          Annuleren
        </button>
        <button
          type="submit"
          className="up-btn up-btn-primary"
          disabled={saving}
        >
          {saving ? "Opslaan…" : isEdit ? "Opslaan" : "Aanmaken"}
        </button>
      </div>
      </form>
    </Modal>
  );
}
