const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL?.replace(/\/+$/, "") ||
  "http://46.224.225.189:8080";

function apiUrl(path = "") {
  const suffix = String(path || "").replace(/^\/+/, "");
  return `${API_BASE_URL}/${suffix}`;
}

const getTeamEndpoint = (path = "") => apiUrl(`/src/api/v1/aidteam${path}`);

const getWorkerEndpoint = (path = "") => apiUrl(`/src/api/v1/aidworker${path}`);

const handleResponse = async (res) => {
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`API error (${res.status}): ${errorText}`);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : {};
};

// =============================================================================
// AidTeam endpoints
// =============================================================================

// GET /aidteam?eventId=X
export const getUnits = async (eventId = null) => {
  const url = eventId
    ? `${getTeamEndpoint()}?eventId=${eventId}`
    : getTeamEndpoint();
  const res = await fetch(url);
  return handleResponse(res);
};

// GET /aidteam/:id
export const getUnit = async (id) => {
  const res = await fetch(getTeamEndpoint(`/${id}`));
  return handleResponse(res);
};

// POST /aidteam
// payload: { teamName, eventId, workerIds: number[], callNumber?, note?, status? }
export const createUnit = async (payload) => {
  const res = await fetch(getTeamEndpoint(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
};

// PUT /aidteam/:id
// payload: { teamName?, eventId?, workerIds?: number[], callNumber?, note?, status? }
export const updateUnit = async (id, payload) => {
  const res = await fetch(getTeamEndpoint(`/${id}`), {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
};

// DELETE /aidteam/:id
export const deleteUnit = async (id) => {
  const res = await fetch(getTeamEndpoint(`/${id}`), {
    method: "DELETE",
  });
  if (!res.ok && res.status !== 204) {
    const errorText = await res.text();
    throw new Error(`API error (${res.status}): ${errorText}`);
  }
  return true;
};

// =============================================================================
// AidWorker endpoints
// =============================================================================

// GET /aidworker?eventId=X
// GET /aidworker?eventId=X&available=1   — only workers not yet in a team
export const getWorkers = async ({
  eventId = null,
  available = false,
} = {}) => {
  const params = new URLSearchParams();
  if (eventId !== null) params.set("eventId", eventId);
  if (available) params.set("available", "1");
  const query = params.toString();
  const url = query ? `${getWorkerEndpoint()}?${query}` : getWorkerEndpoint();
  const res = await fetch(url);
  return handleResponse(res);
};

// GET /aidworker/:id
export const getWorker = async (id) => {
  const res = await fetch(getWorkerEndpoint(`/${id}`));
  return handleResponse(res);
};

// POST /aidworker
// payload: { firstName, lastName, callNumber, workerType, eventId, note?, status? }
export const createWorker = async (payload) => {
  const res = await fetch(getWorkerEndpoint(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
};

// PUT /aidworker/:id  — full update
// payload: { firstName?, lastName?, callNumber?, workerType?, eventId?, note?, status?, teamId? }
// Pass teamId: null to explicitly unassign the worker from their current team.
export const updateWorker = async (id, payload) => {
  const res = await fetch(getWorkerEndpoint(`/${id}`), {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
};

// PATCH /aidworker/:id  — partial update (only fields you include are changed)
// Same fields as PUT, all optional.
export const patchWorker = async (id, payload) => {
  const res = await fetch(getWorkerEndpoint(`/${id}`), {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
};

// DELETE /aidworker/:id
export const deleteWorker = async (id) => {
  const res = await fetch(getWorkerEndpoint(`/${id}`), {
    method: "DELETE",
  });
  if (!res.ok && res.status !== 204) {
    const errorText = await res.text();
    throw new Error(`API error (${res.status}): ${errorText}`);
  }
  return true;
};
