// =================================================================
// ENTRY VIEW - Verbesserte Version mit korrekter Zuordnung und Kamera
// =================================================================

class EntryView {
  constructor() {
    this.selectedTeamId = null;
    this.selectedShooterId = null;
    this.selectedDiscipline = null; // Änderung: Keine Default-Auswahl
    this.shots = new Array(40).fill(null);
    this.currentShotIndex = -1; // NEU: Verfolgt die aktuelle Eingabeposition
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
    // Inline style für nebeneinander Layout
    row.style.cssText = "display: flex; align-items: center; gap: 12px; margin-bottom: 12px;";

    const label = document.createElement("label");
    label.className = "form-label";
    label.textContent = labelText;
    // Label mit fester Breite für einheitliches Aussehen
    label.style.cssText = "min-width: 100px; flex-shrink: 0; font-weight: 500;";

    // Container für das Eingabefeld um es flexibel zu machen
    inputElement.style.cssText = "flex: 1; min-width: 0;";

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
      this.currentShotIndex = 0;
      return;
    }

    const existingResult = storage.results.find(
      (r) =>
        r.shooterId === this.selectedShooterId &&
        r.discipline === this.selectedDiscipline &&
        r.teamId === this.selectedTeamId
    );

    if (existingResult) {
      this.shots = [...existingResult.shots];

      // NEU: Setze currentShotIndex auf die Position nach dem letzten Eintrag
      this.currentShotIndex = -1;
      const maxShots = getCompetitionType(this.selectedDiscipline) === CompetitionType.ANNEX_SCHEIBE ? 40 : 20;

      // Finde letzten Eintrag
      for (let i = maxShots - 1; i >= 0; i--) {
        if (this.shots[i] !== null) {
          this.currentShotIndex = i + 1;
          break;
        }
      }

      // Falls alle Positionen leer sind, starte bei 0
      if (this.currentShotIndex === -1) {
        this.currentShotIndex = 0;
      }

      console.log("Loaded existing results, next position:", this.currentShotIndex);
    } else {
      this.shots = new Array(40).fill(null);
      this.currentShotIndex = 0;
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
    cameraBtn.textContent = "📷 Spiegel";
    buttonsContainer.appendChild(cameraBtn);

    // NEU: Button für Foto-Bearbeitung
    const photoEditBtn = document.createElement("button");
    photoEditBtn.id = "photoEditBtn";
    photoEditBtn.className = "btn btn-secondary";
    photoEditBtn.style.cssText =
      "height: 50px; background-color: #ff9500; color: white;";
    photoEditBtn.textContent = "📂 Spiegel";
    buttonsContainer.appendChild(photoEditBtn);

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

    // NEU: Photo Edit Button Event Listener
    const photoEditBtn = document.getElementById("photoEditBtn");
    if (photoEditBtn) {
      this.eventRegistry.register(photoEditBtn, "click", () =>
        this.processExistingPhoto()
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

      // Verwende currentShotIndex falls gesetzt, sonst finde ersten freien Platz
      let targetIndex = this.currentShotIndex || -1;

      if (targetIndex === -1 || targetIndex >= maxShots || this.shots[targetIndex] !== null) {
        // Finde ersten freien Platz
        for (let i = 0; i < maxShots; i++) {
          if (this.shots[i] === null) {
            targetIndex = i;
            break;
          }
        }
      }

      if (targetIndex !== -1 && targetIndex < maxShots) {
        this.shots[targetIndex] = validatedValue;

        // Setze nächsten Index
        this.currentShotIndex = targetIndex + 1;
        if (this.currentShotIndex >= maxShots) {
          this.currentShotIndex = -1; // Alle Plätze belegt
        }

        this.updateShotsDisplay();
      } else {
        UIUtils.showError("Alle Positionen sind bereits belegt.");
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

      // Finde letzten gefüllten Slot
      let lastFilledIndex = -1;
      for (let i = maxShots - 1; i >= 0; i--) {
        if (this.shots[i] !== null) {
          lastFilledIndex = i;
          break;
        }
      }

      if (lastFilledIndex !== -1) {
        // Lösche den letzten Schuss
        this.shots[lastFilledIndex] = null;

        // Setze Position für nächste Eingabe
        this.currentShotIndex = lastFilledIndex;

        // Zeige Erfolg
        if (competitionType === CompetitionType.ANNEX_SCHEIBE) {
          const series = Math.floor(lastFilledIndex / 8) + 1;
          const position = (lastFilledIndex % 8) + 1;
          UIUtils.showSuccessMessage(`Schuss aus Serie ${series}, Position ${position} gelöscht`);
        } else {
          UIUtils.showSuccessMessage(`Schuss ${lastFilledIndex + 1} gelöscht`);
        }

        this.updateShotsDisplay();
      } else {
        // Keine Schüsse vorhanden
        this.currentShotIndex = 0;
        UIUtils.showSuccessMessage("Keine Schüsse zum Löschen vorhanden");
      }

    } catch (error) {
      console.error("Error removing shot:", error);
      UIUtils.showError("Fehler beim Entfernen des Schusses");
    }
  }

  clear() {
    this.shots = new Array(40).fill(null);
    this.currentShotIndex = -1; // NEU: Position zurücksetzen
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

  // In entry-view.js - createAnnexKeypad Methode erweitern:

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
      "aspect-ratio: 1; font-size: 16px; font-weight: 500; gap: 8px; padding: 12px; height: 50px;";
    deleteBtn.textContent = "⌫";

    this.eventRegistry.register(deleteBtn, "click", () =>
      this.removeLastShot()
    );
    keypad.appendChild(deleteBtn);

    // UMBENANNT: Carriage Return Button
    const carriageReturnBtn = document.createElement("button");
    carriageReturnBtn.className = "btn btn-secondary";
    carriageReturnBtn.style.cssText =
      "aspect-ratio: 1; font-size: 16px; font-weight: 500; gap: 8px; padding: 12px; height: 50px;";
    carriageReturnBtn.textContent = "⏎";

    this.eventRegistry.register(carriageReturnBtn, "click", () =>
      this.jumpToNextSeries()
    );
    keypad.appendChild(carriageReturnBtn);


    container.appendChild(keypad);
  }

  // NEU: Methode zum Springen zur nächsten Serie
  // In entry-view.js - jumpToNextSeries Methode überarbeiten:

  jumpToNextSeries() {
    try {
      // Finde die letzte Serie mit Daten (nicht nur letzten Schuss)
      let lastSeriesWithData = -1;

      // Durchsuche alle 5 Serien und finde die letzte mit Daten
      for (let series = 0; series < 5; series++) {
        const seriesStart = series * 8;
        const seriesEnd = seriesStart + 8;
        const seriesHasData = this.shots.slice(seriesStart, seriesEnd).some(shot => shot !== null);

        if (seriesHasData) {
          lastSeriesWithData = series;
        }
      }

      console.log(`Last series with data: ${lastSeriesWithData}`);

      // Bestimme die Ziel-Serie
      let targetSeries;

      if (lastSeriesWithData === -1) {
        // Keine Daten vorhanden - starte bei Serie 0 (S1)
        targetSeries = 0;
      } else {
        // Springe zur nächsten Serie nach der letzten mit Daten
        targetSeries = lastSeriesWithData + 1;
      }

      // Zyklisches Springen - nach S5 wieder zu S1
      if (targetSeries >= 5) {
        targetSeries = 0;
      }

      // Setze Position auf den Anfang der Ziel-Serie
      const targetIndex = targetSeries * 8; // Erstes Feld der Serie

      console.log(`Jumping to series ${targetSeries} (${targetSeries + 1}), index: ${targetIndex}`);

      // Setze currentShotIndex für die nächste Eingabe
      this.currentShotIndex = targetIndex;

      // Aktualisiere die Anzeige
      this.updateShotsDisplay();

      // Hervorhebung NACH dem Update der Anzeige
      setTimeout(() => {
        this.highlightNextShotPosition(targetIndex);
      }, 150);

      // Korrekte Anzeige der Position
      UIUtils.showSuccessMessage(`Springe zu Serie ${targetSeries + 1} - Position 1`);

    } catch (error) {
      console.error("Error jumping to next series:", error);
      UIUtils.showError("Fehler beim Springen zur nächsten Serie");
    }
  }

  highlightNextShotPosition(index) {
    console.log(`=== HIGHLIGHT DEBUG START ===`);
    console.log(`Input index: ${index}`);

    // Entferne vorherige Hervorhebungen
    const previousHighlights = document.querySelectorAll('[style*="border: 2px solid #007bff"]');
    previousHighlights.forEach(el => {
      el.style.border = "1px solid #d1d1d6";
      el.style.backgroundColor = "";
      el.style.transform = "";
    });

    // Berechne Serie und Schuss KORREKT
    const series = Math.floor(index / 8);        // Serie 0-4
    const shotInSeries = (index % 8);            // Position 0-7
    const displaySeries = series + 1;            // Serie 1-5 für Anzeige
    const displayPosition = shotInSeries + 1;    // Position 1-8 für Anzeige

    console.log(`Calculated: series=${series}, shotInSeries=${shotInSeries}`);
    console.log(`Display: Serie ${displaySeries}, Position ${displayPosition}`);

    // Warte bis DOM vollständig aktualisiert ist
    setTimeout(() => {
      const grid = document.getElementById("shotsGrid");
      if (!grid) {
        console.log("Grid not found");
        return;
      }

      const gridWrapper = grid.querySelector('div[style*="overflow-x: auto"]');
      if (!gridWrapper) {
        console.log("GridWrapper not found");
        return;
      }

      // KORRIGIERT: Alle Kinder des gridWrapper durchgehen
      const allChildren = Array.from(gridWrapper.children);
      console.log(`GridWrapper has ${allChildren.length} children`);

      // WICHTIG: Durchsuche ALLE Kinder und finde die Serie-Rows
      // Header ist das erste Kind, dann kommen die Serie-Rows
      let seriesRows = [];

      allChildren.forEach((child, index) => {
        if (index === 0) {
          console.log(`Child ${index}: Header`);
          return; // Überspringt Header
        }

        // Prüfe ob es eine Serie-Row ist (hat CSS Grid Layout mit 40px + repeat)
        const style = child.style.cssText || '';
        if (style.includes('grid-template-columns') &&
          style.includes('40px') &&
          style.includes('30px')) {
          seriesRows.push(child);
          console.log(`Child ${index}: Series Row ${seriesRows.length - 1} (DOM children: ${child.children.length})`);
        }
      });

      console.log(`Found ${seriesRows.length} series rows`);

      // Jetzt haben wir die korrekten Serie-Rows
      if (series < seriesRows.length) {
        const targetRow = seriesRows[series];
        const cells = targetRow.children;

        console.log(`Target row (series ${series}) has ${cells.length} cells`);

        // +1 wegen Serie-Label am Anfang jeder Row
        const targetCellIndex = shotInSeries + 1;

        if (targetCellIndex < cells.length) {
          const targetCell = cells[targetCellIndex];

          // Hervorhebung anwenden
          targetCell.style.border = "2px solid #007bff";
          targetCell.style.backgroundColor = "#e7f3ff";
          targetCell.style.transform = "scale(1.1)";
          targetCell.style.transition = "all 0.3s ease";

          console.log(`SUCCESS: Highlighted Serie ${displaySeries}, Position ${displayPosition}`);
          console.log(`DOM: seriesRows[${series}].children[${targetCellIndex}]`);

          // Entferne Hervorhebung nach 3 Sekunden
          setTimeout(() => {
            targetCell.style.border = "1px solid #d1d1d6";
            targetCell.style.backgroundColor = "";
            targetCell.style.transform = "";
          }, 3000);
        } else {
          console.log(`ERROR: targetCellIndex ${targetCellIndex} >= cells.length ${cells.length}`);
        }
      } else {
        console.log(`ERROR: series ${series} >= seriesRows.length ${seriesRows.length}`);
      }

      console.log(`=== HIGHLIGHT DEBUG END ===`);
    }, 200);
  }

  jumpToNextSeries() {
    try {
      // Finde die aktuelle Position (letzter gefüllter Schuss)
      let currentIndex = -1;
      for (let i = 39; i >= 0; i--) { // Rückwärts suchen für letzten Eintrag
        if (this.shots[i] !== null) {
          currentIndex = i;
          break;
        }
      }

      console.log(`Current last shot index: ${currentIndex}`);

      // Bestimme aktuelle Serie
      let currentSeries = currentIndex === -1 ? -1 : Math.floor(currentIndex / 8);

      // Bestimme die Ziel-Serie (nächste Serie)
      let targetSeries = currentSeries + 1;

      // Falls noch keine Daten vorhanden sind, starte bei Serie 0
      if (currentSeries === -1) {
        targetSeries = 0;
      }

      // NEU: Zyklisches Springen - nach S5 wieder zu S1
      if (targetSeries >= 5) {
        targetSeries = 0; // Springe zurück zu Serie 1
      }

      // NEU: Setze Position IMMER auf den Anfang der Ziel-Serie (nicht erstes leeres!)
      const targetIndex = targetSeries * 8; // Erstes Feld der Serie

      console.log(`Jumping from series ${currentSeries} to series ${targetSeries}`);
      console.log(`Target index: ${targetIndex} (should be Serie ${targetSeries + 1}, Position 1)`);

      // Setze currentShotIndex für die nächste Eingabe
      this.currentShotIndex = targetIndex;

      // Aktualisiere die Anzeige
      this.updateShotsDisplay();

      // Hervorhebung NACH dem Update der Anzeige
      setTimeout(() => {
        this.highlightNextShotPosition(targetIndex);
      }, 150);

      // Korrekte Anzeige der Position
      UIUtils.showSuccessMessage(`Springe zu Serie ${targetSeries + 1} - Position 1`);

    } catch (error) {
      console.error("Error jumping to next series:", error);
      UIUtils.showError("Fehler beim Springen zur nächsten Serie");
    }
  }

  // Zusätzlich: Bessere Initialisierung beim Laden von existierenden Ergebnissen
  loadExistingResults() {
    if (!this.selectedShooterId || !this.selectedDiscipline) {
      this.shots = new Array(40).fill(null);
      this.currentShotIndex = 0; // NEU: Setze auf Anfang
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

      // NEU: Setze currentShotIndex auf nächste freie Position
      this.currentShotIndex = -1;
      const maxShots = getCompetitionType(this.selectedDiscipline) === CompetitionType.ANNEX_SCHEIBE ? 40 : 20;
      for (let i = 0; i < maxShots; i++) {
        if (this.shots[i] === null) {
          this.currentShotIndex = i;
          break;
        }
      }

      console.log("Loaded existing results for shooter:", this.selectedShooterId);
    } else {
      // Keine Ergebnisse vorhanden - leeres Array
      this.shots = new Array(40).fill(null);
      this.currentShotIndex = 0; // NEU: Starte am Anfang
      console.log("No existing results found - starting fresh");
    }
  }


  // Verbesserte addShot Methode:
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
      const maxShots = competitionType === CompetitionType.ANNEX_SCHEIBE ? 40 : 20;

      let targetIndex = -1;

      // Falls currentShotIndex gesetzt ist, verwende ihn (auch wenn Position belegt ist!)
      if (this.currentShotIndex !== -1 && this.currentShotIndex < maxShots) {
        targetIndex = this.currentShotIndex;
      } else {
        // Sonst finde den nächsten freien Platz
        for (let i = 0; i < maxShots; i++) {
          if (this.shots[i] === null) {
            targetIndex = i;
            break;
          }
        }
      }

      if (targetIndex !== -1 && targetIndex < maxShots) {
        // NEU: Überschreibe auch belegte Positionen wenn currentShotIndex gesetzt
        this.shots[targetIndex] = validatedValue;

        // Setze nächsten Index für fortlaufende Eingabe
        this.currentShotIndex = targetIndex + 1;
        if (this.currentShotIndex >= maxShots) {
          this.currentShotIndex = -1; // Alle Positionen durchlaufen
        }

        this.updateShotsDisplay();

        // Zeige aktuelle Position an
        if (competitionType === CompetitionType.ANNEX_SCHEIBE) {
          const series = Math.floor(targetIndex / 8) + 1;
          const position = (targetIndex % 8) + 1;
          console.log(`Eingabe in Serie ${series}, Position ${position}`);
        }
      } else {
        UIUtils.showError("Alle Positionen sind bereits belegt.");
      }
    } catch (error) {
      console.error("Invalid shot value:", error);
      UIUtils.showError(error.message);
    }
  }

