import React from "react";

export default function TeamSelect({
  units = [],
  value,
  onChange,
  className = "custom-select",
  placeholder = "Kies team",
}) {
  const isTeamUnavailable = (status) => {
    return ["BUSY", "NOTIFICATION", "UNAVAILABLE", "SIGNED_OUT"].includes(
      status,
    );
  };

  return (
    <select
      className={className}
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      onClick={(e) => e.stopPropagation()}
    >
      <option value="">{placeholder}</option>

      {units.map((unit) => {
        const disabled = isTeamUnavailable(unit.status);

        return (
          <option
            key={unit.id}
            value={unit.name}
            disabled={disabled}
            style={{ color: disabled ? "red" : "initial" }}
          >
            {unit.name}
          </option>
        );
      })}
    </select>
  );
}