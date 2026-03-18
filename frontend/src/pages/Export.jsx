import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getSelectedEvent } from "../utils";
import "../Export.css";

const ExportPage = ({ title = "Export" }) => {
    const API_BASE =
        process.env.REACT_APP_API_URL || import.meta.env.VITE_API_URL;
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [selectedEvent, setSelectedEvent] = useState(null);

    useEffect(() => {
        const evt = getSelectedEvent(navigate);
        if (!evt) return;
        setSelectedEvent(evt);
    }, [navigate]);

    const handleExport = () => {
        if (!selectedEvent) return;

        setLoading(true);
        setError("");

        try {
            const form = document.createElement("form");
            form.method = "POST";
            const backendBase = process.env.REACT_APP_BACKEND_URL || "http://localhost:8080";
            form.action = `${backendBase}/export/export.php`;

            const input = document.createElement("input");
            input.type = "hidden";
            input.name = "eventId";
            input.value = selectedEvent.id;

            form.appendChild(input);
            document.body.appendChild(form);
            form.submit();
            document.body.removeChild(form);
        } catch (e) {
            console.error(e);
            setError("Er ging iets mis tijdens de export.");
        } finally {
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

                <button
                    onClick={handleExport}
                    disabled={loading}
                    className="btn btn-primary"
                >
                    {loading ? "Bezig met exporteren..." : "Exporteer ZIP"}
                </button>

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
