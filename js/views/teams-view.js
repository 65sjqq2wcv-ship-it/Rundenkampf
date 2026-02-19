class TeamsView {
  constructor() {
    this.currentEditingTeam = null;
    this.currentEditingShooter = null;
  }

  render() {
    const container = document.createElement("div");
    container.style.cssText = "padding-bottom: 20px;";

    try {
      this.setupNavButtons();

      if (storage.teams.length > 0) {
        const teamsSection = this.createTeamsList();
        container.appendChild(teamsSection);
      }

      if (storage.standaloneShooters.length > 0) {
        const shootersSection = this.createStandaloneShootersList();
        container.appendChild(shootersSection);
      }

      if (
        storage.teams.length === 0 &&
        storage.standaloneShooters.length === 0
      ) {
        const emptyState = this.createEmptyState(); // ✅ SICHERHEITSFX: Ausgelagert
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

  // ✅ SICHERHEITSFIX: Sichere Empty State Erstellung
  createEmptyState() {
    const emptyState = document.createElement("div");
    emptyState.className = "card empty-state";
    emptyState.style.cssText = "margin-bottom: 30px;";

    const title = document.createElement("h3");
    title.textContent = "Keine Teams oder Schützen";
    emptyState.appendChild(title);

    const description = document.createElement("p");
    description.textContent = "Fügen Sie Ihr erstes Team oder Einzelschützen hinzu.";
    description.style.cssText = "margin: 16px 0;";
    emptyState.appendChild(description);

    const buttonContainer = document.createElement("div");
    buttonContainer.style.cssText = "display: flex; gap: 12px; justify-content: center; margin-top: 20px;";

    // ✅ SICHERHEITSFIX: onclick durch addEventListener ersetzt
    const teamBtn = document.createElement("button");
    teamBtn.className = "btn btn-primary";
    teamBtn.textContent = "Team hinzufügen";
    teamBtn.style.cssText = "width: 50%; height: 70px;";
    teamBtn.addEventListener("click", () => this.addTeam());

    const shooterBtn = document.createElement("button");
    shooterBtn.className = "btn btn-secondary";
    shooterBtn.textContent = "Einzelschütze hinzufügen";
    shooterBtn.style.cssText = "width: 50%; height: 70px;";
    shooterBtn.addEventListener("click", () => this.addStandaloneShooter());

    buttonContainer.appendChild(teamBtn);
    buttonContainer.appendChild(shooterBtn);
    emptyState.appendChild(buttonContainer);

    return emptyState;
  }

  setupNavButtons() {
    setTimeout(() => {
      const navButtons = document.getElementById("navButtons");
      if (navButtons) {
        navButtons.innerHTML = "";
        
        const shooterBtn = document.createElement("button");
        shooterBtn.className = "nav-btn";
        shooterBtn.textContent = "👤";
        shooterBtn.title = "Einzelschütze hinzufügen";
        shooterBtn.addEventListener("click", () => this.addStandaloneShooter());
        navButtons.appendChild(shooterBtn);

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

  addTeam() {
    const team = new Team("", []);
    this.showTeamEditModal(team, true);
  }

  editTeam(team) {
    this.showTeamEditModal(team, false);
  }

  showTeamEditModal(team, isNew = false) {
    const content = document.createElement("div");
    content.innerHTML = `
      <div class="form-section">
        <div class="form-row">
          <input type="text" id="teamNameInput" class="form-input" placeholder="Mannschaftsname" value="${UIUtils.escapeHtml(team.name)}">
        </div>
      </div>
      
      <div class="form-section">
        <div class="form-section-header">Schützen</div>
        <div id="shootersList"></div>
        <button class="btn btn-secondary" id="addShooterBtn" style="width: 100%; margin-top: 8px;">
          Schütze hinzufügen
        </button>
      </div>
      
      ${!isNew ? `
        <div class="form-section">
          <div class="form-row">
            <button class="btn btn-danger" id="deleteTeamBtn" style="width: 100%;">
              Mannschaft löschen
            </button>
          </div>
        </div>
      ` : ""}
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

    setTimeout(() => {
      this.updateShootersList(team);

      const addShooterBtn = document.getElementById("addShooterBtn");
      if (addShooterBtn) {
        addShooterBtn.addEventListener("click", () => {
          if (team.shooters.length >= 4) {
            UIUtils.showError("Eine Mannschaft darf maximal 4 Schützen haben.");
            return;
          }
          const newShooter = new Shooter("");
          team.shooters.push(newShooter);
          this.updateShootersList(team);
        });
      }

      const deleteTeamBtn = document.getElementById("deleteTeamBtn");
      if (deleteTeamBtn && !isNew) {
        deleteTeamBtn.addEventListener("click", () => {
          if (
            confirm(
              `Möchten Sie die Mannschaft "${team.name}" wirklich löschen?`
            )
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
    }, 100);
  }

  // ✅ HAUPTSICHERHEITSFIX: onclick durch addEventListener ersetzt
  updateShootersList(team) {
    const shootersList = document.getElementById("shootersList");
    const addShooterBtn = document.getElementById("addShooterBtn");

    if (!shootersList) return;

    shootersList.innerHTML = "";

    team.shooters.forEach((shooter, index) => {
      const shooterDiv = document.createElement("div");
      shooterDiv.className = "form-row";
      shooterDiv.style.cssText = "display: flex; gap: 8px; align-items: center;";

      // ✅ SICHERHEITSFIX: Input Element sicher erstellen
      const input = document.createElement("input");
      input.type = "text";
      input.placeholder = "Schützenname";
      input.value = UIUtils.escapeHtml(shooter.name);
      input.style.cssText = "flex: 1; padding: 8px; border: 1px solid #d1d1d6; border-radius: 8px;";
      
      // ✅ SICHERHEITSFIX: addEventListener statt onchange in innerHTML
      input.addEventListener("change", (e) => {
        shooter.name = e.target.value.trim();
      });

      // ✅ SICHERHEITSFIX: Button Element sicher erstellen  
      const deleteBtn = document.createElement("button");
      deleteBtn.className = "btn btn-danger btn-small";
      deleteBtn.textContent = "Löschen";
      deleteBtn.style.cssText = "padding: 8px 12px;";
      
      // ✅ SICHERHEITSFIX: addEventListener statt onclick in innerHTML
      deleteBtn.addEventListener("click", () => {
        this.removeShooter(team.id, index);
      });

      shooterDiv.appendChild(input);
      shooterDiv.appendChild(deleteBtn);
      shootersList.appendChild(shooterDiv);
    });

    // Button-Status Update (unverändert)
    if (addShooterBtn) {
      if (team.shooters.length >= 4) {
        addShooterBtn.textContent = "Maximum erreicht (4 Schützen)";
        addShooterBtn.disabled = true;
        addShooterBtn.style.opacity = "0.5";
      } else {
        addShooterBtn.textContent = `Schütze hinzufügen (${team.shooters.length}/4)`;
        addShooterBtn.disabled = false;
        addShooterBtn.style.opacity = "1";
      }
    }
  }

  removeShooter(teamId, shooterIndex) {
    const team = storage.teams.find((t) => t.id === teamId);
    if (team && team.shooters[shooterIndex]) {
      const shooter = team.shooters[shooterIndex];

      if (
        confirm(
          `Möchten Sie den Schützen "${shooter.name}" wirklich entfernen?`
        )
      ) {
        storage.deleteResultsForShooter(shooter.id);
        team.shooters.splice(shooterIndex, 1);
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

      team.shooters.forEach((shooter, index) => {
        if (!shooter.name || !shooter.name.trim()) {
          throw new Error(`Schütze ${index + 1} benötigt einen Namen.`);
        }
      });

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

  addStandaloneShooter() {
    const shooter = new Shooter("");
    this.showStandaloneShooterEditModal(shooter, true);
  }

  editStandaloneShooter(shooter) {
    this.showStandaloneShooterEditModal(shooter, false);
  }

  showStandaloneShooterEditModal(shooter, isNew = false) {
    const content = document.createElement("div");
    content.innerHTML = `
      <div class="form-section">
        <div class="form-row">
          <input type="text" id="shooterNameInput" class="form-input" placeholder="Schützenname" value="${UIUtils.escapeHtml(shooter.name)}">
        </div>
      </div>
      
      ${!isNew ? `
        <div class="form-section">
          <div class="form-row">
            <button class="btn btn-danger" id="deleteShooterBtn" style="width: 100%;">
              Einzelschütze löschen
            </button>
          </div>
        </div>
      ` : ""}
    `;

    const modal = new ModalComponent(
      isNew ? "Neuer Einzelschütze" : "Einzelschütze bearbeiten",
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

    setTimeout(() => {
      const deleteShooterBtn = document.getElementById("deleteShooterBtn");
      if (deleteShooterBtn && !isNew) {
        deleteShooterBtn.addEventListener("click", () => {
          if (
            confirm(
              `Möchten Sie den Einzelschützen "${shooter.name}" wirklich löschen?`
            )
          ) {
            storage.deleteStandaloneShooter(shooter.id);
            UIUtils.showSuccessMessage("Einzelschütze gelöscht");

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
    card.innerHTML = `<p style="color: red;">${UIUtils.escapeHtml(message)}</p>`;
    return card;
  }
}