class SettingsView {
	render() {
		const container = document.createElement('div');
		container.style.cssText = 'padding-bottom: 20px;'; // Zusätzlicher Container-Abstand
		
		try {
			// Competition Type Section
			const competitionSection = this.createCompetitionTypeSection();
			container.appendChild(competitionSection);

			// Current Discipline Section
			const currentDisciplineSection = this.createCurrentDisciplineSection();
			container.appendChild(currentDisciplineSection);

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
			}, 100);

		} catch (error) {
			console.error('Error rendering settings view:', error);
			container.innerHTML = `<div class="card" style="margin-bottom: 30px;"><p style="color: red;">Fehler beim Laden der Einstellungen: ${error.message}</p></div>`;
		}
		
		return container;
	}


	createCompetitionTypeSection() {
		const section = document.createElement('div');
		section.className = 'card';
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
		const section = document.createElement('div');
		section.className = 'card';
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

	createDisciplinesSection() {
		const section = document.createElement('div');
		section.className = 'card';
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
		const section = document.createElement('div');
		section.className = 'card';
		section.style.cssText = 'margin-bottom: 30px;'; // Zusätzlicher Abstand
		section.innerHTML = `
		<h3>App-Information</h3>
		<div style="margin-top: 12px;">
		<div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f0f0f0;">
		<span>App Version</span>
		<span style="color: #8e8e93;">1.21</span>
		</div>
		<div style="display: flex; justify-content: space-between; padding: 8px 0;">
		<span>Rundenkampfbericht</span>
		<span style="color: #8e8e93;">© 2025</span>
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
		const competitionTypeSelect = document.getElementById('competitionTypeSelect');
		const currentDisciplineSelect = document.getElementById('currentDisciplineSelect');

		if (competitionTypeSelect) {
			competitionTypeSelect.value = storage.selectedCompetitionType;
			competitionTypeSelect.addEventListener('change', (e) => {
				storage.selectedCompetitionType = e.target.value;
				storage.save();
				UIUtils.showSuccessMessage('Wettbewerbsmodus geändert');
				
				// Refresh overview if currently showing
				if (app && app.getCurrentView() === 'overview') {
					setTimeout(() => app.showView('overview'), 500);
				}
			});
		}

		if (currentDisciplineSelect) {
			currentDisciplineSelect.addEventListener('change', (e) => {
				storage.selectedDiscipline = e.target.value || null;
				storage.save();
				UIUtils.showSuccessMessage('Disziplin gewählt');
				
				// Refresh overview if currently showing
				if (app && app.getCurrentView() === 'overview') {
					setTimeout(() => app.showView('overview'), 500);
				}
			});
		}
	}

	updateCurrentDisciplineSelect() {
		const select = document.getElementById('currentDisciplineSelect');
		if (!select) return;

		select.innerHTML = '<option value="">Keine ausgewählt</option>';
		
		storage.availableDisciplines.forEach(discipline => {
			const option = document.createElement('option');
			option.value = discipline;
			option.textContent = discipline;
			if (discipline === storage.selectedDiscipline) {
				option.selected = true;
			}
			select.appendChild(option);
		});
	}

	updateDisciplinesList() {
		const disciplinesList = document.getElementById('disciplinesList');
		if (!disciplinesList) return;

		disciplinesList.innerHTML = '';

		if (storage.availableDisciplines.length === 0) {
			disciplinesList.innerHTML = '<p style="color: #8e8e93; font-style: italic;">Keine Disziplinen vorhanden</p>';
			return;
		}

		storage.availableDisciplines.forEach((discipline, index) => {
			const disciplineItem = document.createElement('div');
			disciplineItem.style.cssText = `
			display: flex;
			justify-content: space-between;
			align-items: center;
			padding: 8px 0;
			border-bottom: 1px solid #f0f0f0;
			`;
			
			disciplineItem.innerHTML = `
			<span style="flex: 1; height: 30px; max-width:60%;">${UIUtils.escapeHtml(discipline)}</span>
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
			const nameInput = document.getElementById('newDisciplineName');
			const name = nameInput.value.trim();
			
			if (!name) {
				alert('Bitte geben Sie einen Namen für die Disziplin ein.');
				return;
			}

			if (storage.availableDisciplines.includes(name)) {
				alert('Diese Disziplin existiert bereits.');
				return;
			}

			storage.addDiscipline(name);
			nameInput.value = '';
			this.updateDisciplinesList();
			this.updateCurrentDisciplineSelect();
			
			UIUtils.showSuccessMessage('Disziplin hinzugefügt');
			
		} catch (error) {
			console.error('Error adding discipline:', error);
			alert('Fehler beim Hinzufügen der Disziplin: ' + error.message);
		}
	}

	editDiscipline(index) {
		try {
			const currentName = storage.availableDisciplines[index];
			const newName = prompt('Disziplin bearbeiten:', currentName);
			
			if (newName === null) return;
			
			const trimmedName = newName.trim();
			if (!trimmedName) {
				alert('Disziplinname darf nicht leer sein.');
				return;
			}
			
			if (trimmedName === currentName) return;
			
			if (storage.availableDisciplines.includes(trimmedName)) {
				alert('Diese Disziplin existiert bereits.');
				return;
			}

			storage.updateDiscipline(index, trimmedName);
			this.updateDisciplinesList();
			this.updateCurrentDisciplineSelect();
			
			UIUtils.showSuccessMessage('Disziplin bearbeitet');
			
		} catch (error) {
			console.error('Error editing discipline:', error);
			alert('Fehler beim Bearbeiten der Disziplin: ' + error.message);
		}
	}

	deleteDiscipline(index) {
		try {
			const disciplineName = storage.availableDisciplines[index];
			if (confirm(`Möchten Sie die Disziplin "${disciplineName}" wirklich löschen?`)) {
				storage.deleteDiscipline(index);
				this.updateDisciplinesList();
				this.updateCurrentDisciplineSelect();
				
				UIUtils.showSuccessMessage('Disziplin gelöscht');
			}
		} catch (error) {
			console.error('Error deleting discipline:', error);
			alert('Fehler beim Löschen der Disziplin: ' + error.message);
		}
	}

	resetApp() {
		if (confirm('Möchten Sie wirklich alle Daten zurücksetzen? Diese Aktion kann nicht rückgängig gemacht werden.')) {
			try {
				localStorage.removeItem('rundenkampf_bericht');
				UIUtils.showSuccessMessage('App zurückgesetzt - Seite wird neu geladen...');
				
				setTimeout(() => {
					location.reload();
				}, 1500);
				
			} catch (error) {
				console.error('Error resetting app:', error);
				alert('Fehler beim Zurücksetzen: ' + error.message);
			}
		}
	}
}
