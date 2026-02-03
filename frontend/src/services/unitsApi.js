const API_BASE_URL = "http://localhost:8080";

function apiUrl(path = "") {
  const base = API_BASE_URL.replace(/\/+$/, "");
  const suffix = String(path || "").replace(/^\/+/, "");
  return suffix ? `${base}/${suffix}` : base;
}

const getEndpoint = (path = "") => apiUrl(`/src/api/v1/aidteam${path}`);

const handleResponse = async (res) => {
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`API error (${res.status}): ${errorText}`);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : {};
};

// GET /aid-teams
export const getUnits = async (eventId = null) => {
  const url = eventId ? `${getEndpoint()}?eventId=${eventId}` : getEndpoint();
  const res = await fetch(url);
  return handleResponse(res);
};

// POST /aid-teams
export const createUnit = async (payload) => {
  const res = await fetch(getEndpoint(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
};

// PUT /aid-teams/:id
export const updateUnit = async (id, payload) => {
  const res = await fetch(getEndpoint(`/${id}`), {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
};

// DELETE /aid-teams/:id
export const deleteUnit = async (id) => {
  const res = await fetch(getEndpoint(`/${id}`), {
    method: "DELETE",
  });
  if (!res.ok && res.status !== 204) {
    const errorText = await res.text();
    throw new Error(`API error (${res.status}): ${errorText}`);
  }
  return true;
};
