// =================================================================
// PDF EXPORTER - Rundenkampfbericht
// Verbesserte und zuverlässige PDF-Export-Funktionalität
// =================================================================

class PDFExporter {
  constructor() {
    this.logoBase64 = null;
    this.loadingPromise = null;
    this.cssStyles = null;
    this.cssLoaded = false;
  }

  // =================================================================
  // CSS LOADING
  // =================================================================

  async loadCSS() {
    if (this.cssLoaded && this.cssStyles) {
      return this.cssStyles;
    }

    try {
      const response = await fetch("./css/pdf-styles.css");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      this.cssStyles = await response.text();
      this.cssLoaded = true;
      console.log("PDF CSS loaded successfully");
      return this.cssStyles;
    } catch (error) {
      console.warn("Could not load external CSS, using fallback:", error);
      this.cssStyles = this.getFallbackCSS();
      this.cssLoaded = true;
      return this.cssStyles;
    }
  }

  // =================================================================
  // HAUPTEXPORT-METHODE
  // =================================================================

  async exportToPDF() {
    try {
      console.log("Starting PDF export...");

      // CSS und Logo parallel laden
      const [cssStyles, logoBase64] = await Promise.all([
        this.loadCSS(),
        this.loadLogoIfNeeded(),
      ]);

      this.logoBase64 = logoBase64;

      const filteredTeams = this.getFilteredTeams();
      const competitionType = storage.selectedCompetitionType;

      // HTML-Content erstellen
      const htmlContent = this.createPDFHTML(
        filteredTeams,
        competitionType,
        cssStyles
      );

      // PDF-Optionen
      const options = this.getPDFOptions();

      // PDF generieren und speichern
      await html2pdf().set(options).from(htmlContent).save();

      UIUtils.showSuccessMessage("PDF erfolgreich erstellt");
      console.log("PDF export completed");
    } catch (error) {
      console.error("Error during PDF export:", error);
      UIUtils.showError("Fehler beim PDF-Export: " + error.message);
    }
  }

  async loadLogoIfNeeded() {
    if (!this.logoBase64 && !this.loadingPromise) {
      this.loadingPromise = this.loadLogoAsBase64();
    }

    if (this.loadingPromise) {
      const result = await this.loadingPromise;
      this.loadingPromise = null;
      return result;
    }

    return this.logoBase64;
  }

  // =================================================================
  // HTML-STRUKTUR AUFBAU
  // =================================================================

  createPDFHTML(filteredTeams, competitionType, cssStyles) {
    const header = this.createHeader();
    const mainContent = this.createMainContent(filteredTeams, competitionType);
    const footer = this.createFooter();

    return `
        <!DOCTYPE html>
        <html lang="de">
        <head>
            <meta charset="UTF-8">
            <title>Rundenkampfbericht</title>
            <style>
                ${cssStyles}
            </style>
        </head>
        <body>
            <div class="pdf-container">
                ${header}
                ${mainContent}
                ${footer}
            </div>
        </body>
        </html>
        `;
  }

  createHeader() {
    const logoHtml = this.logoBase64
      ? `<img src="${this.logoBase64}" alt="Vereinslogo" class="logo">`
      : `<div class="logo-placeholder">
                <div>SCHÜTZEN</div>
                <div>VEREIN</div>
                <div>LOGO</div>
            </div>`;

    return `
        <header class="pdf-header">
            <div class="header-content">
                <div class="logo-container">
                    ${logoHtml}
                </div>
                <div class="title-container">
                    <h1 class="main-title">Rundenkampfbericht</h1>
                    <div class="subtitle-info">
                        <div class="info-row">
                            <strong>Disziplin:</strong> ${UIUtils.escapeHtml(
                              storage.selectedDiscipline || "Nicht gewählt"
                            )}
                        </div>
                        <div class="info-row">
                            <strong>Wettkampfdatum:</strong> ${new Date().toLocaleDateString(
                              "de-DE"
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </header>
        `;
  }

  createMainContent(filteredTeams, competitionType) {
    let content = '<main class="pdf-main">';

    // Teams
    if (filteredTeams.length > 0) {
      filteredTeams.forEach((team) => {
        content += this.createTeamSection(team, competitionType);
      });
    }

    // Einzelschützen
    if (storage.standaloneShooters.length > 0) {
      content += this.createSoloShootersSection(competitionType);
    }

    content += "</main>";
    return content;
  }

  createFooter() {
    return `
        <footer class="pdf-footer">
            <div class="footer-line"></div>
            <p class="footer-text">
                Die Mannschaftsführer bestätigen, dass alle Mannschaftschützen gemäß 
                Rundenkampfordnung startberechtigt waren und der Wettkampf nach SpO des 
                DSB in Verbindung mit der RKO des PSSB durchgeführt wurde.
            </p>
        </footer>
        `;
  }

