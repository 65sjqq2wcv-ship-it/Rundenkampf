class TeamsView {
  constructor() {
    this.currentEditingTeam = null;
    this.currentEditingShooter = null;
  }

  render() {
    const container = document.createElement("div");
    container.style.cssText = "padding-bottom: 20px;"; // Zusätzlicher Container-Abstand

    try {
      // Setup navigation buttons
      this.setupNavButtons();

      // Teams List
      if (storage.teams.length > 0) {
        const teamsSection = this.createTeamsList();
        container.appendChild(teamsSection);
      }

      // Standalone Shooters List
      if (storage.standaloneShooters.length > 0) {
        const shootersSection = this.createStandaloneShootersList();
        container.appendChild(shootersSection);
      }

      // Empty state
      if (
        storage.teams.length === 0 &&
        storage.standaloneShooters.length === 0
      ) {
        const emptyState = document.createElement("div");
        emptyState.className = "card empty-state";
        emptyState.style.cssText = "margin-bottom: 30px;";
        emptyState.innerHTML = `
				<h3>Keine Teams oder Schützen</h3>
				<p style="margin: 16px 0;">Fügen Sie Ihr erstes Team oder Einzelschützen hinzu.</p>
				<div style="display: flex; gap: 12px; justify-content: center; margin-top: 20px;">
				<button class="btn btn-primary" style="width: 50%; height: 70px;" onclick="app.views.teams.addTeam()">
				Team hinzufügen
				</button>
				<button class="btn btn-secondary" style="width: 50%; height: 70px;" onclick="app.views.teams.addStandaloneShooter()">
				Einzelschütze hinzufügen
				</button>
				</div>
				`;
        container.appendChild(emptyState);
      }
    } catch (error) {
      console.error("Error rendering teams view:", error);
      container.appendChild(
        this.createErrorCard("Fehler beim Laden der Teams-Ansicht")
      );
    }

    return container;
  }

  setupNavButtons() {
    setTimeout(() => {
      const navButtons = document.getElementById("navButtons");
      if (navButtons) {
        navButtons.innerHTML = "";
        // Import Button (NEU)
        const importBtn = document.createElement("button");
        importBtn.className = "nav-btn";
        importBtn.textContent = "📥";
        importBtn.title = "CSV Import";
        importBtn.addEventListener("click", () => this.showImportModal());
        navButtons.appendChild(importBtn);

        // Einzelschütze Button
        const shooterBtn = document.createElement("button");
        shooterBtn.className = "nav-btn";
        shooterBtn.textContent = "👤";
        shooterBtn.title = "Einzelschütze hinzufügen";
        shooterBtn.addEventListener("click", () => this.addStandaloneShooter());
        navButtons.appendChild(shooterBtn);

        // Team Button
        const teamBtn = document.createElement("button");
        teamBtn.className = "nav-btn";
        teamBtn.textContent = "➕";
        teamBtn.title = "Team hinzufügen";
        teamBtn.addEventListener("click", () => this.addTeam());
        navButtons.appendChild(teamBtn);
      }
    }, 100);
  }

  createTeamsList() {
    const teamsSection = document.createElement("div");
    teamsSection.className = "list";

    const teamsHeader = document.createElement("div");
    teamsHeader.className = "list-header";
    teamsHeader.textContent = `Mannschaften (${storage.teams.length})`;
    teamsSection.appendChild(teamsHeader);

    storage.teams.forEach((team) => {
      const item = document.createElement("div");
      item.className = "list-item";

      const content = document.createElement("div");
      content.className = "list-item-content";

      const title = document.createElement("div");
      title.className = "list-item-title";
      title.textContent = team.name;
      content.appendChild(title);

      const subtitle = document.createElement("div");
      subtitle.className = "list-item-subtitle";
      if (team.shooters.length > 0) {
        const shooterNames = team.shooters.map((s) => s.name).join(", ");
        // Fixed: Remove the template string and use direct assignment
        subtitle.textContent = `${team.shooters.length} Schützen: ${shooterNames}`;
      } else {
        subtitle.textContent = "Keine Schützen";
      }
      content.appendChild(subtitle);

      const action = document.createElement("span");
      action.className = "list-item-action";
      action.textContent = "›";

      item.appendChild(content);
      item.appendChild(action);
      item.addEventListener("click", () => this.editTeam(team));
      teamsSection.appendChild(item);
    });

    return teamsSection;
  }

  createStandaloneShootersList() {
    const shootersSection = document.createElement("div");
    shootersSection.className = "list";

    const shootersHeader = document.createElement("div");
    shootersHeader.className = "list-header";
    shootersHeader.textContent = `Einzelschützen (${storage.standaloneShooters.length})`;
    shootersSection.appendChild(shootersHeader);

    storage.standaloneShooters.forEach((shooter) => {
      const item = document.createElement("div");
      item.className = "list-item";

      const content = document.createElement("div");
      content.className = "list-item-content";

      const title = document.createElement("div");
      title.className = "list-item-title";
      title.textContent = shooter.name;
      content.appendChild(title);

      const action = document.createElement("span");
      action.className = "list-item-action";
      action.textContent = "›";

      item.appendChild(content);
      item.appendChild(action);
      item.addEventListener("click", () => this.editStandaloneShooter(shooter));
      shootersSection.appendChild(item);
    });

    return shootersSection;
  }

  // Team Management
  addTeam() {
    const team = new Team("", []);
    this.showTeamEditModal(team, true);
  }

  editTeam(team) {
    this.showTeamEditModal(team, false);
  }

  // Auch die showTeamEditModal erweitern um einen Hinweis zu zeigen:
  showTeamEditModal(team, isNew = false) {
    const content = document.createElement("div");
    content.innerHTML = `
		<div class="form-section">
		<div class="form-section-header">Mannschaft</div>
		<div class="form-row">
		<input type="text" id="teamNameInput" class="form-input" placeholder="Mannschaftsname" value="${UIUtils.escapeHtml(
      team.name
    )}">
		</div>
		</div>
		
		<div class="form-section">
		<div class="form-section-header">Schützen (maximal 4)</div>
		<div id="shootersList"></div>
		<div class="form-row">
		<div class="add-shooter-row">
		<input type="text" id="newShooterName" class="form-input" placeholder="Neuer Schütze">
		<button class="btn btn-secondary" id="addShooterBtn">Hinzufügen</button>
		</div>
		</div>
		${
      team.shooters.length >= 4
        ? '<p style="color: #666; font-size: 12px; margin-top: 8px;">ℹ️ Eine Mannschaft darf maximal 4 Schützen haben. Für die Wertung zählen die besten 3 Ergebnisse.</p>'
        : '<p style="color: #666; font-size: 12px; margin-top: 8px;">💡 Tipp: Für die Mannschaftswertung werden die besten 3 von 4 Schützen gewertet.</p>'
    }
		</div>
		
		${
      !isNew
        ? `
		<div class="form-section">
		<div class="form-row">
		<button class="btn btn-danger" id="deleteTeamBtn" style="width: 100%;">
		Mannschaft löschen
		</button>
		</div>
		</div>
		`
        : ""
    }
		`;

    const modal = new ModalComponent(
      isNew ? "Neue Mannschaft" : "Mannschaft bearbeiten",
      content
    );

    modal.addAction("Abbrechen", null, false, false);
    modal.addAction(
      "Speichern",
      () => {
        this.saveTeam(team, isNew);
      },
      true,
      false
    );

    modal.show();

    // Setup shooters list and event handlers
    setTimeout(() => {
      this.updateShootersList(team);
      this.setupTeamModalHandlers(team, isNew);
    }, 100);
  }

  // updateShootersList Methode erweitern:
  updateShootersList(team) {
    const shootersList = document.getElementById("shootersList");
    if (!shootersList) return;

    shootersList.innerHTML = "";

    team.shooters.forEach((shooter, index) => {
      const shooterDiv = document.createElement("div");
      shooterDiv.className = "shooter-item";

      // Create input element
      const input = document.createElement("input");
      input.type = "text";
      input.className = "form-input";
      input.value = shooter.name;
      input.addEventListener("change", (e) => {
        this.updateShooterName(team.id, index, e.target.value);
      });

      // Create remove button
      const removeBtn = document.createElement("button");
      removeBtn.className = "remove-shooter-btn";
      removeBtn.textContent = "Entfernen";
      removeBtn.addEventListener("click", () => {
        this.removeShooter(team.id, index);
      });

      shooterDiv.appendChild(input);
      shooterDiv.appendChild(removeBtn);
      shootersList.appendChild(shooterDiv);
    });

    // Update Add-Button Status basierend auf Anzahl Schützen
    setTimeout(() => {
      const addShooterBtn = document.getElementById("addShooterBtn");
      const newShooterName = document.getElementById("newShooterName");

      if (addShooterBtn && newShooterName) {
        if (team.shooters.length >= 4) {
          addShooterBtn.disabled = true;
          addShooterBtn.textContent = "Maximum erreicht";
          addShooterBtn.style.opacity = "0.5";
          newShooterName.disabled = true;
          newShooterName.placeholder = "Maximal 4 Schützen erlaubt";
        } else {
          addShooterBtn.disabled = false;
          addShooterBtn.textContent = "Hinzufügen";
          addShooterBtn.style.opacity = "1";
          newShooterName.disabled = false;
          newShooterName.placeholder = "Neuer Schütze";
        }
      }
    }, 10);
  }

  // In der setupTeamModalHandlers Methode - den addShooter Teil ersetzen:
  setupTeamModalHandlers(team, isNew) {
    const addShooterBtn = document.getElementById("addShooterBtn");
    const newShooterName = document.getElementById("newShooterName");
    const deleteTeamBtn = document.getElementById("deleteTeamBtn");

    if (addShooterBtn && newShooterName) {
      const addShooter = () => {
        const name = newShooterName.value.trim();
        if (name) {
          // Prüfung: Maximal 4 Schützen pro Mannschaft
          if (team.shooters.length >= 4) {
            UIUtils.showError("Eine Mannschaft darf maximal 4 Schützen haben.");
            return;
          }

          team.shooters.push(new Shooter(name));
          newShooterName.value = "";
          this.updateShootersList(team);

          // Button deaktivieren wenn Maximum erreicht
          if (team.shooters.length >= 4) {
            addShooterBtn.disabled = true;
            addShooterBtn.textContent = "Maximum erreicht";
            addShooterBtn.style.opacity = "0.5";
            newShooterName.disabled = true;
          }
        }
      };

      addShooterBtn.addEventListener("click", addShooter);
      newShooterName.addEventListener("keypress", (e) => {
        if (e.key === "Enter") addShooter();
      });
    }

    if (deleteTeamBtn && !isNew) {
      deleteTeamBtn.addEventListener("click", () => {
        if (
          confirm(`Möchten Sie die Mannschaft "${team.name}" wirklich löschen?`)
        ) {
          storage.deleteTeam(team.id);
          UIUtils.showSuccessMessage("Mannschaft gelöscht");
          app.showView("teams");
        }
      });
    }
  }

  updateShooterName(teamId, shooterIndex, newName) {
    const team = storage.teams.find((t) => t.id === teamId);
    if (team && team.shooters[shooterIndex]) {
      team.shooters[shooterIndex].name = newName.trim();
    }
  }

  // removeShooter Methode erweitern um Button-Status zu aktualisieren:
  removeShooter(teamId, shooterIndex) {
    const team = storage.teams.find((t) => t.id === teamId);
    if (team && team.shooters[shooterIndex]) {
      const shooter = team.shooters[shooterIndex];

      if (
        confirm(
          `Möchten Sie den Schützen "${shooter.name}" wirklich entfernen?`
        )
      ) {
        // Delete results for this shooter
        storage.deleteResultsForShooter(shooter.id);

        // Remove from team
        team.shooters.splice(shooterIndex, 1);

        // Update the list immediately (dies aktualisiert auch den Button-Status)
        this.updateShootersList(team);

        UIUtils.showSuccessMessage("Schütze entfernt");
      }
    }
  }

  saveTeam(team, isNew) {
    try {
      const teamNameInput = document.getElementById("teamNameInput");
      if (teamNameInput) {
        team.name = teamNameInput.value.trim();
      }

      if (!team.name) {
        alert("Bitte geben Sie einen Mannschaftsnamen ein.");
        return;
      }

      if (isNew) {
        storage.addTeam(team);
        UIUtils.showSuccessMessage("Mannschaft hinzugefügt");
      } else {
        storage.updateTeam(team);
        UIUtils.showSuccessMessage("Mannschaft aktualisiert");
      }

      app.showView("teams");
    } catch (error) {
      console.error("Error saving team:", error);
      alert("Fehler beim Speichern: " + error.message);
    }
  }

  // Standalone Shooter Management
  addStandaloneShooter() {
    const shooter = new Shooter("");
    this.showStandaloneShooterModal(shooter, true);
  }

  editStandaloneShooter(shooter) {
    this.showStandaloneShooterModal(shooter, false);
  }

  showStandaloneShooterModal(shooter, isNew = false) {
    const content = document.createElement("div");
    content.innerHTML = `
		<div class="form-section">
		<div class="form-row">
		<input type="text" id="shooterNameInput" class="form-input" placeholder="Schützenname" value="${UIUtils.escapeHtml(
      shooter.name
    )}">
		</div>
		</div>
		
		${
      !isNew
        ? `
		<div class="form-section">
		<div class="form-row">
		<button class="btn btn-danger" id="deleteShooterBtn" style="width: 100%;">
		Schütze löschen
		</button>
		</div>
		</div>
		`
        : ""
    }
		`;

    const modal = new ModalComponent(
      isNew ? "Neuer Einzelschütze" : "Schütze bearbeiten",
      content
    );

    modal.addAction("Abbrechen", null, false, false);
    modal.addAction(
      "Speichern",
      () => {
        this.saveStandaloneShooter(shooter, isNew);
      },
      true,
      false
    );

    modal.show();

    // Setup event handlers
    setTimeout(() => {
      const deleteShooterBtn = document.getElementById("deleteShooterBtn");
      if (deleteShooterBtn && !isNew) {
        deleteShooterBtn.addEventListener("click", () => {
          if (
            confirm(
              `Möchten Sie den Schützen "${shooter.name}" wirklich löschen?`
            )
          ) {
            storage.deleteStandaloneShooter(shooter.id);
            UIUtils.showSuccessMessage("Schütze gelöscht");
            app.showView("teams");
          }
        });
      }
    }, 100);
  }

  saveStandaloneShooter(shooter, isNew) {
    try {
      const shooterNameInput = document.getElementById("shooterNameInput");
      if (shooterNameInput) {
        shooter.name = shooterNameInput.value.trim();
      }

      if (!shooter.name) {
        alert("Bitte geben Sie einen Schützennamen ein.");
        return;
      }

      if (isNew) {
        storage.addStandaloneShooter(shooter);
        UIUtils.showSuccessMessage("Einzelschütze hinzugefügt");
      } else {
        storage.updateStandaloneShooter(shooter);
        UIUtils.showSuccessMessage("Einzelschütze aktualisiert");
      }

      app.showView("teams");
    } catch (error) {
      console.error("Error saving standalone shooter:", error);
      alert("Fehler beim Speichern: " + error.message);
    }
  }

  createErrorCard(message) {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `<p style="color: red;">${UIUtils.escapeHtml(
      message
    )}</p>`;
    return card;
  }
  showImportModal() {
    const content = document.createElement("div");
    content.innerHTML = `
		<div class="form-section">
		<div class="form-section-header">CSV-Datei importieren</div>
		<div class="form-row">
		<p style="margin-bottom: 12px; font-size: 14px; color: #666;">
		Format: Name; Verein; Einzelschütze;<br>
		Bei "E" in Einzelschütze → Einzelschütze anlegen<br>
		Sonst → Team mit Mitglied anlegen
		</p>
		<input type="file" id="csvFileInput" accept=".csv,.txt" class="form-input" style="padding: 8px;">
		</div>
		</div>
		
		<div class="form-section">
		<div class="form-section-header">Vorschau</div>
		<div id="importPreview" style="max-height: 200px; overflow-y: auto; font-family: monospace; font-size: 12px; background: #f8f9fa; padding: 8px; border-radius: 4px;">
		Keine Datei ausgewählt
		</div>
		</div>
		`;

    const modal = new ModalComponent("CSV Import", content);

    modal.addAction("Abbrechen", null, false, false);
    modal.addAction(
      "Importieren",
      () => {
        this.processImport();
      },
      true,
      false
    );

    modal.show();

    // Setup file input handler
    setTimeout(() => {
      const fileInput = document.getElementById("csvFileInput");
      if (fileInput) {
        fileInput.addEventListener("change", (e) => {
          this.previewCSV(e.target.files[0]);
        });
      }
    }, 100);
  }

  previewCSV(file) {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target.result;
      const lines = content.split("\n").filter((line) => line.trim());

      let preview = "<strong>Gefundene Einträge:</strong><br><br>";

      lines.forEach((line, index) => {
        if (index === 0) return; // Skip header if exists

        const parts = line.split(";").map((p) => p.trim());
        if (parts.length >= 3) {
          const [name, verein, einzelschuetze] = parts;

          if (einzelschuetze.toUpperCase() === "E") {
            preview += `📍 Einzelschütze: <strong>${name} - ${verein}</strong><br>`;
          } else {
            preview += `👥 Team: <strong>${verein}</strong> → Mitglied: <strong>${name}</strong><br>`;
          }
        }
      });

      const previewDiv = document.getElementById("importPreview");
      if (previewDiv) {
        previewDiv.innerHTML = preview;
      }
    };

    reader.readAsText(file, "UTF-8");
  }

  // processImport Methode erweitern:
  processImport() {
    const fileInput = document.getElementById("csvFileInput");
    const file = fileInput?.files[0];

    if (!file) {
      alert("Bitte wählen Sie eine CSV-Datei aus.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target.result;
        const lines = content.split("\n").filter((line) => line.trim());

        let teamsCreated = 0;
        let shootersCreated = 0;
        let skippedShooters = 0;
        let errors = [];

        // Process each line
        lines.forEach((line, index) => {
          if (index === 0 && line.toLowerCase().includes("name")) return; // Skip header

          const parts = line.split(";").map((p) => p.trim());
          if (parts.length < 3) {
            errors.push(`Zeile ${index + 1}: Unvollständige Daten`);
            return;
          }

          const [name, verein, einzelschuetze] = parts;

          if (!name || !verein) {
            errors.push(`Zeile ${index + 1}: Name oder Verein fehlt`);
            return;
          }

          try {
            if (einzelschuetze.toUpperCase() === "E") {
              // Create standalone shooter
              const shooterName = `${name} - ${verein}`;

              // Check if shooter already exists
              const existingShooter = storage.standaloneShooters.find(
                (s) => s.name === shooterName
              );
              if (!existingShooter) {
                const newShooter = new Shooter(shooterName);
                storage.addStandaloneShooter(newShooter);
                shootersCreated++;
              }
            } else {
              // Create/update team
              let team = storage.teams.find((t) => t.name === verein);

              if (!team) {
                // Create new team
                team = new Team(verein, []);
                storage.addTeam(team);
                teamsCreated++;
              }

              // Prüfung: Maximal 4 Schützen pro Mannschaft
              if (team.shooters.length >= 4) {
                errors.push(
                  `Zeile ${
                    index + 1
                  }: Mannschaft "${verein}" hat bereits 4 Schützen (Maximum erreicht)`
                );
                skippedShooters++;
                return;
              }

              // Check if shooter already exists in team
              const existingShooter = team.shooters.find(
                (s) => s.name === name
              );
              if (!existingShooter) {
                const newShooter = new Shooter(name);
                team.shooters.push(newShooter);
                storage.updateTeam(team);
              }
            }
          } catch (error) {
            errors.push(`Zeile ${index + 1}: ${error.message}`);
          }
        });

        // Show results
        let message = `Import abgeschlossen!\n\n`;
        message += `• ${teamsCreated} Teams erstellt\n`;
        message += `• ${shootersCreated} Einzelschützen erstellt\n`;

        if (skippedShooters > 0) {
          message += `• ${skippedShooters} Schützen übersprungen (Team-Maximum erreicht)\n`;
        }

        if (errors.length > 0) {
          message += `\nFehler (${errors.length}):\n`;
          message += errors.slice(0, 5).join("\n"); // Show first 5 errors
          if (errors.length > 5) {
            message += `\n... und ${errors.length - 5} weitere`;
          }
        }

        alert(message);

        // Refresh the view
        app.showView("teams");
      } catch (error) {
        console.error("Import error:", error);
        alert("Fehler beim Importieren: " + error.message);
      }
    };

    reader.readAsText(file, "UTF-8");
  }
}
