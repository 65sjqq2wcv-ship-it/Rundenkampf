// =================================================================
// ENTRY VIEW - Verbesserte Version mit korrekter Zuordnung und Kamera
// =================================================================

class EntryView {
  constructor() {
    this.selectedTeamId = null;
    this.selectedShooterId = null;
    this.selectedDiscipline = null; // Änderung: Keine Default-Auswahl
    this.shots = new Array(40).fill(null);
    this.eventRegistry = new EventRegistry();
    this.isDestroyed = false;
    this.cameraStream = null;
    this.isCapturing = false;
  }

  // =================================================================
  // MAIN RENDER METHOD
  // =================================================================

  render() {
    const container = document.createElement("div");

    try {
      this.setupNavButtons();

      // Sichere Element-Erstellung
      const selectionCard = this.createSelectionCard();
      const shotsCard = this.createShotsCard();
      const controlsDiv = this.createControlsSection();

      container.appendChild(selectionCard);
      container.appendChild(shotsCard);
      container.appendChild(controlsDiv);

      // ÄNDERUNG: Keine automatische Initialisierung
      this.resetSelection();
    } catch (error) {
      console.error("Error rendering entry view:", error);
      this.showError(container, "Fehler beim Laden der Erfassen-Ansicht");
    }

    return container;
  }

  // =================================================================
  // VERBESSERTE SELECTION MANAGEMENT
  // =================================================================

  resetSelection() {
    // Alles auf leer setzen
    this.selectedTeamId = null;
    this.selectedShooterId = null;
    this.selectedDiscipline = null;
    this.shots = new Array(40).fill(null);

    setTimeout(() => {
      this.updateTeamSelect();
      this.updateShooterSelect();
      this.updateDisciplineSelect();
      this.updateShotsDisplay();
    }, 100);
  }

  // =================================================================
  // NAVIGATION SETUP
  // =================================================================

  setupNavButtons() {
    setTimeout(() => {
      const navButtons = document.getElementById("navButtons");
      if (navButtons) {
        navButtons.innerHTML = "";
      }
    }, 100);
  }

  // =================================================================
  // SELECTION CARD CREATION
  // =================================================================

  createSelectionCard() {
    const card = document.createElement("div");
    card.className = "card";

    // Header
    const header = document.createElement("h3");
    header.textContent = "Auswahl";
    card.appendChild(header);

    // Container für Formulare
    const formContainer = document.createElement("div");
    formContainer.style.marginTop = "16px";

    // Form Rows
    const teamRow = this.createFormRow("Mannschaft", this.createTeamSelect());
    const shooterRow = this.createFormRow(
      "Schütze",
      this.createShooterSelect()
    );
    const disciplineRow = this.createFormRow(
      "Disziplin",
      this.createDisciplineSelect()
    );

    formContainer.appendChild(teamRow);
    formContainer.appendChild(shooterRow);
    formContainer.appendChild(disciplineRow);
    card.appendChild(formContainer);

    // Sichere Event-Registrierung nach DOM-Insertion
    setTimeout(() => this.setupEventListeners(), 100);

    return card;
  }

  createFormRow(labelText, inputElement) {
    const row = document.createElement("div");
    row.className = "form-row";

    const label = document.createElement("label");
    label.className = "form-label";
    label.textContent = labelText;

    row.appendChild(label);
    row.appendChild(inputElement);
    return row;
  }

  createTeamSelect() {
    const select = document.createElement("select");
    select.className = "form-select";
    select.id = "teamSelect";

    // Sichere Option-Erstellung
    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = "— Bitte wählen —";
    select.appendChild(defaultOption);

    return select;
  }

  createShooterSelect() {
    const select = document.createElement("select");
    select.className = "form-select";
    select.id = "shooterSelect";

    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = "— Bitte wählen —";
    select.appendChild(defaultOption);

    return select;
  }

  createDisciplineSelect() {
    const select = document.createElement("select");
    select.className = "form-select";
    select.id = "disciplineSelect";

    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = "— Bitte wählen —";
    select.appendChild(defaultOption);

    return select;
  }

  // =================================================================
  // EVENT LISTENERS SETUP
  // =================================================================

  setupEventListeners() {
    const teamSelect = document.getElementById("teamSelect");
    const shooterSelect = document.getElementById("shooterSelect");
    const disciplineSelect = document.getElementById("disciplineSelect");

    if (teamSelect) {
      this.eventRegistry.register(teamSelect, "change", (e) => {
        try {
          this.selectedTeamId = e.target.value || null;
          this.selectedShooterId = null; // Schützen-Auswahl zurücksetzen
          this.shots = new Array(40).fill(null); // Shots zurücksetzen

          this.updateShooterSelect();
          this.updateShotsDisplay();
        } catch (error) {
          console.error("Error handling team selection:", error);
          UIUtils.showError("Fehler bei der Mannschaftsauswahl");
        }
      });
    }

    if (shooterSelect) {
      this.eventRegistry.register(shooterSelect, "change", (e) => {
        try {
          this.selectedShooterId = e.target.value || null;
          this.loadExistingResults(); // NEU: Lade existierende Ergebnisse
          this.updateShotsDisplay();
        } catch (error) {
          console.error("Error handling shooter selection:", error);
          UIUtils.showError("Fehler bei der Schützenauswahl");
        }
      });
    }

    if (disciplineSelect) {
      this.eventRegistry.register(disciplineSelect, "change", (e) => {
        try {
          this.selectedDiscipline = e.target.value || null;
          this.loadExistingResults(); // NEU: Lade existierende Ergebnisse
          this.updateShotsDisplay();
        } catch (error) {
          console.error("Error handling discipline selection:", error);
          UIUtils.showError("Fehler bei der Disziplinauswahl");
        }
      });
    }

    // Update initial selections
    this.updateTeamSelect();
    this.updateShooterSelect();
    this.updateDisciplineSelect();
  }

  // =================================================================
  // NEU: LADEN EXISTIERENDER ERGEBNISSE
  // =================================================================