  // =================================================================
  // TEAM-SEKTION ERSTELLUNG
  // =================================================================

  createTeamSection(team, competitionType) {
    const shooterData = this.prepareShooterData(team, competitionType);
    const worstShooterId = this.getWorstShooterId(team, competitionType);
    const teamTotal = storage.calculateTeamTotal(team, competitionType);

    let tableHtml;
    if (competitionType === CompetitionType.ANNEX_SCHEIBE) {
      tableHtml = this.createAnnexTable(shooterData, worstShooterId, teamTotal);
    } else {
      tableHtml = this.createStandardTable(
        shooterData,
        worstShooterId,
        teamTotal
      );
    }

    return `
        <section class="team-section">
            <h2 class="team-title">
                ${UIUtils.escapeHtml(team.name)} 
                <span class="team-count">(${
                  team.shooters.length
                } Schützen)</span>
            </h2>
            ${tableHtml}
        </section>
        `;
  }

  // Verbesserte Tabellen-Erstellung ohne verwirrende Formatierung

  createStandardTable(shooterData, worstShooterId, teamTotal) {
    let rows = "";

    // ALLE Schützen anzeigen (sortiert nach Name)
    const sortedShooterData = shooterData.sort((a, b) =>
      a[0].name.localeCompare(b[0].name, "de", { sensitivity: "base" })
    );

    sortedShooterData.forEach((data, index) => {
      const [shooter, precision, duell, total] = data;
      const isWorst = shooter.id === worstShooterId;

      // Einfache Logik: Worst Shooter rot, sonst abwechselnd weiß/grau
      let rowClass = "";
      let backgroundColor = "";

      if (isWorst) {
        rowClass = "worst-shooter";
        backgroundColor = "background-color: #ffebee;";
      } else if (index % 2 === 1) {
        rowClass = "zebra";
        backgroundColor = "background-color: #f8f9fa;";
      }

      rows += `
        <tr class="table-row ${rowClass}" style="${backgroundColor}">
            <td class="name-cell" style="${
              isWorst ? "color: #d32f2f;" : ""
            }">${UIUtils.escapeHtml(shooter.name)}</td>
            <td class="score-cell">${precision}</td>
            <td class="score-cell">${duell}</td>
            <td class="total-cell" style="${
              isWorst ? "font-weight: bold; color: #d32f2f;" : ""
            }">${total}</td>
        </tr>
        `;
    });

    return `
    <table class="results-table">
        <thead>
            <tr class="header-row" style="background-color: #e9ecef; font-weight: bold;">
                <th class="name-header">Name</th>
                <th class="score-header">Präzision</th>
                <th class="score-header">Duell</th>
                <th class="total-header">Gesamt</th>
            </tr>
        </thead>
        <tbody>
            ${rows}
            <tr class="total-row" style="background-color: #e9ecef !important; font-weight: bold !important;">
                <td class="total-label">Mannschaft Gesamt</td>
                <td class="total-label"></td>
                <td class="total-label"></td>
                <td class="total-value">${teamTotal}</td>
            </tr>
        </tbody>
    </table>
    `;
  }

  createAnnexTable(shooterData, worstShooterId, teamTotal) {
    let rows = "";

    // ALLE Schützen anzeigen (sortiert nach Name)
    const sortedShooterData = shooterData.sort((a, b) =>
      a[0].name.localeCompare(b[0].name, "de", { sensitivity: "base" })
    );

    sortedShooterData.forEach((data, index) => {
      const [shooter, seriesSums, total] = data;
      const isWorst = shooter.id === worstShooterId;

      // Einfache Logik: Worst Shooter rot, sonst abwechselnd weiß/grau
      let rowClass = "";
      let backgroundColor = "";

      if (isWorst) {
        rowClass = "worst-shooter";
        backgroundColor = "background-color: #ffebee;";
      } else if (index % 2 === 1) {
        rowClass = "zebra";
        backgroundColor = "background-color: #f8f9fa;";
      }

      let seriesCells = "";
      for (let i = 0; i < 5; i++) {
        const value = i < seriesSums.length ? seriesSums[i] : 0;
        seriesCells += `<td class="series-cell">${value}</td>`;
      }

      rows += `
        <tr class="table-row ${rowClass}" style="${backgroundColor}">
            <td class="name-cell" style="${
              isWorst ? "color: #d32f2f;" : ""
            }">${UIUtils.escapeHtml(shooter.name)}</td>
            ${seriesCells}
            <td class="total-cell" style="${
              isWorst ? "font-weight: bold; color: #d32f2f;" : ""
            }">${total}</td>
        </tr>
        `;
    });

    return `
    <table class="results-table annex-table">
        <thead>
            <tr class="header-row" style="background-color: #e9ecef; font-weight: bold;">
                <th class="name-header">Name</th>
                <th class="series-header">S1</th>
                <th class="series-header">S2</th>
                <th class="series-header">S3</th>
                <th class="series-header">S4</th>
                <th class="series-header">S5</th>
                <th class="total-header">Gesamt</th>
            </tr>
        </thead>
        <tbody>
            ${rows}
            <tr class="total-row" style="background-color: #e9ecef; font-weight: bold;">
                <td class="total-label">Mannschaft Gesamt</td>
                <td class="total-value"></td>
                <td class="total-value"></td>
                <td class="total-value"></td>
                <td class="total-value"></td>
                <td class="total-value"></td>
                <td class="total-value">${teamTotal}</td>
            </tr>
        </tbody>
    </table>
    `;
  }

