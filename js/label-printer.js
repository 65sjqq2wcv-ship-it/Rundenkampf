// =================================================================
// LABEL PRINTER - Etiketten-Druck für Teams und Einzelschützen
// =================================================================

class LabelPrinter {
  constructor() {
    this.cssStyles = null;
    this.cssLoaded = false;
  }

  // =================================================================
  // NEU: CSS-CACHE INVALIDIEREN
  // =================================================================

  invalidateCSS() {
    console.log("Invalidating CSS cache for updated settings");
    this.cssStyles = null;
    this.cssLoaded = false;
  }

  // =================================================================
  // HAUPT-PRINT-METHODE
  // =================================================================

  async printLabels() {
    try {
      console.log("Starting label printing...");

      // NEU: CSS immer neu laden (da settings sich geändert haben könnten)
      this.cssStyles = this.getFallbackCSS();
      console.log("CSS refreshed with current settings");

      const filteredTeams = storage.getFilteredTeams();
      const filteredStandaloneShooters =
        storage.getFilteredStandaloneShooters();

      console.log("Filtered teams:", filteredTeams.length);
      console.log(
        "Filtered standalone shooters:",
        filteredStandaloneShooters.length,
      );

      // Label-Daten sammeln
      const labelData = this.prepareLabelData(
        filteredTeams,
        filteredStandaloneShooters,
      );
      console.log("Label data prepared:", labelData.length, "labels");

      if (labelData.length === 0) {
        UIUtils.showError(
          "Keine Daten für Labels verfügbar. Prüfen Sie die Filter-Einstellungen.",
        );
        return;
      }

      // HTML-Content erstellen
      const htmlContent = this.createLabelHTML(labelData, this.cssStyles);
      console.log("HTML content created, length:", htmlContent.length);

      // Prüfe ob html2pdf verfügbar ist
      if (typeof html2pdf === "undefined") {
        throw new Error("html2pdf.js ist nicht geladen");
      }

      // Dateiname erstellen
      const timestamp = new Date()
        .toISOString()
        .slice(0, 19)
        .replace(/:/g, "-");
      const filename = `Schuetzen-Labels_${timestamp}.pdf`;

      console.log("Generated filename:", filename);

      // PDF-Optionen für Labels
      const options = this.getLabelPDFOptions();
      console.log("PDF options:", options);

      // PDF generieren (OHNE automatischen Download)
      console.log("Generating PDF...");

      const pdf = await html2pdf()
        .set(options)
        .from(htmlContent)
        .toPdf()
        .get("pdf");

      // PDF als Blob erstellen
      const pdfBlob = new Blob([pdf.output("blob")], {
        type: "application/pdf",
      });

      // Manueller Download
      this.downloadBlob(pdfBlob, filename);

      UIUtils.showSuccessMessage("Labels erfolgreich erstellt");
      console.log("Label printing completed successfully");
    } catch (error) {
      console.error("Error during label printing:", error);
      console.error("Error stack:", error.stack);
      UIUtils.showError("Fehler beim Label-Druck: " + error.message);
    }
  }

  // =================================================================
  // VERBESSERTER DOWNLOAD (SAFARI-OPTIMIERT)
  // =================================================================

  downloadBlob(blob, filename) {
    try {
      console.log("Starting download:", filename);

      // Prüfe Browser
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const isSafari = /^((?!chrome|android).)*safari/i.test(
        navigator.userAgent,
      );

      if (isIOS || isSafari) {
        // Safari/iOS: Öffne in neuem Tab
        const url = URL.createObjectURL(blob);
        const newWindow = window.open(url, "_blank");

        if (newWindow) {
          UIUtils.showSuccessMessage(
            "PDF in neuem Tab geöffnet - dort mit 'Teilen' → 'In Dateien sichern' speichern",
          );
        } else {
          // Fallback: Direkt navigieren
          window.location.href = url;
        }

        // Cleanup nach einer Weile
        setTimeout(() => {
          URL.revokeObjectURL(url);
        }, 30000);
      } else {
        // Andere Browser: Normaler Download
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");

        link.href = url;
        link.download = filename;
        link.style.display = "none";

        document.body.appendChild(link);
        link.click();

        setTimeout(() => {
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        }, 100);
      }
    } catch (error) {
      console.error("Download error:", error);
      throw new Error("Download fehlgeschlagen: " + error.message);
    }
  }