  loadExistingResults() {
    if (!this.selectedShooterId || !this.selectedDiscipline) {
      this.shots = new Array(40).fill(null);
      return;
    }

    // Suche nach existierendem Ergebnis
    const existingResult = storage.results.find(
      (r) =>
        r.shooterId === this.selectedShooterId &&
        r.discipline === this.selectedDiscipline &&
        r.teamId === this.selectedTeamId
    );

    if (existingResult) {
      // Lade existierende Shots
      this.shots = [...existingResult.shots];
      console.log(
        "Loaded existing results for shooter:",
        this.selectedShooterId
      );
    } else {
      // Keine Ergebnisse vorhanden - leeres Array
      this.shots = new Array(40).fill(null);
      console.log("No existing results found - starting fresh");
    }
  }

  // =================================================================
  // SELECT UPDATES
  // =================================================================

  updateTeamSelect() {
    const select = document.getElementById("teamSelect");
    if (!select) return;

    // Clear existing options
    select.innerHTML = "";

    // Default Option
    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = "— Bitte wählen —";
    select.appendChild(defaultOption);

    // Einzelschütze Option
    const soloOption = document.createElement("option");
    soloOption.value = "standalone";
    soloOption.textContent = "— Einzelschütze —";
    select.appendChild(soloOption);

    // Teams hinzufügen
    const sortedTeams = [...storage.teams].sort((a, b) =>
      a.name.localeCompare(b.name, "de", { numeric: true, sensitivity: "base" })
    );

    sortedTeams.forEach((team) => {
      const option = document.createElement("option");
      option.value = team.id;
      option.textContent = UIUtils.escapeHtml(team.name);
      select.appendChild(option);
    });

    // Aktuelle Auswahl setzen
    select.value = this.selectedTeamId || "";
  }

  updateShooterSelect() {
    const select = document.getElementById("shooterSelect");
    if (!select) return;

    // Clear existing options
    select.innerHTML = "";

    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = "— Bitte wählen —";
    select.appendChild(defaultOption);

    const teamSelect = document.getElementById("teamSelect");
    const teamValue = teamSelect?.value;

    if (teamValue === "standalone") {
      // Einzelschützen anzeigen
      this.selectedTeamId = null;
      const sortedStandaloneShooters = [...storage.standaloneShooters].sort(
        (a, b) =>
          a.name.localeCompare(b.name, "de", {
            numeric: true,
            sensitivity: "base",
          })
      );

      sortedStandaloneShooters.forEach((shooter) => {
        const option = document.createElement("option");
        option.value = shooter.id;
        option.textContent = UIUtils.escapeHtml(shooter.name);
        select.appendChild(option);
      });
    } else if (teamValue && teamValue !== "") {
      // Team-Schützen anzeigen
      this.selectedTeamId = teamValue;
      const team = storage.teams.find((t) => t.id === teamValue);
      if (team && team.shooters) {
        const sortedShooters = [...team.shooters].sort((a, b) =>
          a.name.localeCompare(b.name, "de", {
            numeric: true,
            sensitivity: "base",
          })
        );

        sortedShooters.forEach((shooter) => {
          const option = document.createElement("option");
          option.value = shooter.id;
          option.textContent = UIUtils.escapeHtml(shooter.name);
          select.appendChild(option);
        });
      }
    }

    // Aktuelle Auswahl setzen
    if (this.selectedShooterId) {
      select.value = this.selectedShooterId;
    }
  }

  updateDisciplineSelect() {
    const select = document.getElementById("disciplineSelect");
    if (!select) return;

    // Clear existing options
    select.innerHTML = "";

    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = "— Bitte wählen —";
    select.appendChild(defaultOption);

    // Standard-Disziplinen
    const disciplines = [
      { value: Discipline.PRAEZISION, text: "Präzision" },
      { value: Discipline.DUELL, text: "Duell" },
      { value: Discipline.ANNEX_SCHEIBE, text: "Annex Scheibe" },
    ];

    disciplines.forEach((discipline) => {
      const option = document.createElement("option");
      option.value = discipline.value;
      option.textContent = discipline.text;
      select.appendChild(option);
    });

    // Aktuelle Auswahl setzen
    if (this.selectedDiscipline) {
      select.value = this.selectedDiscipline;
    }
  }

  // =================================================================
  // SHOTS CARD CREATION
  // =================================================================

  createShotsCard() {
    const card = document.createElement("div");
    card.className = "card";

    // Header
    const header = document.createElement("h3");
    header.id = "shotsTitle";
    header.textContent = "Schuss-Erfassung";
    card.appendChild(header);

    // Shots Grid Container
    const gridContainer = document.createElement("div");
    gridContainer.id = "shotsGrid";
    gridContainer.style.margin = "16px 0";
    card.appendChild(gridContainer);

    // Stats Container
    const statsContainer = document.createElement("div");
    statsContainer.id = "shotsStats";
    statsContainer.style.cssText =
      "display: flex; justify-content: space-between; margin-top: 12px; font-size: 14px; color: #666;";
    card.appendChild(statsContainer);

    // Series Summary Container
    const summaryContainer = document.createElement("div");
    summaryContainer.id = "seriesSummary";
    summaryContainer.style.marginTop = "16px";
    card.appendChild(summaryContainer);

    setTimeout(() => this.updateShotsDisplay(), 100);

    return card;
  }

  // =================================================================
  // CONTROLS SECTION - ERWEITERT MIT KAMERA-BUTTON
  // =================================================================