  // =================================================================
  // EINZELSCHÜTZEN-SEKTION
  // =================================================================

  createSoloShootersSection(competitionType) {
    const sortedShooters = [...storage.standaloneShooters].sort((a, b) =>
      a.name.localeCompare(b.name, "de", { sensitivity: "base" })
    );

    let tableHtml;
    if (competitionType === CompetitionType.ANNEX_SCHEIBE) {
      tableHtml = this.createSoloAnnexTable(sortedShooters);
    } else {
      tableHtml = this.createSoloStandardTable(sortedShooters);
    }

    return `
        <section class="solo-section">
            <h2 class="team-title">Einzelschützen</h2>
            ${tableHtml}
        </section>
        `;
  }

  createSoloStandardTable(sortedShooters) {
    let rows = "";

    sortedShooters.forEach((shooter, index) => {
      const precision = storage.results
        .filter(
          (r) =>
            r.teamId === null &&
            r.shooterId === shooter.id &&
            r.discipline === Discipline.PRAEZISION
        )
        .reduce((sum, r) => sum + r.total(), 0);
      const duell = storage.results
        .filter(
          (r) =>
            r.teamId === null &&
            r.shooterId === shooter.id &&
            r.discipline === Discipline.DUELL
        )
        .reduce((sum, r) => sum + r.total(), 0);
      const total = precision + duell;

      const zebraClass = index % 2 === 1 ? "zebra" : "";

      rows += `
            <tr class="table-row ${zebraClass}">
                <td class="name-cell">${UIUtils.escapeHtml(shooter.name)}</td>
                <td class="score-cell">${precision}</td>
                <td class="score-cell">${duell}</td>
                <td class="total-cell">${total}</td>
            </tr>
            `;
    });

    return `
        <table class="results-table">
            <thead>
                <tr class="header-row" style="background-color: #e9ecef; font-weight: bold;">
                    <th class="name-header">Name</th>
                    <th class="score-header">Präzision</th>
                    <th class="score-header">Duell</th>
                    <th class="total-header">Gesamt</th>
                </tr>
            </thead>
            <tbody>
                ${rows}
            </tbody>
        </table>
        `;
  }

  createSoloAnnexTable(sortedShooters) {
    let rows = "";

    sortedShooters.forEach((shooter, index) => {
      const result = storage.results.find(
        (r) =>
          r.teamId === null &&
          r.shooterId === shooter.id &&
          r.discipline === Discipline.ANNEX_SCHEIBE
      );

      let seriesSums = [0, 0, 0, 0, 0];
      let total = 0;

      if (result && result.seriesSums) {
        seriesSums = result.seriesSums();
        total = result.total();
      }

      const zebraClass = index % 2 === 1 ? "zebra" : "";

      let seriesCells = "";
      for (let i = 0; i < 5; i++) {
        seriesCells += `<td class="series-cell">${seriesSums[i]}</td>`;
      }

      rows += `
            <tr class="table-row ${zebraClass}">
                <td class="name-cell">${UIUtils.escapeHtml(shooter.name)}</td>
                ${seriesCells}
                <td class="total-cell">${total}</td>
            </tr>
            `;
    });

    return `
        <table class="results-table annex-table">
            <thead>
                <tr class="header-row" style="background-color: #e9ecef; font-weight: bold;">
                    <th class="name-header">Name</th>
                    <th class="series-header">S1</th>
                    <th class="series-header">S2</th>
                    <th class="series-header">S3</th>
                    <th class="series-header">S4</th>
                    <th class="series-header">S5</th>
                    <th class="total-header">Gesamt</th>
                </tr>
            </thead>
            <tbody>
                ${rows}
            </tbody>
        </table>
        `;
  }