  // =================================================================
  // CSS LOADING (ÜBERARBEITET)
  // =================================================================

  async loadCSS() {
    // NEU: Immer aktuelle Settings verwenden, nicht cachen
    console.log("Loading label CSS with current settings...");
    this.cssStyles = this.getFallbackCSS();
    return this.cssStyles;
  }

  // =================================================================
  // DATEN-AUFBEREITUNG
  // =================================================================

  prepareLabelData(filteredTeams, filteredStandaloneShooters) {
  const labelData = [];
  const settings = storage.getLabelSettings();

  console.log("=== PREPARE LABEL DATA ===");
  console.log("Teams:", filteredTeams.length);
  console.log("Standalone shooters:", filteredStandaloneShooters.length);
  console.log("Copies per label:", settings.copies);

  // Teams: Mannschaftsname + Schützennamen
  filteredTeams.forEach((team) => {
    console.log(`Processing team: ${team.name} with ${team.shooters.length} shooters`);
    team.shooters.forEach((shooter) => {
      if (shooter && shooter.name && shooter.name.trim()) { // NUR gültige Schützen
        for (let i = 0; i < settings.copies; i++) {
          labelData.push({
            type: "team",
            teamName: team.name.trim(),
            shooterName: shooter.name.trim(),
            displayText1: team.name.trim(),
            displayText2: shooter.name.trim(),
          });
        }
      }
    });
  });

  // Einzelschützen: Nur Name
  filteredStandaloneShooters.forEach((shooter) => {
    if (shooter && shooter.name && shooter.name.trim()) { // NUR gültige Schützen
      console.log(`Processing standalone shooter: ${shooter.name}`);
      for (let i = 0; i < settings.copies; i++) {
        labelData.push({
          type: "standalone",
          shooterName: shooter.name.trim(),
          displayText1: shooter.name.trim(),
          displayText2: "",
        });
      }
    }
  });

  console.log(`=== RESULT: ${labelData.length} valid labels prepared ===`);
  return labelData;
}