  createControlsSection() {
    const controlsDiv = document.createElement("div");

    const card = document.createElement("div");
    card.className = "card";
    card.style.cssText = "padding: 12px; margin-bottom: 30px;";

    const flexContainer = document.createElement("div");
    flexContainer.style.cssText =
      "display: flex; gap: 8px; align-items: flex-start;";

    // Keypad Container
    const keypadContainer = document.createElement("div");
    keypadContainer.id = "keypadContainer";
    keypadContainer.style.flex = "1";
    flexContainer.appendChild(keypadContainer);

    // Buttons Container
    const buttonsContainer = document.createElement("div");
    buttonsContainer.style.cssText =
      "display: flex; flex-direction: column; gap: 8px; min-width: 100px;";

    // Save Button
    const saveBtn = document.createElement("button");
    saveBtn.id = "saveBtn";
    saveBtn.className = "btn btn-primary";
    saveBtn.style.cssText = "height: 50px; font-weight: 600;";
    saveBtn.textContent = "Speichern";
    buttonsContainer.appendChild(saveBtn);

    // Clear Button
    const clearBtn = document.createElement("button");
    clearBtn.id = "clearBtn";
    clearBtn.className = "btn btn-secondary";
    clearBtn.style.cssText = "height: 50px;";
    clearBtn.textContent = "Leeren";
    buttonsContainer.appendChild(clearBtn);

    // NEU: Kamera Button für Scheibendokumentation
    const cameraBtn = document.createElement("button");
    cameraBtn.id = "cameraBtn";
    cameraBtn.className = "btn btn-secondary";
    cameraBtn.style.cssText =
      "height: 50px; background-color: #34c759; color: white;";
    cameraBtn.textContent = "📷 Scheibe";
    buttonsContainer.appendChild(cameraBtn);

    flexContainer.appendChild(buttonsContainer);
    card.appendChild(flexContainer);
    controlsDiv.appendChild(card);

    // Setup controls after DOM insertion
    setTimeout(() => this.setupControls(), 100);

    return controlsDiv;
  }

  setupControls() {
    if (this.isDestroyed) return;

    this.updateKeypad();

    const saveBtn = document.getElementById("saveBtn");
    const clearBtn = document.getElementById("clearBtn");
    const cameraBtn = document.getElementById("cameraBtn"); // NEU

    if (saveBtn) {
      this.eventRegistry.register(saveBtn, "click", () => this.saveEntry());
    }

    if (clearBtn) {
      this.eventRegistry.register(clearBtn, "click", () => this.clear());
    }

    // NEU: Kamera Button Event Listener
    if (cameraBtn) {
      this.eventRegistry.register(cameraBtn, "click", () =>
        this.documentTarget()
      );
    }
  }

  // =================================================================
  // SHOTS MANAGEMENT
  // =================================================================

  addShot(value) {
    try {
      if (!this.selectedDiscipline) {
        UIUtils.showError("Bitte wählen Sie zuerst eine Disziplin aus.");
        return;
      }

      const validatedValue = InputValidator.validateShotValue(
        value,
        this.selectedDiscipline
      );
      const competitionType = getCompetitionType(this.selectedDiscipline);
      const maxShots =
        competitionType === CompetitionType.ANNEX_SCHEIBE ? 40 : 20;

      // Find first empty slot
      for (let i = 0; i < maxShots; i++) {
        if (this.shots[i] === null) {
          this.shots[i] = validatedValue;
          this.updateShotsDisplay();
          return;
        }
      }

      // If all slots are filled, overwrite the last one
      if (maxShots > 0) {
        this.shots[maxShots - 1] = validatedValue;
        this.updateShotsDisplay();
      }
    } catch (error) {
      console.error("Invalid shot value:", error);
      UIUtils.showError(error.message);
    }
  }

  removeLastShot() {
    try {
      if (!this.selectedDiscipline) {
        return;
      }

      const competitionType = getCompetitionType(this.selectedDiscipline);
      const maxShots =
        competitionType === CompetitionType.ANNEX_SCHEIBE ? 40 : 20;

      // Find last filled slot and remove it
      for (let i = maxShots - 1; i >= 0; i--) {
        if (this.shots[i] !== null) {
          this.shots[i] = null;
          this.updateShotsDisplay();
          return;
        }
      }
    } catch (error) {
      console.error("Error removing shot:", error);
      UIUtils.showError("Fehler beim Entfernen des Schusses");
    }
  }

  clear() {
    this.shots = new Array(40).fill(null);
    this.updateShotsDisplay();
  }

  // =================================================================
  // KEYPAD CREATION
  // =================================================================

  updateKeypad() {
    const keypadContainer = document.getElementById("keypadContainer");
    if (!keypadContainer) return;

    keypadContainer.innerHTML = "";

    if (!this.selectedDiscipline) {
      const placeholder = document.createElement("div");
      placeholder.style.cssText =
        "text-align: center; color: #666; padding: 20px;";
      placeholder.textContent = "Wählen Sie eine Disziplin aus";
      keypadContainer.appendChild(placeholder);
      return;
    }

    const competitionType = getCompetitionType(this.selectedDiscipline);

    if (competitionType === CompetitionType.ANNEX_SCHEIBE) {
      this.createAnnexKeypad(keypadContainer);
    } else {
      this.createStandardKeypad(keypadContainer);
    }
  }

  createStandardKeypad(container) {
    const keypad = document.createElement("div");
    keypad.className = "keypad";
    keypad.style.cssText =
      "display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; max-width: 200px; margin-bottom: 20px;";

    const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 0];

    numbers.forEach((num) => {
      const btn = document.createElement("button");
      btn.className = "btn btn-secondary";
      btn.style.cssText =
        "aspect-ratio: 1; font-size: 16px; font-weight: 500; padding: 12px; height: 60px;";
      btn.textContent = num.toString();

      this.eventRegistry.register(btn, "click", () => this.addShot(num));
      keypad.appendChild(btn);
    });

    // Delete button
    const deleteBtn = document.createElement("button");
    deleteBtn.className = "btn btn-secondary";
    deleteBtn.style.cssText =
      "aspect-ratio: 1; font-size: 16px; font-weight: 500; padding: 12px; height: 60px;";
    deleteBtn.textContent = "⌫";

    this.eventRegistry.register(deleteBtn, "click", () =>
      this.removeLastShot()
    );
    keypad.appendChild(deleteBtn);