  // =================================================================
  // FALLBACK CSS (falls externe Datei nicht lädt)
  // =================================================================

  getFallbackCSS() {
    return `
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; font-size: 12px; line-height: 1.4; color: #333; background: white; }
        .pdf-container { max-width: 100%; margin: 0 auto; padding: 20px; }
        .pdf-header { margin-bottom: 30px; }
        .header-content { display: flex; align-items: flex-start; gap: 20px; }
        .logo-container { flex-shrink: 0; width: 80px; height: 80px; }
        .logo { width: 100%; height: 100%; object-fit: contain; border-radius: 8px; }
        .logo-placeholder { width: 100%; height: 100%; background: #4CAF50; border-radius: 8px; display: flex; flex-direction: column; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 9px; text-align: center; line-height: 1.1; }
        .title-container { flex: 1; }
        .main-title { font-size: 24px; font-weight: bold; color: #333; margin-bottom: 12px; }
        .subtitle-info { font-size: 14px; color: #555; }
        .info-row { margin-bottom: 6px; }
        .pdf-main { margin-bottom: 40px; }
        .team-section, .solo-section { margin-bottom: 25px; break-inside: avoid; }
        .team-title { font-size: 16px; font-weight: bold; color: #333; margin-bottom: 12px; display: flex; align-items: baseline; gap: 8px; }
        .team-count { font-size: 12px; font-weight: normal; color: #666; }
        .results-table { width: 100%; border-collapse: collapse; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); margin-bottom: 20px; break-inside: avoid; }
        .results-table th, .results-table td { padding: 8px 6px; text-align: center; border: none; }
        .results-table th { background-color: #e9ecef; font-weight: bold; font-size: 14px; color: #495057; }
        .header-row th:first-child { border-top-left-radius: 14px; }
        .header-row th:last-child { border-top-right-radius: 14px; }
        .name-header, .name-cell { text-align: left; width: 40%; }
        .score-header, .score-cell { width: 20%; text-align: center; }
        .series-header, .series-cell { width: 12%; text-align: center; }
        .total-header, .total-cell { text-align: right; width: 20%; font-weight: bold; }
        .table-row { background-color:rgb(255, 255, 255); border: 0px; }
        .table-row.zebra { background-color: #f8f9fa; border: 0px; }
        .table-row.worst-shooter { background-color: #ffebee !important; color: #d32f2f !important; }
        .worst-shooter .name-cell, .worst-shooter .total-cell { font-weight: italic; }
        .total-row { background-color: #e9ecef !important; font-weight: bold;}
        .total-row td:first-child { border-bottom-left-radius: 12px; }
        .total-row td:last-child { border-bottom-right-radius: 12px; }
        .total-label { text-align: left; font-size: 14px !important; font-weight: bold; }
        .total-value { text-align: left; font-weight: bold; font-size: 14px !important; }
        .pdf-footer { margin-top: 30px; page-break-inside: avoid; }
        .footer-line { height: 1px; background-color: #666; margin-bottom: 12px; }
        .footer-text { font-size: 10px; line-height: 1.4; color: #666; text-align: justify; max-width: 100%; font-style: italic; }
        @media print { .team-section, .results-table { page-break-inside: avoid; } body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
        `;
  }

  // =================================================================
  // HILFSMETHODEN
  // =================================================================

  getFilteredTeams() {
    if (storage.visibleTeamIds) {
      return storage.teams.filter((team) =>
        storage.visibleTeamIds.has(team.id)
      );
    }
    return storage.teams;
  }

  prepareShooterData(team, competitionType) {
    if (competitionType === CompetitionType.ANNEX_SCHEIBE) {
      return this.prepareAnnexShooterData(team);
    } else {
      return this.prepareStandardShooterData(team);
    }
  }

  prepareStandardShooterData(team) {
    return team.shooters
      .map((shooter) => {
        const precision = storage.results
          .filter(
            (r) =>
              r.teamId === team.id &&
              r.shooterId === shooter.id &&
              r.discipline === Discipline.PRAEZISION
          )
          .reduce((sum, r) => sum + r.total(), 0);
        const duell = storage.results
          .filter(
            (r) =>
              r.teamId === team.id &&
              r.shooterId === shooter.id &&
              r.discipline === Discipline.DUELL
          )
          .reduce((sum, r) => sum + r.total(), 0);
        return [shooter, precision, duell, precision + duell];
      })
      .sort((a, b) => b[3] - a[3]); // Sortiert nach Gesamtpunkten, höchste zuerst
  }

