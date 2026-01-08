# Rundenkampfbericht

Eine Progressive Web App zur digitalen Auswertung von Schießsport-Rundenkämpfen mit zwei verschiedenen Wettkampfmodi und vollständiger digitaler Erfassung von Mannschafts- und Einzelergebnissen.
## 🛠️ Technologie
- Frontend: Vanilla JavaScript (ES6+)
- PWA: Service Worker, Offline-Support
- PDF: html2pdf.js
- Storage: Browser LocalStorage
- Sicherheit: CSP, XSS-Schutz

## 🔧 Systemanforderungen
- Moderner Browser mit JavaScript
- ~50MB freier LocalStorage
- Kamera für Scheibendokumentation (optional)
- HTTPS oder localhost für Kamera-Zugriff

## 🔒 Datenschutz
- Alle Daten bleiben lokal im Browser
- Keine externe Datenübertragung
- LocalStorage-basierte Speicherung

## 🏆 Wettkampfmodi

### Präzision/Duell
- **Präzision**: 20 Schuss (0-10 Ringe)
- **Duell**: 20 Schuss (0-10 Ringe)

### Annex Scheibe
- 40 Schuss in 5 Serien à 8 Schuss
- Werte 0-3 pro Schuss

## 👥 Mannschaftswertung

- Bei 4 Schützen werden die **besten 3 Ergebnisse** gewertet
- Der schlechteste Schütze wird **farblich markiert**
- Unterstützung für Einzelschützen und Teams jeder Größe

## 📱 Funktionen

### 📊 Übersicht
- Anzeige aller Mannschaften mit Ergebnissen
- **Filter-Funktion** 🔍 für Teams
- **PDF-Export** 📄 für Berichte

### ✏️ Erfassen
- Digitales Nummernpad für Schusswerte
- **Scheibendokumentation** 📷 mit Kamera
  - Foto mit Info-Overlay
  - Automatischer Download

### 👥 Teams
- Verwaltung von Mannschaften und Einzelschützen
- **CSV-Import** 📥 (`Name; Verein; Einzelschütze`)
- Team-/Schützen-Bearbeitung

### ⚙️ Einstellungen
- Wettkampfmodus-Wechsel
- Disziplin-Verwaltung
- **Vereinslogo-Upload** (JPG/PNG/GIF, max. 5MB)

## 🚀 Installation

### PWA Installation
1. Website im Browser öffnen
2. "Zur Startseite hinzufügen" wählen
3. Offline-Nutzung möglich

### Lokale Installation
```bash
# Repository klonen
git clone [repository-url]
cd rundenkampfbericht

# HTTP-Server starten
python -m http.server 8000
# oder
npx http-server
