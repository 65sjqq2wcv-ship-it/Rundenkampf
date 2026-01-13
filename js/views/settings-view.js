class SettingsView {
  render() {
    const container = document.createElement("div");
    container.style.cssText = "padding-bottom: 20px;";

    try {
      // Competition Type Section
      const competitionSection = this.createCompetitionTypeSection();
      container.appendChild(competitionSection);

      // Current Discipline Section
      const currentDisciplineSection = this.createCurrentDisciplineSection();
      container.appendChild(currentDisciplineSection);

      // NEU: Logo Upload Section
      const logoSection = this.createLogoUploadSection();
      container.appendChild(logoSection);

      // Available Disciplines Section
      const disciplinesSection = this.createDisciplinesSection();
      container.appendChild(disciplinesSection);

      // Info Section
      const infoSection = this.createInfoSection();
      container.appendChild(infoSection);

      // Setup event listeners after render
      setTimeout(() => {
        this.setupEventListeners();
        this.updateCurrentDisciplineSelect();
        this.updateDisciplinesList();
        this.updateLogoPreview(); // NEU
      }, 100);
    } catch (error) {
      console.error("Error rendering settings view:", error);
      container.innerHTML = `<div class="card" style="margin-bottom: 30px;"><p style="color: red;">Fehler beim Laden der Einstellungen: ${error.message}</p></div>`;
    }

    return container;
  }

  createCompetitionTypeSection() {
    const section = document.createElement("div");
    section.className = "card";
    section.innerHTML = `
		<h3>Wettbewerbsmodus</h3>
		<div style="margin-top: 12px;">
		<select class="form-select" id="competitionTypeSelect">
		<option value="${CompetitionType.PRAEZISION_DUELL}">${CompetitionType.PRAEZISION_DUELL}</option>
		<option value="${CompetitionType.ANNEX_SCHEIBE}">${CompetitionType.ANNEX_SCHEIBE}</option>
		</select>
		</div>
		`;
    return section;
  }

  createCurrentDisciplineSection() {
    const section = document.createElement("div");
    section.className = "card";
    section.innerHTML = `
		<h3>Aktuelle Disziplin</h3>
		<div style="margin-top: 12px;">
		<select class="form-select" id="currentDisciplineSelect">
		<option value="">Keine ausgewählt</option>
		</select>
		</div>
		`;
    return section;
  }

  // NEU: Logo Upload Section
  // NEU: Verbesserte Logo Upload Section
  createLogoUploadSection() {
    const section = document.createElement("div");
    section.className = "card";
    section.innerHTML = `
	<h3>Vereinslogo</h3>
	<div style="margin-top: 12px;">
		<div id="logoPreview" style="margin-bottom: 16px; text-align: center;">
			<!-- Logo preview will be inserted here -->
		</div>
		
		<!-- Upload Input Bereich -->
		<div style="margin-bottom: 12px;">
			<input type="file" id="logoUpload" accept="image/*" 
				   style="width: 100%; padding: 10px; border: 1px solid #d1d1d6; border-radius: 8px; font-size: 14px;">
		</div>
		
		<!-- Button Container -->
		<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">
			<button class="btn btn-primary" onclick="app.views.settings.uploadLogo()" 
					style="padding: 12px; font-weight: bold; height:45px;">
				📁 Hochladen
			</button>
			<button class="btn btn-danger" onclick="app.views.settings.deleteLogo()" 
					style="padding: 12px; height:45px;">
				🗑️ Löschen
			</button>
		</div>
		
		<!-- Info Text -->
		<div style="background-color: #f8f9fa; padding: 12px; border-radius: 6px; border-left: 4px solid #007bff;">
			<div style="font-size: 13px; color: #495057; margin-bottom: 4px; font-weight: 500;">
				📋 Anforderungen:
			</div>
			<div style="font-size: 12px; color: #6c757d; line-height: 1.4;">
				• <strong>Größe:</strong> Mindestens 200×200px empfohlen<br>
				• <strong>Format:</strong> JPG, PNG oder GIF<br>
				• <strong>Dateigröße:</strong> Maximal 5MB<br>
				• <strong>Verwendung:</strong> Wird im PDF-Bericht angezeigt
			</div>
		</div>
	</div>
	`;
    return section;
  }

  createDisciplinesSection() {
    const section = document.createElement("div");
    section.className = "card";
    section.innerHTML = `
		<h3>Verfügbare Disziplinen</h3>
		<div id="disciplinesList" style="margin-top: 12px;">
		<!-- Disciplines will be populated here -->
		</div>
		<div style="margin-top: 16px; display: flex; gap: 8px;">
		<input type="text" id="newDisciplineName" placeholder="Neue Disziplin" 
		style="flex: 1; padding: 12px; border: 1px solid #d1d1d6; border-radius: 8px; font-size: 16px; height:40px;">
		<button class="btn btn-secondary" onclick="app.views.settings.addDiscipline()" style="padding: 8px 12px; height: 40px;">Hinzufügen</button>
		</div>
		`;
    return section;
  }

  createInfoSection() {
    const section = document.createElement("div");
    section.className = "card";
    section.style.cssText = "margin-bottom: 30px;"; // Zusätzlicher Abstand
    section.innerHTML = `
		<h3>App-Information</h3>
		<div style="margin-top: 12px;">
		<div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f0f0f0;">
		<span>App Version</span>
		<span style="color: #8e8e93;">1.57</span>
		</div>
		<div style="display: flex; justify-content: space-between; padding: 8px 0;">
		<span>Rundenkampfbericht</span>
		<span style="color: #8e8e93;">© 2026</span>
		</div>
		</div>
		<div style="margin-top: 16px;">
		<button class="btn btn-secondary" onclick="app.views.settings.resetApp()" style="width: 100%;">
		App zurücksetzen
		</button>
		</div>
		`;
    return section;
  }

  setupEventListeners() {
    const competitionTypeSelect = document.getElementById(
      "competitionTypeSelect"
    );
    const currentDisciplineSelect = document.getElementById(
      "currentDisciplineSelect"
    );

    if (competitionTypeSelect) {
      competitionTypeSelect.value = storage.selectedCompetitionType;
      competitionTypeSelect.addEventListener("change", (e) => {
        storage.selectedCompetitionType = e.target.value;
        storage.save();
        UIUtils.showSuccessMessage("Wettbewerbsmodus geändert");

        // Refresh overview if currently showing
        if (app && app.getCurrentView() === "overview") {
          setTimeout(() => app.showView("overview"), 500);
        }
      });
    }

    if (currentDisciplineSelect) {
      currentDisciplineSelect.addEventListener("change", (e) => {
        storage.selectedDiscipline = e.target.value || null;
        storage.save();
        UIUtils.showSuccessMessage("Disziplin gewählt");

        // Refresh overview if currently showing
        if (app && app.getCurrentView() === "overview") {
          setTimeout(() => app.showView("overview"), 500);
        }
      });
    }
  }

  // Verbesserte Logo Management Methoden in SettingsView
  uploadLogo() {
    try {
      const fileInput = document.getElementById("logoUpload");
      const file = fileInput.files[0];

      if (!file) {
        alert("Bitte wählen Sie eine Datei aus.");
        return;
      }

      // Erweiterte Validierung
      if (file.size > 5 * 1024 * 1024) {
        alert("Die Datei ist zu groß. Maximale Größe: 5MB");
        return;
      }

      const allowedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif",
      ];
      if (!allowedTypes.includes(file.type)) {
        alert("Unsupported file type. Please use JPG, PNG or GIF.");
        return;
      }

      // Loading Indicator
      const uploadButton = document.querySelector(
        'button[onclick="app.views.settings.uploadLogo()"]'
      );
      const originalText = uploadButton.textContent;
      uploadButton.disabled = true;
      uploadButton.textContent = "⏳ Wird hochgeladen...";

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const base64 = e.target.result;
          console.log(
            "File loaded, size:",
            Math.round(base64.length / 1024),
            "KB"
          );

          // Logo über Storage-Methode speichern
          storage.saveLogo(base64);

          // Preview aktualisieren
          this.updateLogoPreview();

          // Input zurücksetzen
          fileInput.value = "";

          // Button zurücksetzen
          uploadButton.disabled = false;
          uploadButton.textContent = originalText;

          UIUtils.showSuccessMessage("Logo erfolgreich hochgeladen!");
        } catch (error) {
          console.error("Error saving logo:", error);
          uploadButton.disabled = false;
          uploadButton.textContent = originalText;

          if (error.message.includes("Speicher ist voll")) {
            alert(
              "Das Logo ist zu groß für den verfügbaren Speicher. Versuchen Sie ein kleineres Bild oder komprimieren Sie es."
            );
          } else {
            alert("Fehler beim Speichern des Logos: " + error.message);
          }
        }
      };

      reader.onerror = () => {
        uploadButton.disabled = false;
        uploadButton.textContent = originalText;
        alert("Fehler beim Lesen der Datei.");
      };

      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Error uploading logo:", error);
      alert("Fehler beim Hochladen: " + error.message);
    }
  }

  deleteLogo() {
    try {
      const hasLogo = storage.getLogo();

      if (!hasLogo) {
        alert("Es ist kein Logo vorhanden.");
        return;
      }

      if (
        confirm(
          "Möchten Sie das Vereinslogo wirklich löschen?\n\nEs wird dann nicht mehr im PDF-Bericht angezeigt."
        )
      ) {
        storage.deleteLogo();

        // File Input leeren
        const fileInput = document.getElementById("logoUpload");
        if (fileInput) {
          fileInput.value = "";
        }

        this.updateLogoPreview();
        UIUtils.showSuccessMessage("Logo wurde gelöscht.");
      }
    } catch (error) {
      console.error("Error deleting logo:", error);
      alert("Fehler beim Löschen des Logos: " + error.message);
    }
  }

  updateLogoPreview() {
    const logoPreview = document.getElementById("logoPreview");
    if (!logoPreview) return;

    const logoBase64 = storage.getLogo();

    if (logoBase64) {
      logoPreview.innerHTML = `
			<div style="position: relative; display: inline-block;">
				<img src="${logoBase64}" 
					 style="max-width: 120px; max-height: 120px; border-radius: 12px; 
					 		box-shadow: 0 4px 12px rgba(0,0,0,0.15); border: 2px solid #e9ecef;"
					 alt="Vereinslogo">
				<div style="position: absolute; top: -8px; right: -8px; background: #28a745; 
							color: white; border-radius: 50%; width: 24px; height: 24px; 
							display: flex; align-items: center; justify-content: center; font-size: 12px;">
					✓
				</div>
			</div>
			<div style="font-size: 13px; color: #28a745; margin-top: 8px; font-weight: 500;">
				✅ Logo aktiv (wird im PDF verwendet)
			</div>
		`;
    } else {
      logoPreview.innerHTML = `
			<div style="width: 120px; height: 120px; background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); 
						border-radius: 12px; margin: 0 auto; display: flex; align-items: center; 
						justify-content: center; color: #adb5bd; border: 2px dashed #dee2e6;">
				<div style="text-align: center;">
					<div style="font-size: 28px; margin-bottom: 4px;">📷</div>
					<div style="font-size: 12px; font-weight: 500;">Kein Logo</div>
				</div>
			</div>
			<div style="font-size: 13px; color: #6c757d; margin-top: 8px;">
				Laden Sie ein Vereinslogo hoch
			</div>
		`;
    }
  }

  updateCurrentDisciplineSelect() {
    const select = document.getElementById("currentDisciplineSelect");
    if (!select) return;

    select.innerHTML = '<option value="">Keine ausgewählt</option>';

    storage.availableDisciplines.forEach((discipline) => {
      const option = document.createElement("option");
      option.value = discipline;
      option.textContent = discipline;
      if (discipline === storage.selectedDiscipline) {
        option.selected = true;
      }
      select.appendChild(option);
    });
  }

  updateDisciplinesList() {
    const disciplinesList = document.getElementById("disciplinesList");
    if (!disciplinesList) return;

    disciplinesList.innerHTML = "";

    if (storage.availableDisciplines.length === 0) {
      disciplinesList.innerHTML =
        '<p style="color: #8e8e93; font-style: italic;">Keine Disziplinen vorhanden</p>';
      return;
    }

    storage.availableDisciplines.forEach((discipline, index) => {
      const disciplineItem = document.createElement("div");
      disciplineItem.style.cssText = `
			display: flex;
			justify-content: space-between;
			align-items: center;
			padding: 8px 0;
			border-bottom: 1px solid #f0f0f0;
			`;

      disciplineItem.innerHTML = `
			<span style="flex: 1; height: 30px; max-width:60%;">${UIUtils.escapeHtml(
        discipline
      )}</span>
			<div style="display: flex; gap: 8px;">
			<button class="btn btn-small btn-secondary" style="height: 30px;" onclick="app.views.settings.editDiscipline(${index})">
			Bearbeiten
			</button>
			<button class="btn btn-small btn-danger" style="height: 30px;" onclick="app.views.settings.deleteDiscipline(${index})">
			Löschen
			</button>
			</div>
			`;

      disciplinesList.appendChild(disciplineItem);
    });
  }

  addDiscipline() {
    try {
      const nameInput = document.getElementById("newDisciplineName");
      const name = nameInput.value.trim();

      if (!name) {
        alert("Bitte geben Sie einen Namen für die Disziplin ein.");
        return;
      }

      if (storage.availableDisciplines.includes(name)) {
        alert("Diese Disziplin existiert bereits.");
        return;
      }

      storage.addDiscipline(name);
      nameInput.value = "";
      this.updateDisciplinesList();
      this.updateCurrentDisciplineSelect();

      UIUtils.showSuccessMessage("Disziplin hinzugefügt");
    } catch (error) {
      console.error("Error adding discipline:", error);
      alert("Fehler beim Hinzufügen der Disziplin: " + error.message);
    }
  }

  editDiscipline(index) {
    try {
      const currentName = storage.availableDisciplines[index];
      const newName = prompt("Disziplin bearbeiten:", currentName);

      if (newName === null) return;

      const trimmedName = newName.trim();
      if (!trimmedName) {
        alert("Disziplinname darf nicht leer sein.");
        return;
      }

      if (trimmedName === currentName) return;

      if (storage.availableDisciplines.includes(trimmedName)) {
        alert("Diese Disziplin existiert bereits.");
        return;
      }

      storage.updateDiscipline(index, trimmedName);
      this.updateDisciplinesList();
      this.updateCurrentDisciplineSelect();

      UIUtils.showSuccessMessage("Disziplin bearbeitet");
    } catch (error) {
      console.error("Error editing discipline:", error);
      alert("Fehler beim Bearbeiten der Disziplin: " + error.message);
    }
  }

  deleteDiscipline(index) {
    try {
      const disciplineName = storage.availableDisciplines[index];
      if (
        confirm(
          `Möchten Sie die Disziplin "${disciplineName}" wirklich löschen?`
        )
      ) {
        storage.deleteDiscipline(index);
        this.updateDisciplinesList();
        this.updateCurrentDisciplineSelect();

        UIUtils.showSuccessMessage("Disziplin gelöscht");
      }
    } catch (error) {
      console.error("Error deleting discipline:", error);
      alert("Fehler beim Löschen der Disziplin: " + error.message);
    }
  }

  resetApp() {
    if (
      confirm(
        "Möchten Sie wirklich alle Daten zurücksetzen? Diese Aktion kann nicht rückgängig gemacht werden."
      )
    ) {
      try {
        localStorage.removeItem("rundenkampf_bericht");
        UIUtils.showSuccessMessage(
          "App zurückgesetzt - Seite wird neu geladen..."
        );

        setTimeout(() => {
          location.reload();
        }, 1500);
      } catch (error) {
        console.error("Error resetting app:", error);
        alert("Fehler beim Zurücksetzen: " + error.message);
      }
    }
  }
}
