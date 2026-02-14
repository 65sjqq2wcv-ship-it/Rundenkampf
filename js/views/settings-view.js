class SettingsView {
  // In der render() Methode - Event-Listeners Setup korrigieren:
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

      // Overlay Scale Section
      const overlayScaleSection = this.createOverlayScaleSection();
      container.appendChild(overlayScaleSection);

      // Logo Upload Section
      const logoSection = this.createLogoUploadSection();
      container.appendChild(logoSection);

      // NEU: Label-Einstellungen Section
      const labelSection = this.createLabelSettingsSection();
      container.appendChild(labelSection);

      // Backup/Restore Section
      const backupSection = this.createBackupRestoreSection();
      container.appendChild(backupSection);

      // Available Disciplines Section
      const disciplinesSection = this.createDisciplinesSection();
      container.appendChild(disciplinesSection);

      // Weapons Section
      const weaponsSection = this.createWeaponsSection();
      container.appendChild(weaponsSection);

      // Info Section
      const infoSection = this.createInfoSection();
      container.appendChild(infoSection);

      // Setup event listeners after render - ERWEITERT
      setTimeout(() => {
        this.setupEventListeners();
        this.setupLabelSettingsEventListeners(); // NEU: Label-Settings Event-Listeners
        this.updateCurrentDisciplineSelect();
        this.updateDisciplinesList();
        this.updateWeaponsList();
        this.updateLogoPreview();
      }, 100);
    } catch (error) {
      console.error("Error rendering settings view:", error);
      container.innerHTML = `<div class="card" style="margin-bottom: 30px;"><p style="color: red;">Fehler beim Laden der Einstellungen: ${error.message}</p></div>`;
    }

    return container;
  }

  createLabelSettingsSection() {
  const section = document.createElement("div");
  section.className = "card";

  const labelSettings = storage.getLabelSettings();

  section.innerHTML = `
    <h3 style="margin-bottom: 16px;">📄 Label-Einstellungen</h3>
    
    <div class="form-section">
      <div class="form-section-header">Label-Abmessungen</div>
      
      <div class="form-row">
        <label style="display: block; margin-bottom: 4px; font-weight: 500;">
          Label-Breite: <span id="labelWidthValue">${labelSettings.labelWidth}</span> mm
        </label>
        <input type="range" id="labelWidthSlider" min="30.0" max="100.0" step="0.1" value="${labelSettings.labelWidth}"
               style="width: 100%; margin-bottom: 8px;">
      </div>
      
      <div class="form-row">
        <label style="display: block; margin-bottom: 4px; font-weight: 500;">
          Label-Höhe: <span id="labelHeightValue">${labelSettings.labelHeight}</span> mm
        </label>
        <input type="range" id="labelHeightSlider" min="15.0" max="60.0" step="0.1" value="${labelSettings.labelHeight}"
               style="width: 100%; margin-bottom: 8px;">
      </div>
    </div>

    <div class="form-section">
      <div class="form-section-header">Seitenränder</div>
      
      <div class="form-row">
        <label style="display: block; margin-bottom: 4px; font-weight: 500;">
          Rand oben: <span id="marginTopValue">${labelSettings.marginTop}</span> mm
        </label>
        <input type="range" id="marginTopSlider" min="0.0" max="30.0" step="0.1" value="${labelSettings.marginTop}"
               style="width: 100%; margin-bottom: 8px;">
      </div>
      
      <div class="form-row">
        <label style="display: block; margin-bottom: 4px; font-weight: 500;">
          Rand unten: <span id="marginBottomValue">${labelSettings.marginBottom}</span> mm
        </label>
        <input type="range" id="marginBottomSlider" min="0.0" max="30.0" step="0.1" value="${labelSettings.marginBottom}"
               style="width: 100%; margin-bottom: 8px;">
      </div>

      <div class="form-row">
        <label style="display: block; margin-bottom: 4px; font-weight: 500;">
          Rand links: <span id="marginLeftValue">${labelSettings.marginLeft || 0}</span> mm
        </label>
        <input type="range" id="marginLeftSlider" min="0.0" max="30.0" step="0.1" value="${labelSettings.marginLeft || 0}"
               style="width: 100%; margin-bottom: 8px;">
      </div>

      <div class="form-row">
        <label style="display: block; margin-bottom: 4px; font-weight: 500;">
          Rand rechts: <span id="marginRightValue">${labelSettings.marginRight || 0}</span> mm
        </label>
        <input type="range" id="marginRightSlider" min="0.0" max="30.0" step="0.1" value="${labelSettings.marginRight || 0}"
               style="width: 100%; margin-bottom: 8px;">
      </div>
    </div>

    <div class="form-section">
      <div class="form-section-header">Layout</div>
      
      <div class="form-row">
        <label style="display: block; margin-bottom: 4px; font-weight: 500;">
          Spalten: <span id="columnsValue">${labelSettings.columns}</span>
        </label>
        <input type="range" id="columnsSlider" min="1" max="5" step="1" value="${labelSettings.columns}"
               style="width: 100%; margin-bottom: 8px;">
      </div>
      
      <div class="form-row">
        <label style="display: block; margin-bottom: 4px; font-weight: 500;">
          Zeilen: <span id="rowsValue">${labelSettings.rows}</span>
        </label>
        <input type="range" id="rowsSlider" min="1" max="15" step="1" value="${labelSettings.rows}"
               style="width: 100%; margin-bottom: 8px;">
      </div>

      <div class="form-row">
        <label style="display: block; margin-bottom: 4px; font-weight: 500;">
          Abstand zwischen Labels: <span id="labelSpacingValue">${labelSettings.labelSpacing || 0}</span> mm
        </label>
        <input type="range" id="labelSpacingSlider" min="0.0" max="10.0" step="0.1" value="${labelSettings.labelSpacing || 0}"
               style="width: 100%; margin-bottom: 8px;">
      </div>
    </div>

    <div class="form-section">
      <div class="form-section-header">Druckoptionen</div>
      
      <div class="form-row">
        <label style="display: block; margin-bottom: 4px; font-weight: 500;">
          Überspringen (alte Bögen): <span id="skipLabelsValue">${labelSettings.skipLabels}</span>
        </label>
        <input type="range" id="skipLabelsSlider" min="0" max="50" step="1" value="${labelSettings.skipLabels}"
               style="width: 100%; margin-bottom: 8px;">
      </div>
      
      <div class="form-row">
        <label style="display: block; margin-bottom: 4px; font-weight: 500;">
          Anzahl Kopien: <span id="copiesValue">${labelSettings.copies}</span>
        </label>
        <input type="range" id="copiesSlider" min="1" max="5" step="1" value="${labelSettings.copies}"
               style="width: 100%; margin-bottom: 8px;">
      </div>
    </div>

    <div class="form-section">
      <div class="form-row">
        <button class="btn btn-primary" id="saveLabelSettingsBtn" style="width: 100%;">
          Label-Einstellungen speichern
        </button>
      </div>
    </div>
  `;

  return section;
}

  setupLabelSettingsEventListeners() {
    console.log("Setting up label settings event listeners...");

    // Slider-Updates - ALLE auf 0.1 Schritte (außer Ganzzahlen)
    const sliders = [
      { name: "labelWidth", decimals: 1, step: 0.1 }, // 0,1 mm Schritte
      { name: "labelHeight", decimals: 1, step: 0.1 }, // 0,1 mm Schritte
      { name: "marginTop", decimals: 1, step: 0.1 }, // 0,1 mm Schritte - GEÄNDERT
      { name: "marginBottom", decimals: 1, step: 0.1 }, // 0,1 mm Schritte - GEÄNDERT
      { name: "marginLeft", decimals: 1, step: 0.1 }, // 0,1 mm Schritte - GEÄNDERT
      { name: "marginRight", decimals: 1, step: 0.1 }, // 0,1 mm Schritte - GEÄNDERT
      { name: "columns", decimals: 0, step: 1 }, // Ganzzahl
      { name: "rows", decimals: 0, step: 1 }, // Ganzzahl
      { name: "skipLabels", decimals: 0, step: 1 }, // Ganzzahl
      { name: "copies", decimals: 0, step: 1 }, // Ganzzahl
      { name: "labelSpacing", decimals: 1, step: 0.1 }, // 0,1 mm Schritte
    ];

    sliders.forEach((setting) => {
      const slider = document.getElementById(`${setting.name}Slider`);
      const valueDisplay = document.getElementById(`${setting.name}Value`);

      console.log(
        `Setting up slider for ${setting.name}:`,
        slider ? "found" : "not found",
      );

      if (slider && valueDisplay) {
        // Event-Listener hinzufügen
        slider.addEventListener("input", (e) => {
          const value = parseFloat(e.target.value);

          // EINHEITLICHE FORMATIERUNG für alle 0.1-Schritte
          if (setting.decimals === 0) {
            // Ganzzahlen
            valueDisplay.textContent = Math.round(value).toString();
          } else {
            // Dezimalzahlen - immer eine Nachkommastelle für 0.1-Schritte
            valueDisplay.textContent = value.toFixed(1);
          }

          console.log(`${setting.name} updated to:`, value);
        });

        // Initial-Wert setzen
        const currentSettings = storage.getLabelSettings();
        const currentValue = currentSettings[setting.name];
        if (currentValue !== undefined) {
          slider.value = currentValue;

          // Display aktualisieren
          if (setting.decimals === 0) {
            valueDisplay.textContent = Math.round(currentValue).toString();
          } else {
            valueDisplay.textContent = currentValue.toFixed(1);
          }
        }
      } else {
        console.warn(`Slider or value display not found for ${setting.name}`);
      }
    });

    // Speichern Button
    const saveBtn = document.getElementById("saveLabelSettingsBtn");
    console.log("Save button:", saveBtn ? "found" : "not found");

    if (saveBtn) {
      saveBtn.addEventListener("click", () => {
        console.log("Save button clicked");
        this.saveLabelSettings();
      });
    }
  }

  // saveLabelSettings korrigieren:
  saveLabelSettings() {
    try {
      console.log("Saving label settings...");

      const settings = {
        labelWidth: parseFloat(
          document.getElementById("labelWidthSlider").value,
        ),
        labelHeight: parseFloat(
          document.getElementById("labelHeightSlider").value,
        ),
        marginTop: parseFloat(document.getElementById("marginTopSlider").value),
        marginBottom: parseFloat(
          document.getElementById("marginBottomSlider").value,
        ),
        marginLeft: parseFloat(
          document.getElementById("marginLeftSlider").value,
        ),
        marginRight: parseFloat(
          document.getElementById("marginRightSlider").value,
        ),
        columns: parseInt(document.getElementById("columnsSlider").value),
        rows: parseInt(document.getElementById("rowsSlider").value),
        skipLabels: parseInt(document.getElementById("skipLabelsSlider").value),
        copies: parseInt(document.getElementById("copiesSlider").value),
        labelSpacing: parseFloat(
          document.getElementById("labelSpacingSlider").value,
        ),
      };

      console.log("Settings to save:", settings);

      storage.saveLabelSettings(settings);
      UIUtils.showSuccessMessage("Label-Einstellungen gespeichert");

      console.log("Label settings saved successfully");
    } catch (error) {
      console.error("Error saving label settings:", error);
      UIUtils.showError("Fehler beim Speichern: " + error.message);
    }
  }

  // NEU: Test-Labels drucken
  testPrintLabels() {
    if (typeof labelPrinter !== "undefined" && labelPrinter.printLabels) {
      labelPrinter.printLabels();
    } else {
      UIUtils.showError("Label-Printer nicht verfügbar");
    }
  }

  createWeaponsSection() {
    const section = document.createElement("div");
    section.className = "card";
    section.innerHTML = `
    <h3>Verfügbare Waffen</h3>
    <div id="weaponsList" style="margin-top: 12px;">
      <!-- Weapons will be populated here -->
    </div>
    <div style="margin-top: 16px; display: flex; gap: 8px;">
      <input type="text" id="newWeaponName" placeholder="Neue Waffe" 
             style="flex: 1; padding: 12px; border: 1px solid #d1d1d6; border-radius: 8px; font-size: 16px; height:40px;">
      <button class="btn btn-secondary" onclick="app.views.settings.addWeapon()" 
              style="padding: 8px 12px; height: 40px;">Hinzufügen</button>
    </div>
  `;
    return section;
  }

  updateWeaponsList() {
    const weaponsList = document.getElementById("weaponsList");
    if (!weaponsList) return;

    weaponsList.innerHTML = "";

    if (storage.availableWeapons.length === 0) {
      weaponsList.innerHTML =
        '<p style="color: #8e8e93; font-style: italic;">Keine Waffen vorhanden</p>';
      return;
    }

    storage.availableWeapons.forEach((weapon, index) => {
      const weaponItem = document.createElement("div");
      weaponItem.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 0;
      border-bottom: 1px solid #f0f0f0;
    `;

      weaponItem.innerHTML = `
      <span style="flex: 1; height: 30px; max-width:50%; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; line-height: 30px;" title="${UIUtils.escapeHtml(weapon)}">${UIUtils.escapeHtml(weapon)}</span>
      <div style="display: flex; gap: 8px;">
        <button class="btn btn-small btn-secondary" style="height: 30px;" onclick="app.views.settings.editWeapon(${index})">
          Bearbeiten
        </button>
        <button class="btn btn-small btn-danger" style="height: 30px;" onclick="app.views.settings.deleteWeapon(${index})">
          Löschen
        </button>
      </div>
    `;

      weaponsList.appendChild(weaponItem);
    });
  }

  addWeapon() {
    try {
      const nameInput = document.getElementById("newWeaponName");
      const name = nameInput.value.trim();

      if (!name) {
        alert("Bitte geben Sie einen Namen für die Waffe ein.");
        return;
      }

      if (storage.availableWeapons.includes(name)) {
        alert("Diese Waffe existiert bereits.");
        return;
      }

      storage.addWeapon(name);
      nameInput.value = "";
      this.updateWeaponsList();

      UIUtils.showSuccessMessage("Waffe hinzugefügt");
    } catch (error) {
      console.error("Error adding weapon:", error);
      alert("Fehler beim Hinzufügen der Waffe: " + error.message);
    }
  }

  editWeapon(index) {
    try {
      const currentName = storage.availableWeapons[index];
      const newName = prompt("Waffe bearbeiten:", currentName);

      if (newName === null) return;

      const trimmedName = newName.trim();
      if (!trimmedName) {
        alert("Waffenname darf nicht leer sein.");
        return;
      }

      if (trimmedName === currentName) return;

      if (storage.availableWeapons.includes(trimmedName)) {
        alert("Diese Waffe existiert bereits.");
        return;
      }

      storage.updateWeapon(index, trimmedName);
      this.updateWeaponsList();

      UIUtils.showSuccessMessage("Waffe bearbeitet");
    } catch (error) {
      console.error("Error editing weapon:", error);
      alert("Fehler beim Bearbeiten der Waffe: " + error.message);
    }
  }

  deleteWeapon(index) {
    try {
      const weaponName = storage.availableWeapons[index];
      if (confirm(`Möchten Sie die Waffe "${weaponName}" wirklich löschen?`)) {
        storage.deleteWeapon(index);
        this.updateWeaponsList();
        UIUtils.showSuccessMessage("Waffe gelöscht");
      }
    } catch (error) {
      console.error("Error deleting weapon:", error);
      alert("Fehler beim Löschen der Waffe: " + error.message);
    }
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

  // NEU: Backup/Restore Section
  createBackupRestoreSection() {
    const section = document.createElement("div");
    section.className = "card";
    section.innerHTML = `
    <h3>Backup & Restore</h3>
    <div style="margin-top: 12px;">
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">
        <button class="btn btn-primary" onclick="app.views.settings.exportSettings()" 
                style="padding: 12px; font-weight: bold; height: 45px;">
          💾 Backup
        </button>
        <button class="btn btn-secondary" onclick="app.views.settings.showImportSettings()" 
                style="padding: 12px; height: 45px;">
          📁 Restore
        </button>
      </div>
      
      <div style="background-color: #f0f8ff; padding: 12px; border-radius: 6px; border-left: 4px solid #0066cc;">
        <div style="font-size: 13px; color: #0066cc; margin-bottom: 4px; font-weight: 500;">
          💡 Vollständiges Backup:
        </div>
        <div style="font-size: 12px; color: #4a5568; line-height: 1.4;">
          • <strong>Backup:</strong> Sichert ALLE Daten (Teams, Ergebnisse, Einstellungen)<br>
          • <strong>Restore:</strong> Stellt alle Daten wieder her<br>
          • <strong>Empfehlung:</strong> Regelmäßige Backups vor wichtigen Änderungen
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

  createOverlayScaleSection() {
    const section = document.createElement("div");
    section.className = "card";
    section.innerHTML = `
    <h3>Foto-Overlay Einstellungen</h3>
    <div style="margin-top: 12px;">
      <!-- Größe -->
      <label style="display: block; font-weight: 600; margin-bottom: 8px;">
        Overlay-Größe: <span id="scaleValue">${storage.settings.overlayScale || 3.0}x</span>
      </label>
      <input type="range" id="overlayScaleSlider" 
             min="0.5" max="5.0" step="0.1" 
             value="${storage.settings.overlayScale || 3.0}"
             style="width: 100%; margin-bottom: 16px;">
             <div style="display: flex; justify-content: space-between; font-size: 12px; color: #666; margin-top: 4px; margin-bottom: 12px;">
        <span>klein (0,5x)</span>
        <span>Standard (3x)</span>
        <span>groß (5x)</span>
      </div>
      
      <!-- Transparenz -->
      <label style="display: block; font-weight: 600; margin-bottom: 8px;">
        Transparenz: <span id="opacityValue">${Math.round((storage.settings.overlayOpacity || 0.8) * 100)}%</span>
      </label>
      <input type="range" id="overlayOpacitySlider" 
             min="0.2" max="1.0" step="0.1" 
             value="${storage.settings.overlayOpacity || 0.8}"
             style="width: 100%;">
      <div style="display: flex; justify-content: space-between; font-size: 12px; color: #666; margin-top: 4px;">
        <span>sehr Duchsichtig (20%)</span>
        <span>Standard (80%)</span>
        <span>Undurchsichtig (100%)</span>
      </div>
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
    <span style="color: #8e8e93;">${APP_VERSION}</span>
		</div>
		<div style="display: flex; justify-content: space-between; padding: 8px 0;">
		<span>Rundenkampfbericht</span>
		<span style="color: #8e8e93;">© 2026</span>
		</div>
		</div>
		<div style="margin-top: 16px;">
		<button class="btn btn-danger" onclick="app.views.settings.resetApp()" style="width: 100%;">
		App zurücksetzen
		</button>
		</div>
		`;
    return section;
  }

  setupEventListeners() {
    const competitionTypeSelect = document.getElementById(
      "competitionTypeSelect",
    );
    const currentDisciplineSelect = document.getElementById(
      "currentDisciplineSelect",
    );

    const scaleSlider = document.getElementById("overlayScaleSlider");
    const scaleValue = document.getElementById("scaleValue");

    // ✅ KORREKTUR: opacitySlider richtig definieren
    const opacitySlider = document.getElementById("overlayOpacitySlider");
    const opacityValue = document.getElementById("opacityValue");

    if (scaleSlider && scaleValue) {
      scaleSlider.addEventListener("input", (e) => {
        const value = parseFloat(e.target.value);
        scaleValue.textContent = `${value}x`;
        storage.settings.overlayScale = value;
        storage.save();
      });
    }

    // ✅ Jetzt funktioniert der Opacity Slider Event Listener
    if (opacitySlider && opacityValue) {
      opacitySlider.addEventListener("input", (e) => {
        const value = parseFloat(e.target.value);
        opacityValue.textContent = `${Math.round(value * 100)}%`;
        storage.settings.overlayOpacity = value;
        storage.save();
      });
    }

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

    this.updateWeaponsList();

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

  // NEU: Separate Event-Listener-Methode für Label-Settings:
  setupLabelSettingsEventListeners() {
    console.log("Setting up label settings event listeners...");

    // Slider-Updates mit intelligenter Formatierung
    const sliders = [
      { name: "labelWidth", decimals: 1 },
      { name: "labelHeight", decimals: 1 },
      { name: "marginTop", decimals: 1 },
      { name: "marginBottom", decimals: 1 },
      { name: "marginLeft", decimals: 1 },
      { name: "marginRight", decimals: 1 },
      { name: "columns", decimals: 0 }, // Ganzzahl
      { name: "rows", decimals: 0 }, // Ganzzahl
      { name: "skipLabels", decimals: 0 }, // Ganzzahl
      { name: "copies", decimals: 0 }, // Ganzzahl
      { name: "labelSpacing", decimals: 1 },
    ];

    sliders.forEach((setting) => {
      const slider = document.getElementById(`${setting.name}Slider`);
      const valueDisplay = document.getElementById(`${setting.name}Value`);

      console.log(
        `Setting up slider for ${setting.name}:`,
        slider ? "found" : "not found",
      );

      if (slider && valueDisplay) {
        // Event-Listener hinzufügen
        slider.addEventListener("input", (e) => {
          const value = parseFloat(e.target.value);

          // Formatierung: Ganzzahlen ohne Dezimale, sonst mit Dezimale
          if (setting.decimals === 0) {
            valueDisplay.textContent = Math.round(value).toString();
          } else {
            // Zeige Dezimale nur wenn nötig
            const formatted =
              value % 1 === 0
                ? Math.round(value).toString()
                : value.toFixed(setting.decimals);
            valueDisplay.textContent = formatted;
          }

          console.log(`${setting.name} updated to:`, value);
        });

        // Initial-Wert setzen
        const currentSettings = storage.getLabelSettings();
        const currentValue = currentSettings[setting.name];
        if (currentValue !== undefined) {
          slider.value = currentValue;

          // Display aktualisieren
          if (setting.decimals === 0) {
            valueDisplay.textContent = Math.round(currentValue).toString();
          } else {
            const formatted =
              currentValue % 1 === 0
                ? Math.round(currentValue).toString()
                : currentValue.toFixed(setting.decimals);
            valueDisplay.textContent = formatted;
          }
        }
      } else {
        console.warn(`Slider or value display not found for ${setting.name}`);
      }
    });

    // Speichern Button
    const saveBtn = document.getElementById("saveLabelSettingsBtn");
    console.log("Save button:", saveBtn ? "found" : "not found");

    if (saveBtn) {
      saveBtn.addEventListener("click", () => {
        console.log("Save button clicked");
        this.saveLabelSettings();
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
        'button[onclick="app.views.settings.uploadLogo()"]',
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
            "KB",
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
              "Das Logo ist zu groß für den verfügbaren Speicher. Versuchen Sie ein kleineres Bild oder komprimieren Sie es.",
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
          "Möchten Sie das Vereinslogo wirklich löschen?\n\nEs wird dann nicht mehr im PDF-Bericht angezeigt.",
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

  // NEU: Backup/Restore Methoden
  // Ersetzen Sie die exportSettings() Methode:
  exportSettings() {
    try {
      // KOMPLETTES Backup - Einstellungen UND alle Daten
      const completeBackup = {
        // Alle Teams und Ergebnisse
        teams: storage.teams.map((t) => t.toJSON()),
        standaloneShooters: storage.standaloneShooters.map((s) => s.toJSON()),
        results: storage.results.map((r) => r.toJSON()),

        // Filter-Einstellungen
        visibleTeamIds: storage.visibleTeamIds
          ? Array.from(storage.visibleTeamIds)
          : null,
        visibleShooterIds: storage.visibleShooterIds
          ? Array.from(storage.visibleShooterIds)
          : null,

        // Disziplinen und Waffen
        availableDisciplines: storage.availableDisciplines,
        availableWeapons: storage.availableWeapons,
        selectedDiscipline: storage.selectedDiscipline,
        selectedCompetitionType: storage.selectedCompetitionType,

        // App-Einstellungen (Logo, Overlay-Einstellungen, etc.)
        settings: storage.settings,

        // NEU: Label-Einstellungen hinzufügen
        labelSettings: storage.getLabelSettings(),

        // Meta-Informationen
        exportDate: new Date().toISOString(),
        exportVersion: APP_VERSION || "1.0.0",
        exportType: "complete", // Marker für vollständiges Backup
      };

      const dataStr = JSON.stringify(completeBackup, null, 2);
      const blob = new Blob([dataStr], { type: "application/json" });

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;

      const timestamp = new Date()
        .toISOString()
        .slice(0, 19)
        .replace(/:/g, "-");
      // GEÄNDERT: Dateiname zeigt, dass es ein vollständiges Backup ist
      link.download = `rundenkampf-backup-${timestamp}.json`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      UIUtils.showSuccessMessage("Backup erstellt!");
    } catch (error) {
      console.error("Error creating complete backup:", error);
      alert("Fehler beim Erstellen des Backups: " + error.message);
    }
  }

  showImportSettings() {
    const content = document.createElement("div");
    content.innerHTML = `
    <div class="form-section">
      <div class="form-section-header">Wiederherstellen eines Backup</div>
      <div class="form-row">
        <p style="margin-bottom: 12px; font-size: 14px; color: #666;">
          Wählen Sie eine zuvor exportierte Backup-Datei aus.<br>
          <strong>Achtung:</strong> Bei einem Restore werden ALLE aktuellen Daten überschrieben!
        </p>
        <input type="file" id="settingsFileInput" accept=".json" class="form-input" style="padding: 8px;">
      </div>
    </div>
    
    <div class="form-section">
      <div class="form-section-header">Vorschau</div>
      <div id="settingsPreview" style="max-height: 200px; overflow-y: auto; font-family: monospace; font-size: 12px; background: #f8f9fa; padding: 8px; border-radius: 4px;">
        Keine Datei ausgewählt
      </div>
    </div>
  `;

    const modal = new ModalComponent("Restore", content);

    modal.addAction("Abbrechen", null, false, false);
    modal.addAction(
      "Restore",
      () => {
        this.processSettingsImport();
      },
      true,
      false,
    );

    modal.show();

    // Setup file input handler
    setTimeout(() => {
      const fileInput = document.getElementById("settingsFileInput");
      if (fileInput) {
        fileInput.addEventListener("change", (e) => {
          this.previewSettingsFile(e.target.files[0]);
        });
      }
    }, 100);
  }

  previewSettingsFile(file) {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target.result;
        const settingsData = JSON.parse(content);

        let preview = "<strong>Backup-Inhalt:</strong><br><br>";

        // Export-Informationen
        if (settingsData.exportDate) {
          const exportDate = new Date(settingsData.exportDate).toLocaleString(
            "de-DE",
          );
          preview += `📅 <strong>Export-Datum:</strong> ${exportDate}<br>`;
        }

        if (settingsData.exportVersion) {
          preview += `🏷️ <strong>Version:</strong> ${settingsData.exportVersion}<br>`;
        }

        // NEU: Label-Einstellungen Preview
        if (settingsData.labelSettings) {
          preview += `🏷️ <strong>Label-Einstellungen:</strong> Enthalten<br>`;
        }

        // Backup-Typ erkennen
        if (settingsData.exportType === "complete") {
          preview += `📦 <strong>Backup-Typ:</strong> Full Backup<br><br>`;
        } else {
          preview += `⚙️ <strong>Backup-Typ:</strong> Nur Einstellungen<br><br>`;
        }

        // TEAMS UND ERGEBNISSE (NEU)
        if (settingsData.teams && settingsData.teams.length > 0) {
          preview += `👥 <strong>Teams:</strong> ${settingsData.teams.length} Einträge<br>`;
        }

        if (
          settingsData.standaloneShooters &&
          settingsData.standaloneShooters.length > 0
        ) {
          preview += `👤 <strong>Einzelschützen:</strong> ${settingsData.standaloneShooters.length} Einträge<br>`;
        }

        if (settingsData.results && settingsData.results.length > 0) {
          preview += `🎯 <strong>Ergebnisse:</strong> ${settingsData.results.length} Einträge<br>`;
        }

        // Trennlinie wenn Daten vorhanden sind
        if (
          settingsData.teams ||
          settingsData.standaloneShooters ||
          settingsData.results
        ) {
          preview += `<br>`;
        }

        // EINSTELLUNGEN
        if (settingsData.selectedCompetitionType) {
          preview += `🎯 <strong>Wettbewerbsmodus:</strong> ${settingsData.selectedCompetitionType}<br>`;
        }

        if (settingsData.selectedDiscipline) {
          preview += `📋 <strong>Aktuelle Disziplin:</strong> ${settingsData.selectedDiscipline}<br>`;
        }

        if (
          settingsData.availableDisciplines &&
          settingsData.availableDisciplines.length > 0
        ) {
          preview += `📝 <strong>Disziplinen:</strong> ${settingsData.availableDisciplines.length} Einträge<br>`;
        }

        // Waffen-Vorschau
        if (
          settingsData.availableWeapons &&
          settingsData.availableWeapons.length > 0
        ) {
          preview += `🔫 <strong>Waffen:</strong> ${settingsData.availableWeapons.length} Einträge<br>`;
        }

        if (settingsData.settings && settingsData.settings.clubLogo) {
          preview += `🖼️ <strong>Vereinslogo:</strong> Enthalten<br>`;
        }

        // Filter-Einstellungen (NEU)
        if (settingsData.visibleTeamIds) {
          preview += `🔍 <strong>Team-Filter:</strong> ${settingsData.visibleTeamIds.length} Teams sichtbar<br>`;
        }

        if (settingsData.visibleShooterIds) {
          preview += `🔍 <strong>Schützen-Filter:</strong> ${settingsData.visibleShooterIds.length} Einzelschützen sichtbar<br>`;
        }

        const previewDiv = document.getElementById("settingsPreview");
        if (previewDiv) {
          previewDiv.innerHTML = preview;
        }
      } catch (error) {
        const previewDiv = document.getElementById("settingsPreview");
        if (previewDiv) {
          previewDiv.innerHTML = `<span style="color: red;">❌ Fehler: Ungültige JSON-Datei</span>`;
        }
      }
    };

    reader.readAsText(file, "UTF-8");
  }

  processSettingsImport() {
    const fileInput = document.getElementById("settingsFileInput");
    const file = fileInput?.files[0];

    if (!file) {
      alert("Bitte wählen Sie eine Backup-Datei aus.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target.result;
        const backupData = JSON.parse(content);

        // Prüfe ob es ein vollständiges Backup ist
        if (backupData.exportType === "complete") {
          // Vollständiger Import über Storage
          storage.importData(backupData);
          UIUtils.showSuccessMessage("Backup wiederhergestellt!");
        } else {
          // Legacy: Nur Einstellungen importieren
          if (backupData.availableDisciplines)
            storage.availableDisciplines = backupData.availableDisciplines;
          if (backupData.availableWeapons)
            storage.availableWeapons = backupData.availableWeapons;
          if (backupData.selectedDiscipline)
            storage.selectedDiscipline = backupData.selectedDiscipline;
          if (backupData.selectedCompetitionType)
            storage.selectedCompetitionType =
              backupData.selectedCompetitionType;
          if (backupData.settings)
            storage.settings = { ...storage.settings, ...backupData.settings };

          // NEU: Label-Einstellungen importieren
          if (backupData.labelSettings)
            storage.saveLabelSettings(backupData.labelSettings);

          storage.save();
          UIUtils.showSuccessMessage("Einstellungen wiederhergestellt!");
        }

        // Ansicht aktualisieren
        setTimeout(() => app.showView("settings"), 1000);
      } catch (error) {
        console.error("Import error:", error);
        alert("Fehler beim Wiederherstellen: " + error.message);
      }
    };

    reader.readAsText(file, "UTF-8");
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
			<span style="flex: 1; height: 30px; max-width:50%; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; line-height: 30px;" title="${UIUtils.escapeHtml(discipline)}">${UIUtils.escapeHtml(discipline)}</span>
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
          `Möchten Sie die Disziplin "${disciplineName}" wirklich löschen?`,
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
        "Möchten Sie wirklich alle Daten zurücksetzen? Diese Aktion kann nicht rückgängig gemacht werden.",
      )
    ) {
      try {
        localStorage.removeItem("rundenkampf_bericht");
        UIUtils.showSuccessMessage(
          "App zurückgesetzt - Seite wird neu geladen...",
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
