// Events API service for talking to the real PHP backend.
//
// Backend (see backend/src/api/v1/index.php & EventController.php) exposes:
//
//   GET    /src/api/v1/event           -> list all events
//   GET    /src/api/v1/event/:id       -> get single event
//   POST   /src/api/v1/event           -> create event
//   PUT    /src/api/v1/event/:id       -> update event
//   DELETE /src/api/v1/event/:id       -> delete event
//
// Response JSON shape is defined by Event::toArray():
//
//   {
//     "id": number,
//     "eventName": string,
//     "updatedAt": string,   // datetime
//     "createdAt": string    // datetime
//   }
//
// This module exposes a frontend-friendly shape:
//
//   { id, name, updatedAt, createdAt }
//
// and converts between the two as needed.

import { apiUrl } from "../config/api";

// Helper: build a full URL for the events endpoint
function eventsUrl(path = "") {
  return apiUrl(path);
}

// ---- Shape mappers --------------------------------------------------------

// Map server event -> frontend event
//   { id, eventName, updatedAt, createdAt }  ->  { id, name, updatedAt, createdAt }
function mapFromServer(event) {
  if (!event || typeof event !== "object") return event;

  const { id, eventName, updatedAt, createdAt, ...rest } = event;

  return {
    id,
    name: eventName,
    updatedAt,
    createdAt,
    ...rest,
  };
}

// Map frontend event payload -> server payload
//   { id, name, updatedAt, createdAt }  ->  { id, eventName }
function mapToServer(event) {
  if (!event || typeof event !== "object") return event;

  const { id, name, updatedAt, createdAt, ...rest } = event;

  return {
    // Backend only needs eventName in current implementation;
    // id is taken from URL for PUT, generated for POST.
    eventName: name,
    ...rest,
  };
}

// ---- Fetch helpers --------------------------------------------------------

async function handleJsonResponse(res) {
  if (!res.ok) {
    let message = `Request failed with status ${res.status}`;
    try {
      const text = await res.text();
      if (text) {
        try {
          const parsed = JSON.parse(text);
          if (parsed && (parsed.message || parsed.error)) {
            message = parsed.message || parsed.error;
          } else {
            message = text;
          }
        } catch {
          message = text;
        }
      }
    } catch {
      // ignore
    }
    throw new Error(message);
  }

  // No content
  if (res.status === 204) return null;

  return res.json();
}

// ---- Public API functions -------------------------------------------------
//
// All functions here are async and should be awaited in the React code.
//

/**
 * Get all events.
 * Returns an array of frontend-shaped events: [{ id, name, updatedAt, createdAt }, ...]
 *
 * Backend: GET /src/api/v1/event
 */
export async function getEvents() {
  const res = await fetch(eventsUrl("src/api/v1/event"), {
    method: "GET",
    credentials: "include", // keep if you use cookies/session auth
  });

  const response = await handleJsonResponse(res);

  // Handle wrapped response from backend: {"success": true, "data": [...]}
  const data = response && response.data ? response.data : response;

  if (!Array.isArray(data)) {
    return [];
  }
  return data.map(mapFromServer);
}

/**
 * Get a single event by ID.
 * Returns a frontend-shaped event: { id, name, updatedAt, createdAt }
 *
 * Backend: GET /src/api/v1/event/:id
 */
export async function getEventById(id) {
  if (id == null) {
    throw new Error("getEventById requires an id");
  }

  const res = await fetch(
    eventsUrl(`src/api/v1/event/${encodeURIComponent(id)}`),
    {
      method: "GET",
      credentials: "include",
    },
  );

  const data = await handleJsonResponse(res);
  return mapFromServer(data);
}

/**
 * Create a new event.
 * Expects a frontend-shaped payload: { name }
 * Returns the created event in frontend shape.
 *
 * Backend: POST /src/api/v1/event
 * Body JSON (server expects):
 *   { "eventName": string }
 */
export async function addEvent(eventData) {
  const serverPayload = mapToServer(eventData);

  const res = await fetch(eventsUrl("src/api/v1/event"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(serverPayload),
  });

  const data = await handleJsonResponse(res);
  return mapFromServer(data);
}

/**
 * Update an existing event.
 * Expects a frontend-shaped payload with `id`: { id, name }
 * Returns the updated event in frontend shape.
 *
 * Backend: PUT /src/api/v1/event/:id
 * Body JSON (server expects):
 *   { "eventName": string }
 */
export async function updateEvent(eventData) {
  if (!eventData || eventData.id == null) {
    throw new Error("updateEvent requires an event with an id");
  }

  const id = eventData.id;
  const serverPayload = mapToServer(eventData);

  const res = await fetch(
    eventsUrl(`src/api/v1/event/${encodeURIComponent(id)}`),
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(serverPayload),
    },
  );

  const data = await handleJsonResponse(res);
  return mapFromServer(data);
}

/**
 * Delete an event by ID.
 * Returns nothing (or the backend's confirmation message) on success.
 *
 * Backend: DELETE /src/api/v1/event/:id
 */
export async function deleteEventById(id) {
  if (id == null) {
    throw new Error("deleteEventById requires an id");
  }

  const res = await fetch(
    eventsUrl(`src/api/v1/event/${encodeURIComponent(id)}`),
    {
      method: "DELETE",
      credentials: "include",
    },
  );

  // Backend returns { message: 'Event deleted successfully' }
  // but callers don't need it; we just ensure no error is thrown.
  await handleJsonResponse(res);
}
