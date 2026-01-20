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
        // JSON Import/Export Button
        const jsonBtn = document.createElement("button");
        jsonBtn.className = "nav-btn";
        jsonBtn.textContent = "📦";
        jsonBtn.title = "JSON Import/Export";
        jsonBtn.addEventListener("click", () => this.showJsonModal());
        navButtons.appendChild(jsonBtn);

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
		${team.shooters.length >= 4
        ? '<p style="color: #666; font-size: 12px; margin-top: 8px;">ℹ️ Eine Mannschaft darf maximal 4 Schützen haben. Für die Wertung zählen die besten 3 Ergebnisse.</p>'
        : '<p style="color: #666; font-size: 12px; margin-top: 8px;">💡 Tipp: Für die Mannschaftswertung werden die besten 3 von 4 Schützen gewertet.</p>'
      }
		</div>
		
		${!isNew
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


          const modal = document.querySelector('.modal');
          if (modal) {
            modal.remove();
          }
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
		
		${!isNew
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

            // NEU: Modal explizit schließen
            const modal = document.querySelector('.modal');
            if (modal) {
              modal.remove();
            }

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

  showJsonModal() {
    const content = document.createElement("div");
    content.innerHTML = `
   <h3>Teams & Ergebnisse sichern</h3>
<div style="margin-top: 12px;">
    <!-- Button Container -->
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">
        <button class="btn btn-primary" onclick="app.views.teams.exportData()" 
                style="padding: 12px; font-weight: bold; height:45px;">
            💾 Export
        </button>
        <button class="btn btn-secondary" onclick="app.views.teams.importData()" 
                style="padding: 12px; height:45px;">
            📁 Import
        </button>
    </div>
    
    <!-- Info Text -->
    <div style="background-color: #f0f8ff; padding: 12px; border-radius: 6px; border-left: 4px solid #0066cc;">
        <div style="font-size: 13px; color: #0066cc; margin-bottom: 4px; font-weight: 500;">
            💡 Hinweis:
        </div>
        <div style="font-size: 12px; color: #4a5568; line-height: 1.4;">
            • <strong>Export:</strong> Sichert alle Teams und Ergebnisse<br>
            • <strong>Import:</strong> Lädt Backup (überschreibt alle Daten)<br>
            • <strong>Dateiformat:</strong> JSON-Datei mit .data.json Endung
        </div>
    </div>
</div>
  `;

    const modal = new ModalComponent("Daten Export/Import", content);
    modal.addAction("Schließen", null, false, false);
    modal.show();
  }

  exportData() {
    try {
      const data = storage.exportData();
      const dataStr = JSON.stringify(data, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `rundenkampf-data-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      UIUtils.showSuccessMessage("Daten exportiert!");
    } catch (error) {
      console.error("Error exporting data:", error);
      alert("Fehler beim Exportieren der Daten: " + error.message);
    }
  }

  importData() {
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = ".json";
    fileInput.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const content = e.target.result;
            const data = JSON.parse(content);
            storage.importData(data);
            UIUtils.showSuccessMessage("Daten importiert!");
            app.showView("teams");
          } catch (error) {
            console.error("Error importing data:", error);
            alert("Fehler beim Importieren der Daten: " + error.message);
          }
        };
        reader.readAsText(file);
      }
    };
    fileInput.click();
  }
}
