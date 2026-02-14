// =================================================================
// LABEL PRINTER - Etiketten-Druck für Teams und Einzelschützen
// =================================================================

class LabelPrinter {
  constructor() {
    this.cssStyles = null;
    this.cssLoaded = false;
  }

  // =================================================================
  // HAUPT-PRINT-METHODE
  // =================================================================

  async printLabels() {
    try {
      console.log("Starting label printing...");

      // CSS laden
      const cssStyles = await this.loadCSS();
      console.log("CSS loaded");

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
      const htmlContent = this.createLabelHTML(labelData, cssStyles);
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
  // CSS LOADING
  // =================================================================

  async loadCSS() {
    if (this.cssLoaded && this.cssStyles) {
      return this.cssStyles;
    }

    console.log("Loading label CSS...");
    this.cssStyles = this.getFallbackCSS();
    this.cssLoaded = true;
    return this.cssStyles;
  }

  // =================================================================
  // DATEN-AUFBEREITUNG
  // =================================================================

  prepareLabelData(filteredTeams, filteredStandaloneShooters) {
    const labelData = [];
    const settings = storage.getLabelSettings();

    console.log("Label settings:", settings);

    // Teams: Mannschaftsname + Schützennamen
    filteredTeams.forEach((team) => {
      console.log(
        `Processing team: ${team.name} with ${team.shooters.length} shooters`,
      );
      team.shooters.forEach((shooter) => {
        for (let i = 0; i < settings.copies; i++) {
          labelData.push({
            type: "team",
            teamName: team.name,
            shooterName: shooter.name,
            displayText1: team.name,
            displayText2: shooter.name,
          });
        }
      });
    });

    // Einzelschützen: Nur Name
    filteredStandaloneShooters.forEach((shooter) => {
      console.log(`Processing standalone shooter: ${shooter.name}`);
      for (let i = 0; i < settings.copies; i++) {
        labelData.push({
          type: "standalone",
          shooterName: shooter.name,
          displayText1: shooter.name,
          displayText2: "",
        });
      }
    });

    console.log(`Prepared ${labelData.length} labels`);
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
    // Filtere alle echten Inhalte (keine leeren Labels)
    const contentLabels = labels.filter((label) => label.type !== "empty");

    if (contentLabels.length === 0) {
      console.log("No content labels found");
      return ""; // Gib gar nichts zurück wenn keine Inhalte
    }

    let html = "";
    let labelIndex = 0;
    let skipRemaining = settings.skipLabels;

    const labelsPerPage = settings.columns * settings.rows;
    const totalLabels = contentLabels.length + skipRemaining;
    const totalPages = Math.ceil(totalLabels / labelsPerPage);

    console.log(
      `Content labels: ${contentLabels.length}, Skip: ${skipRemaining}, Pages needed: ${totalPages}`,
    );

    for (let page = 0; page < totalPages; page++) {
      // Prüfe ob diese Seite Inhalt haben wird
      let pageWillHaveContent = false;
      let tempLabelIndex = labelIndex;
      let tempSkipRemaining = skipRemaining;

      for (let i = 0; i < labelsPerPage; i++) {
        if (tempSkipRemaining > 0) {
          tempSkipRemaining--;
        } else if (tempLabelIndex < contentLabels.length) {
          pageWillHaveContent = true;
          tempLabelIndex++;
        }
      }

      // Überspringe Seiten ohne Inhalt
      if (!pageWillHaveContent) {
        console.log(`Skipping empty page ${page + 1}`);
        continue;
      }

      html += '<div class="label-page">';

      for (let row = 0; row < settings.rows; row++) {
        html += '<div class="label-row">';

        for (let col = 0; col < settings.columns; col++) {
          if (skipRemaining > 0) {
            // Übersprungene Position
            html += '<div class="label empty-label"></div>';
            skipRemaining--;
          } else if (labelIndex < contentLabels.length) {
            // Echter Inhalt
            const label = contentLabels[labelIndex];
            html += this.createSingleLabel(label, settings);
            labelIndex++;
          } else {
            // Leere Position zum Auffüllen
            html += '<div class="label empty-label"></div>';
          }
        }

        html += "</div>";
      }

      html += "</div>";
    }

    console.log(
      `Generated ${totalPages} pages with content, processed ${labelIndex} labels`,
    );
    return html;
  }

  // =================================================================
  // EINZELNES LABEL ERSTELLEN - KORRIGIERT
  // =================================================================

  createSingleLabel(label, settings) {
    if (label.type === "empty") {
      return `<div class="label empty-label"></div>`;
    }

    // KORREKTUR: Prüfe auf existierende Werte und vermeide "null"
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
        quality: 0.98,
      },
      html2canvas: {
        scale: 1.5,
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
      },
    };
  }

