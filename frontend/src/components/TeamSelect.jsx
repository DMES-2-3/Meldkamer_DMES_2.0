import React from "react";

export default function TeamSelect({
  units = [],
  value,
  onChange,
  className = "custom-select",
  placeholder = "Kies team",
}) {
  const isTeamUnavailable = (status) => {
    return ["Bezig", "Notificatie", "Niet beschikbaar", "Uitgelogd"].includes(
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
      {units.map((unit) => (
        <option
          key={unit.id}
          value={unit.name}
          disabled={isTeamUnavailable(unit.status)}
          style={{
            color: isTeamUnavailable(unit.status) ? "red" : "initial",
          }}
        >
          {unit.name}
        </option>
      ))}
    </select>
  );
}
