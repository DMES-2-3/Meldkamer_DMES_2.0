import sampleData from "../data/reports.sample.json";
import unitsData from "../data/units.sample.json";
import eventsSample from "../data/events.sample.json";

const STORAGE_KEY = "meldkamer_reports_mock";
const UNITS_STORAGE_KEY = "meldkamer_units_mock";
const EVENTS_STORAGE_KEY = "meldkamer_events_mock";

// Helper to ensure every report has an ID for editing
const ensureIds = (reports) => {
  return reports.map((wrapper, index) => {
    const report = wrapper.Report || wrapper;

    if (!report.id) {
      report.id = `mock-${index}-${Date.now()}`;
    }

    return wrapper.Report ? { Report: report } : report;
  });
};

export const getReports = () => {
  const stored = localStorage.getItem(STORAGE_KEY);

  if (stored) {
    return JSON.parse(stored);
  }

  const initialData = ensureIds(sampleData.Reports || []);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(initialData));
  return initialData;
};

export const getUnits = () => {
  let units = [];

  const storedUnits = localStorage.getItem(UNITS_STORAGE_KEY);

  if (storedUnits) {
    units = JSON.parse(storedUnits);
  } else {
    units = unitsData.Units || [];
  }

  const reports = getReports();
  const activeTeams = new Set();

  reports.forEach((wrapper) => {
    const r = wrapper.Report || wrapper;

    if (r.Status !== "Gesloten" && r.Status !== "Closed") {
      if (r.Team) activeTeams.add(r.Team);

      // align with new Assistance shape
      if (r.Assistance?.Team) activeTeams.add(r.Assistance.Team);
    }
  });

  const updatedUnits = units.map((u) => ({
    ...u,
    Status: activeTeams.has(u.TeamName) ? "Actief" : "Beschikbaar",
  }));

  localStorage.setItem(UNITS_STORAGE_KEY, JSON.stringify(updatedUnits));
  return updatedUnits;
};

export const updateUnitStatus = (teamName, status) => {
  const units = getUnits();

  const index = units.findIndex((u) => u.TeamName === teamName);

  if (index !== -1) {
    units[index].Status = status;
    localStorage.setItem(UNITS_STORAGE_KEY, JSON.stringify(units));
  }
};

const delay = (ms = 120) => new Promise(r => setTimeout(r, ms));

export const getUnitsCRUD = () => {
  const stored = localStorage.getItem(UNITS_STORAGE_KEY);
  return stored ? JSON.parse(stored) : unitsData.Units || [];
};

export const createUnit = async (payload) => {
  await delay();

  const units = getUnitsCRUD();

  const newUnit = {
    id: `unit-${Date.now()}`,
    TeamName: payload.teamName,
    CallNumber: payload.callNumber,
    Status: payload.status,
    Position: payload.position,
    Note: payload.note || "",
    updatedAt: Date.now(),
  };

  units.unshift(newUnit);
  localStorage.setItem(UNITS_STORAGE_KEY, JSON.stringify(units));

  return newUnit;
};

export const updateUnit = async (id, payload) => {
  await delay();

  const units = getUnitsCRUD();
  const index = units.findIndex(u => u.id === id);
  if (index === -1) return null;

  units[index] = {
    ...units[index],
    TeamName: payload.teamName ?? units[index].TeamName,
    Status: payload.status ?? units[index].Status,
    Note: payload.note ?? units[index].Note,
    Position: payload.position ?? units[index].Position,
    updatedAt: Date.now(),
  };

  localStorage.setItem(UNITS_STORAGE_KEY, JSON.stringify(units));
  return units[index];
};

export const deleteUnit = async (id) =>{
  await delay();

  const units = getUnitsCRUD().filter(u => u.id !== id);
  localStorage.setItem(UNITS_STORAGE_KEY, JSON.stringify(units));

  return true;
};

