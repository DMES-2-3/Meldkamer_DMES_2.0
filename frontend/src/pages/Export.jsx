import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getSelectedEvent } from "../utils/utils";
import { apiUrl } from "../config/api";
import "../Export.css";

const ExportPage = ({ title = "Export" }) => {

    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [activeExport, setActiveExport] = useState(null);
    const [selectedEvent, setSelectedEvent] = useState(null);

    useEffect(() => {
        const evt = getSelectedEvent(navigate);
        if (!evt) return;
        setSelectedEvent(evt);
    }, [navigate]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            // Alt + N om een nieuwe melding te maken
            if (e.altKey && e.key.toLowerCase() === 'n') {
                e.preventDefault();
                if (document.activeElement instanceof HTMLElement) {
                    document.activeElement.blur();
                }
                navigate("/melding");
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [navigate]);

    const handleExport = () => {
        if (!selectedEvent) return;

        setLoading(true);
        setActiveExport("zip");
        setError("");

        try {
            const form = document.createElement("form");
            form.method = "POST";
            form.action = `${apiUrl("/export/export.php")}`;

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
            setTimeout(() => {
                setLoading(false);
                setActiveExport(null);
            }, 800);
        }
    };

    const handleExportExcel = () => {
        if (!selectedEvent) return;

        setLoading(true);
        setActiveExport("excel");
        setError("");

        try {
            const form = document.createElement("form");
            form.method = "POST";

            const backendBase = process.env.REACT_APP_BACKEND_URL || apiUrl("");
            form.action = `${backendBase}/export/export_excel.php`;

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
            setError("Er ging iets mis tijdens de Excel-export.");
        } finally {
            setTimeout(() => {
                setLoading(false);
                setActiveExport(null);
            }, 800);
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

                <div className="export-buttons">
                    <button
                        onClick={handleExport}
                        disabled={loading}
                        className="btn btn-primary"
                    >
                       {activeExport === "zip" ? "Bezig met exporteren..." : "Exporteer ZIP"}
                    </button>

                    <button
                        onClick={handleExportExcel}
                        disabled={loading}
                        className="btn btn-outline"
                    >
                        {activeExport === "excel" ? "Bezig met exporteren..." : "Exporteer Excel"}
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
