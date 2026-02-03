import React, { useState } from "react";
import "../Export.css";

const ExportPage = ({ title = "Export" }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [eventId, setEventId] = useState(1);

    const handleExport = () => {
    setLoading(true);
    setError("");

    try {
      // Classic form POST → browser handles download
        const form = document.createElement("form");
        form.method = "POST";
        const backendBase = process.env.REACT_APP_BACKEND_URL || "http://localhost:8080";
        form.action = `${backendBase}/export/export.php`;

        const input = document.createElement("input");
        input.type = "hidden";
        input.name = "eventId";
        input.value = eventId;

        form.appendChild(input);
        document.body.appendChild(form);
        form.submit();
        document.body.removeChild(form);
    } catch (e) {
        console.error(e);
        setError("Er ging iets mis tijdens de export.");
    } finally {
      // Small delay so UI doesn't flicker
        setTimeout(() => setLoading(false), 800);
    }
};

return (
    <div className="page">
        <div className="header">Export</div>

        <div className="card card--p24 mb-16">
        <h3 className="section-title">{title}</h3>
        <p className="section-subtitle">
            Download een ZIP met CSV’s voor het gekozen event.
        </p>

        <div className="mb-12">
            <label htmlFor="eventId" style={{ marginRight: 8 }}>
                Event ID:
            </label>
            <input
            id="eventId"
            type="number"
            min={1}
            value={eventId}
            onChange={(e) => setEventId(Number(e.target.value))}
            className="input"
            style={{ width: 140 }}
            />
        </div>

        <div style={{ display: "flex", gap: 10 }}>
            <button
                onClick={handleExport}
                disabled={loading}
                className="btn btn-primary"
            >
            {loading ? "Bezig met exporteren..." : "Exporteer ZIP"}
            </button>

            <button
                type="button"
                className="btn btn-outline"
                onClick={() => setEventId(1)}
            >
            Reset
            </button>
        </div>

        {error && (
        <div
            className="mb-12"
            style={{ marginTop: 14, color: "#b91c1c", fontWeight: 600 }}
        >
            Fout: {error}
        </div>
        )}
        </div>
    </div>
    );
};

export default ExportPage;