    container.appendChild(keypad);
  }

  createAnnexKeypad(container) {
    const keypad = document.createElement("div");
    keypad.className = "keypad";
    keypad.style.cssText =
      "display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; max-width: 100px; margin-bottom: 20px;";

    [0, 1, 2, 3].forEach((num) => {
      const btn = document.createElement("button");
      btn.className = "btn btn-secondary";
      btn.style.cssText =
        "aspect-ratio: 1; font-size: 16px; font-weight: 500; padding: 12px; min-height: 50px;";
      btn.textContent = num.toString();

      this.eventRegistry.register(btn, "click", () => this.addShot(num));
      keypad.appendChild(btn);
    });

    // Delete button
    const deleteBtn = document.createElement("button");
    deleteBtn.className = "btn btn-secondary";
    deleteBtn.style.cssText =
      "grid-column: 1 / -1; aspect-ratio: 2/1; font-size: 16px; font-weight: 500; padding: 12px; min-height: 50px;";
    deleteBtn.textContent = "⌫";

    this.eventRegistry.register(deleteBtn, "click", () =>
      this.removeLastShot()
    );
    keypad.appendChild(deleteBtn);

    container.appendChild(keypad);
  }

  // =================================================================
  // SHOTS DISPLAY UPDATE
  // =================================================================

  updateShotsDisplay() {
    if (!this.selectedDiscipline) {
      // Keine Disziplin gewählt - zeige leeren Zustand
      const title = document.getElementById("shotsTitle");
      if (title) {
        title.textContent = "Schuss-Erfassung";
      }

      const grid = document.getElementById("shotsGrid");
      if (grid) {
        grid.innerHTML =
          '<div style="text-align: center; color: #666; padding: 20px;">Bitte wählen Sie eine Disziplin aus.</div>';
      }

      const stats = document.getElementById("shotsStats");
      if (stats) {
        stats.innerHTML = "";
      }

      const summary = document.getElementById("seriesSummary");
      if (summary) {
        summary.innerHTML = "";
      }

      this.updateKeypad();
      return;
    }

    const competitionType = getCompetitionType(this.selectedDiscipline);

    // Update title
    const title = document.getElementById("shotsTitle");
    if (title) {
      const shooterInfo = this.getSelectedShooterInfo();
      const shooterText = shooterInfo ? ` - ${shooterInfo}` : "";
      title.textContent =
        competitionType === CompetitionType.ANNEX_SCHEIBE
          ? //? `Serien (8 × 5 Schuss)${shooterText}`
            //: `Serie (20 Schuss)${shooterText}`;
            `Serien (8 × 5 Schuss)`
          : `Serie (20 Schuss)`;
    }

    this.updateShotsGrid();
    this.updateShotsStats();
    this.updateSeriesSummary();
    this.updateKeypad();
  }

  updateShotsGrid() {
    const grid = document.getElementById("shotsGrid");
    if (!grid) return;

    const competitionType = getCompetitionType(this.selectedDiscipline);
    grid.innerHTML = "";

    if (competitionType === CompetitionType.ANNEX_SCHEIBE) {
      this.createAnnexGrid(grid);
    } else {
      this.createStandardGrid(grid);
    }
  }

  createStandardGrid(container) {
    const grid = document.createElement("div");
    grid.style.cssText =
      "display: grid; grid-template-columns: repeat(5, 1fr); gap: 4px; max-width: 250px; margin: 0 auto;";

    for (let i = 0; i < 20; i++) {
      const cell = document.createElement("div");
      cell.style.cssText = `
        aspect-ratio: 1;
        border: 1px solid #d1d1d6;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 10px;
        font-weight: 500;
        min-height: 20px;
      `;
      cell.textContent =
        this.shots[i] !== null ? this.shots[i].toString() : "—";
      grid.appendChild(cell);
    }

    container.appendChild(grid);
  }

  createAnnexGrid(container) {
    const gridWrapper = document.createElement("div");
    gridWrapper.style.cssText = "overflow-x: auto;";

    // Header
    const header = document.createElement("div");
    header.style.cssText =
      "display: grid; grid-template-columns: 40px repeat(8, 30px); gap: 4px; margin-bottom: 8px; font-size: 12px; color: #666;";

    // Series/Round header
    const seriesHeader = document.createElement("div");
    seriesHeader.textContent = "Serie";
    seriesHeader.style.cssText =
      "display: flex; align-items: center; justify-content: center; font-weight: 500;";
    header.appendChild(seriesHeader);

    // Shot number headers
    for (let i = 1; i <= 8; i++) {
      const shotHeader = document.createElement("div");
      shotHeader.textContent = i.toString();
      shotHeader.style.cssText =
        "display: flex; align-items: center; justify-content: center; font-weight: 500;";
      header.appendChild(shotHeader);
    }

    gridWrapper.appendChild(header);

    // Grid rows
    for (let series = 0; series < 5; series++) {
      const rowDiv = document.createElement("div");
      rowDiv.style.cssText =
        "display: grid; grid-template-columns: 40px repeat(8, 30px); gap: 4px; margin-bottom: 4px;";

      // Series number
      const seriesLabel = document.createElement("div");
      seriesLabel.textContent = `S${series + 1}`;
      seriesLabel.style.cssText =
        "display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 500;";
      rowDiv.appendChild(seriesLabel);

      // Shot cells
      for (let shot = 0; shot < 8; shot++) {
        const cell = document.createElement("div");
        cell.style.cssText = `
          aspect-ratio: 1;
          border: 1px solid #d1d1d6;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          font-weight: 500;
        `;
        cell.textContent =
          this.shots[series * 8 + shot] !== null
            ? this.shots[series * 8 + shot].toString()
            : "—";
        rowDiv.appendChild(cell);
      }

      gridWrapper.appendChild(rowDiv);
    }

    container.appendChild(gridWrapper);
  }

  updateShotsStats() {
    const stats = document.getElementById("shotsStats");
    if (!stats) return;

    if (!this.selectedDiscipline) {
      stats.innerHTML = "";
      return;
    }

    const competitionType = getCompetitionType(this.selectedDiscipline);
    const shotCount =
      competitionType === CompetitionType.ANNEX_SCHEIBE ? 40 : 20;
    const filledShots = this.shots
      .slice(0, shotCount)
      .filter((s) => s !== null);
    const total = filledShots.reduce((sum, shot) => sum + shot, 0);

    const label =
      competitionType === CompetitionType.ANNEX_SCHEIBE ? "Gesamt" : "Ringe";

    // Clear and create new content
    stats.innerHTML = "";

    const shotCountSpan = document.createElement("span");
    shotCountSpan.textContent = `Schüsse: ${filledShots.length}/${shotCount}`;

    const totalSpan = document.createElement("span");
    totalSpan.textContent = `${label}: ${total}`;

    stats.appendChild(shotCountSpan);
    stats.appendChild(totalSpan);
  }

  updateSeriesSummary() {
    const summary = document.getElementById("seriesSummary");
    if (!summary) return;

    if (!this.selectedDiscipline) {
      summary.innerHTML = "";
      return;
    }

    const competitionType = getCompetitionType(this.selectedDiscipline);
    if (competitionType !== CompetitionType.ANNEX_SCHEIBE) {
      summary.innerHTML = "";
      return;
    }

    // Calculate series sums
    const seriesSums = [];
    for (let i = 0; i < 5; i++) {
      const startIndex = i * 8;
      const endIndex = startIndex + 8;
      const seriesSum = this.shots
        .slice(startIndex, endIndex)
        .filter((s) => s !== null)
        .reduce((sum, shot) => sum + shot, 0);
      seriesSums.push(seriesSum);
    }

    // Create summary display
    summary.innerHTML = "";

    const summaryCard = document.createElement("div");
    summaryCard.style.cssText =
      "background: #f8f9fa; border-radius: 8px; padding: 12px;";

    const summaryTitle = document.createElement("div");
    summaryTitle.style.cssText =
      "font-weight: 600; margin-bottom: 8px; text-align: center;";
    summaryTitle.textContent = "Serien-Ergebnisse";
    summaryCard.appendChild(summaryTitle);

    const summaryGrid = document.createElement("div");
    summaryGrid.style.cssText =
      "display: flex; justify-content: space-around; margin-bottom: 8px;";

    seriesSums.forEach((sum, i) => {
      const seriesDiv = document.createElement("div");
      seriesDiv.style.cssText = "text-align: center;";

      const seriesLabel = document.createElement("div");
      seriesLabel.style.cssText = "font-size: 12px; color: #666;";
      seriesLabel.textContent = `S${i + 1}`;

      const seriesValue = document.createElement("div");
      seriesValue.style.cssText = "font-weight: 600;";
      seriesValue.textContent = sum.toString();

      seriesDiv.appendChild(seriesLabel);
      seriesDiv.appendChild(seriesValue);
      summaryGrid.appendChild(seriesDiv);
    });

    summaryCard.appendChild(summaryGrid);
    summary.appendChild(summaryCard);
  }

  // =================================================================
  // HILFSMETHODEN
  // =================================================================

  getSelectedShooterInfo() {
    if (!this.selectedShooterId) return null;

    let shooter = null;
    let teamName = null;

    if (this.selectedTeamId) {
      const team = storage.teams.find((t) => t.id === this.selectedTeamId);
      if (team) {
        shooter = team.shooters.find((s) => s.id === this.selectedShooterId);
        teamName = team.name;
        return `${shooter?.name} (${teamName})`;
      }
    } else {
      shooter = storage.standaloneShooters.find(
        (s) => s.id === this.selectedShooterId
      );
      return shooter?.name || null;
    }

    return null;
  }

  canSaveEntry() {
    return (
      this.selectedShooterId &&
      this.selectedDiscipline &&
      this.shots.some((shot) => shot !== null)
    );
  }

  // =================================================================
  // SAVE FUNCTIONALITY
  // =================================================================

  saveEntry() {
    try {
      if (!this.selectedShooterId) {
        UIUtils.showError("Bitte wählen Sie einen Schützen aus.");
        return;
      }

      if (!this.selectedDiscipline) {
        UIUtils.showError("Bitte wählen Sie eine Disziplin aus.");
        return;
      }

      if (!this.shots.some((shot) => shot !== null)) {
        UIUtils.showError("Bitte erfassen Sie mindestens einen Schuss.");
        return;
      }

      const entry = new ResultEntry(
        this.selectedTeamId,
        this.selectedShooterId,
        this.selectedDiscipline,
        [...this.shots]
      );

      storage.saveResult(entry);

      const shooterInfo = this.getSelectedShooterInfo();
      const total = entry.total();

      UIUtils.showSuccessMessage(
        `Ergebnis gespeichert für ${shooterInfo}: ${total} Ringe`
      );

      console.log("Entry saved successfully:", entry);
    } catch (error) {
      console.error("Error saving entry:", error);
      UIUtils.showError(`Fehler beim Speichern: ${error.message}`);
    }
  }

  // =================================================================
  // NEU: SCHEIBENDOKUMENTATION
  // =================================================================

  async documentTarget() {
    try {
      // Validierung
      if (!this.selectedShooterId) {
        UIUtils.showError("Bitte wählen Sie zuerst einen Schützen aus.");
        return;
      }

      // Schützen-Informationen ermitteln
      const shooterInfo = this.getShooterInfo();
      if (!shooterInfo) {
        UIUtils.showError("Schützeninformationen nicht verfügbar.");
        return;
      }

      // Kamera-Modal anzeigen
      this.showCameraModal(shooterInfo);
    } catch (error) {
      console.error("Error starting target documentation:", error);
      UIUtils.showError("Fehler beim Starten der Kamera: " + error.message);
    }
  }

  getShooterInfo() {
    try {
      let shooter = null;
      let teamName = null;
      let displayName = "";

      // Schützen finden
      if (this.selectedTeamId) {
        const team = storage.teams.find((t) => t.id === this.selectedTeamId);
        if (team) {
          shooter = team.shooters.find((s) => s.id === this.selectedShooterId);
          teamName = team.name;
          // Mannschaftsschütze: Name - Verein
          displayName = shooter ? `${shooter.name} - ${teamName}` : "";
        }
      } else {
        shooter = storage.standaloneShooters.find(
          (s) => s.id === this.selectedShooterId
        );
        // Einzelschütze: nur Name
        displayName = shooter ? shooter.name : "";
      }

      if (!shooter) return null;

      return {
        name: displayName,
        shooterName: shooter.name,
        team: teamName,
        isTeamShooter: !!teamName,
        discipline: this.selectedDiscipline,
        currentDiscipline: storage.selectedDiscipline || "Keine ausgewählt", // Aus Settings
        date: new Date().toLocaleDateString("de-DE"),
        competitionType: storage.selectedCompetitionType || "Rundenkampf",
      };
    } catch (error) {
      console.error("Error getting shooter info:", error);
      return null;
    }
  }

  showCameraModal(shooterInfo) {
    // Modal Container
    const modalContent = document.createElement("div");
    modalContent.style.cssText = "width: 100%; max-width: 500px;";

    // Kamera-Bereich
    const cameraContainer = document.createElement("div");
    cameraContainer.style.cssText = "position: relative; margin-bottom: 16px;";

    // Video Element für Kamera-Preview
    const video = document.createElement("video");
    video.style.cssText =
      "width: 100%; height: 300px; background: #000; border-radius: 8px; object-fit: cover; aspect-ratio: 1/1;";
    video.autoplay = true;
    video.muted = true;
    video.playsInline = true;
    cameraContainer.appendChild(video);

    // Canvas für Foto (versteckt)
    const canvas = document.createElement("canvas");
    canvas.style.display = "none";
    cameraContainer.appendChild(canvas);

    // === ERWEITERTE POSITIONSHILFEN-OVERLAY ===
    // === ÜBERARBEITETE POSITIONSHILFEN-OVERLAY ===
const guidesOverlay = document.createElement("div");
guidesOverlay.className = "guides-overlay";
guidesOverlay.style.cssText = `
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  border: 2px dashed rgba(0, 255, 0, 0.8);
  border-radius: 8px;
  display: block;
`;

// Mittlere Kreuzlinien (horizontal und vertikal durch die Mitte)
const centerLineV = document.createElement("div");
centerLineV.style.cssText = `
  position: absolute;
  top: 10%;
  left: 50%;
  transform: translateX(-50%);
  width: 2px;
  height: 80%;
  background: linear-gradient(to bottom, transparent, rgba(0, 255, 0, 0.8) 20%, rgba(0, 255, 0, 0.8) 80%, transparent);
`;
guidesOverlay.appendChild(centerLineV);

const centerLineH = document.createElement("div");
centerLineH.style.cssText = `
  position: absolute;
  top: 50%;
  left: 10%;
  transform: translateY(-50%);
  width: 80%;
  height: 2px;
  background: linear-gradient(to right, transparent, rgba(0, 255, 0, 0.8) 20%, rgba(0, 255, 0, 0.8) 80%, transparent);
`;
guidesOverlay.appendChild(centerLineH);

// Drittel-Linien (Rule of thirds) - kompakter und grün
const thirdLineV1 = document.createElement("div");
thirdLineV1.style.cssText = `
  position: absolute;
  top: 20%;
  left: 33.33%;
  transform: translateX(-50%);
  width: 1px;
  height: 60%;
  background-color: rgba(0, 200, 0, 0.4);
`;
guidesOverlay.appendChild(thirdLineV1);

const thirdLineV2 = document.createElement("div");
thirdLineV2.style.cssText = `
  position: absolute;
  top: 20%;
  left: 66.67%;
  transform: translateX(-50%);
  width: 1px;
  height: 60%;
  background-color: rgba(0, 200, 0, 0.4);
`;
guidesOverlay.appendChild(thirdLineV2);

const thirdLineH1 = document.createElement("div");
thirdLineH1.style.cssText = `
  position: absolute;
  top: 33.33%;
  left: 20%;
  transform: translateY(-50%);
  width: 60%;
  height: 1px;
  background-color: rgba(0, 200, 0, 0.4);
`;
guidesOverlay.appendChild(thirdLineH1);

const thirdLineH2 = document.createElement("div");
thirdLineH2.style.cssText = `
  position: absolute;
  top: 66.67%;
  left: 20%;
  transform: translateY(-50%);
  width: 60%;
  height: 1px;
  background-color: rgba(0, 200, 0, 0.4);
`;
guidesOverlay.appendChild(thirdLineH2);

// Verbessertes mittleres Fadenkreuz - grün
const crosshair = document.createElement("div");
crosshair.style.cssText = `
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 50px;
  height: 50px;
  border: 2px solid rgba(0, 255, 0, 0.9);
  border-radius: 50%;
  box-shadow: 0 0 10px rgba(0, 255, 0, 0.3);
`;

const crosshairV = document.createElement("div");
crosshairV.style.cssText = `
  position: absolute;
  top: -15px;
  left: 50%;
  transform: translateX(-50%);
  width: 2px;
  height: 80px;
  background: linear-gradient(to bottom, transparent, rgba(0, 255, 0, 1) 30%, rgba(0, 255, 0, 1) 70%, transparent);
`;

const crosshairH = document.createElement("div");
crosshairH.style.cssText = `
  position: absolute;
  top: 50%;
  left: -15px;
  transform: translateY(-50%);
  width: 80px;
  height: 2px;
  background: linear-gradient(to right, transparent, rgba(0, 255, 0, 1) 30%, rgba(0, 255, 0, 1) 70%, transparent);
`;

crosshair.appendChild(crosshairV);
crosshair.appendChild(crosshairH);
guidesOverlay.appendChild(crosshair);

// Zusätzlicher Zielkreis für Scheibenzentrierung
const targetCircle = document.createElement("div");
targetCircle.style.cssText = `
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 120px;
  height: 120px;
  border: 1px solid rgba(0, 200, 0, 0.6);
  border-radius: 50%;
  border-style: dashed;
`;
guidesOverlay.appendChild(targetCircle);

cameraContainer.appendChild(guidesOverlay);

    // Info-Bereich (Text "Disziplin" durch "Scheibe" ersetzt)
    const infoDiv = document.createElement("div");
    infoDiv.style.cssText =
      "margin-bottom: 16px; padding: 12px; background: #f8f9fa; border-radius: 8px;";
    infoDiv.innerHTML = `
    <div style="font-weight: 600; margin-bottom: 4px;">${shooterInfo.name}</div>
    <div style="font-size: 14px; color: #666;">
      Disziplin: ${shooterInfo.currentDiscipline}<br>
      Scheibe: ${shooterInfo.discipline}<br>
      Datum: ${shooterInfo.date}
    </div>
  `;

    modalContent.appendChild(infoDiv);
    modalContent.appendChild(cameraContainer);

    const modal = new ModalComponent("Scheibe dokumentieren", modalContent);

    modal.addAction(
      "Abbrechen",
      () => {
        this.stopCamera();
      },
      false,
      false
    );

    modal.addAction(
      "📸 Foto aufnehmen",
      () => {
        this.takePhoto(video, canvas, shooterInfo);
      },
      true,
      false
    );

    modal.show();

    // Kamera starten
    this.startCamera(video);
  }

  async startCamera(video) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { exact: "environment" }, // Rückkamera bevorzugen
          width: { ideal: 1080 }, // ← Geändert: quadratisch 1080x1080
          height: { ideal: 1080 }, // ← Geändert: quadratisch 1080x1080
          aspectRatio: 1.0, // ← Neu: explizit 1:1 Verhältnis
        },
      });

      video.srcObject = stream;
      this.cameraStream = stream;
      this.isCapturing = true;

      console.log("Camera started successfully");
    } catch (error) {
      console.error("Error starting camera:", error);
      UIUtils.showError(
        "Kamera konnte nicht gestartet werden: " + error.message
      );
    }
  }

  stopCamera() {
    if (this.cameraStream) {
      this.cameraStream.getTracks().forEach((track) => track.stop());
      this.cameraStream = null;
      this.isCapturing = false;
      console.log("Camera stopped");
    }
  }

  takePhoto(video, canvas, shooterInfo) {
    try {
      // Canvas-Größe an Video anpassen
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0);

      // Overlay mit Informationen hinzufügen
      this.addOverlayToCanvas(ctx, canvas.width, canvas.height, shooterInfo);

      // Download
      this.downloadPhoto(canvas, shooterInfo);

      // Kamera stoppen
      this.stopCamera();

      UIUtils.showSuccessMessage("Foto wurde gespeichert!");
    } catch (error) {
      console.error("Error taking photo:", error);
      UIUtils.showError("Fehler beim Aufnehmen des Fotos: " + error.message);
    }
  }

  addOverlayToCanvas(ctx, width, height, shooterInfo) {
    const competitionType = getCompetitionType(this.selectedDiscipline);

    // Angepasste Box-Größen und Abstände
    const isAnnex = competitionType === CompetitionType.ANNEX_SCHEIBE;
    const boxWidth = Math.min(width * 0.8, isAnnex ? 500 : 350);
    const boxHeight = isAnnex ? 320 : 260; // Beide vergrößert
    const x = 20;
    const y = 20;

    // Box zeichnen
    ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
    ctx.fillRect(x, y, boxWidth, boxHeight);

    // Rahmen
    ctx.strokeStyle = "black";
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, boxWidth, boxHeight);

    // Text-Stil für Header-Infos
    ctx.fillStyle = "black";
    ctx.font = "bold 14px Arial";
    ctx.textAlign = "left";

    // Header-Informationen
    const info = [
      `Name: ${shooterInfo.name}`,
      `Disziplin: ${shooterInfo.currentDiscipline}`,
      `Scheibe: ${shooterInfo.discipline}`,
      `Datum: ${shooterInfo.date}`,
    ];

    info.forEach((line, index) => {
      ctx.fillText(line, x + 10, y + 20 + index * 18);
    });

    // Schuss-Matrix zeichnen - angepasste Start-Positionen
    const matrixStartY = isAnnex ? y + 110 : y + 100; // Mehr Abstand für Annex, etwas mehr für Standard

    if (isAnnex) {
      this.drawAnnexMatrix(ctx, x + 10, matrixStartY, boxWidth - 20);
    } else {
      this.drawStandardMatrix(ctx, x + 10, matrixStartY, boxWidth - 20);
    }
  }

  drawStandardMatrix(ctx, startX, startY, maxWidth) {
    const cellSize = Math.min(25, (maxWidth - 40) / 5);
    const gap = 3;

    ctx.font = "bold 12px Arial";
    ctx.textAlign = "center";
    ctx.fillStyle = "black";

    // 4 Reihen × 5 Spalten = 20 Schüsse
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 5; col++) {
        const shotIndex = row * 5 + col;
        const cellX = startX + col * (cellSize + gap);
        const cellY = startY + row * (cellSize + gap);

        // Zelle zeichnen
        ctx.strokeStyle = "#666";
        ctx.lineWidth = 1;
        ctx.strokeRect(cellX, cellY, cellSize, cellSize);

        // Schuss-Wert
        const shotValue = this.shots[shotIndex];
        if (shotValue !== null) {
          ctx.fillStyle = "black";
          ctx.fillText(
            shotValue.toString(),
            cellX + cellSize / 2,
            cellY + cellSize / 2 + 4
          );
        } else {
          ctx.fillStyle = "#ccc";
          ctx.fillText("—", cellX + cellSize / 2, cellY + cellSize / 2 + 4);
        }
      }
    }

    // Gesamtpunkte unter der Matrix - mehr Abstand
    const filledShots = this.shots.slice(0, 20).filter((s) => s !== null);
    const total = filledShots.reduce((sum, shot) => sum + shot, 0);

    ctx.font = "bold 14px Arial";
    ctx.fillStyle = "black";
    ctx.textAlign = "left";
    ctx.fillText(
      `Schüsse: ${filledShots.length}/20  |  Ringe: ${total}`,
      startX,
      startY + 4 * (cellSize + gap) + 25 // Erhöht von 20 auf 25
    );
  }

  drawAnnexMatrix(ctx, startX, startY, maxWidth) {
    const cellSize = Math.min(20, (maxWidth - 60) / 9);
    const gap = 2;

    ctx.font = "10px Arial";
    ctx.textAlign = "center";
    ctx.fillStyle = "black";

    // Header: Serie | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 - mehr Abstand nach oben
    const headerY = startY - 20; // Erhöht von -15 auf -20
    ctx.font = "bold 10px Arial";
    ctx.fillText("Serie", startX + 20, headerY);
    for (let i = 1; i <= 8; i++) {
      ctx.fillText(i.toString(), startX + 40 + i * (cellSize + gap), headerY);
    }

    // 5 Serien × 8 Schüsse = 40 Schüsse
    ctx.font = "10px Arial";
    const seriesSums = [];

    for (let series = 0; series < 5; series++) {
      const rowY = startY + series * (cellSize + gap);

      // Serie-Label (S1, S2, etc.)
      ctx.font = "bold 10px Arial";
      ctx.fillText(`S${series + 1}`, startX + 20, rowY + cellSize / 2 + 3);

      ctx.font = "10px Arial";
      let seriesSum = 0;

      for (let shot = 0; shot < 8; shot++) {
        const shotIndex = series * 8 + shot;
        const cellX = startX + 40 + (shot + 1) * (cellSize + gap);

        // Zelle zeichnen
        ctx.strokeStyle = "#666";
        ctx.lineWidth = 1;
        ctx.strokeRect(cellX, rowY, cellSize, cellSize);

        // Schuss-Wert
        const shotValue = this.shots[shotIndex];
        if (shotValue !== null) {
          ctx.fillStyle = "black";
          ctx.fillText(
            shotValue.toString(),
            cellX + cellSize / 2,
            rowY + cellSize / 2 + 3
          );
          seriesSum += shotValue;
        } else {
          ctx.fillStyle = "#ccc";
          ctx.fillText("—", cellX + cellSize / 2, rowY + cellSize / 2 + 3);
        }
      }

      seriesSums.push(seriesSum);
    }

    // Serien-Ergebnisse und Gesamtpunkte
    const filledShots = this.shots.slice(0, 40).filter((s) => s !== null);
    const total = filledShots.reduce((sum, shot) => sum + shot, 0);

    const summaryY = startY + 5 * (cellSize + gap) + 15;

    ctx.font = "bold 12px Arial";
    ctx.fillStyle = "black";
    ctx.textAlign = "left";

    // Serien-Summen
    const seriesText = seriesSums
      .map((sum, i) => `S${i + 1}:${sum}`)
      .join("  ");
    ctx.fillText(seriesText, startX, summaryY);

    // Gesamtergebnis
    ctx.fillText(
      `Schüsse: ${filledShots.length}/40  |  Gesamt: ${total}`,
      startX,
      summaryY + 18
    );
  }

  downloadPhoto(canvas, shooterInfo) {
    try {
      // Normalisierungsfunktion lokal definieren
      const normalizeFileName = (text) => {
        return text
          .replace(/ä/g, "ae")
          .replace(/ö/g, "oe")
          .replace(/ü/g, "ue")
          .replace(/Ä/g, "Ae")
          .replace(/Ö/g, "Oe")
          .replace(/Ü/g, "Ue")
          .replace(/ß/g, "ss")
          .replace(/[^a-zA-Z0-9]/g, "_");
      };

      // Dateiname erstellen im Format: <Datum>-<Name>-<Scheibe>
      const date = new Date().toLocaleDateString("de-DE").replace(/\./g, "-"); // DD-MM-YYYY
      const time = new Date().toLocaleTimeString("de-DE").replace(/:/g, "-"); // HH-MM-SS

      // Name normalisieren (bereits mit Verein kombiniert falls Mannschaftsschütze)
      const normalizedName = normalizeFileName(shooterInfo.name);

      // Scheibe/Disziplin normalisieren
      const normalizedDiscipline = normalizeFileName(shooterInfo.discipline);

      const fileName = `${date}_${time}-${normalizedName}-${normalizedDiscipline}.jpg`;

      // Canvas zu Blob konvertieren
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            throw new Error("Fehler beim Erstellen des Bildes");
          }

          // Download-Link erstellen
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = fileName;
          link.style.display = "none";

          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          // URL freigeben
          setTimeout(() => URL.revokeObjectURL(url), 1000);
        },
        "image/jpeg",
        0.95
      );
    } catch (error) {
      console.error("Error downloading photo:", error);
      UIUtils.showError("Fehler beim Speichern des Fotos: " + error.message);
    }
  }

  // =================================================================
  // ERROR HANDLING
  // =================================================================

  showError(container, message) {
    const errorCard = document.createElement("div");
    errorCard.className = "card";

    const errorText = document.createElement("p");
    errorText.style.color = "red";
    errorText.textContent = UIUtils.sanitizeText(message);

    errorCard.appendChild(errorText);
    container.appendChild(errorCard);
  }

  // =================================================================
  // ERWEITERTE CLEANUP-METHODE
  // =================================================================

  destroy() {
    this.isDestroyed = true;
    this.stopCamera();
    this.eventRegistry.cleanupAll();
    this.selectedTeamId = null;
    this.selectedShooterId = null;
    this.selectedDiscipline = null;
    this.shots = new Array(40).fill(null);
  }
}
