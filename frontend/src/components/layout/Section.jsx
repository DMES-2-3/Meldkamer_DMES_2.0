import React from "react";

const Section = ({ title, color, children }) => (
  <section className="section">
    <header className="section-header" style={{ backgroundColor: color }}>
      {title}
    </header>
    <div className="section-body">{children}</div>
  </section>
);

export default Section;