// theme-init.js – setzt das Design vor dem Rendern (Standard: light).
// Bewusst als eigene Datei statt Inline-Skript, damit die CSP ohne 'unsafe-inline' für Skripte auskommt.
document.documentElement.setAttribute(
  "data-theme",
  localStorage.getItem("rundenkampf-theme") === "dark" ? "dark" : "light"
);