  createLabelHTML(labelData, cssStyles) {
    const settings = storage.getLabelSettings();

    // Labels für übersprungene Positionen hinzufügen
    const emptyLabels = Array(settings.skipLabels).fill({
      type: "empty",
      displayText1: "",
      displayText2: "",
    });

    const allLabels = [...emptyLabels, ...labelData];
    console.log(`Total labels including empty: ${allLabels.length}`);

    const labelGrid = this.createLabelGrid(allLabels, settings);

    // Prüfe ob überhaupt Inhalt vorhanden
    if (!labelGrid || labelGrid.trim() === "") {
      console.warn("No label grid generated");
      return `
      <!DOCTYPE html>
      <html lang="de">
      <head>
        <meta charset="UTF-8">
        <title>Schützen-Labels</title>
        <style>${cssStyles}</style>
      </head>
      <body>
        <div class="label-container">
          <div class="label-page">
            <div class="label-row">
              <div class="label empty-label"></div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
    }

    const html = `
    <!DOCTYPE html>
    <html lang="de">
    <head>
      <meta charset="UTF-8">
      <title>Schützen-Labels</title>
      <style>
        ${cssStyles}
      </style>
    </head>
    <body>
      <div class="label-container">
        ${labelGrid}
      </div>
    </body>
    </html>
  `;

    return html;
  }

  // =================================================================
  // LABEL GRID ERSTELLEN - KEINE LEEREN SEITEN
  // =================================================================

  createLabelGrid(labels, settings) {
  // NUR echte Labels (keine leeren)
  const contentLabels = labels.filter((label) => 
    label && 
    label.type !== "empty" && 
    (label.displayText1 || label.displayText2)
  );

  console.log("=== CREATE LABEL GRID ===");
  console.log("Input labels:", labels.length);
  console.log("Content labels after filtering:", contentLabels.length);
  console.log("Settings - Columns:", settings.columns, "Rows:", settings.rows);

  if (contentLabels.length === 0) {
    console.log("No content labels found");
    return "";
  }

  const labelsPerPage = settings.columns * settings.rows;
  const totalPages = Math.ceil(contentLabels.length / labelsPerPage);
  
  console.log(`Labels per page: ${labelsPerPage}`);
  console.log(`Total pages needed: ${totalPages}`);
  console.log(`Content labels: ${contentLabels.length}`);

  let html = "";
  let labelIndex = 0;

  // SICHERE SCHLEIFE - nur für Seiten mit garantiertem Inhalt
  for (let pageIndex = 0; pageIndex < totalPages; pageIndex++) {
    const labelsOnThisPage = Math.min(labelsPerPage, contentLabels.length - labelIndex);
    
    console.log(`Creating page ${pageIndex + 1}/${totalPages} with ${labelsOnThisPage} labels`);
    
    if (labelsOnThisPage <= 0) {
      console.log("Skipping page with no labels");
      break;
    }

    html += '<div class="label-page">\n';
    
    let pagePosition = 0;
    
    // Zeilen erstellen
    for (let row = 0; row < settings.rows; row++) {
      html += '  <div class="label-row">\n';
      
      // Spalten erstellen
      for (let col = 0; col < settings.columns; col++) {
        if (labelIndex < contentLabels.length && pagePosition < labelsOnThisPage) {
          // Echtes Label
          const label = contentLabels[labelIndex];
          html += this.createSingleLabel(label, settings);
          labelIndex++;
        } else {
          // Leerer Platz zum Auffüllen
          html += '    <div class="label empty-label"></div>\n';
        }
        pagePosition++;
      }
      
      html += '  </div>\n';
      
      // Wenn alle Labels dieser Seite verarbeitet sind, breche ab
      if (pagePosition >= labelsOnThisPage) {
        break;
      }
    }
    
    html += '</div>\n';
  }

  console.log(`=== GRID COMPLETE: ${totalPages} pages created, ${labelIndex} labels processed ===`);
  return html;
}

  // =================================================================
  // EINZELNES LABEL ERSTELLEN
  // =================================================================

  createSingleLabel(label, settings) {
    if (label.type === "empty") {
      return `<div class="label empty-label"></div>`;
    }

    const text1 = label.displayText1
      ? UIUtils.escapeHtml(label.displayText1)
      : "";
    const text2 = label.displayText2
      ? UIUtils.escapeHtml(label.displayText2)
      : "";

    return `
    <div class="label">
      <div class="label-content">
        <div class="label-text primary">${text1}</div>
        ${text2 ? `<div class="label-text secondary">${text2}</div>` : ""}
      </div>
    </div>
  `;
  }

  // =================================================================
  // PDF-OPTIONEN
  // =================================================================

  getLabelPDFOptions() {
    return {
      margin: [0, 0, 0, 0],
      image: {
        type: "jpeg",
        quality: 1,
      },
      html2canvas: {
        scale: 2.5,
        dpi: 300,
        useCORS: true,
        letterRendering: true,
        allowTaint: false,
        backgroundColor: "#ffffff",
      },
      jsPDF: {
        unit: "mm",
        format: "a4",
        orientation: "portrait",
        compress: false,
      },
    };
  }

  // =================================================================
  // CSS STYLES - ERWEITERT MIT RAHMEN-OPTION
  // =================================================================

  getFallbackCSS() {
  const settings = storage.getLabelSettings();

  const pageWidth =
    210.0 - (settings.marginLeft || 0.0) - (settings.marginRight || 0.0);
  const availableWidth =
    pageWidth - (settings.columns - 1) * (settings.labelSpacing || 0.0);
  const labelWidth = Math.min(
    settings.labelWidth,
    availableWidth / settings.columns,
  );

  // Rahmen-Stil basierend auf Einstellung
  const borderStyle = settings.showBorders ? '1px solid #ccc' : 'none';

  return `
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: 'Verdana', 'Calibri', 'Segoe UI', Arial, sans-serif;
    background: white;
    margin: 0;
    padding: 0;
    font-size: 12px;
    -webkit-font-smoothing: subpixel-antialiased;
    -moz-osx-font-smoothing: auto;
    text-rendering: optimizeLegibility;
  }

  .label-container {
    width: 210mm;
    margin: 0 auto;
    background: white;
    padding-top: ${(settings.marginTop || 0.0).toFixed(1)}mm;
    padding-bottom: ${(settings.marginBottom || 0.0).toFixed(1)}mm;
    padding-left: ${(settings.marginLeft || 0.0).toFixed(1)}mm;
    padding-right: ${(settings.marginRight || 0.0).toFixed(1)}mm;
  }

  .label-page {
    width: 100%;
    background: white;
    min-height: 10mm;
  }

  .label-page:not(:last-child) {
    page-break-after: always;
  }

  /* NEU: Robuste Behandlung leerer Seiten */
  .label-page:empty {
    display: none !important;
    height: 0 !important;
    page-break-after: avoid !important;
  }

  /* NEU: Verhindere Seiten die nur leere Labels haben */
  .label-page:not(:has(.label:not(.empty-label))) {
    display: none !important;
    height: 0 !important;
    page-break-after: avoid !important;
  }

  /* NEU: Verhindere Page-Breaks nach der letzten Seite */
  .label-page:last-of-type {
    page-break-after: avoid !important;
  }

  .label-row {
    display: flex;
    width: 100%;
    justify-content: flex-start;
    margin-bottom: ${(settings.labelSpacing || 0.0).toFixed(1)}mm;
    gap: ${(settings.labelSpacing || 0.0).toFixed(1)}mm;
  }

  .label {
    width: ${labelWidth.toFixed(1)}mm;
    height: ${settings.labelHeight.toFixed(1)}mm;
    border: ${borderStyle};
    display: flex;
    align-items: center;
    justify-content: center;
    background: white;
    break-inside: avoid;
    flex-shrink: 0;
  }

  .empty-label {
    border: none;
    background: transparent;
  }

  .label-content {
    padding: 1.5mm;
    text-align: center;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 1mm;
  }

  .label-text {
    width: 100%;
    text-align: center;
    
    /* INTELLIGENTER TEXTUMBRUCH */
    word-wrap: break-word;
    overflow-wrap: break-word;
    word-break: normal;
    hyphens: none;
    
    /* MEHRZEILIGKEIT ERMÖGLICHEN */
    white-space: normal;
    line-height: 1.2;
    
    /* SCHRIFT-OPTIMIERUNG */
    text-rendering: optimizeLegibility;
    -webkit-font-feature-settings: "liga" 1, "kern" 1;
    font-feature-settings: "liga" 1, "kern" 1;
    letter-spacing: 0em;
    
    /* OVERFLOW HANDLING */
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
  }

  .label-text.primary {
    font-size: ${this.calculatePrimaryFontSize(settings).toFixed(1)}pt;
    font-weight: 600;
    color: #000;
    margin-bottom: 0.5mm;
    
    /* PRIMÄRER TEXT: MAXIMAL 2 ZEILEN */
    -webkit-line-clamp: 2;
    max-height: ${(this.calculatePrimaryFontSize(settings) * 1.2 * 2 * 1.33).toFixed(1)}px;
  }

  .label-text.secondary {
    font-size: ${this.calculateSecondaryFontSize(settings).toFixed(1)}pt;
    font-weight: 500;
    color: #000;
    
    /* SEKUNDÄRER TEXT: MAXIMAL 2 ZEILEN */
    -webkit-line-clamp: 2;
    max-height: ${(this.calculateSecondaryFontSize(settings) * 1.2 * 2 * 1.33).toFixed(1)}px;
  }

  @media print {
    body {
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
      -webkit-font-smoothing: subpixel-antialiased;
      -moz-osx-font-smoothing: auto;
      text-rendering: geometricPrecision;
    }
    
    .label-page:not(:last-child) {
      page-break-after: always;
    }
    
    /* NEU: Verstärkte Behandlung leerer Seiten beim Drucken */
    .label-page:empty {
      display: none !important;
      height: 0 !important;
      page-break-after: avoid !important;
    }
    
    .label-page:not(:has(.label:not(.empty-label))) {
      display: none !important;
      height: 0 !important;
      page-break-after: avoid !important;
    }

    .label {
      break-inside: avoid;
      page-break-inside: avoid;
    }

    .label-text {
      text-rendering: geometricPrecision;
      -webkit-font-smoothing: antialiased;
    }
    
    .label-text.primary {
      font-weight: 600;
    }
    
    .label-text.secondary {
      font-weight: 500;
    }
  }
`;
}

  // =================================================================
  // SCHRIFTGRÖSSEN-BERECHNUNG
  // =================================================================

  calculatePrimaryFontSize(settings) {
    const labelWidth = settings.labelWidth;
    const labelHeight = settings.labelHeight;

    // Normale Berechnung ohne Textlängen-Berücksichtigung
    const widthBased = labelWidth / 5.5;
    const heightBased = labelHeight / 3.2;

    const baseSize = Math.min(widthBased, heightBased);

    // Runde auf halbe Punkte
    const fontSize = Math.round(Math.max(10, Math.min(16, baseSize)) * 2) / 2;

    console.log(
      `Primary font size: ${fontSize}pt for ${labelWidth}×${labelHeight}mm`,
    );
    return fontSize;
  }

  calculateSecondaryFontSize(settings) {
    const primarySize = this.calculatePrimaryFontSize(settings);

    // Normaler Unterschied
    const secondarySize = Math.round((primarySize - 1.5) * 2) / 2;

    console.log(`Secondary font size: ${secondarySize}pt`);
    return Math.max(9, secondarySize);
  }

  // =================================================================
  // VORSCHAU-FUNKTION (KORRIGIERT)
  // =================================================================

  previewLabels() {
    try {
      console.log("previewLabels() called");

      const filteredTeams = storage.getFilteredTeams();
      const filteredStandaloneShooters =
        storage.getFilteredStandaloneShooters();

      console.log("Filtered teams:", filteredTeams.length);
      console.log(
        "Filtered standalone shooters:",
        filteredStandaloneShooters.length,
      );

      const labelData = this.prepareLabelData(
        filteredTeams,
        filteredStandaloneShooters,
      );

      console.log("Label data prepared:", labelData.length, "labels");

      if (labelData.length === 0) {
        UIUtils.showError(
          "Keine Daten für Vorschau verfügbar. Fügen Sie Teams oder Einzelschützen hinzu.",
        );
        return;
      }

      // CSS immer frisch laden für Vorschau
      const css = this.getFallbackCSS();
      const html = this.createLabelHTML(labelData, css);

      console.log("HTML created, opening preview window");

      // Öffne in neuem Fenster
      const newWindow = window.open("", "_blank", "width=800,height=600");

      if (!newWindow) {
        UIUtils.showError(
          "Popup-Blocker verhindert Vorschau. Bitte erlauben Sie Popups für diese Seite.",
        );
        return;
      }

      newWindow.document.write(html);
      newWindow.document.close();

      UIUtils.showSuccessMessage("Label-Vorschau geöffnet");
      console.log("Preview window opened successfully");
    } catch (error) {
      console.error("Preview error:", error);
      UIUtils.showError("Vorschau-Fehler: " + error.message);
    }
  }

  // =================================================================
  // DEBUG-METHODE
  // =================================================================

  debugPrint() {
    console.log("=== LABEL PRINTER DEBUG ===");

    const settings = storage.getLabelSettings();
    console.log("Current settings:", settings);

    const filteredTeams = storage.getFilteredTeams();
    const filteredStandaloneShooters = storage.getFilteredStandaloneShooters();

    console.log("Filtered teams:", filteredTeams.length);
    console.log(
      "Filtered standalone shooters:",
      filteredStandaloneShooters.length,
    );

    const labelData = this.prepareLabelData(
      filteredTeams,
      filteredStandaloneShooters,
    );
    console.log("Label data:", labelData);

    const labelsPerPage = settings.columns * settings.rows;
    const totalPages = Math.ceil(
      (labelData.length + settings.skipLabels) / labelsPerPage,
    );

    console.log(`Total labels: ${labelData.length}`);
    console.log(`Skip labels: ${settings.skipLabels}`);
    console.log(`Labels per page: ${labelsPerPage}`);
    console.log(`Total pages needed: ${totalPages}`);
  }
}

// =================================================================
// SICHERE GLOBALE INITIALISIERUNG (NUR EINMAL!)
// =================================================================

// Prüfe ob labelPrinter bereits existiert
if (typeof window.labelPrinter === "undefined") {
  // Globale Instanz erstellen
  window.labelPrinter = new LabelPrinter();

  // Globale Funktionen
  window.printLabels = function () {
    window.labelPrinter.printLabels();
  };

  window.previewLabels = function () {
    window.labelPrinter.previewLabels();
  };

  window.debugLabelPrinter = function () {
    window.labelPrinter.debugPrint();
  };

  console.log("✅ LabelPrinter initialized and globally available");
} else {
  console.log("⚠️ LabelPrinter already exists, skipping initialization");
}

// Für backward compatibility auch als lokale Variable
const labelPrinter = window.labelPrinter;