  prepareAnnexShooterData(team) {
    return team.shooters
      .map((shooter) => {
        const result = storage.results.find(
          (r) =>
            r.teamId === team.id &&
            r.shooterId === shooter.id &&
            r.discipline === Discipline.ANNEX_SCHEIBE
        );

        if (result && result.seriesSums) {
          const seriesSums = result.seriesSums();
          const total = result.total();
          return [shooter, seriesSums, total];
        }
        return [shooter, [0, 0, 0, 0, 0], 0];
      })
      .sort((a, b) => b[2] - a[2]); // Sortiert nach Gesamtpunkten, höchste zuerst
  }

  getWorstShooterId(team, competitionType) {
    if (team.shooters.length !== 4) return null; // Nur bei genau 4 Schützen

    let shooterTotals;

    if (competitionType === CompetitionType.ANNEX_SCHEIBE) {
      shooterTotals = team.shooters.map((shooter) => {
        const result = storage.results.find(
          (r) =>
            r.teamId === team.id &&
            r.shooterId === shooter.id &&
            r.discipline === Discipline.ANNEX_SCHEIBE
        );
        const total = result ? result.total() : 0;
        return { id: shooter.id, total: total };
      });
    } else {
      shooterTotals = team.shooters.map((shooter) => {
        const precision = storage.results
          .filter(
            (r) =>
              r.teamId === team.id &&
              r.shooterId === shooter.id &&
              r.discipline === Discipline.PRAEZISION
          )
          .reduce((sum, r) => sum + r.total(), 0);
        const duell = storage.results
          .filter(
            (r) =>
              r.teamId === team.id &&
              r.shooterId === shooter.id &&
              r.discipline === Discipline.DUELL
          )
          .reduce((sum, r) => sum + r.total(), 0);
        return { id: shooter.id, total: precision + duell };
      });
    }

    const sorted = shooterTotals.sort((a, b) => a.total - b.total);
    return sorted[0]?.id;
  }

  // In pdf-exporter.js - Ersetzen Sie die loadLogoAsBase64 Methode:

  // In pdf-exporter.js - loadLogoAsBase64 Methode ersetzen:
  async loadLogoAsBase64() {
    return new Promise((resolve) => {
      // Zuerst prüfen, ob ein hochgeladenes Logo existiert
      const storedLogo = storage.getLogo();
      if (storedLogo) {
        console.log("Using uploaded club logo from storage");
        resolve(storedLogo);
        return;
      }

      // Fallback zu den Standard-Logo-Pfaden
      const img = new Image();
      img.crossOrigin = "anonymous";

      img.onload = function () {
        try {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");

          canvas.width = this.naturalWidth;
          canvas.height = this.naturalHeight;

          ctx.drawImage(this, 0, 0);

          const base64 = canvas.toDataURL("image/png");
          console.log("Standard logo loaded successfully");
          resolve(base64);
        } catch (e) {
          console.warn("Error converting logo to base64:", e);
          resolve(null);
        }
      };

      img.onerror = function () {
        console.warn("No logo could be loaded (neither uploaded nor standard)");
        resolve(null);
      };

      // Versuche verschiedene Logo-Pfade
      const logoPaths = [
        "./assets/logo.png",
        "./icons/icon-192x192.png",
        "assets/logo.png",
        "icons/icon-192x192.png",
      ];

      img.src = logoPaths[0];
    });
  }

  getPDFOptions() {
    return {
      margin: [15, 15, 20, 15], // top, right, bottom, left (mm)
      filename: `Rundenkampfbericht_${new Date()
        .toLocaleDateString("de-DE")
        .replace(/\./g, "_")}.pdf`,
      image: {
        type: "jpeg",
        quality: 0.98,
      },
      html2canvas: {
        scale: 2,
        dpi: 300,
        useCORS: true,
        letterRendering: true,
        allowTaint: false,
        backgroundColor: "#ffffff",
        removeContainer: true,
        onclone: function (document) {
          // Cleanup any potential styling issues
          const elements = document.querySelectorAll("*");
          elements.forEach((el) => {
            // Remove any problematic transforms or filters
            const computed = window.getComputedStyle(el);
            if (computed.transform && computed.transform !== "none") {
              el.style.transform = "none";
            }
          });
        },
      },
      jsPDF: {
        unit: "mm",
        format: "a4",
        orientation: "portrait",
        compress: false,
      },
    };
  }
}

// Globale Instanz erstellen
const pdfExporter = new PDFExporter();

// Globale Funktion für den Export
window.exportToPDF = function () {
  pdfExporter.exportToPDF();
};
