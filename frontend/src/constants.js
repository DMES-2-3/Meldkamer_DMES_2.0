export const STATUSES = {
  REGISTERED: { label: "Ingemeld", group: "Aangemeld" },
  AVAILABLE: { label: "Beschikbaar", group: "Aangemeld" },
  NOTIFICATION: { label: "Melding", group: "Aangemeld" },
  WAIT: { label: "Wacht", group: "Wachtrij" },
  SHORT_BREAK: { label: "Pauze (kort)", group: "Wachtrij" },
  LONG_BREAK: { label: "Pauze (lang)", group: "Wachtrij" },
  SIGNED_OUT: { label: "Uitgemeld", group: "Afgemeld" },
  ACTIVE: { label: "Actief", group: "Aangemeld" },
  BUSY: { label: "Bezig", group: "Aangemeld" },
  RESOLVED: { label: "Opgelost", group: "Afgemeld" },
  UNAVAILABLE: { label: "Niet beschikbaar", group: "Afgemeld" },
};

// Simplified status set used in the Units page forms.
// Maps to the statuses shown in the UI; the backend enum supports all values above.
export const UNIT_STATUSES = {
  AVAILABLE: { label: "Beschikbaar", group: "Aangemeld" },
  NOTIFICATION: { label: "Melding", group: "Aangemeld" },
  WAIT: { label: "Wacht", group: "Wachtrij" },
  SHORT_BREAK: { label: "Pauze (kort)", group: "Afgemeld" },
  LONG_BREAK: { label: "Pauze (lang)", group: "Afgemeld" },
  SIGNED_OUT: { label: "Uitgemeld", group: "Afgemeld" },
};
