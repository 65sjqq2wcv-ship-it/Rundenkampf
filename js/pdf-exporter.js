// =================================================================
// PDF EXPORTER - Erweiterte Version mit Einzelschützen-Filter
// =================================================================

class PDFExporter {
  constructor() {
    this.logoBase64 = null;
    this.loadingPromise = null;
    this.cssStyles = null;
    this.cssLoaded = false;
  }

  // =================================================================
  // CSS LOADING (bleibt unverändert)
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
  // HAUPTEXPORT-METHODE (erweitert)
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

      const filteredTeams = storage.getFilteredTeams();
      const filteredStandaloneShooters = storage.getFilteredStandaloneShooters(); // NEU
      const competitionType = storage.selectedCompetitionType;

      // HTML-Content erstellen
      const htmlContent = this.createPDFHTML(
        filteredTeams,
        filteredStandaloneShooters, // NEU
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
  // HTML-STRUKTUR AUFBAU (erweitert)
  // =================================================================

  createPDFHTML(filteredTeams, filteredStandaloneShooters, competitionType, cssStyles) {
    const header = this.createHeader();
    const mainContent = this.createMainContent(filteredTeams, filteredStandaloneShooters, competitionType);
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

    const eventDirector = storage.settings.eventDirector || {};

    return `
        <header class="pdf-header">
            <div class="header-content">
                <div class="logo-container">
                    ${logoHtml}
                </div>
                <div class="title-container">
                    <h2 class="club-name">${UIUtils.escapeHtml(storage.settings.clubName || "Sportschützenkreis Germersheim e.V.")}</h2>
                    <h1 class="main-title">Rundenkampfbericht</h1>
                </div>
            </div>
            
            <table class="info-table">
                <tr>
                    <td class="info-label">Disziplin:</td>
                    <td class="info-value">${UIUtils.escapeHtml(storage.selectedDiscipline || "Nicht gewählt")}</td>
                    <td class="info-label">Rundenkampfleiter:</td>
                    <td class="info-value">${UIUtils.escapeHtml(eventDirector.name || "")}</td>
                </tr>
                <tr>
                    <td class="info-label"></td>
                    <td class="info-value"></td>
                    <td class="info-label">Tel:</td>
                    <td class="info-value">${UIUtils.escapeHtml(eventDirector.phone || "")}</td>
                </tr>
                <tr>
                    <td colspan="2"></td>
                    <td class="info-label">E-mail:</td>
                    <td class="info-value">${UIUtils.escapeHtml(eventDirector.email || "")}</td>
                </tr>
                <tr>
                    <td class="info-label">Wettkampfort:</td>
                    <td class="info-value">${UIUtils.escapeHtml(storage.selectedVenue || "")}</td>
                    <td class="info-label">Wettkampfdatum:</td>
                    <td class="info-value">${new Date().toLocaleDateString("de-DE")}</td>
                </tr>
            </table>
        </header>
        `;
  }

  createMainContent(filteredTeams, filteredStandaloneShooters, competitionType) {
    let content = '<main class="pdf-main">';

    // Teams
    if (filteredTeams.length > 0) {
      filteredTeams.forEach((team) => {
        content += this.createTeamSection(team, competitionType);
      });
    }

    // NEU: Einzelschützen - nur die gefilterten
    if (filteredStandaloneShooters.length > 0) {
      content += this.createSoloShootersSection(filteredStandaloneShooters, competitionType);
    }

    content += "</main>";
    return content;
  }

  createFooter() {
    return `
        <footer class="pdf-footer">
            <div class="signature-section">
                <table class="signature-table">
                    <tr>
                        <td class="signature-cell">
                            <div class="signature-label">Mannschaftsführer Standverein</div>
                            <div class="signature-line"></div>
                        </td>
                        <td class="signature-cell">
                            <div class="signature-label">Mannschaftsführer Gastverein</div>
                            <div class="signature-line"></div>
                        </td>
                        <td class="signature-cell">
                            <div class="signature-label">evl. Schießleiter</div>
                            <div class="signature-line"></div>
                        </td>
                    </tr>
                </table>
            </div>
            <div class="footer-note">
                <p>
                    Die Mannschaftsführer bestätigen mit ihrer Unterschrift, dass alle Mannschaftschützen 
                    gemäß Rundenkampfordnung startberechtigt waren und der Wettkampf nach SpO des 
                    DSB in Verbindung mit der RKO des PSSB durchgeführt wurde.
                </p>
            </div>
        </footer>
        `;
  }

  // =================================================================
  // TEAM-SEKTION ERSTELLUNG (bleibt unverändert)
  // =================================================================

  createTeamSection(team, competitionType) {
    const shooterData = this.prepareShooterData(team, competitionType);
    const worstShooterId = this.getWorstShooterId(team, competitionType);
    const teamTotal = storage.calculateTeamTotal(team, competitionType);

    // Team info section
    const teamLeader = team.teamLeader || {};
    let teamInfoHtml = `
        <table class="team-info-table">
            <tr>
                <td class="team-info-label">Mannschaftsführer:</td>
                <td class="team-info-name">${UIUtils.escapeHtml(teamLeader.name || "")}</td>
                <td class="team-info-phone-label">MF - Tel.:</td>
                <td class="team-info-phone">${UIUtils.escapeHtml(teamLeader.phone || "")}</td>
            </tr>
        </table>
    `;

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
                <span class="team-count">(${team.shooters.length
      } Schützen)</span>
            </h2>
            ${teamInfoHtml}
            ${tableHtml}
        </section>
        `;
  }

  // =================================================================
  // NEU: EINZELSCHÜTZEN-SEKTION ERSTELLUNG
  // =================================================================

  createSoloShootersSection(filteredStandaloneShooters, competitionType) {
    let content = `
        <section class="team-section">
            <h2 class="team-title">
                Einzelschützen 
                <span class="team-count">(${filteredStandaloneShooters.length} Schützen)</span>
            </h2>
        `;

    if (competitionType === CompetitionType.ANNEX_SCHEIBE) {
      content += this.createSoloShootersAnnexTable(filteredStandaloneShooters);
    } else {
      content += this.createSoloShootersStandardTable(filteredStandaloneShooters);
    }

    content += `</section>`;
    return content;
  }

  createSoloShootersStandardTable(filteredStandaloneShooters) {
    let rows = "";

    // Prepare shooter data
    const shooterData = filteredStandaloneShooters
      .map((shooter) => {
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
        return [shooter, precision, duell, precision + duell];
      })
      //.sort((a, b) => b[3] - a[3]); // Sortiert nach Gesamtpunkten
      .sort((a, b) => a[0].name.localeCompare(b[0].name, "de", { sensitivity: "base" })); // Sortiert alphabetisch nach Namen

    shooterData.forEach((data, index) => {
      const [shooter, precision, duell, total] = data;
      const rowClass = index % 2 === 0 ? "table-row" : "table-row zebra";

      rows += `
          <tr class="${rowClass}">
              <td class="scheiben-cell">${index + 1}</td>
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
                <tr class="header-row">
                    <th class="scheiben-header">Scheiben-Nr.</th>
                    <th class="name-header">Name Vorname (Blockschrift)</th>
                    <th class="score-header">Präz.</th>
                    <th class="score-header">Duell</th>
                    <th class="total-header">gesamt</th>
                </tr>
            </thead>
            <tbody>
                ${rows}
            </tbody>
        </table>
    `;
  }

  createSoloShootersAnnexTable(filteredStandaloneShooters) {
    let rows = "";

    // Prepare shooter data for Annex
    const shooterData = filteredStandaloneShooters
      .map((shooter) => {
        const result = storage.results.find(
          (r) =>
            r.teamId === null &&
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
      //.sort((a, b) => b[2] - a[2]); // Sortiert nach Gesamtpunkten
      .sort((a, b) => a[0].name.localeCompare(b[0].name, "de", { sensitivity: "base" })); // Sortiert alphabetisch nach Namen

    shooterData.forEach((data, index) => {
      const [shooter, seriesSums, total] = data;
      const rowClass = index % 2 === 0 ? "table-row" : "table-row zebra";

      let seriesCells = "";
      for (let i = 0; i < 5; i++) {
        const seriesValue = i < seriesSums.length ? seriesSums[i] : 0;
        seriesCells += `<td class="series-cell">${seriesValue}</td>`;
      }

      rows += `
          <tr class="${rowClass}">
              <td class="scheiben-cell">${index + 1}</td>
              <td class="name-cell">${UIUtils.escapeHtml(shooter.name)}</td>
              ${seriesCells}
              <td class="total-cell">${total}</td>
          </tr>
      `;
    });

    return `
        <table class="results-table">
            <thead>
                <tr class="header-row">
                    <th class="scheiben-header">Scheiben-Nr.</th>
                    <th class="name-header">Name Vorname (Blockschrift)</th>
                    <th class="series-header">Serie 1</th>
                    <th class="series-header">Serie 2</th>
                    <th class="series-header">Serie 3</th>
                    <th class="series-header">Serie 4</th>
                    <th class="series-header">Serie 5</th>
                    <th class="total-header">gesamt</th>
                </tr>
            </thead>
            <tbody>
                ${rows}
            </tbody>
        </table>
    `;
  }

  // =================================================================
  // TABELLEN-ERSTELLUNG (bleibt größtenteils unverändert)
  // =================================================================

  createStandardTable(shooterData, worstShooterId, teamTotal) {
    let rows = "";

    shooterData.forEach((data, index) => {
      const [shooter, precision, duell, total] = data;
      const isWorst = shooter.id === worstShooterId;
      const rowClass = isWorst
        ? "table-row worst-shooter"
        : index % 2 === 0
          ? "table-row"
          : "table-row zebra";

      rows += `
          <tr class="${rowClass}">
              <td class="scheiben-cell">${index + 1}</td>
              <td class="name-cell">${UIUtils.escapeHtml(shooter.name)}</td>
              <td class="score-cell">${precision}</td>
              <td class="score-cell">${duell}</td>
              <td class="total-cell">${total}</td>
          </tr>
      `;
    });

    // Team total row
    rows += `
        <tr class="total-row">
            <td colspan="4" class="total-label">Mannschaft Gesamt:</td>
            <td class="total-value">${teamTotal}</td>
        </tr>
    `;

    return `
        <table class="results-table">
            <thead>
                <tr class="header-row">
                    <th class="scheiben-header">Scheiben-Nr.</th>
                    <th class="name-header">Name Vorname (Blockschrift)</th>
                    <th class="score-header">Präz.</th>
                    <th class="score-header">Duell</th>
                    <th class="total-header">gesamt</th>
                </tr>
            </thead>
            <tbody>
                ${rows}
            </tbody>
        </table>
    `;
  }

  createAnnexTable(shooterData, worstShooterId, teamTotal) {
    let rows = "";

    shooterData.forEach((data, index) => {
      const [shooter, seriesSums, total] = data;
      const isWorst = shooter.id === worstShooterId;
      const rowClass = isWorst
        ? "table-row worst-shooter"
        : index % 2 === 0
          ? "table-row"
          : "table-row zebra";

      let seriesCells = "";
      for (let i = 0; i < 5; i++) {
        const seriesValue = i < seriesSums.length ? seriesSums[i] : 0;
        seriesCells += `<td class="series-cell">${seriesValue}</td>`;
      }

      rows += `
          <tr class="${rowClass}">
              <td class="scheiben-cell">${index + 1}</td>
              <td class="name-cell">${UIUtils.escapeHtml(shooter.name)}</td>
              ${seriesCells}
              <td class="total-cell">${total}</td>
          </tr>
      `;
    });

    // Team total row
    rows += `
        <tr class="total-row">
            <td colspan="7" class="total-label">Mannschaft Gesamt:</td>
            <td class="total-value">${teamTotal}</td>
        </tr>
    `;

    return `
        <table class="results-table">
            <thead>
                <tr class="header-row">
                    <th class="scheiben-header">Scheiben-Nr.</th>
                    <th class="name-header">Name Vorname (Blockschrift)</th>
                    <th class="series-header">Serie 1</th>
                    <th class="series-header">Serie 2</th>
                    <th class="series-header">Serie 3</th>
                    <th class="series-header">Serie 4</th>
                    <th class="series-header">Serie 5</th>
                    <th class="total-header">gesamt</th>
                </tr>
            </thead>
            <tbody>
                ${rows}
            </tbody>
        </table>
    `;
  }

  // =================================================================
  // FALLBACK CSS (bleibt unverändert)
  // =================================================================

  getFallbackCSS() {
    return `
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; font-size: 11px; line-height: 1.3; color: #333; background: white; }
        .pdf-container { max-width: 100%; margin: 0 auto; padding: 15px; }
        
        /* HEADER STYLES */
        .pdf-header { margin-bottom: 20px; border-bottom: 2px solid #333; padding-bottom: 15px; }
        .header-content { display: flex; align-items: flex-start; gap: 15px; margin-bottom: 12px; }
        .logo-container { flex-shrink: 0; width: 60px; height: 60px; }
        .logo { width: 100%; height: 100%; object-fit: contain; border-radius: 4px; }
        .logo-placeholder { width: 100%; height: 100%; background: #f0f0f0; border: 1px solid #ccc; border-radius: 4px; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #666; font-weight: bold; font-size: 8px; text-align: center; line-height: 1; }
        .title-container { flex: 1; }
        .club-name { font-size: 12px; font-weight: normal; color: #333; margin-bottom: 2px; }
        .main-title { font-size: 16px; font-weight: bold; color: #333; margin-bottom: 8px; }
        
        /* INFO TABLE */
        .info-table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 10px; }
        .info-table td { padding: 3px 4px; border: 1px solid #999; }
        .info-label { font-weight: bold; width: 25%; text-align: left; background-color: #e0e0e0; }
        .info-value { text-align: left; width: 25%; }
        
        /* MAIN CONTENT */
        .pdf-main { margin-bottom: 30px; }
        .team-section { margin-bottom: 20px; page-break-inside: avoid; }
        .team-title { font-size: 12px; font-weight: bold; color: #333; margin-bottom: 4px; display: flex; align-items: baseline; gap: 6px; }
        .team-count { font-size: 10px; font-weight: normal; color: #666; }
        .team-info-table { width: 100%; border-collapse: collapse; margin-bottom: 8px; font-size: 9px; background-color: #f5f5f5; border-left: 2px solid #333; }
        .team-info-label { font-weight: bold; padding: 2px 3px; width: 15%; }
        .team-info-name { padding: 2px 3px; width: 35%; }
        .team-info-phone-label { font-weight: bold; padding: 2px 3px; width: 15%; }
        .team-info-phone { padding: 2px 3px; width: 35%; }
        
        /* TABLE STYLES */
        .results-table { width: 100%; border-collapse: collapse; margin-bottom: 15px; page-break-inside: avoid; font-size: 10px; }
        .results-table th, .results-table td { padding: 2px 2px; border: 1px solid #999; text-align: center; }
        .results-table th { background-color: #d3d3d3; font-weight: bold; }
        .name-header, .name-cell { text-align: left; width: 45%; font-size: 8px; }
        .scheiben-header, .scheiben-cell { width: 6%; }
        .score-header, .score-cell { width: 12%; }
        .series-header, .series-cell { width: 10%; }
        .total-header, .total-cell { width: 12%; font-weight: bold; }
        
        .table-row { background-color: white; }
        .table-row.zebra { background-color: #f9f9f9; }
        .table-row.worst-shooter { background-color: #ffcccc; }
        .total-row { background-color: #d3d3d3; font-weight: bold; font-size: 8px; }
        .total-label { text-align: left; font-weight: bold; }
        .total-value { text-align: center; font-weight: bold; }
        
        /* FOOTER */
        .pdf-footer { margin-top: 30px; page-break-inside: avoid; }
        .signature-section { margin-bottom: 15px; }
        .signature-table { width: 100%; border-collapse: collapse; }
        .signature-cell { width: 33%; text-align: center; padding: 10px 5px; }
        .signature-label { font-size: 9px; font-weight: normal; margin-bottom: 25px; }
        .signature-line { border-bottom: 1px solid #333; height: 20px; }
        .footer-note { font-size: 9px; line-height: 1.3; color: #666; text-align: justify; margin-top: 10px; }
        .footer-note p { margin: 0; }
        
        @media print { 
            .team-section, .results-table { page-break-inside: avoid; } 
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
        `;
  }

  // =================================================================
  // HILFSMETHODEN (erweitert)
  // =================================================================

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
      // ALTE ZEILE:
      //.sort((a, b) => b[3] - a[3]); // Sortiert nach Gesamtpunkten, höchste zuerst
      // NEUE ZEILE:
      .sort((a, b) => a[0].name.localeCompare(b[0].name, "de", { sensitivity: "base" })); // Sortiert alphabetisch nach Namen
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
      // ALTE ZEILE:
      //.sort((a, b) => b[2] - a[2]); // Sortiert nach Gesamtpunkten, höchste zuerst
      // NEUE ZEILE:
      .sort((a, b) => a[0].name.localeCompare(b[0].name, "de", { sensitivity: "base" })); // Sortiert alphabetisch nach Namen
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
        quality: 1.0,
      },
      html2canvas: {
        scale: 2.5,
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