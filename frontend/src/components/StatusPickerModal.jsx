import React from "react";
import "../../src/UnitsPage.css";

function StatusPickerModal({
  title = "Status wijzigen",
  currentStatus,
  options = [],
  saving = false,
  error = "",
  onClose,
  onSelect,
}) {
  return (
    <div className="up-modal-backdrop" onClick={onClose}>
      <div className="up-modal up-status-modal" onClick={(e) => e.stopPropagation()}>
        <div className="up-modal-header">
          <h2 className="up-modal-title">{title}</h2>
          <button className="up-modal-close" onClick={onClose} disabled={saving}>
            ×
          </button>
        </div>

        <div className="up-modal-body">
          {error && <div className="up-api-error">{error}</div>}

          <div className="up-status-legend">
            {options.map((option) => {
              const isActive = option.value === currentStatus;

              return (
                <button
                  key={option.value}
                  type="button"
                  className={`up-status-option ${isActive ? "up-status-option--active" : ""}`}
                  onClick={() => onSelect(option.value)}
                  disabled={saving}
                >
                  <span className={`unit-label ${option.className || ""}`}>
                    {option.label}
                  </span>

                  <span className="up-status-option-meta">
                    {isActive ? "Huidige status" : "Selecteren"}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="up-modal-footer">
          <button
            className="up-btn up-btn-secondary"
            onClick={onClose}
            disabled={saving}
          >
            Sluiten
          </button>
        </div>
      </div>
    </div>
  );
}

export default StatusPickerModal;