  // =================================================================
  // CSS STYLES - ERWEITERT MIT DEZIMALWERTEN
  // =================================================================

  // =================================================================
  // CSS STYLES - OHNE LABEL-RÄNDER
  // =================================================================

  getFallbackCSS() {
    const settings = storage.getLabelSettings();

    // Präzise Berechnung mit Dezimalwerten
    const pageWidth =
      210.0 - (settings.marginLeft || 0.0) - (settings.marginRight || 0.0);
    const availableWidth =
      pageWidth - (settings.columns - 1) * (settings.labelSpacing || 0.0);
    const labelWidth = Math.min(
      settings.labelWidth,
      availableWidth / settings.columns,
    );

    return `
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: Arial, sans-serif;
      background: white;
      margin: 0;
      padding: 0;
      font-size: 12px;
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
      page-break-after: always;
      background: white;
    }

    .label-page:last-child {
      page-break-after: avoid;
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
      border: none; /* GEÄNDERT: Kein Rand mehr */
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
      padding: 1mm;
      text-align: center;
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
    }

    .label-text {
      word-wrap: break-word;
      overflow-wrap: break-word;
      line-height: 1.1;
      width: 100%;
      overflow: hidden;
    }

    .label-text.primary {
      font-size: ${this.calculatePrimaryFontSize(settings).toFixed(1)}pt;
      font-weight: bold;
      color: #000;
      margin-bottom: 1mm;
    }

    .label-text.secondary {
      font-size: ${this.calculateSecondaryFontSize(settings).toFixed(1)}pt;
      color: #000;
      font-weight: normal;
    }

    @media print {
      body {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      
      .label-page {
        page-break-after: always;
      }
      
      .label-page:last-child {
        page-break-after: avoid;
      }
    }
  `;
  }

  // =================================================================
  // HILFSFUNKTIONEN - ERWEITERT FÜR DEZIMALWERTE
  // =================================================================

  calculatePrimaryFontSize(settings) {
    const baseSize = Math.min(
      settings.labelWidth / 8.0,
      settings.labelHeight / 4.0,
    );
    return Math.max(8.0, Math.min(14.0, baseSize));
  }

  calculateSecondaryFontSize(settings) {
    return Math.max(7.0, this.calculatePrimaryFontSize(settings) - 2.0);
  }

  // =================================================================
  // VORSCHAU-FUNKTION (OPTIONAL)
  // =================================================================

  previewLabels() {
    try {
      const filteredTeams = storage.getFilteredTeams();
      const filteredStandaloneShooters =
        storage.getFilteredStandaloneShooters();
      const labelData = this.prepareLabelData(
        filteredTeams,
        filteredStandaloneShooters,
      );
      const html = this.createLabelHTML(labelData, this.getFallbackCSS());

      // Öffne in neuem Fenster
      const newWindow = window.open("", "_blank", "width=800,height=600");
      newWindow.document.write(html);
      newWindow.document.close();

      UIUtils.showSuccessMessage("Label-Vorschau geöffnet");
    } catch (error) {
      console.error("Preview error:", error);
      UIUtils.showError("Vorschau-Fehler: " + error.message);
    }
  }

  // =================================================================
  // DEBUG-METHODE (OPTIONAL)
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

// Globale Instanz erstellen
const labelPrinter = new LabelPrinter();

// Globale Funktionen
window.printLabels = function () {
  labelPrinter.printLabels();
};

window.previewLabels = function () {
  labelPrinter.previewLabels();
};

window.debugLabelPrinter = function () {
  labelPrinter.debugPrint();
};