  // Erweiterte clear Methode:
  clear() {
    this.shots = new Array(40).fill(null);
    this.currentShotIndex = 0; // NEU: Starte bei Position 0
    this.updateShotsDisplay();
  }

  // Beim Wechseln der Disziplin auch Position zurücksetzen:
  // In der handleDisciplineChange Methode hinzufügen:
  handleDisciplineChange() {
    const select = document.getElementById("disciplineSelect");
    if (!select) return;

    this.selectedDiscipline = select.value || null;
    this.currentShotIndex = 0; // NEU: Position zurücksetzen
    this.updateShotsDisplay();
  }

  // NEU: Methode zum Hervorheben der nächsten Position
  highlightNextShotPosition(index) {
    // Entferne vorherige Hervorhebungen
    const previousHighlights = document.querySelectorAll('.next-shot-highlight');
    previousHighlights.forEach(el => el.classList.remove('next-shot-highlight'));

    // Berechne Serie und Schuss
    const series = Math.floor(index / 8);
    const shotInSeries = index % 8;

    // Finde das entsprechende Grid-Element und hebe es hervor
    setTimeout(() => {
      const grid = document.getElementById("shotsGrid");
      if (grid) {
        const rows = grid.querySelectorAll('[style*="grid-template-columns: 40px repeat(8, 30px)"]');
        if (rows[series]) {
          const cells = rows[series].children;
          // +1 weil das erste Element das Serie-Label ist
          if (cells[shotInSeries + 1]) {
            cells[shotInSeries + 1].style.border = "2px solid #007bff";
            cells[shotInSeries + 1].style.backgroundColor = "#e7f3ff";

            // Entferne Hervorhebung nach 3 Sekunden
            setTimeout(() => {
              cells[shotInSeries + 1].style.border = "1px solid #d1d1d6";
              cells[shotInSeries + 1].style.backgroundColor = "";
            }, 3000);
          }
        }
      }
    }, 100);
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
    gridWrapper.setAttribute("data-grid-type", "annex"); // Debug-Attribut

    // Header
    const header = document.createElement("div");
    header.className = "annex-header";
    header.setAttribute("data-row-type", "header"); // Debug-Attribut
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

    // Data rows
    for (let series = 0; series < 5; series++) {
      const row = document.createElement("div");
      row.className = `annex-series-row`;
      row.setAttribute("data-series", series.toString()); // Eindeutiges Attribut!
      row.setAttribute("data-row-type", "data"); // Debug-Attribut
      row.style.cssText =
        "display: grid; grid-template-columns: 40px repeat(8, 30px); gap: 4px; margin-bottom: 4px;";

      // Series label
      const seriesLabel = document.createElement("div");
      seriesLabel.textContent = `S${series + 1}`;
      seriesLabel.className = "series-label";
      seriesLabel.style.cssText =
        "display: flex; align-items: center; justify-content: center; font-weight: 500; font-size: 11px; color: #666;";
      row.appendChild(seriesLabel);

      // Shot cells
      for (let shot = 0; shot < 8; shot++) {
        const shotIndex = series * 8 + shot;
        const cell = document.createElement("div");
        cell.className = `shot-cell`;
        cell.setAttribute("data-series", series.toString());
        cell.setAttribute("data-shot", shot.toString());
        cell.setAttribute("data-index", shotIndex.toString()); // Eindeutiger Index!
        cell.style.cssText = `
        aspect-ratio: 1;
        border: 1px solid #d1d1d6;
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 9px;
        font-weight: 500;
        min-height: 20px;
      `;
        cell.textContent =
          this.shots[shotIndex] !== null ? this.shots[shotIndex].toString() : "—";
        row.appendChild(cell);
      }

      gridWrapper.appendChild(row);
    }

    container.appendChild(gridWrapper);
  }

