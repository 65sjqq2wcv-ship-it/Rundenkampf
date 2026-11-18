class OverviewView {
  constructor() {
    this.showingFilter = false;
  }

  // Erweiterte render() Methode - nur die relevanten Teile
  render() {
    const container = document.createElement("div");

    try {
      // Setup navigation buttons
      this.setupNavButtons();

      // Current discipline and competition type info
      if (storage.selectedDiscipline) {
        const infoCard = this.createInfoCard();
        container.appendChild(infoCard);
      }

      // Teams overview
      const filteredTeams = storage.getFilteredTeams();

      // Always show teams even without results
      if (filteredTeams.length > 0) {
        filteredTeams.forEach((team) => {
          const teamCard = this.createTeamOverviewCard(team);
          container.appendChild(teamCard);
        });
      }

      // Standalone shooters overview - MIT FILTER
      const filteredStandaloneShooters =
        storage.getFilteredStandaloneShooters();
      if (filteredStandaloneShooters.length > 0) {
        const soloCard = this.createSoloShootersCard();
        container.appendChild(soloCard);
      }

      // Add encounters and event director cards - unabhängig vom Filter, von ALLEN Teams
      if (storage.teams.length > 0) {
        const encountersCard = this.createAllEncountersCard(storage.teams);
        if (encountersCard) {
          container.appendChild(encountersCard);
        }

        // Event Director info card - nach den Ergebnissen
        const eventDirectorCard = this.createEventDirectorCard();
        if (eventDirectorCard) {
          container.appendChild(eventDirectorCard);
        }

        const leadersCard = this.createAllTeamLeadersCard(storage.teams);
        if (leadersCard) {
          container.appendChild(leadersCard);
        }
      }

      // Empty state only if NO filtered teams AND no filtered standalone shooters
      if (
        filteredTeams.length === 0 &&
        filteredStandaloneShooters.length === 0
      ) {
        const emptyState = document.createElement("div");
        emptyState.className = "card empty-state";
        emptyState.style.cssText = "margin-bottom: 30px;";
        emptyState.innerHTML = `
        <h3>Keine Teams oder Schützen sichtbar</h3>
        <p style="margin: 16px 0;">Passen Sie den Filter an oder fügen Sie Teams und Schützen hinzu.</p>
        <div style="display: flex; gap: 12px; justify-content: center; margin-top: 20px;">
          <button class="btn btn-primary" style="width: 50%; height: 70px;" onclick="app.showView('teams')">
            Teams verwalten
          </button>
          <button class="btn btn-secondary" style="width: 50%; height: 70px;" onclick="app.showView('entry')">
            Ergebnisse erfassen
          </button>
        </div>
      `;
        container.appendChild(emptyState);
      } else if (this.hasNoResults()) {
        // Show info card if teams exist but no results
        const infoCard = document.createElement("div");
        infoCard.className = "card";
        infoCard.style.cssText =
          "background: color-mix(in srgb, var(--warning-color) 15%, var(--bg-card)); border: 1px solid var(--warning-color); text-align: center; margin-bottom: 30px;";
        infoCard.innerHTML = `
        <h4 style="margin: 0 0 8px 0; color: var(--warning-color);">Noch keine Ergebnisse erfasst</h4>
        <p style="margin: 0; color: var(--warning-color);">Die Teams sind angelegt, aber es wurden noch keine Schussergebnisse erfasst.</p>
        <button class="btn btn-primary" style="width: 100%; height: 70px; margin-top: 20px;" onclick="app.showView('entry')" style="margin-top: 12px;">
          Jetzt Ergebnisse erfassen
        </button>
      `;
        container.appendChild(infoCard);
      }
    } catch (error) {
      console.error("Error rendering overview:", error);
      container.innerHTML = `<div class="card" style="margin-bottom: 30px;"><p style="color: red;">Fehler beim Laden der Übersicht: ${error.message}</p></div>`;
    }

    return container;
  }

  hasNoResults() {
    return storage.results.length === 0;
  }

  setupNavButtons() {
    setTimeout(() => {
      const navButtons = document.getElementById("navButtons");
      if (navButtons) {
        navButtons.innerHTML = "";

        // Einträge des Header-Menüs (Übersicht)
        const items = [
          { text: "🔍 Filter", action: () => this.showFilterModal() },
          { text: "🏷️ Labels drucken", action: () => this.printLabels() },
          { text: "📄 PDF Export", action: () => this.exportToPDF() },
        ];

        items.forEach((item) => {
          const btn = document.createElement("button");
          btn.className = "nav-menu-item";
          btn.type = "button";
          btn.textContent = item.text;
          btn.addEventListener("click", item.action);
          navButtons.appendChild(btn);
        });
      }
    }, 100);
  }

  // NEU: printLabels Methode hinzufügen
  printLabels() {
    // Verwende den neuen Label-Printer
    if (typeof labelPrinter !== "undefined" && labelPrinter.printLabels) {
      labelPrinter.printLabels();
    } else if (typeof window.printLabels === "function") {
      window.printLabels();
    } else {
      console.error("Label-Printer not available");
      UIUtils.showError(
        "Label-Printer nicht verfügbar. Bitte laden Sie die Seite neu.",
      );
    }
  }

  createInfoCard() {
    const card = document.createElement("div");
    card.className = "card";
    card.style.cssText = "background: color-mix(in srgb, var(--color-success) 12%, var(--bg-card)); border: 1px solid var(--color-success);";
    let venueText = "";
    if (storage.selectedVenue) {
      venueText = `<p style="color: var(--text-secondary); margin-top: 8px;">Wettkampfort: ${UIUtils.escapeHtml(storage.selectedVenue)}</p>`;
    }
    card.innerHTML = `
			<div style="text-align: center;">
				<h3>${storage.selectedDiscipline}</h3>
				<!-- <p style="color: var(--text-secondary); margin-top: 8px;">Modus: ${storage.selectedCompetitionType}</p> -->
				${venueText}
			</div>
		`;
    return card;
  }

  createTeamOverviewCard(team) {
    const competitionType = storage.selectedCompetitionType;

    if (competitionType === CompetitionType.ELEKTRONISCH) {
      return this.createTeamOverviewCardElectronic(team);
    }
    if (competitionType === CompetitionType.ANNEX_SCHEIBE) {
      return this.createTeamOverviewCardAnnex(team);
    }
    return this.createTeamOverviewCardStandard(team);
  }

  // Modus Elektronisch (LG/LP): Serien je Schütze, Mannschaftssumme (bester 3er)
  createTeamOverviewCardElectronic(team) {
    const card = document.createElement("div");
    card.className = "card";

    const header = document.createElement("div");
    header.style.cssText =
      "display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;";
    header.innerHTML = `
			<h3 style="margin: 0; flex: 1; line-height: 1.3;">${UIUtils.escapeHtml(team.name)}</h3>
			<span style="color: var(--text-secondary); font-size: 14px;">Schützen: ${team.shooters.length}</span>
		`;
    card.appendChild(header);

    const rows = storage.getElectronicRows(team.shooters, team.id);
    card.appendChild(
      this.createElectronicBlock(rows, {
        total: storage.calculateTeamTotal(team, CompetitionType.ELEKTRONISCH),
        worstShooterId: storage.getElectronicWorstShooterId(team),
      }),
    );
    return card;
  }

  // Tabelle für elektronisch erfasste Serien (LG/LP): S1-S4 und Ergebnis.
  // options.total: optionale Zeile "Mannschaft Gesamt"
  createElectronicBlock(rows, options = {}) {
    const wrapper = document.createElement("div");
    wrapper.className = "electro-block";

    if (!rows || rows.length === 0) {
      const empty = document.createElement("div");
      empty.className = "text-muted";
      empty.textContent = "Noch keine elektronischen Ergebnisse erfasst.";
      wrapper.appendChild(empty);
      return wrapper;
    }

    const table = document.createElement("div");
    table.className = "electro-table";

    const header = document.createElement("div");
    header.className = "electro-row electro-head";
    header.innerHTML = `
			<div>Name</div>
			<div>S1</div>
			<div>S2</div>
			<div>S3</div>
			<div>S4</div>
			<div class="electro-total">Erg.</div>
		`;
    table.appendChild(header);

    rows.forEach((row, index) => {
      const line = document.createElement("div");
      const isWorst = row.shooter.id === options.worstShooterId;
      line.className = [
        "electro-row",
        isWorst ? "electro-worst" : index % 2 === 1 ? "zebra" : "",
      ]
        .filter(Boolean)
        .join(" ");
      const seriesCells = row.series
        .map((v) => `<div>${formatScore(v)}</div>`)
        .join("");
      line.innerHTML = `
				<div class="electro-name">${UIUtils.escapeHtml(row.shooter.name)}</div>
				${seriesCells}
				<div class="electro-total">${formatScore(row.total)}</div>
			`;
      table.appendChild(line);
    });

    if (options.total !== undefined) {
      const foot = document.createElement("div");
      foot.className = "electro-row electro-foot";
      foot.innerHTML = `
				<div class="electro-foot-label">Mannschaft Gesamt:</div>
				<div class="electro-total">${formatScore(options.total)}</div>
			`;
      table.appendChild(foot);
    }

    wrapper.appendChild(table);
    return wrapper;
  }

  createTeamOverviewCardStandard(team) {
    const card = document.createElement("div");
    card.className = "card";

    // Prepare shooter data
    const shooterData = this.prepareShooterData(team);
    const worstShooterId = this.getWorstShooterId(team);
    const teamTotal = storage.calculateBestThreeSum(team);

    // Header
    const header = document.createElement("div");
    header.style.cssText =
      "display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;";
    header.innerHTML = `
			<h3 style="margin: 0; flex: 1; line-height: 1.3;">${UIUtils.escapeHtml(
        team.name,
      )}</h3>
			<span style="color: var(--text-secondary); font-size: 14px;">Schützen: ${
        team.shooters.length
      }</span>
		`;
    card.appendChild(header);

    // Show message if no shooters
    if (team.shooters.length === 0) {
      const noShooters = document.createElement("div");
      noShooters.style.cssText =
        "text-align: center; color: var(--text-secondary); padding: 20px;";
      noShooters.textContent = "Keine Schützen in dieser Mannschaft";
      card.appendChild(noShooters);
      return card;
    }

    // Table
    const table = document.createElement("div");
    table.style.cssText =
      "border: 1px solid var(--border-default); border-radius: 8px; overflow: hidden;";

    // Table header
    const tableHeader = document.createElement("div");
    tableHeader.style.cssText =
      "background: var(--bg-table-header); padding: 8px; display: grid; grid-template-columns: 1fr 50px 50px 50px; gap: 8px; font-weight: 600; font-size: 12px;";
    tableHeader.innerHTML = `
			<div style="text-align: left;">Name</div>
			<div style="text-align: right;">Präz.</div>
			<div style="text-align: center;">Duell</div>
			<div style="text-align: right;">Gesamt</div>
		`;
    table.appendChild(tableHeader);

    // Shooter rows
    shooterData.forEach((data, index) => {
      const [shooter, precision, duell, total] = data;
      const isWorst =
        shooter.id === worstShooterId && team.shooters.length >= 4;

      const row = document.createElement("div");
      row.style.cssText = `
				padding: 8px; 
				display: grid; 
				grid-template-columns: 1fr 50px 50px 50px; 
				gap: 4px; 
				font-size: 12px;
				border-top: 1px solid var(--border-default);
				${index % 2 === 1 ? "background: var(--bg-subtle);" : ""}
				${isWorst ? "color: var(--color-danger); background-color: color-mix(in srgb, var(--color-danger) 15%, var(--bg-card));" : ""}
			`;
      row.innerHTML = `
				<div style="overflow: hidden; text-overflow: ellipsis; ${
          isWorst ? "text-decoration: normal;" : ""
        }">${UIUtils.escapeHtml(shooter.name)}</div>
				<div style="text-align: center;">${precision}</div>
				<div style="text-align: center;">${duell}</div>
				<div style="text-align: right; font-weight: 500; ${
          isWorst ? "text-decoration: normal;" : ""
        }">${total}</div>
			`;
      table.appendChild(row);
    });

    // Team total row
    const totalRow = document.createElement("div");
    totalRow.style.cssText =
      "background: var(--bg-table-header); padding: 8px; display: grid; grid-template-columns: 1fr 50px; gap: 4px; font-weight: 600; border-top: 1px solid var(--border-default);";
    totalRow.innerHTML = `
			<div style="text-align: left; font-weight: bold; font-size: 12px;">Mannschaft Gesamt: </div>
			<div style="text-align: right; font-weight: bold; font-size: 12px;">${teamTotal}</div>
		`;

    table.appendChild(totalRow);

    card.appendChild(table);
    return card;
  }

  createTeamOverviewCardAnnex(team) {
    const card = document.createElement("div");
    card.className = "card";

    // Prepare shooter data for Annex
    const shooterData = this.prepareShooterDataAnnex(team);
    const worstShooterId = this.getWorstShooterIdAnnex(team);

    // Header
    const header = document.createElement("div");
    header.style.cssText =
      "display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;";
    header.innerHTML = `
			<h3 style="margin: 0; flex: 1; line-height: 1.3;">${UIUtils.escapeHtml(
        team.name,
      )}</h3>
			<span style="color: var(--text-secondary); font-size: 14px;">Schützen: ${
        team.shooters.length
      }</span>
		`;
    card.appendChild(header);

    // Show message if no shooters
    if (team.shooters.length === 0) {
      const noShooters = document.createElement("div");
      noShooters.style.cssText =
        "text-align: center; color: var(--text-secondary); padding: 20px;";
      noShooters.textContent = "Keine Schützen in dieser Mannschaft";
      card.appendChild(noShooters);
      return card;
    }

    // Scrollable table container
    const tableContainer = document.createElement("div");
    tableContainer.style.cssText =
      "overflow-x: auto; border: 1px solid var(--border-default); border-radius: 8px;";

    const table = document.createElement("div");
    table.style.cssText = "min-width: 330px;";

    // Table header - narrower columns for series, wider for Gesamt
    const tableHeader = document.createElement("div");
    tableHeader.style.cssText =
      "background: var(--bg-table-header); padding: 8px; display: grid; grid-template-columns: 1fr repeat(5, 25px) 35px; gap: 4px; font-weight: 600; font-size: 12px;";
    tableHeader.innerHTML = `
			<div>Name</div>
			<div style="text-align: center;">S1</div>
			<div style="text-align: center;">S2</div>
			<div style="text-align: center;">S3</div>
			<div style="text-align: center;">S4</div>
			<div style="text-align: center;">S5</div>
			<div style="text-align: right;">Ges.</div>
		`;
    table.appendChild(tableHeader);

    // Shooter rows
    shooterData.forEach((data, index) => {
      const [shooter, seriesSums, total] = data;
      const isWorst =
        shooter.id === worstShooterId && team.shooters.length >= 4;

      const row = document.createElement("div");
      row.style.cssText = `
				padding: 8px; 
				display: grid; 
				grid-template-columns: 1fr repeat(5, 25px) 35px; 
				gap: 4px; 
				font-size: 12px;
				border-top: 1px solid var(--border-default);
				${index % 2 === 1 ? "background: var(--bg-subtle);" : ""}
				${isWorst ? "color: var(--color-danger); background-color: color-mix(in srgb, var(--color-danger) 15%, var(--bg-card));" : ""}
			`;

      let rowHTML = `<div style="overflow: hidden; text-overflow: ellipsis; ${
        isWorst ? "text-decoration: normal;" : ""
      }">${UIUtils.escapeHtml(shooter.name)}</div>`;

      // Series sums
      for (let i = 0; i < 5; i++) {
        const seriesValue = i < seriesSums.length ? seriesSums[i] : 0;
        rowHTML += `<div style="text-align: center;">${seriesValue}</div>`;
      }

      rowHTML += `<div style="text-align: right; font-weight: 500; ${
        isWorst ? "text-decoration: normal;" : ""
      }">${total}</div>`;

      row.innerHTML = rowHTML;
      table.appendChild(row);
    });

    // Calculate team total using storage method
    const teamTotal = storage.calculateTeamTotal(
      team,
      CompetitionType.ANNEX_SCHEIBE,
    );

    // Team total row - spanning across name and series columns
    const totalRow = document.createElement("div");
    totalRow.style.cssText =
      "background: var(--bg-table-header); padding: 8px; display: grid; grid-template-columns: 1fr 50px; gap: 4px; font-weight: 600; border-top: 1px solid var(--border-default);";
    totalRow.innerHTML = `
			<div style="text-align: left; font-weight: bold; font-size: 12px;">Mannschaft Gesamt: </div>
			<div style="text-align: right; font-weight: bold; font-size: 12px;">${teamTotal}</div>
		`;

    table.appendChild(totalRow);

    tableContainer.appendChild(table);
    card.appendChild(tableContainer);
    return card;
  }

  // Erweiterte createSoloShootersCard() Methode um Filter zu berücksichtigen
  createSoloShootersCard() {
    const competitionType = storage.selectedCompetitionType;

    if (competitionType === CompetitionType.ELEKTRONISCH) {
      return this.createSoloShootersCardElectronic();
    }
    if (competitionType === CompetitionType.ANNEX_SCHEIBE) {
      return this.createSoloShootersCardAnnex();
    }
    return this.createSoloShootersCardStandard();
  }

  createSoloShootersCardElectronic() {
    const shooters = storage.getFilteredStandaloneShooters();
    const card = document.createElement("div");
    card.className = "card";

    const header = document.createElement("div");
    header.style.cssText =
      "display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;";
    header.innerHTML = `
			<h3 style="margin: 0; flex: 1; line-height: 1.3;">Einzelschützen</h3>
			<span style="color: var(--text-secondary); font-size: 14px;">Schützen: ${shooters.length}</span>
		`;
    card.appendChild(header);
    card.appendChild(
      this.createElectronicBlock(storage.getElectronicRows(shooters, null)),
    );
    return card;
  }

  createSoloShootersCardStandard() {
    const card = document.createElement("div");
    card.className = "card";

    // Header
    const header = document.createElement("div");
    header.innerHTML = '<h3 style="margin: 0 0 16px 0;">Einzelschützen</h3>';
    card.appendChild(header);

    // Use filtered shooters instead of all shooters
    const filteredShooters = storage.getFilteredStandaloneShooters();

    if (filteredShooters.length === 0) {
      const noShooters = document.createElement("div");
      noShooters.style.cssText =
        "text-align: center; color: var(--text-secondary); padding: 20px;";
      noShooters.textContent = "Keine Einzelschützen sichtbar";
      card.appendChild(noShooters);
      return card;
    }

    // Table
    const table = document.createElement("div");
    table.style.cssText =
      "border: 1px solid var(--border-default); border-radius: 8px; overflow: hidden;";

    // Table header
    const tableHeader = document.createElement("div");
    tableHeader.style.cssText =
      "background: var(--bg-table-header); padding: 8px; display: grid; grid-template-columns: 1fr 50px 50px 50px; gap: 8px; font-weight: 600; font-size: 12px;";
    tableHeader.innerHTML = `
			<div style="text-align: left;">Name</div>
			<div style="text-align: right;">Präz.</div>
			<div style="text-align: center;">Duell</div>
			<div style="text-align: right;">Gesamt</div>
		`;
    table.appendChild(tableHeader);

    // Shooter rows with filtered data
    filteredShooters
      .map((shooter) => {
        const precision = storage.results
          .filter(
            (r) =>
              r.teamId === null &&
              r.shooterId === shooter.id &&
              r.discipline === Discipline.PRAEZISION,
          )
          .reduce((sum, r) => sum + r.total(), 0);
        const duell = storage.results
          .filter(
            (r) =>
              r.teamId === null &&
              r.shooterId === shooter.id &&
              r.discipline === Discipline.DUELL,
          )
          .reduce((sum, r) => sum + r.total(), 0);
        return [shooter, precision, duell, precision + duell];
      })
      .sort((a, b) => {
        const sortingOpt = storage.settings.sortingOption || "nameAsc";
        switch (sortingOpt) {
          case "nameAsc":
            return a[0].name.localeCompare(b[0].name, "de", { sensitivity: "base" });
          case "nameDesc":
            return b[0].name.localeCompare(a[0].name, "de", { sensitivity: "base" });
          case "scoreAsc":
            return a[3] - b[3];
          case "scoreDesc":
            return b[3] - a[3];
          default:
            return a[0].name.localeCompare(b[0].name, "de", { sensitivity: "base" });
        }
      })
      .forEach((data, index) => {
        const [shooter, precision, duell, total] = data;

        const row = document.createElement("div");
        row.style.cssText = `
				padding: 8px; 
				display: grid; 
				grid-template-columns: 1fr 50px 50px 50px; 
				gap: 4px; 
				font-size: 12px;
				border-top: 1px solid var(--border-default);
				${index % 2 === 1 ? "background: var(--bg-subtle);" : ""}
			`;
        row.innerHTML = `
				<div style="overflow: hidden; text-overflow: ellipsis;">${UIUtils.escapeHtml(
          shooter.name,
        )}</div>
				<div style="text-align: center;">${precision}</div>
				<div style="text-align: center;">${duell}</div>
				<div style="text-align: right; font-weight: 500;">${total}</div>
			`;
        table.appendChild(row);
      });

    card.appendChild(table);
    return card;
  }

  createSoloShootersCardAnnex() {
    const card = document.createElement("div");
    card.className = "card";

    // Header
    const header = document.createElement("div");
    header.innerHTML = '<h3 style="margin: 0 0 16px 0;">Einzelschützen</h3>';
    card.appendChild(header);

    // Use filtered shooters instead of all shooters
    const filteredShooters = storage.getFilteredStandaloneShooters();

    if (filteredShooters.length === 0) {
      const noShooters = document.createElement("div");
      noShooters.style.cssText =
        "text-align: center; color: var(--text-secondary); padding: 20px;";
      noShooters.textContent = "Keine Einzelschützen sichtbar";
      card.appendChild(noShooters);
      return card;
    }

    // Scrollable table container
    const tableContainer = document.createElement("div");
    tableContainer.style.cssText =
      "overflow-x: auto; border: 1px solid var(--border-default); border-radius: 8px;";

    const table = document.createElement("div");
    table.style.cssText = "min-width: 330px;";

    // Table header
    const tableHeader = document.createElement("div");
    tableHeader.style.cssText =
      "background: var(--bg-table-header); padding: 8px; display: grid; grid-template-columns: 1fr repeat(5, 25px) 35px; gap: 4px; font-weight: 600; font-size: 12px;";
    tableHeader.innerHTML = `
			<div>Name</div>
			<div style="text-align: center;">S1</div>
			<div style="text-align: center;">S2</div>
			<div style="text-align: center;">S3</div>
			<div style="text-align: center;">S4</div>
			<div style="text-align: center;">S5</div>
			<div style="text-align: right;">Ges.</div>
		`;
    table.appendChild(tableHeader);

    // Shooter rows with filtered data
    filteredShooters
      .map((shooter) => {
        const result = storage.results.find(
          (r) =>
            r.teamId === null &&
            r.shooterId === shooter.id &&
            r.discipline === Discipline.ANNEX_SCHEIBE,
        );

        if (result && result.seriesSums) {
          const seriesSums = result.seriesSums();
          const total = result.total();
          return [shooter, seriesSums, total];
        }
        return [shooter, [0, 0, 0, 0, 0], 0];
      })
      .sort((a, b) => {
        const sortingOpt = storage.settings.sortingOption || "nameAsc";
        switch (sortingOpt) {
          case "nameAsc":
            return a[0].name.localeCompare(b[0].name, "de", { sensitivity: "base" });
          case "nameDesc":
            return b[0].name.localeCompare(a[0].name, "de", { sensitivity: "base" });
          case "scoreAsc":
            return a[2] - b[2];
          case "scoreDesc":
            return b[2] - a[2];
          default:
            return a[0].name.localeCompare(b[0].name, "de", { sensitivity: "base" });
        }
      })
      .forEach((data, index) => {
        const [shooter, seriesSums, total] = data;

        const row = document.createElement("div");
        row.style.cssText = `
				padding: 8px; 
				display: grid; 
				grid-template-columns: 1fr repeat(5, 25px) 35px; 
				gap: 4px; 
				font-size: 12px;
				border-top: 1px solid var(--border-default);
				${index % 2 === 1 ? "background: var(--bg-subtle);" : ""}
			`;

        let rowHTML = `<div style="overflow: hidden; text-overflow: ellipsis;">${UIUtils.escapeHtml(
          shooter.name,
        )}</div>`;

        // Series sums
        for (let i = 0; i < 5; i++) {
          const seriesValue = i < seriesSums.length ? seriesSums[i] : 0;
          rowHTML += `<div style="text-align: center;">${seriesValue}</div>`;
        }

        rowHTML += `<div style="text-align: right; font-weight: 500;">${total}</div>`;

        row.innerHTML = rowHTML;
        table.appendChild(row);
      });

    tableContainer.appendChild(table);
    card.appendChild(tableContainer);
    return card;
  }

  prepareShooterData(team) {
    return team.shooters
      .map((shooter) => {
        const precision = storage.results
          .filter(
            (r) =>
              r.teamId === team.id &&
              r.shooterId === shooter.id &&
              r.discipline === Discipline.PRAEZISION,
          )
          .reduce((sum, r) => sum + r.total(), 0);
        const duell = storage.results
          .filter(
            (r) =>
              r.teamId === team.id &&
              r.shooterId === shooter.id &&
              r.discipline === Discipline.DUELL,
          )
          .reduce((sum, r) => sum + r.total(), 0);
        return [shooter, precision, duell, precision + duell];
      })
      .sort((a, b) => {
        const sortingOpt = storage.settings.sortingOption || "nameAsc";
        switch (sortingOpt) {
          case "nameAsc":
            return a[0].name.localeCompare(b[0].name, "de", { sensitivity: "base" });
          case "nameDesc":
            return b[0].name.localeCompare(a[0].name, "de", { sensitivity: "base" });
          case "scoreAsc":
            return a[3] - b[3];
          case "scoreDesc":
            return b[3] - a[3];
          default:
            return a[0].name.localeCompare(b[0].name, "de", { sensitivity: "base" });
        }
      });
  }

  prepareShooterDataAnnex(team) {
    return team.shooters
      .map((shooter) => {
        const result = storage.results.find(
          (r) =>
            r.teamId === team.id &&
            r.shooterId === shooter.id &&
            r.discipline === Discipline.ANNEX_SCHEIBE,
        );

        if (result && result.seriesSums) {
          const seriesSums = result.seriesSums();
          const total = result.total();
          return [shooter, seriesSums, total];
        }
        return [shooter, [0, 0, 0, 0, 0], 0];
      })
      .sort((a, b) => {
        const sortingOpt = storage.settings.sortingOption || "nameAsc";
        switch (sortingOpt) {
          case "nameAsc":
            return a[0].name.localeCompare(b[0].name, "de", { sensitivity: "base" });
          case "nameDesc":
            return b[0].name.localeCompare(a[0].name, "de", { sensitivity: "base" });
          case "scoreAsc":
            return a[2] - b[2];
          case "scoreDesc":
            return b[2] - a[2];
          default:
            return a[0].name.localeCompare(b[0].name, "de", { sensitivity: "base" });
        }
      });
  }

  getWorstShooterId(team) {
    if (team.shooters.length < 4) return null;

    const shooterTotals = team.shooters.map((shooter) => {
      const precision = storage.results
        .filter(
          (r) =>
            r.teamId === team.id &&
            r.shooterId === shooter.id &&
            r.discipline === Discipline.PRAEZISION,
        )
        .reduce((sum, r) => sum + r.total(), 0);
      const duell = storage.results
        .filter(
          (r) =>
            r.teamId === team.id &&
            r.shooterId === shooter.id &&
            r.discipline === Discipline.DUELL,
        )
        .reduce((sum, r) => sum + r.total(), 0);
      return { id: shooter.id, total: precision + duell };
    });

    const sorted = shooterTotals.sort((a, b) => a.total - b.total);
    return sorted[0]?.id;
  }

  getWorstShooterIdAnnex(team) {
    if (team.shooters.length < 4) return null;

    const shooterTotals = team.shooters.map((shooter) => {
      const result = storage.results.find(
        (r) =>
          r.teamId === team.id &&
          r.shooterId === shooter.id &&
          r.discipline === Discipline.ANNEX_SCHEIBE,
      );
      const total = result ? result.total() : 0;
      return { id: shooter.id, total: total };
    });

    const sorted = shooterTotals.sort((a, b) => a.total - b.total);
    return sorted[0]?.id;
  }

  // Erweiterte showFilterModal Funktion
  showFilterModal() {
    const content = document.createElement("div");
    content.innerHTML = `
    <div class="form-section">
      <div class="form-section-header">Anzuzeigende Mannschaften</div>
      <div class="form-row">
        <label style="display: flex; align-items: center; gap: 8px;">
          <input type="checkbox" id="showAllTeams" ${
            !storage.visibleTeamIds ? "checked" : ""
          }>
          <span>Alle anzeigen</span>
        </label>
      </div>
      <div id="teamCheckboxes"></div>
    </div>
    
    <div class="form-section">
      <div class="form-section-header">Anzuzeigende Einzelschützen</div>
      <div class="form-row">
        <label style="display: flex; align-items: center; gap: 8px;">
          <input type="checkbox" id="showAllShooters" ${
            !storage.visibleShooterIds ? "checked" : ""
          }>
          <span>Alle anzeigen</span>
        </label>
      </div>
      <div id="shooterCheckboxes"></div>
    </div>
  `;

    const modal = new ModalComponent("Filter", content);
    modal.addAction(
      "Fertig",
      () => {
        this.saveFilter();
        app.showView("overview");
      },
      true,
      false,
    );

    modal.show();

    setTimeout(() => {
      this.setupFilterModal();
    }, 100);
  }

  // Erweiterte setupFilterModal Funktion
  setupFilterModal() {
    const showAllTeamsCheckbox = document.getElementById("showAllTeams");
    const teamCheckboxesContainer = document.getElementById("teamCheckboxes");
    const showAllShootersCheckbox = document.getElementById("showAllShooters");
    const shooterCheckboxesContainer =
      document.getElementById("shooterCheckboxes");

    // Teams Handling
    if (showAllTeamsCheckbox && teamCheckboxesContainer) {
      // Show all teams checkbox handler
      showAllTeamsCheckbox.addEventListener("change", (e) => {
        const teamCheckboxes = teamCheckboxesContainer.querySelectorAll(
          'input[type="checkbox"]',
        );
        teamCheckboxes.forEach((cb) => {
          cb.disabled = e.target.checked;
        });
      });

      // Team checkboxes
      storage.teams.forEach((team) => {
        const row = document.createElement("div");
        row.className = "form-row";
        row.innerHTML = `
        <label style="display: flex; align-items: center; gap: 8px;">
          <input type="checkbox" class="team-checkbox" data-team-id="${team.id}" 
            ${
              !storage.visibleTeamIds || storage.visibleTeamIds.has(team.id)
                ? "checked"
                : ""
            }
            ${!storage.visibleTeamIds ? "disabled" : ""}>
          <span>${UIUtils.escapeHtml(team.name)}</span>
        </label>
      `;
        teamCheckboxesContainer.appendChild(row);
      });
    }

    // Shooters Handling
    if (showAllShootersCheckbox && shooterCheckboxesContainer) {
      // Show all shooters checkbox handler
      showAllShootersCheckbox.addEventListener("change", (e) => {
        const shooterCheckboxes = shooterCheckboxesContainer.querySelectorAll(
          'input[type="checkbox"]',
        );
        shooterCheckboxes.forEach((cb) => {
          cb.disabled = e.target.checked;
        });
      });

      // Shooter checkboxes
      storage.standaloneShooters.forEach((shooter) => {
        const row = document.createElement("div");
        row.className = "form-row";
        row.innerHTML = `
        <label style="display: flex; align-items: center; gap: 8px;">
          <input type="checkbox" class="shooter-checkbox" data-shooter-id="${shooter.id}" 
            ${
              !storage.visibleShooterIds ||
              storage.visibleShooterIds.has(shooter.id)
                ? "checked"
                : ""
            }
            ${!storage.visibleShooterIds ? "disabled" : ""}>
          <span>${UIUtils.escapeHtml(shooter.name)}</span>
        </label>
      `;
        shooterCheckboxesContainer.appendChild(row);
      });
    }
  }

  // Erweiterte saveFilter Funktion
  saveFilter() {
    const showAllTeamsCheckbox = document.getElementById("showAllTeams");
    const showAllShootersCheckbox = document.getElementById("showAllShooters");

    // Teams Filter
    if (showAllTeamsCheckbox && showAllTeamsCheckbox.checked) {
      storage.visibleTeamIds = null;
    } else {
      const teamCheckboxes = document.querySelectorAll(".team-checkbox");
      const visibleTeamIds = new Set();

      teamCheckboxes.forEach((checkbox) => {
        if (checkbox.checked) {
          visibleTeamIds.add(checkbox.dataset.teamId);
        }
      });

      storage.visibleTeamIds = visibleTeamIds;
    }

    // Shooters Filter
    if (showAllShootersCheckbox && showAllShootersCheckbox.checked) {
      storage.visibleShooterIds = null;
    } else {
      const shooterCheckboxes = document.querySelectorAll(".shooter-checkbox");
      const visibleShooterIds = new Set();

      shooterCheckboxes.forEach((checkbox) => {
        if (checkbox.checked) {
          visibleShooterIds.add(checkbox.dataset.shooterId);
        }
      });

      storage.visibleShooterIds = visibleShooterIds;
    }

    storage.save();
    UIUtils.showSuccessMessage("Filter aktualisiert");
  }

  exportToPDF() {
    // Verwende den neuen PDF-Exporter
    if (typeof pdfExporter !== "undefined" && pdfExporter.exportToPDF) {
      pdfExporter.exportToPDF();
    } else if (typeof window.exportToPDF === "function") {
      window.exportToPDF();
    } else {
      console.error("PDF-Exporter not available");
      UIUtils.showError(
        "PDF-Exporter nicht verfügbar. Bitte laden Sie die Seite neu.",
      );
    }
  }

  createAllTeamLeadersCard(filteredTeams) {
    const teamLeaders = filteredTeams
      .filter((team) => team.teamLeader && team.teamLeader.name)
      .map((team) => ({ team, leader: team.teamLeader }));

    if (teamLeaders.length === 0) {
      return null;
    }

    const card = document.createElement("div");
    card.className = "card";
    card.style.cssText = "margin-bottom: 12px; padding: 12px; background: var(--bg-subtle); border: 1px solid var(--border-default);";

    const header = document.createElement("h4");
    header.style.cssText = "margin: 0 0 8px 0; color: var(--text-primary); font-size: 14px;";
    header.textContent = `Mannschaftsführer (${teamLeaders.length})`;
    card.appendChild(header);

    const list = document.createElement("div");
    list.style.cssText = "font-size: 13px; line-height: 1.5;";

    teamLeaders.forEach((item, index) => {
      const { team, leader } = item;
      const container = document.createElement("div");
      container.style.cssText = `padding: 6px 0; ${index < teamLeaders.length - 1 ? 'border-bottom: 1px solid var(--border-default); padding-bottom: 8px;' : ''}`;
      
      // Name und Team
      const nameLine = document.createElement("div");
      nameLine.innerHTML = `<strong>${UIUtils.escapeHtml(leader.name)}</strong> (${UIUtils.escapeHtml(team.name)})`;
      container.appendChild(nameLine);

      // eMail
      if (leader.email) {
        const emailLine = document.createElement("div");
        emailLine.style.cssText = "color: var(--color-link);";
        emailLine.innerHTML = `<span style="color: var(--text-primary);">eMail:</span> <a href="mailto:${UIUtils.escapeHtml(leader.email)}" style="color: var(--color-link); text-decoration: none;">${UIUtils.escapeHtml(leader.email)}</a>`;
        container.appendChild(emailLine);
      }

      // Telefon
      if (leader.phone) {
        const phoneLine = document.createElement("div");
        phoneLine.style.cssText = "color: var(--color-link);";
        phoneLine.innerHTML = `<span style="color: var(--text-primary);">Telefon:</span> <a href="tel:${UIUtils.escapeHtml(leader.phone)}" style="color: var(--color-link); text-decoration: none;">${UIUtils.escapeHtml(leader.phone)}</a>`;
        container.appendChild(phoneLine);
      }
      
      list.appendChild(container);
    });

    card.appendChild(list);
    return card;
  }

  createAllEncountersCard(filteredTeams) {
    let totalEncounters = 0;
    const encountersList = [];

    filteredTeams.forEach((team) => {
      if (team.encounters && team.encounters.length > 0) {
        team.encounters.forEach((encounter) => {
          encountersList.push({ team, encounter });
          totalEncounters++;
        });
      }
    });

    if (totalEncounters === 0) {
      return null;
    }

    // Sortiere Begegnungen nach Datum (DD.MM.YYYY -> chronologisch)
    encountersList.sort((a, b) => {
      const dateA = new Date(a.encounter.date.split(".").reverse().join("-"));
      const dateB = new Date(b.encounter.date.split(".").reverse().join("-"));
      return dateA - dateB;
    });

    const card = document.createElement("div");
    card.className = "card";
    card.style.cssText = "margin-bottom: 12px; padding: 12px; background: var(--bg-subtle); border: 1px solid var(--border-default);";

    const header = document.createElement("h4");
    header.style.cssText = "margin: 0 0 8px 0; color: var(--text-primary); font-size: 14px;";
    header.textContent = `Begegnungen (${totalEncounters})`;
    card.appendChild(header);

    const list = document.createElement("div");
    list.style.cssText = "font-size: 13px; line-height: 1.5;";

    encountersList.forEach((item, index) => {
      const { team, encounter } = item;
      const row = document.createElement("div");
      row.style.cssText = `padding: 4px 0; ${index < encountersList.length - 1 ? 'border-bottom: 1px solid var(--border-default);' : ''}`;
      const dateShort = encounter.date.substring(0, 5) + "." + encounter.date.slice(-2); // DD.MM.YY
      row.innerHTML = `<strong>${UIUtils.escapeHtml(dateShort)}</strong> ${UIUtils.escapeHtml(team.name)} gegen ${UIUtils.escapeHtml(encounter.opponent)}`;
      list.appendChild(row);
    });

    card.appendChild(list);
    return card;
  }

  createEventDirectorCard() {
    const eventDirector = storage.settings.eventDirector || {};
    if (!eventDirector.name) {
      return null;
    }

    const card = document.createElement("div");
    card.className = "card";
    card.style.cssText = "margin-bottom: 12px; padding: 12px; background: var(--bg-subtle); border: 1px solid var(--border-default);";

    const header = document.createElement("h4");
    header.style.cssText = "margin: 0 0 8px 0; color: var(--text-primary); font-size: 14px;";
    header.textContent = "Rundenkampfleiter";
    card.appendChild(header);

    const content = document.createElement("div");
    content.style.cssText = "font-size: 13px; line-height: 1.5;";

    // Name
    const nameDiv = document.createElement("div");
    nameDiv.style.cssText = "font-weight: 600; color: var(--text-primary); margin-bottom: 6px;";
    nameDiv.textContent = UIUtils.escapeHtml(eventDirector.name);
    content.appendChild(nameDiv);

    // eMail
    if (eventDirector.email) {
      const emailDiv = document.createElement("div");
      emailDiv.style.cssText = "color: var(--color-link); margin-bottom: 4px;";
      emailDiv.innerHTML = `<span style="color: var(--text-primary);">eMail:</span> <a href="mailto:${UIUtils.escapeHtml(eventDirector.email)}" style="color: var(--color-link); text-decoration: none;">${UIUtils.escapeHtml(eventDirector.email)}</a>`;
      content.appendChild(emailDiv);
    }

    // Telefon
    if (eventDirector.phone) {
      const phoneDiv = document.createElement("div");
      phoneDiv.style.cssText = "color: var(--color-link);";
      phoneDiv.innerHTML = `<span style="color: var(--text-primary);">Telefon:</span> <a href="tel:${UIUtils.escapeHtml(eventDirector.phone)}" style="color: var(--color-link); text-decoration: none;">${UIUtils.escapeHtml(eventDirector.phone)}</a>`;
      content.appendChild(phoneDiv);
    }

    card.appendChild(content);
    return card;
  }
}
