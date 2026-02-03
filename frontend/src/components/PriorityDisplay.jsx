import React from "react";

const PriorityDisplay = ({ priority }) => {
  const priorityLower = (priority || "").toLowerCase();
  let color;

  switch (priorityLower) {
    case "rood":
      color = "#DC2626"; 
      break;
    case "geel":
      color = "#ffdf2cff"; 
      break;
    case "groen":
      color = "#00A651"; 
      break;
    default:
      return <span>{priority}</span>;
  }
  return (
    <div className="priority-display">{<div className="priority-dot" style={{ backgroundColor: color }} />}<span>{priority}</span></div>
  );
};

export default PriorityDisplay;