  // In entry-view.js - updateShotsStats erweitern:
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

    // Ändere das Layout zu vertikal für mehrere Zeilen
    stats.style.cssText = "margin-top: 12px; font-size: 14px; color: #666;";

    // Erste Zeile: Schüsse und Ringe (horizontal)
    const firstLineDiv = document.createElement("div");
    firstLineDiv.style.cssText = "display: flex; justify-content: space-between; margin-bottom: 4px;";

    const shotCountSpan = document.createElement("span");
    shotCountSpan.textContent = `Schüsse: ${filledShots.length}/${shotCount}`;

    const totalSpan = document.createElement("span");
    totalSpan.textContent = `${label}: ${total}`;

    firstLineDiv.appendChild(shotCountSpan);
    firstLineDiv.appendChild(totalSpan);
    stats.appendChild(firstLineDiv);

    // Zweite Zeile: Schuss-Gruppierung (nur für Präzision/Duell)
    if (competitionType !== CompetitionType.ANNEX_SCHEIBE && filledShots.length > 0) {
      const shotDistribution = this.calculateShotDistribution(filledShots);
      if (shotDistribution) {
        const distributionDiv = document.createElement("div");
        distributionDiv.style.cssText = "font-size: 12px; color: #666; text-align: center; margin-top: 4px;";
        distributionDiv.textContent = shotDistribution;
        stats.appendChild(distributionDiv);
      }
    }
  }

  // NEU: Methode zur Berechnung der Schuss-Verteilung
  calculateShotDistribution(shots) {
    if (!shots || shots.length === 0) return "";

    // Zähle jede Ringzahl
    const counts = {};
    shots.forEach(shot => {
      counts[shot] = (counts[shot] || 0) + 1;
    });

    // Sortiere nach Ringzahl (absteigend) und erstelle Text
    const distribution = Object.entries(counts)
      .map(([rings, count]) => {
        if (rings === '0') {
          return `${count}×-`;
        }
        return `${count}×${rings}`;
      })
      .sort((a, b) => {
        // Sortiere nach Ringzahl (extrahiere Zahl aus "2×10" Format)
        const getRingValue = (str) => {
          if (str.includes('×-')) return 0;
          return parseInt(str.split('×')[1]) || 0;
        };
        return getRingValue(b) - getRingValue(a);
      })
      .join('  ');

    return distribution;
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

      /*if (!this.shots.some((shot) => shot !== null)) {
        UIUtils.showError("Bitte erfassen Sie mindestens einen Schuss.");
        return;
      }*/

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

    // Video Container mit erweiterten Guides
    const videoContainer = document.createElement("div");
    videoContainer.id = "cameraContainer";
    videoContainer.style.cssText = `
    position: relative;
    width: 100%;
    height: 300px;
    background: #000;
    border-radius: 8px;
    overflow: hidden;
    margin-bottom: 16px;
  `;

    const video = document.createElement("video");
    video.id = "cameraVideo";
    video.style.cssText = "width: 100%; height: 100%; object-fit: cover;";
    video.autoplay = true;
    video.playsInline = true;
    videoContainer.appendChild(video);

    // Erweiterte Kamera-Guides hinzufügen
    this.createCameraGuides(videoContainer);

    // Guide-Optionen
    const guidesOptions = document.createElement("div");
    guidesOptions.style.cssText = "margin-bottom: 16px; display: flex; gap: 12px; font-size: 14px;";
    guidesOptions.innerHTML = `
    <label style="display: flex; align-items: center; gap: 4px;">
      <input type="checkbox" id="toggleGrid" ${this.showGrid ? 'checked' : ''}>
      <span>Gitter anzeigen</span>
    </label>
    <label style="display: flex; align-items: center; gap: 4px;">
      <input type="checkbox" id="toggleLevel" checked>
      <span>Wasserwage</span>
    </label>
  `;

    modalContent.appendChild(infoDiv);
    modalContent.appendChild(videoContainer);
    modalContent.appendChild(guidesOptions);

    const modal = new ModalComponent("📸 Scheibe dokumentieren", modalContent);

    modal.addAction("Abbrechen", () => {
      this.stopCamera();
    }, false, false);

    modal.addAction("Foto aufnehmen", () => {
      this.capturePhoto(shooterInfo);
    }, true, false);

    modal.onCloseHandler(() => {
      this.stopCamera();
    });

    modal.show();

    // Event Listeners für Optionen
    setTimeout(() => {
      const gridToggle = document.getElementById("toggleGrid");
      const levelToggle = document.getElementById("toggleLevel");

      if (gridToggle) {
        gridToggle.addEventListener('change', (e) => {
          this.showGrid = e.target.checked;
          // Aktualisiere Guides
          const container = document.getElementById("cameraContainer");
          const overlay = container.querySelector('div[style*="z-index: 10"]');
          if (overlay) {
            overlay.remove();
            this.createCameraGuides(container);
          }
        });
      }

      if (levelToggle) {
        levelToggle.addEventListener('change', (e) => {
          const levelIndicator = document.getElementById("levelIndicator");
          if (levelIndicator) {
            levelIndicator.style.display = e.target.checked ? 'flex' : 'none';
          }
        });
      }

      this.startCamera();
    }, 100);
  }

  async startCamera() {
    try {
      console.log("Starting camera...");

      const video = document.getElementById("cameraVideo");
      if (!video) {
        throw new Error("Video element not found");
      }

      // Stoppe eventuell laufende Streams
      if (this.stream) {
        this.stream.getTracks().forEach(track => track.stop());
      }

      // Kamera-Constraints mit Fallback-Optionen
      const constraints = {
        video: {
          facingMode: { ideal: "environment" }, // Rückkamera bevorzugen
          width: { ideal: 1920, min: 640 },
          height: { ideal: 1920, min: 480 },
          aspectRatio: { ideal: 1.0 } // Quadratisch bevorzugen
        },
        audio: false
      };

      console.log("Requesting camera access...");
      this.stream = await navigator.mediaDevices.getUserMedia(constraints);

      video.srcObject = this.stream;

      // Warte bis Video ready ist
      await new Promise((resolve, reject) => {
        video.onloadedmetadata = () => {
          console.log("Video metadata loaded, starting playback...");
          video.play()
            .then(resolve)
            .catch(reject);
        };

        video.onerror = (error) => {
          console.error("Video error:", error);
          reject(new Error("Video playback failed"));
        };

        // Timeout nach 10 Sekunden
        setTimeout(() => {
          reject(new Error("Camera startup timeout"));
        }, 10000);
      });

      console.log("Camera started successfully");
      this.isCapturing = true;

      // Update Status
      const status = document.getElementById("levelStatus");
      if (status && !status.textContent.includes("nicht verfügbar")) {
        status.textContent = "Kamera bereit - Gerät ausrichten";
      }

    } catch (error) {
      console.error("Error starting camera:", error);
      this.handleCameraError(error);
    }
  }

  async capturePhoto(shooterInfo) {
    try {
      const video = document.getElementById("cameraVideo");
      if (!video || !this.stream) {
        throw new Error("Kamera nicht bereit");
      }

      console.log("Capturing photo...");

      // Canvas für das Foto erstellen
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      // Canvas-Größe an Video anpassen
      canvas.width = video.videoWidth || video.clientWidth;
      canvas.height = video.videoHeight || video.clientHeight;

      console.log(`Photo dimensions: ${canvas.width}x${canvas.height}`);

      // Video-Frame auf Canvas zeichnen
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Overlay hinzufügen - verwende aktuelle Schuss-Daten falls vorhanden
      const competitionType = getCompetitionType(this.selectedDiscipline);
      let shotsToUse = null;

      // Nur Schüsse verwenden wenn welche eingegeben wurden
      const hasShots = this.shots && this.shots.some((shot) => shot !== null);
      if (hasShots) {
        shotsToUse = [...this.shots]; // Kopie der aktuellen Schüsse
      }

      this.addOverlayToCanvas(ctx, canvas.width, canvas.height, shooterInfo, shotsToUse);

      // Foto herunterladen
      await this.downloadPhoto(canvas, shooterInfo);

      // Kamera stoppen und Modal schließen
      this.stopCamera();

      // Success-Feedback
      UIUtils.showSuccessMessage("📸 Foto wurde gespeichert!");

      // Kurzes haptisches Feedback
      if (navigator.vibrate) {
        navigator.vibrate(100);
      }

      console.log("Photo captured successfully");

    } catch (error) {
      console.error("Error capturing photo:", error);
      UIUtils.showError("Fehler beim Aufnehmen des Fotos: " + error.message);
    }
  }

  addShotsMatrix(ctx, startX, startY, boxWidth, scale, competitionType) {
    try {
      const matrixTitle = "SCHUSS-ERGEBNISSE";

      ctx.fillStyle = "rgba(0, 100, 0, 0.1)";
      ctx.fillRect(startX, startY, boxWidth, 80 * scale);

      ctx.fillStyle = "black";
      ctx.font = `bold ${14 * scale}px Arial`;
      ctx.textAlign = "center";
      ctx.fillText(matrixTitle, startX + boxWidth / 2, startY + 20 * scale);

      if (competitionType === CompetitionType.ANNEX_SCHEIBE) {
        this.drawAnnexMatrix(ctx, startX, startY + 30 * scale, boxWidth, scale);
      } else {
        this.drawStandardMatrix(ctx, startX, startY + 30 * scale, boxWidth, scale);
      }

    } catch (error) {
      console.error("Error adding shots matrix:", error);
    }
  }


  stopCamera() {
    console.log("Stopping camera...");

    // Stream stoppen
    if (this.stream) {
      this.stream.getTracks().forEach(track => {
        track.stop();
        console.log(`Stopped ${track.kind} track`);
      });
      this.stream = null;
    }

    // Video Element leeren
    const video = document.getElementById("cameraVideo");
    if (video) {
      video.srcObject = null;
    }

    // Orientierungs-Listener stoppen
    if (this.orientationHandler) {
      window.removeEventListener('deviceorientation', this.orientationHandler);
      this.orientationHandler = null;
    }

    // Status zurücksetzen
    this.isCapturing = false;
    this.wasLevel = false;

    console.log("Camera stopped successfully");
  }

  // =================================================================
  // FALLBACK FÜR NICHT-HTTPS UMGEBUNGEN
  // =================================================================

  checkCameraSupport() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      return {
        supported: false,
        reason: "Browser unterstützt keine Kamera-API"
      };
    }

    if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
      return {
        supported: false,
        reason: "Kamera benötigt HTTPS-Verbindung"
      };
    }

    return { supported: true };
  }

  async processCamera() {
    try {
      // Validierung
      if (!this.selectedShooterId) {
        UIUtils.showError("Bitte wählen Sie zuerst einen Schützen aus.");
        return;
      }

      // Kamera-Unterstützung prüfen
      const cameraCheck = this.checkCameraSupport();
      if (!cameraCheck.supported) {
        UIUtils.showError(`Kamera nicht verfügbar: ${cameraCheck.reason}`);
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
      console.error("Error starting camera process:", error);
      UIUtils.showError("Fehler beim Starten der Kamera: " + error.message);
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

  addOverlayToCanvas(ctx, width, height, shooterInfo, customShots = null) {
    const competitionType = getCompetitionType(this.selectedDiscipline);

    // Angepasste Box-Größen - KOMPAKTER für Annex
    const isAnnex = competitionType === CompetitionType.ANNEX_SCHEIBE;
    const boxWidth = Math.min(width * 0.9, isAnnex ? 420 : 370);
    const boxHeight = isAnnex ? 270 : 270;
    const x = 20;
    const y = 20;

    // Box zeichnen
    ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
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

    // Schuss-Matrix zeichnen
    const matrixStartY = y + 100;

    if (isAnnex) {
      this.drawAnnexMatrix(ctx, x + 10, matrixStartY, boxWidth - 20, customShots);
    } else {
      // STANDARD MATRIX
      this.drawStandardMatrix(ctx, x + 10, matrixStartY, boxWidth - 20, customShots);
    }
  }

  drawStandardMatrix(ctx, startX, startY, maxWidth, customShots = null) {
    const cellSize = Math.min(25, (maxWidth - 40) / 5);
    const gap = 3;

    // Verwende entweder die übergebenen Schuss-Daten oder die aktuellen
    const shotsToUse = customShots || this.shots;

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
        const shotValue = shotsToUse[shotIndex];
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

    // Gesamtpunkte unter der Matrix
    const filledShots = shotsToUse.slice(0, 20).filter((s) => s !== null);
    const total = filledShots.reduce((sum, shot) => sum + shot, 0);

    ctx.font = "bold 14px Arial";
    ctx.fillStyle = "black";
    ctx.textAlign = "left";

    // Erste Zeile: Schüsse und Ringe
    ctx.fillText(
      `Schüsse: ${filledShots.length}/20  |  Ringe: ${total}`,
      startX,
      startY + 4 * (cellSize + gap) + 25
    );

    // Zweite Zeile: Schuss-Gruppierung (nur wenn Schüsse vorhanden sind)
    if (filledShots.length > 0) {
      const shotDistribution = this.calculateShotDistribution(filledShots);
      if (shotDistribution) {
        ctx.font = "12px Arial"; // Etwas kleiner für die Gruppierung
        ctx.fillStyle = "#666"; // Etwas heller
        ctx.fillText(
          shotDistribution,
          startX,
          startY + 4 * (cellSize + gap) + 45 // 20 Pixel unter der ersten Zeile
        );
      }
    }
  }

  // NEU: Methode zur Berechnung der Schuss-Verteilung in mehreren Zeilen
  calculateShotDistribution(shots) {
    if (!shots || shots.length === 0) return null;

    // Zähle jede Ringzahl
    const counts = {};
    shots.forEach(shot => {
      counts[shot] = (counts[shot] || 0) + 1;
    });

    // Sortiere nach Ringzahl (absteigend) und erstelle Text
    const distribution = Object.entries(counts)
      .map(([rings, count]) => {
        if (rings === '0') {
          return `${count}×-`;
        }
        return `${count}×${rings}`;
      })
      .sort((a, b) => {
        // Sortiere nach Ringzahl (extrahiere Zahl aus "2×10" Format)
        const getRingValue = (str) => {
          if (str.includes('×-')) return 0;
          return parseInt(str.split('×')[1]) || 0;
        };
        return getRingValue(b) - getRingValue(a);
      })
      .join(' ');

    return distribution;
  }

  drawAnnexMatrix(ctx, startX, startY, maxWidth, customShots = null) {
    const cellSize = Math.min(20, (maxWidth - 60) / 9);
    const gap = 2;

    // Verwende entweder die übergebenen Schuss-Daten oder die aktuellen
    const shotsToUse = customShots || this.shots;

    ctx.font = "10px Arial";
    ctx.textAlign = "center";
    ctx.fillStyle = "black";

    // Header: Serie | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8
    const headerY = startY - 5;
    ctx.font = "bold 10px Arial";
    ctx.fillText("Serie", startX + 20, headerY);
    for (let i = 1; i <= 8; i++) {
      ctx.fillText(i.toString(), startX + 48 + i * (cellSize + gap), headerY);
    }

    // 5 Serien × 8 Schüsse = 40 Schüsse
    ctx.font = "10px Arial";
    const seriesSums = [];

    for (let series = 0; series < 5; series++) {
      const rowY = startY + series * (cellSize + gap);

      // Serie-Label (S1, S2, etc.)
      ctx.font = "bold 10px Arial";
      ctx.fillStyle = "black"; // EXPLIZIT SCHWARZ
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
        const shotValue = shotsToUse[shotIndex];
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
    const filledShots = shotsToUse.slice(0, 40).filter((s) => s !== null);
    const total = filledShots.reduce((sum, shot) => sum + shot, 0);

    const summaryY = startY + 5 * (cellSize + gap) + 25;

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

  async downloadPhoto(canvas, shooterInfo) {
    try {
      const now = new Date();
      const timestamp = now.toISOString().replace(/[:.]/g, "-").slice(0, 19);
      const shooterName = shooterInfo.name.replace(/[^\w]/g, "_");
      const disciplineName = shooterInfo.discipline.replace(/[^\w]/g, "_");

      const fileName = `Scheibe_${timestamp}_${shooterName}_${disciplineName}.jpg`;

      // Canvas zu Blob konvertieren
      const blob = await new Promise(resolve => {
        canvas.toBlob(resolve, 'image/jpeg', 0.9);
      });

      // Download starten
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      link.style.display = "none";

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setTimeout(() => URL.revokeObjectURL(url), 1000);

      console.log(`Photo saved as: ${fileName}`);

    } catch (error) {
      console.error("Error downloading photo:", error);
      throw error;
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

  handleCameraError(error) {
    let userMessage = "Kamera konnte nicht gestartet werden";
    let suggestions = [];

    console.error("Camera error details:", error);

    if (error.name === "NotAllowedError" || error.message.includes("Permission")) {
      userMessage = "Kamera-Berechtigung verweigert";
      suggestions = [
        "Erlauben Sie der App den Kamerazugriff",
        "Überprüfen Sie die Browser-Einstellungen",
        "Laden Sie die Seite neu und versuchen Sie es erneut"
      ];
    } else if (error.name === "NotFoundError" || error.message.includes("not found")) {
      userMessage = "Keine Kamera gefunden";
      suggestions = [
        "Stellen Sie sicher, dass eine Kamera angeschlossen ist",
        "Schließen Sie andere Apps, die die Kamera verwenden",
        "Versuchen Sie es mit einem anderen Gerät"
      ];
    } else if (error.name === "NotReadableError") {
      userMessage = "Kamera ist nicht verfügbar";
      suggestions = [
        "Die Kamera wird möglicherweise von einer anderen App verwendet",
        "Starten Sie das Gerät neu",
        "Überprüfen Sie die Kamera-Hardware"
      ];
    } else if (error.message.includes("timeout")) {
      userMessage = "Kamera-Start dauerte zu lange";
      suggestions = [
        "Versuchen Sie es erneut",
        "Überprüfen Sie Ihre Internetverbindung",
        "Laden Sie die Seite neu"
      ];
    }

    // Detaillierte Fehlermeldung im Modal anzeigen
    this.showCameraErrorModal(userMessage, suggestions, error);
  }

  showCameraErrorModal(userMessage, suggestions, originalError) {
    const errorContent = document.createElement("div");
    errorContent.innerHTML = `
    <div style="text-align: center; padding: 20px;">
      <div style="font-size: 48px; margin-bottom: 16px;">📷❌</div>
      <h3 style="color: #ff3b30; margin-bottom: 16px;">${userMessage}</h3>
      
      ${suggestions.length > 0 ? `
        <div style="text-align: left; margin: 20px 0;">
          <h4 style="margin-bottom: 8px;">Lösungsvorschläge:</h4>
          <ul style="margin-left: 20px;">
            ${suggestions.map(s => `<li style="margin: 4px 0;">${s}</li>`).join('')}
          </ul>
        </div>
      ` : ''}
      
      <div style="margin-top: 20px; padding: 12px; background: #f8f9fa; border-radius: 8px; font-size: 12px; color: #666;">
        <strong>Technische Details:</strong><br>
        ${originalError.name || 'Unknown'}: ${originalError.message}
      </div>
    </div>
  `;

    const modal = new ModalComponent("Kamera-Fehler", errorContent);

    modal.addAction("Erneut versuchen", () => {
      // Versuche Kamera erneut zu starten
      setTimeout(() => {
        const shooterInfo = this.getShooterInfo();
        if (shooterInfo) {
          this.showCameraModal(shooterInfo);
        }
      }, 500);
    }, true, false);

    modal.addAction("Abbrechen", () => {
      // Nichts tun, Modal schließt sich
    }, false, false);

    modal.show();
  }

  // =================================================================
  // NEU: EXISTIERENDE FOTO-BEARBEITUNG
  // =================================================================

  async processExistingPhoto() {
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

      // Foto-Bearbeitungs-Modal anzeigen
      this.showPhotoEditModal(shooterInfo);
    } catch (error) {
      console.error("Error starting photo editing:", error);
      UIUtils.showError("Fehler beim Starten der Foto-Bearbeitung: " + error.message);
    }
  }

  showPhotoEditModal(shooterInfo) {
    // Modal Container
    const modalContent = document.createElement("div");
    modalContent.style.cssText = "width: 100%; max-width: 500px;";

    // Info-Bereich (gleich wie bei Kamera)
    const infoDiv = document.createElement("div");
    infoDiv.style.cssText =
      "margin-bottom: 16px; padding: 12px; background: #f8f9fa; border-radius: 8px;";
    infoDiv.innerHTML = `
    <div style="font-weight: 600; margin-bottom: 4px;">${shooterInfo.name}</div>
    <div style="font-size: 14px; color: #666;">
      Disziplin: ${shooterInfo.currentDiscipline}<br>
      Scheibe: ${shooterInfo.discipline}<br>
      Datum: <span id="selectedDate">${shooterInfo.date}</span>
    </div>
  `;

    // Datums-Auswahl
    const dateDiv = document.createElement("div");
    dateDiv.style.cssText = "margin-bottom: 16px;";

    const dateLabel = document.createElement("label");
    dateLabel.textContent = "Datum für Overlay:";
    dateLabel.style.cssText = "display: block; font-weight: 600; margin-bottom: 8px;";

    const dateInput = document.createElement("input");
    dateInput.type = "date";
    dateInput.id = "overlayDate";
    dateInput.style.cssText = "width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;";

    // Aktuelles Datum als Standard
    const today = new Date();
    dateInput.value = today.toISOString().split('T')[0];

    // Event-Listener für Datums-Änderung
    dateInput.addEventListener('change', () => {
      const selectedDate = new Date(dateInput.value);
      const formattedDate = selectedDate.toLocaleDateString("de-DE");
      document.getElementById("selectedDate").textContent = formattedDate;
    });

    dateDiv.appendChild(dateLabel);
    dateDiv.appendChild(dateInput);

    // Foto-Auswahl
    const fileDiv = document.createElement("div");
    fileDiv.style.cssText = "margin-bottom: 16px;";

    const fileLabel = document.createElement("label");
    fileLabel.textContent = "Foto auswählen:";
    fileLabel.style.cssText = "display: block; font-weight: 600; margin-bottom: 8px;";

    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.id = "photoFile";
    fileInput.accept = "image/*";
    fileInput.style.cssText = "width: 100%; padding: 8px;";

    fileDiv.appendChild(fileLabel);
    fileDiv.appendChild(fileInput);

    // Vorschau-Container
    const previewDiv = document.createElement("div");
    previewDiv.id = "photoPreview";
    previewDiv.style.cssText = "margin-bottom: 16px; text-align: center;";

    // File-Input Event-Listener für Vorschau
    fileInput.addEventListener('change', (e) => {
      this.showPhotoPreview(e.target.files[0], previewDiv);
    });

    modalContent.appendChild(infoDiv);
    modalContent.appendChild(dateDiv);
    modalContent.appendChild(fileDiv);
    modalContent.appendChild(previewDiv);

    const modal = new ModalComponent("Foto mit Overlay versehen", modalContent);

    modal.addAction(
      "Abbrechen",
      () => { },
      false,
      false
    );

    modal.addAction(
      "Overlay hinzufügen",
      () => {
        const file = fileInput.files[0];
        if (!file) {
          UIUtils.showError("Bitte wählen Sie ein Foto aus.");
          return;
        }

        // Aktualisiere shooterInfo mit gewähltem Datum
        const selectedDate = new Date(dateInput.value);
        const updatedShooterInfo = {
          ...shooterInfo,
          date: selectedDate.toLocaleDateString("de-DE")
        };

        this.addOverlayToPhoto(file, updatedShooterInfo);
      },
      true,
      false
    );

    modal.show();
  }

  showPhotoPreview(file, previewContainer) {
    previewContainer.innerHTML = "";

    if (!file || !file.type.startsWith('image/')) {
      return;
    }

    const img = document.createElement("img");
    img.style.cssText = "max-width: 100%; max-height: 200px; border-radius: 8px; border: 1px solid #ddd;";

    const reader = new FileReader();
    reader.onload = (e) => {
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);

    previewContainer.appendChild(img);
  }

  addOverlayToPhoto(file, shooterInfo) {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        // Canvas erstellen
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;

        const ctx = canvas.getContext("2d");

        // Originalbild zeichnen
        ctx.drawImage(img, 0, 0);

        // Overlay hinzufügen - verwende aktuelle Schuss-Daten falls vorhanden
        // Für Präzision/Duell: Nur wenn Schüsse eingegeben wurden, sonst leeres Overlay
        const competitionType = getCompetitionType(this.selectedDiscipline);
        let shotsToUse = null;

        if (competitionType !== CompetitionType.ANNEX_SCHEIBE) {
          // Bei Präzision/Duell: Verwende aktuelle Schüsse falls vorhanden
          const hasShots = this.shots.some((shot) => shot !== null);
          if (hasShots) {
            shotsToUse = [...this.shots]; // Kopie der aktuellen Schüsse
          }
        } else {
          // Bei Annex: Verwende aktuelle Schüsse falls vorhanden
          const hasShots = this.shots.some((shot) => shot !== null);
          if (hasShots) {
            shotsToUse = [...this.shots]; // Kopie der aktuellen Schüsse
          }
        }

        this.addOverlayToCanvas(ctx, canvas.width, canvas.height, shooterInfo, shotsToUse);

        // Download
        this.downloadPhoto(canvas, shooterInfo);

        UIUtils.showSuccessMessage("Foto mit Overlay wurde gespeichert!");
      };

      img.src = e.target.result;
    };

    reader.onerror = () => {
      UIUtils.showError("Fehler beim Laden des Fotos.");
    };

    reader.readAsDataURL(file);
  }


  // =================================================================
  // ERWEITERTE KAMERA-GUIDES MIT WASSERWAGE
  // =================================================================

  createCameraGuides(cameraContainer) {
    // Guides Container
    const guidesOverlay = document.createElement("div");
    guidesOverlay.style.cssText = `
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 10;
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
    const thirdLines = [
      { pos: '33.33%', direction: 'vertical' },
      { pos: '66.67%', direction: 'vertical' },
      { pos: '33.33%', direction: 'horizontal' },
      { pos: '66.67%', direction: 'horizontal' }
    ];

    thirdLines.forEach(line => {
      const element = document.createElement("div");
      if (line.direction === 'vertical') {
        element.style.cssText = `
        position: absolute;
        top: 20%;
        left: ${line.pos};
        transform: translateX(-50%);
        width: 1px;
        height: 60%;
        background-color: rgba(0, 200, 0, 0.4);
      `;
      } else {
        element.style.cssText = `
        position: absolute;
        top: ${line.pos};
        left: 20%;
        transform: translateY(-50%);
        width: 60%;
        height: 1px;
        background-color: rgba(0, 200, 0, 0.4);
      `;
      }
      guidesOverlay.appendChild(element);
    });

    // Verbessertes mittleres Fadenkreuz - grün
    const crosshair = document.createElement("div");
    crosshair.style.cssText = `
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 60px;
    height: 60px;
    border: 2px solid rgba(0, 255, 0, 0.9);
    border-radius: 50%;
    box-shadow: 0 0 15px rgba(0, 255, 0, 0.4);
  `;

    const crosshairV = document.createElement("div");
    crosshairV.style.cssText = `
    position: absolute;
    top: -20px;
    left: 50%;
    transform: translateX(-50%);
    width: 2px;
    height: 100px;
    background: linear-gradient(to bottom, transparent, rgba(0, 255, 0, 1) 25%, rgba(0, 255, 0, 1) 75%, transparent);
  `;

    const crosshairH = document.createElement("div");
    crosshairH.style.cssText = `
    position: absolute;
    top: 50%;
    left: -20px;
    transform: translateY(-50%);
    width: 100px;
    height: 2px;
    background: linear-gradient(to right, transparent, rgba(0, 255, 0, 1) 25%, rgba(0, 255, 0, 1) 75%, transparent);
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
    width: 140px;
    height: 140px;
    border: 1px solid rgba(0, 200, 0, 0.6);
    border-radius: 50%;
    border-style: dashed;
  `;
    guidesOverlay.appendChild(targetCircle);

    // NEU: WASSERWAGE
    this.createLevelIndicator(guidesOverlay);

    // NEU: ECKEN-MARKIERUNGEN für bessere Ausrichtung
    this.createCornerMarkers(guidesOverlay);

    // NEU: GITTER-OPTION (optional)
    if (this.showGrid) {
      this.createGrid(guidesOverlay);
    }

    cameraContainer.appendChild(guidesOverlay);
  }

  // =================================================================
  // NEU: WASSERWAGE-INDIKATOR
  // =================================================================

  createLevelIndicator(container) {
    // Wasserwage Container
    const levelContainer = document.createElement("div");
    levelContainer.id = "levelIndicator";
    levelContainer.style.cssText = `
    position: absolute;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    width: 200px;
    height: 40px;
    background: rgba(0, 0, 0, 0.7);
    border-radius: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 20;
  `;

    // Wasserwage Hintergrund
    const levelTrack = document.createElement("div");
    levelTrack.style.cssText = `
    width: 180px;
    height: 8px;
    background: rgba(255, 255, 255, 0.3);
    border-radius: 4px;
    position: relative;
    overflow: hidden;
  `;

    // Zentrale Markierung (Ideal-Position)
    const centerMark = document.createElement("div");
    centerMark.style.cssText = `
    position: absolute;
    top: -4px;
    left: 50%;
    transform: translateX(-50%);
    width: 3px;
    height: 16px;
    background: #00ff00;
    border-radius: 1px;
  `;

    // Wasserwage Blase (beweglicher Indikator)
    const levelBubble = document.createElement("div");
    levelBubble.id = "levelBubble";
    levelBubble.style.cssText = `
    position: absolute;
    top: -8px;
    left: 50%;
    transform: translateX(-50%);
    width: 24px;
    height: 24px;
    background: radial-gradient(circle, rgba(255, 255, 0, 0.9) 0%, rgba(255, 200, 0, 0.7) 70%, rgba(255, 150, 0, 0.5) 100%);
    border: 2px solid rgba(255, 255, 255, 0.8);
    border-radius: 50%;
    transition: all 0.1s ease-out;
    box-shadow: 0 0 10px rgba(255, 255, 0, 0.6);
  `;

    levelTrack.appendChild(centerMark);
    levelTrack.appendChild(levelBubble);
    levelContainer.appendChild(levelTrack);

    // Status Text
    const levelStatus = document.createElement("div");
    levelStatus.id = "levelStatus";
    levelStatus.style.cssText = `
    position: absolute;
    bottom: -25px;
    left: 50%;
    transform: translateX(-50%);
    color: white;
    font-size: 12px;
    font-weight: bold;
    text-align: center;
    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
  `;
    levelStatus.textContent = "Gerät ausrichten...";

    levelContainer.appendChild(levelStatus);
    container.appendChild(levelContainer);

    // Starte Orientierungserkennung
    this.startDeviceOrientation();
  }

  // =================================================================
  // NEU: GERÄTE-ORIENTIERUNG
  // =================================================================

  startDeviceOrientation() {
    // Prüfe ob DeviceOrientationEvent verfügbar ist
    if (!window.DeviceOrientationEvent) {
      console.warn("Device orientation not supported");
      const status = document.getElementById("levelStatus");
      if (status) status.textContent = "Wasserwage nicht verfügbar";
      return;
    }

    // iOS 13+ Permission Request
    if (typeof DeviceOrientationEvent.requestPermission === 'function') {
      DeviceOrientationEvent.requestPermission()
        .then(response => {
          if (response === 'granted') {
            this.setupOrientationListener();
          } else {
            console.warn("Device orientation permission denied");
            const status = document.getElementById("levelStatus");
            if (status) status.textContent = "Berechtigung erforderlich";
          }
        })
        .catch(console.error);
    } else {
      // Für andere Browser
      this.setupOrientationListener();
    }
  }

  updateLevelIndicator(event) {
    const bubble = document.getElementById("levelBubble");
    const status = document.getElementById("levelStatus");

    if (!bubble || !status) return;

    // Verwende gamma für Roll (links/rechts Neigung)
    let roll = event.gamma || 0;

    // Begrenze den Wert auf ±45 Grad für bessere Darstellung
    roll = Math.max(-45, Math.min(45, roll));

    // Berechne Position der Blase (0-180px Bereich)
    const bubblePosition = 90 + (roll * 2); // 90 ist Mitte, ±2px pro Grad
    bubble.style.left = `${bubblePosition}px`;
    bubble.style.transform = 'translateX(-50%)';

    // Farbe basierend auf Genauigkeit
    const absRoll = Math.abs(roll);
    let color, statusText, isLevel = false;

    if (absRoll <= 1) {
      color = '#00ff00'; // Grün - perfekt ausgerichtet
      statusText = '✓ Perfekt ausgerichtet';
      isLevel = true;
    } else if (absRoll <= 3) {
      color = '#90ff00'; // Hell-grün - sehr gut
      statusText = '✓ Sehr gut ausgerichtet';
      isLevel = true;
    } else if (absRoll <= 5) {
      color = '#ffff00'; // Gelb - gut
      statusText = 'Gut ausgerichtet';
    } else if (absRoll <= 10) {
      color = '#ff9000'; // Orange - mäßig
      statusText = `${roll > 0 ? 'Nach rechts' : 'Nach links'} neigen`;
    } else {
      color = '#ff3000'; // Rot - schlecht
      statusText = `${roll > 0 ? 'Stark nach links' : 'Stark nach rechts'} neigen`;
    }

    // Update Bubble Farbe
    bubble.style.background = `radial-gradient(circle, ${color}99 0%, ${color}bb 70%, ${color}77 100%)`;
    bubble.style.boxShadow = `0 0 ${isLevel ? '15' : '8'}px ${color}99`;

    // Update Status
    status.textContent = statusText;
    status.style.color = color;

    // Vibriere bei perfekter Ausrichtung (einmalig)
    if (isLevel && !this.wasLevel && navigator.vibrate) {
      navigator.vibrate(50);
    }
    this.wasLevel = isLevel;
  }

  setupOrientationListener() {
    this.orientationHandler = (event) => {
      this.updateLevelIndicator(event);
    };

    window.addEventListener('deviceorientation', this.orientationHandler);
  }

  // =================================================================
  // NEU: ECKEN-MARKIERUNGEN
  // =================================================================

  createCornerMarkers(container) {
    const corners = [
      { top: '10px', left: '10px' },
      { top: '10px', right: '10px' },
      { bottom: '10px', left: '10px' },
      { bottom: '10px', right: '10px' }
    ];

    corners.forEach(corner => {
      const marker = document.createElement("div");
      marker.style.cssText = `
      position: absolute;
      width: 20px;
      height: 20px;
      border: 2px solid rgba(0, 255, 0, 0.8);
      ${corner.top ? `top: ${corner.top};` : ''}
      ${corner.bottom ? `bottom: ${corner.bottom};` : ''}
      ${corner.left ? `left: ${corner.left};` : ''}
      ${corner.right ? `right: ${corner.right};` : ''}
      ${corner.top && corner.left ? 'border-bottom: none; border-right: none;' : ''}
      ${corner.top && corner.right ? 'border-bottom: none; border-left: none;' : ''}
      ${corner.bottom && corner.left ? 'border-top: none; border-right: none;' : ''}
      ${corner.bottom && corner.right ? 'border-top: none; border-left: none;' : ''}
    `;
      container.appendChild(marker);
    });
  }

  createGrid(container) {
    const gridSize = 6; // 6x6 Gitter

    // Horizontale Linien
    for (let i = 1; i < gridSize; i++) {
      const line = document.createElement("div");
      line.style.cssText = `
      position: absolute;
      top: ${(i / gridSize) * 100}%;
      left: 10%;
      width: 80%;
      height: 1px;
      background: rgba(0, 200, 0, 0.2);
    `;
      container.appendChild(line);
    }

    // Vertikale Linien
    for (let i = 1; i < gridSize; i++) {
      const line = document.createElement("div");
      line.style.cssText = `
      position: absolute;
      top: 10%;
      left: ${(i / gridSize) * 100}%;
      width: 1px;
      height: 80%;
      background: rgba(0, 200, 0, 0.2);
    `;
      container.appendChild(line);
    }
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
    this.showGrid = false;
    this.wasLevel = false;
  }
}