export const saveReport = (reportData) => {
  const reports = getReports();

  const existingIndex = reports.findIndex((r) => {
    const inner = r.Report || r;
    return inner.id === reportData.id;
  });

  if (existingIndex >= 0) {
    const wrapper = reports[existingIndex];

    if (wrapper.Report) {
      wrapper.Report = { ...wrapper.Report, ...reportData };
    } else {
      reports[existingIndex] = { ...wrapper, ...reportData };
    }
  } else {
    const newId = `mock-${Date.now()}`;
    const newReport = { ...reportData, id: newId };

    // Store as { Report: ... } similar to backend Report wrapper
    reports.push({ Report: newReport });
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
};

export const deleteReport = (reportId) => {
  const reports = getReports();

  const updatedReports = reports.filter((r) => {
    const inner = r.Report || r;
    return inner.id !== reportId;
  });

  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedReports));
};

// ---- Events mock API (aligned with real backend Event shape) --------------
//
// Backend Event::toArray() returns:
// {
//   id: <int>,               // eventId
//   eventName: <string>,
//   updatedAt: <DateTimeInterface>,
//   createdAt: <DateTimeInterface>
// }
//
// The real backend API (in eventsApi.js) maps this to the frontend shape:
//   { id, name }
//
// This mock keeps everything in localStorage and does NOT call the backend,
// but mirrors the same data contract where the UI consumes { id, name }.
// Internally we also store updatedAt / createdAt to mimic the backend,
// but the UI doesn't rely on them yet.

const nowIso = () => new Date().toISOString();

// Map local mock stored event (backend-like) -> frontend shape
//   { id, eventName, ... } -> { id, name }
const mapMockEventToFrontend = (event) => {
  if (!event || typeof event !== "object") return event;
  const { id, eventName, ...rest } = event;
  return {
    id,
    name: eventName,
    ...rest,
  };
};

// Map frontend shape -> mock storage shape (backend-like)
//   { id, name } -> { id, eventName }
const mapFrontendToMockEvent = (feEvent) => {
  if (!feEvent || typeof feEvent !== "object") return feEvent;
  const { id, name, ...rest } = feEvent;
  return {
    id,
    eventName: name,
    ...rest,
  };
};

export const getEvents = () => {
  const stored = localStorage.getItem(EVENTS_STORAGE_KEY);

  let events;
  if (stored) {
    events = JSON.parse(stored);
  } else {
    // Seed from sample file, normalize to backend Event::toArray() style
    events = (eventsSample.Events || []).map((e, index) => {
      const created = nowIso();
      return {
        id:
          typeof e.id === "number" || typeof e.id === "string"
            ? e.id
            : `evt-${index}-${Date.now()}`,
        eventName: (e.eventName || e.name || "").trim(),
        createdAt: e.createdAt || created,
        updatedAt: e.updatedAt || created,
      };
    });

    localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(events));
  }

  // Return frontend-aligned events, like eventsApi does
  return events.map(mapMockEventToFrontend);
};

export const addEvent = (eventData) => {
  // eventData is in frontend shape: { name }
  const current = localStorage.getItem(EVENTS_STORAGE_KEY);
  const events = current ? JSON.parse(current) : [];

  const base = mapFrontendToMockEvent(eventData || {});
  const created = nowIso();

  const newEvent = {
    id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    eventName: (base.eventName || "").trim(),
    createdAt: created,
    updatedAt: created,
  };

  events.push(newEvent);
  localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(events));

  // Return frontend shape like the real API
  return mapMockEventToFrontend(newEvent);
};

export const deleteEventById = (id) => {
  const events = localStorage.getItem(EVENTS_STORAGE_KEY);
  if (!events) return;

  const parsed = JSON.parse(events);
  const filtered = parsed.filter((e) => String(e.id) !== String(id));

  localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(filtered));
};

export const updateEvent = (updatedEvent) => {
  // updatedEvent is in frontend shape: { id, name }
  if (!updatedEvent || updatedEvent.id == null) {
    return;
  }

  const stored = localStorage.getItem(EVENTS_STORAGE_KEY);
  if (!stored) return;

  const events = JSON.parse(stored);
  const idx = events.findIndex((e) => String(e.id) === String(updatedEvent.id));
  if (idx === -1) return;

  const base = mapFrontendToMockEvent(updatedEvent);
  const existing = events[idx];

  const merged = {
    ...existing,
    eventName:
      typeof base.eventName === "string" && base.eventName.trim()
        ? base.eventName.trim()
        : existing.eventName,
    updatedAt: nowIso(),
  };

  events[idx] = merged;
  localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(events));

  // Return frontend shape like the real API
  return mapMockEventToFrontend(merged);
};
