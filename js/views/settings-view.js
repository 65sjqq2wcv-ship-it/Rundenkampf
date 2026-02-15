console.log("🔄 Loading settings-view.js...");

class SettingsView {
  constructor() {
    console.log("🏗️ SettingsView constructor called");
  }

  render() {
    console.log("🎨 SettingsView render called");

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

  createCompetitionTypeSection() {
    const section = document.createElement("div");
    section.className = "card";
    section.innerHTML = `
      <h3>Wettbewerbsmodus</h3>
      <div class="form-section">
        <div class="form-row">
          <select id="competitionTypeSelect" class="form-input">
            <option value="$${CompetitionType.PRAEZISION_DUELL}" $${storage.selectedCompetitionType === CompetitionType.PRAEZISION_DUELL ? "selected" : ""}>
              ${CompetitionType.PRAEZISION_DUELL}
            </option>
            <option value="$${CompetitionType.ANNEX_SCHEIBE}" $${storage.selectedCompetitionType === CompetitionType.ANNEX_SCHEIBE ? "selected" : ""}>
              ${CompetitionType.ANNEX_SCHEIBE}
            </option>
          </select>
        </div>
      </div>
    `;
    return section;
  }

  createCurrentDisciplineSection() {
    const section = document.createElement("div");
    section.className = "card";
    section.innerHTML = `
      <h3>Aktuelle Disziplin</h3>
      <div class="form-section">
        <div class="form-row">
          <select id="currentDisciplineSelect" class="form-input">
            <option value="">Keine ausgewählt</option>
          </select>
        </div>
      </div>
    `;
    return section;
  }

  createOverlayScaleSection() {
    const section = document.createElement("div");
    section.className = "card";
    const overlayScale = storage.settings.overlayScale || 3.0;
    const overlayOpacity = storage.settings.overlayOpacity || 0.8;

    section.innerHTML = `
      <h3>📷 Foto-Overlay Einstellungen</h3>
      <div class="form-section">
        <div class="form-row">
          <label style="display: block; margin-bottom: 4px; font-weight: 500;">
            Overlay-Größe: <span id="overlayScaleValue">${overlayScale.toFixed(1)}x</span>
          </label>
          <input type="range" id="overlayScaleSlider" min="0.5" max="5.0" step="0.1" value="${overlayScale}"
                 style="width: 100%; margin-bottom: 8px;">
          <div style="display: flex; justify-content: space-between; font-size: 12px; color: #666; margin-bottom: 16px;">
            <span>klein (0,5x)</span>
            <span>Standard (3x)</span>
            <span>groß (5x)</span>
          </div>
        </div>
        
        <div class="form-row">
          <label style="display: block; margin-bottom: 4px; font-weight: 500;">
            Transparenz: <span id="overlayOpacityValue">${Math.round(overlayOpacity * 100)}%</span>
          </label>
          <input type="range" id="overlayOpacitySlider" min="0.2" max="1.0" step="0.1" value="${overlayOpacity}"
                 style="width: 100%; margin-bottom: 8px;">
          <div style="display: flex; justify-content: space-between; font-size: 12px; color: #666;">
            <span>sehr Durchsichtig (20%)</span>
            <span>Standard</span>
            <span>Undurchsichtig (100%)</span>
          </div>
        </div>
      </div>
    `;
    return section;
  }

  createLogoUploadSection() {
    const section = document.createElement("div");
    section.className = "card";
    section.innerHTML = `
      <h3>Vereinslogo</h3>
      <div id="logoPreview" style="text-align: center; margin-bottom: 16px;"></div>
      <p style="text-align: center; margin-bottom: 16px; color: #666;">Laden Sie ein Vereinslogo hoch</p>
      
      <div class="form-section">
        <div class="form-row">
          <input type="file" id="logoUpload" accept="image/*" class="form-input">
        </div>
        <div class="form-row" style="display: flex; gap: 8px;">
          <button class="btn btn-primary" onclick="app.views.settings.uploadLogo()" style="flex: 1;">
            📂 Hochladen
          </button>
          <button class="btn btn-danger" onclick="app.views.settings.removeLogo()" style="flex: 1;">
            🗑️ Löschen
          </button>
        </div>
      </div>
      
      <div style="background: #f8f9fa; border-radius: 8px; padding: 12px; margin-top: 16px;">
        <h4 style="margin: 0 0 8px 0; font-size: 14px;">📋 Anforderungen:</h4>
        <ul style="margin: 0; padding-left: 20px; font-size: 12px; color: #666;">
          <li><strong>Größe:</strong> Mindestens 200×200px empfohlen</li>
          <li><strong>Format:</strong> JPG, PNG oder GIF</li>
          <li><strong>Dateigröße:</strong> Maximal 5MB</li>
          <li><strong>Verwendung:</strong> Wird im PDF-Bericht angezeigt</li>
        </ul>
      </div>
    `;
    return section;
  }

  // GEÄNDERT: Label-Einstellungen mit Input-Feldern statt Slidern
  createLabelSettingsSection() {
    const section = document.createElement("div");
    section.className = "card";

    const labelSettings = storage.getLabelSettings();

    section.innerHTML = `
      <h3 style="margin-bottom: 16px;">📄 Label-Einstellungen</h3>
      
      <div class="form-section">
        <div class="form-section-header">Label-Abmessungen</div>
        
        <div class="form-row" style="display: flex; gap: 8px;">
          <div style="flex: 1;">
            <label style="display: block; margin-bottom: 4px; font-weight: 500;">
              Label-Breite (mm)
            </label>
            <input type="number" id="labelWidthInput" min="30.0" max="100.0" step="0.1" 
                   value="${labelSettings.labelWidth}" 
                   style="width: 100%; padding: 8px; border: 1px solid #d1d1d6; border-radius: 8px; font-size: 16px;">
          </div>
          <div style="flex: 1;">
            <label style="display: block; margin-bottom: 4px; font-weight: 500;">
              Label-Höhe (mm)
            </label>
            <input type="number" id="labelHeightInput" min="15.0" max="60.0" step="0.1" 
                   value="${labelSettings.labelHeight}" 
                   style="width: 100%; padding: 8px; border: 1px solid #d1d1d6; border-radius: 8px; font-size: 16px;">
          </div>
        </div>
      </div>

      <div class="form-section">
        <div class="form-section-header">Seitenränder</div>
        
        <div class="form-row" style="display: flex; gap: 8px;">
          <div style="flex: 1;">
            <label style="display: block; margin-bottom: 4px; font-weight: 500;">
              Rand oben (mm)
            </label>
            <input type="number" id="marginTopInput" min="0.0" max="30.0" step="0.1" 
                   value="${labelSettings.marginTop}" 
                   style="width: 100%; padding: 8px; border: 1px solid #d1d1d6; border-radius: 8px; font-size: 16px;">
          </div>
          <div style="flex: 1;">
            <label style="display: block; margin-bottom: 4px; font-weight: 500;">
              Rand unten (mm)
            </label>
            <input type="number" id="marginBottomInput" min="0.0" max="30.0" step="0.1" 
                   value="${labelSettings.marginBottom}" 
                   style="width: 100%; padding: 8px; border: 1px solid #d1d1d6; border-radius: 8px; font-size: 16px;">
          </div>
        </div>
        
        <div class="form-row" style="display: flex; gap: 8px;">
          <div style="flex: 1;">
            <label style="display: block; margin-bottom: 4px; font-weight: 500;">
              Rand links (mm)
            </label>
            <input type="number" id="marginLeftInput" min="0.0" max="30.0" step="0.1" 
                   value="${labelSettings.marginLeft || 0}" 
                   style="width: 100%; padding: 8px; border: 1px solid #d1d1d6; border-radius: 8px; font-size: 16px;">
          </div>
          <div style="flex: 1;">
            <label style="display: block; margin-bottom: 4px; font-weight: 500;">
              Rand rechts (mm)
            </label>
            <input type="number" id="marginRightInput" min="0.0" max="30.0" step="0.1" 
                   value="${labelSettings.marginRight || 0}" 
                   style="width: 100%; padding: 8px; border: 1px solid #d1d1d6; border-radius: 8px; font-size: 16px;">
          </div>
        </div>
      </div>

      <div class="form-section">
        <div class="form-section-header">Layout</div>
        
        <div class="form-row" style="display: flex; gap: 8px;">
          <div style="flex: 1;">
            <label style="display: block; margin-bottom: 4px; font-weight: 500;">
              Spalten
            </label>
            <input type="number" id="columnsInput" min="1" max="4" step="1" 
                   value="${labelSettings.columns}" 
                   style="width: 100%; padding: 8px; border: 1px solid #d1d1d6; border-radius: 8px; font-size: 16px;">
          </div>
          <div style="flex: 1;">
            <label style="display: block; margin-bottom: 4px; font-weight: 500;">
              Zeilen
            </label>
            <input type="number" id="rowsInput" min="1" max="20" step="1" 
                   value="${labelSettings.rows}" 
                   style="width: 100%; padding: 8px; border: 1px solid #d1d1d6; border-radius: 8px; font-size: 16px;">
          </div>
        </div>

        <div class="form-row">
          <label style="display: block; margin-bottom: 4px; font-weight: 500;">
            Abstand zwischen Labels (mm)
          </label>
          <input type="number" id="labelSpacingInput" min="0.0" max="10.0" step="0.1" 
                 value="${labelSettings.labelSpacing || 0}" 
                 style="width: 100%; padding: 8px; border: 1px solid #d1d1d6; border-radius: 8px; font-size: 16px;">
        </div>
      </div>

      <div class="form-section">
        <div class="form-section-header">Darstellungsoptionen</div>
        
        <div class="form-row">
          <label style="display: flex; align-items: center; gap: 8px; font-weight: 500;">
            <input type="checkbox" id="showBordersCheckbox" ${labelSettings.showBorders ? "checked" : ""} 
                   style="transform: scale(1.2);">
            <span>Rahmen um Labels anzeigen</span>
          </label>
        </div>
      </div>

      <div class="form-section">
        <div class="form-section-header">Druckoptionen</div>
    <div class="form-row">
      <label style="display: block; margin-bottom: 4px; font-weight: 500;">
        Überspringe Felder (für alte Bögen)
      </label>
      <input type="number" id="skipLabelsInput" min="0" max="50" step="1" 
             value="${labelSettings.skipLabels}" 
             style="width: 100%; padding: 8px; border: 1px solid #d1d1d6; border-radius: 8px; font-size: 16px;">
    </div>
    
    <div class="form-row">
          <label style="display: block; margin-bottom: 4px; font-weight: 500;">
            Anzahl Kopien
          </label>
          <input type="number" id="copiesInput" min="1" max="5" step="1" 
             value="${labelSettings.copies}" 
             style="width: 100%; padding: 8px; border: 1px solid #d1d1d6; border-radius: 8px; font-size: 16px;">
        </div>
     </div>
     
     </div>
     <div class="form-row">
       <button class="btn btn-primary" id="saveLabelSettingsBtn" style="width: 100%;">
         Label-Einstellungen speichern
       </button>
     </div>
    `;

    return section;
  }

  createBackupRestoreSection() {
    const section = document.createElement("div");
    section.className = "card";
    section.innerHTML = `
      <h3>Backup & Restore</h3>
      
      <div style="display: flex; gap: 12px; margin-bottom: 16px;">
        <button class="btn btn-primary" onclick="app.views.settings.createFullBackup()" style="flex: 1; height: 60px; font-size: 16px;">
          💾 Backup
        </button>
        <button class="btn btn-secondary" onclick="app.views.settings.showImportSettings()" style="flex: 1; height: 60px; font-size: 16px;">
          📂 Restore
        </button>
      </div>
      
      <div style="background: #e3f2fd; border-left: 4px solid #2196f3; padding: 12px; border-radius: 8px;">
        <div style="font-weight: 600; margin-bottom: 8px;">💡 Vollständiges Backup:</div>
        <ul style="margin: 0; padding-left: 20px; font-size: 14px;">
          <li><strong>Backup:</strong> Sichert ALLE Daten (Teams, Ergebnisse, Einstellungen)</li>
          <li><strong>Restore:</strong> Stellt alle Daten wieder her</li>
          <li><strong>Empfehlung:</strong> Regelmäßige Backups vor wichtigen Änderungen</li>
        </ul>
      </div>
    `;
    return section;
  }

  createDisciplinesSection() {
    const section = document.createElement("div");
    section.className = "card";
    section.innerHTML = `
      <h3>Verfügbare Disziplinen</h3>
      <div id="disciplinesList" style="margin-top: 12px;"></div>
      <div style="margin-top: 16px; display: flex; gap: 8px;">
        <input type="text" id="newDisciplineName" placeholder="Neue Disziplin" 
               style="flex: 1; padding: 12px; border: 1px solid #d1d1d6; border-radius: 8px; font-size: 16px; height:40px;">
        <button class="btn btn-secondary" onclick="app.views.settings.addDiscipline()" 
                style="padding: 8px 12px; height: 40px;">Hinzufügen</button>
      </div>
    `;
    return section;
  }

  createWeaponsSection() {
    const section = document.createElement("div");
    section.className = "card";
    section.innerHTML = `
      <h3>Verfügbare Waffen</h3>
      <div id="weaponsList" style="margin-top: 12px;"></div>
      <div style="margin-top: 16px; display: flex; gap: 8px;">
        <input type="text" id="newWeaponName" placeholder="Neue Waffe" 
               style="flex: 1; padding: 12px; border: 1px solid #d1d1d6; border-radius: 8px; font-size: 16px; height:40px;">
        <button class="btn btn-secondary" onclick="app.views.settings.addWeapon()" 
                style="padding: 8px 12px; height: 40px;">Hinzufügen</button>
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
    if (competitionTypeSelect) {
      competitionTypeSelect.addEventListener("change", (e) => {
        storage.selectedCompetitionType = e.target.value;
        storage.save();
        UIUtils.showSuccessMessage("Wettbewerbsmodus geändert");
      });
    }

    const currentDisciplineSelect = document.getElementById(
      "currentDisciplineSelect",
    );
    if (currentDisciplineSelect) {
      currentDisciplineSelect.addEventListener("change", (e) => {
        storage.selectedDiscipline = e.target.value;
        storage.save();
        UIUtils.showSuccessMessage("Aktuelle Disziplin geändert");
      });
    }

    const overlayScaleSlider = document.getElementById("overlayScaleSlider");
    const overlayScaleValue = document.getElementById("overlayScaleValue");
    if (overlayScaleSlider && overlayScaleValue) {
      overlayScaleSlider.addEventListener("input", (e) => {
        const value = parseFloat(e.target.value);
        overlayScaleValue.textContent = value.toFixed(1) + "x";
        storage.settings.overlayScale = value;
        storage.save();
      });
    }

    const overlayOpacitySlider = document.getElementById(
      "overlayOpacitySlider",
    );
    const overlayOpacityValue = document.getElementById("overlayOpacityValue");
    if (overlayOpacitySlider && overlayOpacityValue) {
      overlayOpacitySlider.addEventListener("input", (e) => {
        const value = parseFloat(e.target.value);
        overlayOpacityValue.textContent = Math.round(value * 100) + "%";
        storage.settings.overlayOpacity = value;
        storage.save();
      });
    }
  }

  // GEÄNDERT: setupLabelSettingsEventListeners für Input-Felder
  setupLabelSettingsEventListeners() {
    console.log(
      "Setting up label settings event listeners (INPUT FIELDS ONLY)...",
    );

    const inputConfigs = [
      {
        id: "labelWidthInput",
        setting: "labelWidth",
        min: 30.0,
        max: 100.0,
        decimals: 1,
      },
      {
        id: "labelHeightInput",
        setting: "labelHeight",
        min: 15.0,
        max: 60.0,
        decimals: 1,
      },
      {
        id: "marginTopInput",
        setting: "marginTop",
        min: 0.0,
        max: 30.0,
        decimals: 1,
      },
      {
        id: "marginBottomInput",
        setting: "marginBottom",
        min: 0.0,
        max: 30.0,
        decimals: 1,
      },
      {
        id: "marginLeftInput",
        setting: "marginLeft",
        min: 0.0,
        max: 30.0,
        decimals: 1,
      },
      {
        id: "marginRightInput",
        setting: "marginRight",
        min: 0.0,
        max: 30.0,
        decimals: 1,
      },
      { id: "columnsInput", setting: "columns", min: 1, max: 4, decimals: 0 },
      { id: "rowsInput", setting: "rows", min: 1, max: 20, decimals: 0 },
      {
        id: "skipLabelsInput",
        setting: "skipLabels",
        min: 0,
        max: 50,
        decimals: 0,
      },
      { id: "copiesInput", setting: "copies", min: 1, max: 5, decimals: 0 },
      {
        id: "labelSpacingInput",
        setting: "labelSpacing",
        min: 0.0,
        max: 10.0,
        decimals: 1,
      },
    ];

    const currentSettings = storage.getLabelSettings();

    inputConfigs.forEach((config) => {
      const input = document.getElementById(config.id);
      if (input) {
        // Setze Initial-Wert
        const currentValue = currentSettings[config.setting];
        if (currentValue !== undefined) {
          if (config.decimals === 0) {
            input.value = Math.round(currentValue);
          } else {
            input.value = currentValue.toFixed(1);
          }
        }

        // Input-Validierung
        input.addEventListener("input", (e) => {
          let value = parseFloat(e.target.value);
          if (isNaN(value)) return;
          if (value < config.min) e.target.value = config.min;
          if (value > config.max) e.target.value = config.max;
          if (config.decimals === 0) {
            e.target.value = Math.round(parseFloat(e.target.value));
          }
        });

        // Verhindere ungültige Zeichen
        input.addEventListener("keypress", (e) => {
          const char = String.fromCharCode(e.which);
          const currentValue = e.target.value;

          if (
            !/[0-9.]/.test(char) &&
            ![8, 9, 13, 27, 46, 37, 38, 39, 40].includes(e.which)
          ) {
            e.preventDefault();
            return;
          }

          if (
            char === "." &&
            (currentValue.includes(".") || config.decimals === 0)
          ) {
            e.preventDefault();
            return;
          }
        });

        // Formatierung beim Verlassen
        input.addEventListener("blur", (e) => {
          const value = parseFloat(e.target.value);
          if (!isNaN(value)) {
            e.target.value =
              config.decimals === 0 ? Math.round(value) : value.toFixed(1);
          }
        });
      }
    });

    // Checkbox für Rahmen
    const bordersCheckbox = document.getElementById("showBordersCheckbox");
    if (bordersCheckbox) {
      bordersCheckbox.checked = currentSettings.showBorders || false;
    }

    // Speichern Button
    const saveBtn = document.getElementById("saveLabelSettingsBtn");
    if (saveBtn) {
      saveBtn.addEventListener("click", (e) => {
        e.preventDefault();
        this.saveLabelSettings();
      });
    }
  }

  // GEÄNDERT: saveLabelSettings für Input-Felder
  saveLabelSettings() {
    try {
      const settings = {
        labelWidth: parseFloat(
          document.getElementById("labelWidthInput").value,
        ),
        labelHeight: parseFloat(
          document.getElementById("labelHeightInput").value,
        ),
        marginTop: parseFloat(document.getElementById("marginTopInput").value),
        marginBottom: parseFloat(
          document.getElementById("marginBottomInput").value,
        ),
        marginLeft: parseFloat(
          document.getElementById("marginLeftInput").value,
        ),
        marginRight: parseFloat(
          document.getElementById("marginRightInput").value,
        ),
        columns: parseInt(document.getElementById("columnsInput").value),
        rows: parseInt(document.getElementById("rowsInput").value),
        skipLabels: parseInt(document.getElementById("skipLabelsInput").value),
        copies: parseInt(document.getElementById("copiesInput").value),
        labelSpacing: parseFloat(
          document.getElementById("labelSpacingInput").value,
        ),
        showBorders: document.getElementById("showBordersCheckbox").checked,
      };

      // Validiere die Settings
      for (const [key, value] of Object.entries(settings)) {
        if (
          key !== "showBorders" &&
          (isNaN(value) || value === null || value === undefined)
        ) {
          throw new Error(`Ungültiger Wert für $${key}: $${value}`);
        }
      }

      storage.saveLabelSettings(settings);

      // CSS-Cache invalidieren
      if (typeof window.labelPrinter !== "undefined") {
        window.labelPrinter.invalidateCSS();
      }

      UIUtils.showSuccessMessage(
        "Label-Einstellungen gespeichert - Änderungen sind sofort aktiv",
      );
    } catch (error) {
      console.error("Error saving label settings:", error);
      UIUtils.showError("Fehler beim Speichern: " + error.message);
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

  updateLogoPreview() {
    const logoPreview = document.getElementById("logoPreview");
    if (!logoPreview) return;

    const logoData = storage.getLogo();

    if (logoData) {
      logoPreview.innerHTML = `
        <img src="${logoData}" alt="Vereinslogo" style="max-width: 200px; max-height: 100px; border-radius: 8px; border: 1px solid #ddd;">
        <p style="margin-top: 8px; font-size: 12px; color: #666;">Logo erfolgreich hochgeladen</p>
      `;
    } else {
      logoPreview.innerHTML = `
        <div style="width: 200px; height: 100px; border: 2px dashed #ddd; border-radius: 8px; display: flex; align-items: center; justify-content: center; margin: 0 auto; color: #999;">
          📷 Kein Logo
        </div>
      `;
    }
  }

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
          alert("Fehler beim Speichern des Logos: " + error.message);
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
      alert("Fehler beim Logo-Upload: " + error.message);
    }
  }

  removeLogo() {
    try {
      if (confirm("Möchten Sie das Logo wirklich entfernen?")) {
        storage.removeLogo();
        this.updateLogoPreview();
        UIUtils.showSuccessMessage("Logo entfernt");
      }
    } catch (error) {
      console.error("Error removing logo:", error);
      alert("Fehler beim Entfernen des Logos: " + error.message);
    }
  }

  createFullBackup() {
    try {
      const data = storage.exportData();
      const jsonString = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });

      const timestamp = new Date()
        .toISOString()
        .slice(0, 19)
        .replace(/:/g, "-");
      const filename = `rundenkampf-backup-${timestamp}.json`;

      // Download starten
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      link.style.display = "none";

      document.body.appendChild(link);
      link.click();

      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 100);

      UIUtils.showSuccessMessage("Backup erfolgreich erstellt");
      console.log("Backup created:", filename);
    } catch (error) {
      console.error("Error creating backup:", error);
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

  importBackup() {
    try {
      const fileInput = document.getElementById("backupFileInput");
      const file = fileInput.files[0];

      if (!file) {
        alert("Bitte wählen Sie eine Backup-Datei aus.");
        return;
      }

      if (!file.name.endsWith(".json")) {
        alert("Bitte wählen Sie eine gültige JSON-Backup-Datei aus.");
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const jsonData = e.target.result;
          const data = JSON.parse(jsonData);

          // Backup importieren
          const success = storage.importData(data);

          if (success) {
            UIUtils.showSuccessMessage(
              "Backup erfolgreich wiederhergestellt - Seite wird neu geladen",
            );

            // Seite nach kurzer Verzögerung neu laden
            setTimeout(() => {
              window.location.reload();
            }, 2000);
          }
        } catch (parseError) {
          console.error("Error parsing backup file:", parseError);
          alert(
            "Fehler beim Lesen der Backup-Datei. Bitte stellen Sie sicher, dass es sich um eine gültige Backup-Datei handelt.",
          );
        }
      };

      reader.onerror = () => {
        alert("Fehler beim Lesen der Datei.");
      };

      reader.readAsText(file);
    } catch (error) {
      console.error("Error importing backup:", error);
      alert("Fehler beim Wiederherstellen des Backups: " + error.message);
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

console.log("✅ SettingsView class definition completed");

// Teste ob die Klasse korrekt definiert wurde
if (typeof SettingsView === "undefined") {
  console.error("❌ SettingsView class definition failed!");
} else {
  console.log("✅ SettingsView class is available");
}
