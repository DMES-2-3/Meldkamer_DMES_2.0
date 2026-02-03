import React, { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useCallback } from "react";
import dmesLogo from "../../assets/logos/DMES_Vierkant_Logo.png";

const TopNav = () => {
  const navigate = useNavigate();
  const [selectedEvent, setSelectedEvent] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem("selected_event");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setSelectedEvent(parsed);
      } catch (e) {
        console.error("Failed to parse selected_event from localStorage", e);
      }
    }
  }, []);

  return (
    <nav className="top-nav">
      <div className="top-nav-left">
        <img
          src={dmesLogo}
          alt="Dutch Medical Event Service"
          className="top-nav-logo top-nav-link"
          onClick={() => navigate("/evenementen")}
          style={{ cursor: "pointer" }}
        />
        <div className="top-nav-links">
          <NavLink
            className={({ isActive }) =>
              `top-nav-link ${isActive ? "top-nav-link--active" : ""}`
            }
            to="/dashboard"
          >
            DASHBOARD
          </NavLink>
          <NavLink
            className={({ isActive }) =>
              `top-nav-link ${isActive ? "top-nav-link--active" : ""}`
            }
            to="/melding"
          >
            MELDING
          </NavLink>
          <NavLink
            className={({ isActive }) =>
              `top-nav-link ${isActive ? "top-nav-link--active" : ""}`
            }
            to="/overzicht"
          >
            OVERZICHT MELDINGEN
          </NavLink>
          <NavLink
            className={({ isActive }) =>
              `top-nav-link ${isActive ? "top-nav-link--active" : ""}`
            }
            to="/eenheden"
          >
            EENHEDEN
          </NavLink>
          <NavLink
            className={({ isActive }) =>
              `top-nav-link ${isActive ? "top-nav-link--active" : ""}`
            }
            to="/rapportage"
          >
            RAPPORTAGE
          </NavLink>
        </div>
      </div>
      <div className="top-nav-right">
        {selectedEvent && (
          <span className="top-nav-event-name">
            {selectedEvent.name || selectedEvent.eventName || "Geen evenement"}
          </span>
        )}
      </div>
    </nav>
  );
};

export default TopNav;
