const API_BASE_URL =
  (typeof import.meta !== "undefined" &&
    import.meta.env &&
    import.meta.env.VITE_API_BASE_URL) ||
  "http://localhost:8080"; // PHP server base URL

function apiUrl(path = "") {
  const base = API_BASE_URL.replace(/\/+$/, "");
  const suffix = String(path || "").replace(/^\/+/, "");
  return suffix ? `${base}/${suffix}` : base;
}

async function handleJsonResponse(res) {
  if (!res.ok) {
    let message = `Request failed with status ${res.status}`;
    try {
      const text = await res.text();
      if (text) {
        try {
          const parsed = JSON.parse(text);
          message = parsed.message || parsed.error || text;
        } catch {
          message = text;
        }
      }
    } catch {
      // ignore
    }
    throw new Error(message);
  }

  if (res.status === 204) return null;
  return res.json();
}

// --- Mappers for Enum values ---

function mapPriorityToBackend(priority) {
  const map = {
    Laag: "GREEN",
    Gemiddeld: "ORANGE",
    Hoog: "RED",
  };
  return map[priority] || null;
}

function mapStatusToBackend(status) {
  const map = {
    Open: "NEW",
    "In behandeling": "PENDING",
    Gesloten: "CLOSED",
  };
  return map[status] || null;
}

function mapGenderToBackend(gender) {
  const map = {
    Man: "MALE",
    Vrouw: "FEMALE",
    X: "OTHER",
  };
  return map[gender] || null;
}

function mapReportFromServer(reportWrapper) {
  const report = reportWrapper.Report ?? reportWrapper;
  if (!report) return reportWrapper;

  const priorityMap = { GREEN: "Laag", ORANGE: "Gemiddeld", RED: "Hoog" };
  const statusMap = {
    NEW: "Open",
    PENDING: "In behandeling",
    CLOSED: "Gesloten",
  };
  const genderMap = { MALE: "Man", FEMALE: "Vrouw", OTHER: "X" };

  const mappedReport = {
    ...report,
    ReportedBy: report.ReportedBy || "",
    Team: report.Team || "",
    Prioriteit: priorityMap[report.Prioriteit] || report.Prioriteit,
    Status: statusMap[report.Status] || report.Status,
    SITrap: report.SITRAP
      ? {
          Event: report.SITRAP.Event || "",
          Condition: report.SITRAP.Condition || "",
          Gender: genderMap[report.SITRAP.Gender] || report.SITRAP.Gender || "",
        }
      : { Gender: "", Event: "", Condition: "" },
    AVPU: report.AVPU
      ? {
          Alert: report.AVPU.Alert,
          Verbal: report.AVPU.Verbal,
          Pain: report.AVPU.Pain,
          Unresponsive: report.AVPU.Unresponsive,
        }
      : { Alert: false, Verbal: false, Pain: false, Unresponsive: false },
    Assistance: report.Assistance
      ? {
          Coordinator: report.Assistance.Coordinator,
          Doctor: report.Assistance.Doctor,
          Spoedzorg: report.Assistance.Spoedzorg,
          BasiszorgVPK: report.Assistance.BasiszorgVPK,
          Team: report.Assistance.Team,
        }
      : {
          Coordinator: false,
          Doctor: false,
          Spoedzorg: false,
          BasiszorgVPK: false,
          Team: "",
        },
  };

  // Ensure the data structure stays { Report: ... }
  return { Report: mappedReport };
}

/**
 * Map ReportScreen formData to the backend Report payload
 * expected by NotificationController::handlePost/handlePatch.
 */
function mapFormToReportPayload(form) {
  if (!form || typeof form !== "object") return {};

  const {
    ReportedBy,
    NameEvent,
    Subject,
    Location,
    Note,
    Notepad,
    Team,
    Prioriteit,
    Status,
    Ambulance,
    SITrap,
    AVPU,
    Assistance,
    ...rest
  } = form;

  const sitrapPayload = {
    Gender: mapGenderToBackend(SITrap?.Gender),
    Event: SITrap?.Event ?? null,
    Condition: SITrap?.Condition ?? null,
  };

  const assistancePayload = {
    BasiszorgVPK: Assistance?.BasiszorgVPK ?? false,
    Coordinator: Assistance?.Coordinator ?? false,
    Doctor: Assistance?.Doctor ?? false,
    Spoedzorg: Assistance?.Spoedzorg ?? false,
    Team: Assistance?.Team || null,
  };

  return {
    ReportedBy,
    NameEvent,
    Subject,
    Location,
    Note,
    Notepad,
    Team,
    Prioriteit: mapPriorityToBackend(Prioriteit),
    Status: mapStatusToBackend(Status),
    Ambulance,
    SITrap: sitrapPayload,
    AVPU: {
      Alert: AVPU?.Alert ?? false,
      Verbal: AVPU?.Verbal ?? false,
      Pain: AVPU?.Pain ?? false,
      Unresponsive: AVPU?.Unresponsive ?? false,
    },
    Assistance: assistancePayload,
    ...rest,
  };
}

// ---- Notifications (Reports) ---------------------------------------------

export async function getReports() {
  const res = await fetch(apiUrl("src/api/v1/notification"), {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  });
  const response = await handleJsonResponse(res);

  // Handle wrapped response from backend: {"success": true, "data": [...]}
  const data = response && response.data ? response.data : response;

  if (!Array.isArray(data)) {
    return [];
  }
  return data.map(mapReportFromServer);
}

export async function saveReport(formData) {
  if (!formData || typeof formData !== "object") {
    throw new Error("saveReport expects a formData object");
  }

  const id = formData.id;
  const payload = mapFormToReportPayload(formData);

  const url = id
    ? apiUrl(`src/api/v1/notification/${encodeURIComponent(id)}`)
    : apiUrl("src/api/v1/notification");

  const method = id ? "PATCH" : "POST";

  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ Report: payload }),
    credentials: "include",
  });

  return handleJsonResponse(res);
}

export async function deleteReport(id) {
  if (id == null) {
    throw new Error("deleteReport requires an id");
  }

  const res = await fetch(
    apiUrl(`src/api/v1/notification/${encodeURIComponent(id)}`),
    {
      method: "DELETE",
      credentials: "include",
    },
  );
  return handleJsonResponse(res);
}

// ---- Units / Aid workers --------------------------------------------------

export async function getAidWorkers() {
  const res = await fetch(apiUrl("src/api/v1/aidworker"), {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  });

  const response = await handleJsonResponse(res);

  // Handle wrapped response from backend: {"success": true, "data": [...]}
  const data = response && response.data ? response.data : response;

  if (!Array.isArray(data)) {
    return [];
  }

  return data;
}

export async function getUnits() {
  const data = await getAidWorkers();

  const teamNames = new Set(
    data.map((worker) => worker.teamName).filter(Boolean),
  );

  return Array.from(teamNames).map((name) => ({
    id: name,
    name: name,
  }));
}
