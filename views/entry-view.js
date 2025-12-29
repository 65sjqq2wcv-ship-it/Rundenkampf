// =================================================================
// ENTRY VIEW - Sichere und wartbare Version
// =================================================================

class EntryView {
	constructor() {
		this.selectedTeamId = null;
		this.selectedShooterId = null;
		this.selectedDiscipline = Discipline.PRAEZISION;
		this.shots = new Array(40).fill(null);
		this.eventRegistry = new EventRegistry();
		this.isDestroyed = false;
	}

	// =================================================================
	// MAIN RENDER METHOD
	// =================================================================

	render() {
		const container = document.createElement('div');

		try {
			this.setupNavButtons();
			
			// Sichere Element-Erstellung
			const selectionCard = this.createSelectionCard();
			const shotsCard = this.createShotsCard();
			const controlsDiv = this.createControlsSection();
			
			container.appendChild(selectionCard);
			container.appendChild(shotsCard);
			container.appendChild(controlsDiv);

			this.initializeSelection();

		} catch (error) {
			console.error('Error rendering entry view:', error);
			this.showError(container, 'Fehler beim Laden der Erfassen-Ansicht');
		}

		return container;
	}

	// =================================================================
	// NAVIGATION SETUP
	// =================================================================

	setupNavButtons() {
		setTimeout(() => {
			const navButtons = document.getElementById('navButtons');
			if (navButtons) {
				navButtons.innerHTML = '';
			}
		}, 100);
	}

	// =================================================================
	// SELECTION CARD CREATION
	// =================================================================

	createSelectionCard() {
		const card = document.createElement('div');
		card.className = 'card';
		
		// Header
		const header = document.createElement('h3');
		header.textContent = 'Auswahl';
		card.appendChild(header);

		// Container für Formulare
		const formContainer = document.createElement('div');
		formContainer.style.marginTop = '16px';

		// Form Rows
		const teamRow = this.createFormRow('Mannschaft', this.createTeamSelect());
		const shooterRow = this.createFormRow('Schütze', this.createShooterSelect());
		const disciplineRow = this.createFormRow('Disziplin', this.createDisciplineSelect());

		formContainer.appendChild(teamRow);
		formContainer.appendChild(shooterRow);
		formContainer.appendChild(disciplineRow);
		card.appendChild(formContainer);

		// Sichere Event-Registrierung nach DOM-Insertion
		setTimeout(() => this.setupEventListeners(), 100);

		return card;
	}

	createFormRow(labelText, inputElement) {
		const row = document.createElement('div');
		row.className = 'form-row';

		const label = document.createElement('label');
		label.className = 'form-label';
		label.textContent = labelText;

		row.appendChild(label);
		row.appendChild(inputElement);
		return row;
	}

	createTeamSelect() {
		const select = document.createElement('select');
		select.className = 'form-select';
		select.id = 'teamSelect';
		
		// Sichere Option-Erstellung
		const defaultOption = document.createElement('option');
		defaultOption.value = '';
		defaultOption.textContent = '— Einzelschütze —';
		select.appendChild(defaultOption);

		return select;
	}

	createShooterSelect() {
		const select = document.createElement('select');
		select.className = 'form-select';
		select.id = 'shooterSelect';
		
		const defaultOption = document.createElement('option');
		defaultOption.value = '';
		defaultOption.textContent = '— keine —';
		select.appendChild(defaultOption);

		return select;
	}

	createDisciplineSelect() {
		const select = document.createElement('select');
		select.className = 'form-select';
		select.id = 'disciplineSelect';
		
		// Sichere Option-Erstellung für Disziplinen
		const disciplines = [
			{ value: Discipline.PRAEZISION, text: 'Präzision' },
			{ value: Discipline.DUELL, text: 'Duell' },
			{ value: Discipline.ANNEX_SCHEIBE, text: 'Annex Scheibe' }
		];

		disciplines.forEach(discipline => {
			const option = document.createElement('option');
			option.value = discipline.value;
			option.textContent = discipline.text;
			select.appendChild(option);
		});

		return select;
	}

	// =================================================================
	// SHOTS CARD CREATION
	// =================================================================

	createShotsCard() {
		const card = document.createElement('div');
		card.className = 'card';
		
		const competitionType = getCompetitionType(this.selectedDiscipline);
		const sectionTitle = competitionType === CompetitionType.ANNEX_SCHEIBE ? 
			'Serien (8 × 5 Schuss)' : 'Serie (20 Schuss)';
		
		// Header
		const header = document.createElement('h3');
		header.id = 'shotsTitle';
		header.textContent = sectionTitle;
		card.appendChild(header);

		// Shots Grid Container
		const gridContainer = document.createElement('div');
		gridContainer.id = 'shotsGrid';
		gridContainer.style.margin = '16px 0';
		card.appendChild(gridContainer);

		// Stats Container
		const statsContainer = document.createElement('div');
		statsContainer.id = 'shotsStats';
		statsContainer.style.cssText = 'display: flex; justify-content: space-between; margin-top: 12px; font-size: 14px; color: #666;';
		card.appendChild(statsContainer);

		// Series Summary Container
		const summaryContainer = document.createElement('div');
		summaryContainer.id = 'seriesSummary';
		summaryContainer.style.marginTop = '16px';
		card.appendChild(summaryContainer);

		setTimeout(() => this.updateShotsDisplay(), 100);

		return card;
	}

	// =================================================================
	// CONTROLS SECTION
	// =================================================================

	createControlsSection() {
		const controlsDiv = document.createElement('div');
		
		const card = document.createElement('div');
		card.className = 'card';
		card.style.cssText = 'padding: 12px; margin-bottom: 30px;';
		
		const flexContainer = document.createElement('div');
		flexContainer.style.cssText = 'display: flex; gap: 8px; align-items: flex-start;';

		// Keypad Container
		const keypadContainer = document.createElement('div');
		keypadContainer.id = 'keypadContainer';
		keypadContainer.style.flex = '1';
		flexContainer.appendChild(keypadContainer);

		// Buttons Container
		const buttonsContainer = document.createElement('div');
		buttonsContainer.style.cssText = 'display: flex; flex-direction: column; gap: 8px; min-width: 100px;';

		// Save Button
		const saveBtn = document.createElement('button');
		saveBtn.className = 'btn btn-primary';
		saveBtn.id = 'saveBtn';
		saveBtn.style.cssText = 'font-weight: bold; padding: 10px 14px; font-size: 14px;';
		saveBtn.textContent = 'Speichern';
		buttonsContainer.appendChild(saveBtn);

		// Clear Button
		const clearBtn = document.createElement('button');
		clearBtn.className = 'btn btn-secondary';
		clearBtn.id = 'clearBtn';
		clearBtn.style.cssText = 'padding: 10px 14px; font-size: 14px;';
		clearBtn.textContent = 'Leeren';
		buttonsContainer.appendChild(clearBtn);

		flexContainer.appendChild(buttonsContainer);
		card.appendChild(flexContainer);
		controlsDiv.appendChild(card);

		setTimeout(() => this.setupControls(), 100);

		return controlsDiv;
	}

	// =================================================================
	// EVENT LISTENERS SETUP
	// =================================================================

	setupEventListeners() {
		if (this.isDestroyed) return;

		const teamSelect = document.getElementById('teamSelect');
		const shooterSelect = document.getElementById('shooterSelect');
		const disciplineSelect = document.getElementById('disciplineSelect');

		if (teamSelect) {
			this.eventRegistry.register(teamSelect, 'change', (e) => {
				try {
					this.selectedTeamId = e.target.value || null;
					this.updateShooterSelect();
				} catch (error) {
					console.error('Error handling team selection:', error);
					UIUtils.showError('Fehler bei der Teamauswahl');
				}
			});
		}

		if (shooterSelect) {
			this.eventRegistry.register(shooterSelect, 'change', (e) => {
				try {
					this.selectedShooterId = e.target.value || null;
				} catch (error) {
					console.error('Error handling shooter selection:', error);
					UIUtils.showError('Fehler bei der Schützenauswahl');
				}
			});
		}

		if (disciplineSelect) {
			this.eventRegistry.register(disciplineSelect, 'change', (e) => {
				try {
					this.selectedDiscipline = e.target.value;
					this.clear();
					this.updateShotsDisplay();
				} catch (error) {
					console.error('Error handling discipline selection:', error);
					UIUtils.showError('Fehler bei der Disziplinauswahl');
				}
			});
		}

		// Update initial selections
		this.updateTeamSelect();
		this.updateShooterSelect();
	}

	setupControls() {
		if (this.isDestroyed) return;

		this.updateKeypad();

		const saveBtn = document.getElementById('saveBtn');
		const clearBtn = document.getElementById('clearBtn');

		if (saveBtn) {
			this.eventRegistry.register(saveBtn, 'click', () => this.saveEntry());
		}

		if (clearBtn) {
			this.eventRegistry.register(clearBtn, 'click', () => this.clear());
		}
	}

	// =================================================================
	// SELECTION UPDATE METHODS
	// =================================================================

	updateTeamSelect() {
		const select = document.getElementById('teamSelect');
		if (!select) return;

		// Clear existing options except first
		const firstOption = select.firstChild;
		select.innerHTML = '';
		select.appendChild(firstOption);

		// Add team options securely
		storage.teams.forEach(team => {
			const option = document.createElement('option');
			option.value = team.id;
			option.textContent = UIUtils.escapeHtml(team.name);
			select.appendChild(option);
		});

		if (this.selectedTeamId) {
			select.value = this.selectedTeamId;
		}
	}

	updateShooterSelect() {
		const select = document.getElementById('shooterSelect');
		if (!select) return;

		// Clear existing options except first
		const firstOption = select.firstChild;
		select.innerHTML = '';
		select.appendChild(firstOption);

		if (this.selectedTeamId) {
			const team = storage.teams.find(t => t.id === this.selectedTeamId);
			if (team && team.shooters) {
				team.shooters.forEach(shooter => {
					const option = document.createElement('option');
					option.value = shooter.id;
					option.textContent = UIUtils.escapeHtml(shooter.name);
					select.appendChild(option);
				});
			}
		} else {
			storage.standaloneShooters.forEach(shooter => {
				const option = document.createElement('option');
				option.value = shooter.id;
				option.textContent = UIUtils.escapeHtml(shooter.name);
				select.appendChild(option);
			});
		}

		if (this.selectedShooterId) {
			select.value = this.selectedShooterId;
		}
	}

	initializeSelection() {
		if (!this.selectedTeamId && !this.selectedShooterId) {
			if (storage.teams.length > 0) {
				this.selectedTeamId = storage.teams[0].id;
				this.selectedShooterId = storage.teams[0].shooters[0]?.id || null;
			} else if (storage.standaloneShooters.length > 0) {
				this.selectedShooterId = storage.standaloneShooters[0].id;
			}
			
			setTimeout(() => {
				this.updateTeamSelect();
				this.updateShooterSelect();
			}, 100);
		}
	}

	// =================================================================
	// SHOTS MANAGEMENT
	// =================================================================

	addShot(value) {
		try {
			const validatedValue = InputValidator.validateShotValue(value, this.selectedDiscipline);
			const competitionType = getCompetitionType(this.selectedDiscipline);
			const maxShots = competitionType === CompetitionType.ANNEX_SCHEIBE ? 40 : 20;

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
			console.error('Invalid shot value:', error);
			UIUtils.showError(error.message);
		}
	}

	removeLastShot() {
		try {
			const competitionType = getCompetitionType(this.selectedDiscipline);
			const maxShots = competitionType === CompetitionType.ANNEX_SCHEIBE ? 40 : 20;

			// Find last filled slot and remove it
			for (let i = maxShots - 1; i >= 0; i--) {
				if (this.shots[i] !== null) {
					this.shots[i] = null;
					this.updateShotsDisplay();
					return;
				}
			}
		} catch (error) {
			console.error('Error removing shot:', error);
			UIUtils.showError('Fehler beim Entfernen des Schusses');
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
		const keypadContainer = document.getElementById('keypadContainer');
		if (!keypadContainer) return;

		const competitionType = getCompetitionType(this.selectedDiscipline);
		keypadContainer.innerHTML = '';

		if (competitionType === CompetitionType.ANNEX_SCHEIBE) {
			this.createAnnexKeypad(keypadContainer);
		} else {
			this.createStandardKeypad(keypadContainer);
		}
	}

	createStandardKeypad(container) {
		const keypad = document.createElement('div');
		keypad.className = 'keypad';
		keypad.style.cssText = 'display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; max-width: 200px; margin-bottom: 20px;';

		const numbers = [1,2,3,4,5,6,7,8,9,10,0];
		
		numbers.forEach(num => {
			const btn = document.createElement('button');
			btn.className = 'btn btn-secondary';
			btn.style.cssText = 'aspect-ratio: 1; font-size: 16px; font-weight: 500; padding: 12px; height: 60px;';
			btn.textContent = num.toString();
			
			this.eventRegistry.register(btn, 'click', () => this.addShot(num));
			keypad.appendChild(btn);
		});

		// Delete button
		const deleteBtn = document.createElement('button');
		deleteBtn.className = 'btn btn-secondary';
		deleteBtn.style.cssText = 'aspect-ratio: 1; font-size: 16px; font-weight: 500; padding: 12px; height: 60px;';
		deleteBtn.textContent = '⌫';
		
		this.eventRegistry.register(deleteBtn, 'click', () => this.removeLastShot());
		keypad.appendChild(deleteBtn);

		container.appendChild(keypad);
	}

	createAnnexKeypad(container) {
		const keypad = document.createElement('div');
		keypad.className = 'keypad';
		keypad.style.cssText = 'display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; max-width: 150px; margin-bottom: 20px;';

		[0,1,2,3].forEach(num => {
			const btn = document.createElement('button');
			btn.className = 'btn btn-secondary';
			btn.style.cssText = 'aspect-ratio: 1; font-size: 16px; font-weight: 500; padding: 12px; min-height: 50px;';
			btn.textContent = num.toString();
			
			this.eventRegistry.register(btn, 'click', () => this.addShot(num));
			keypad.appendChild(btn);
		});

		// Delete button
		const deleteBtn = document.createElement('button');
		deleteBtn.className = 'btn btn-secondary';
		deleteBtn.style.cssText = 'grid-column: 1 / -1; aspect-ratio: 2/1; font-size: 16px; font-weight: 500; padding: 12px; min-height: 50px;';
		deleteBtn.textContent = '⌫ Löschen';
		
		this.eventRegistry.register(deleteBtn, 'click', () => this.removeLastShot());
		keypad.appendChild(deleteBtn);

		container.appendChild(keypad);
	}

	// =================================================================
	// SHOTS DISPLAY UPDATE
	// =================================================================

	updateShotsDisplay() {
		const competitionType = getCompetitionType(this.selectedDiscipline);
		
		// Update title
		const title = document.getElementById('shotsTitle');
		if (title) {
			title.textContent = competitionType === CompetitionType.ANNEX_SCHEIBE ? 
				'Serien (8 × 5 Schuss)' : 'Serie (20 Schuss)';
		}

		this.updateShotsGrid();
		this.updateShotsStats();
		this.updateSeriesSummary();
		this.updateKeypad();
	}

	updateShotsGrid() {
		const grid = document.getElementById('shotsGrid');
		if (!grid) return;

		const competitionType = getCompetitionType(this.selectedDiscipline);
		grid.innerHTML = '';

		if (competitionType === CompetitionType.ANNEX_SCHEIBE) {
			this.createAnnexGrid(grid);
		} else {
			this.createStandardGrid(grid);
		}
	}

	createStandardGrid(container) {
		const grid = document.createElement('div');
		grid.style.cssText = 'display: grid; grid-template-columns: repeat(5, 1fr); gap: 4px; max-width: 250px; margin: 0 auto;';

		for (let i = 0; i < 20; i++) {
			const cell = document.createElement('div');
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
			cell.textContent = this.shots[i] !== null ? this.shots[i].toString() : '—';
			grid.appendChild(cell);
		}

		container.appendChild(grid);
	}

	createAnnexGrid(container) {
		const gridWrapper = document.createElement('div');
		gridWrapper.style.cssText = 'overflow-x: auto;';

		// Header
		const header = document.createElement('div');
		header.style.cssText = 'display: grid; grid-template-columns: 40px repeat(8, 30px) 40px; gap: 4px; margin-bottom: 8px; font-size: 12px; color: #666;';

		// Series/Round header
		const seriesHeader = document.createElement('div');
		seriesHeader.textContent = 'S/R';
		seriesHeader.style.cssText = 'display: flex; align-items: center; justify-content: center; font-weight: 500;';
		header.appendChild(seriesHeader);

		// Shot number headers
		for (let i = 1; i <= 8; i++) {
			const shotHeader = document.createElement('div');
			shotHeader.textContent = i.toString();
			shotHeader.style.cssText = 'display: flex; align-items: center; justify-content: center; font-weight: 500;';
			header.appendChild(shotHeader);
		}

		gridWrapper.appendChild(header);

		// Grid rows
		for (let series = 0; series < 5; series++) {
			const rowDiv = document.createElement('div');
			rowDiv.style.cssText = 'display: grid; grid-template-columns: 40px repeat(8, 30px) 40px; gap: 4px; margin-bottom: 4px;';

			// Series number
			const seriesLabel = document.createElement('div');
			seriesLabel.textContent = `S${series + 1}`;
			seriesLabel.style.cssText = 'display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 500;';
			rowDiv.appendChild(seriesLabel);

			// Shot cells
			for (let shot = 0; shot < 8; shot++) {
				const cell = document.createElement('div');
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
				cell.textContent = this.shots[series * 8 + shot] !== null ? 
					this.shots[series * 8 + shot].toString() : '—';
				rowDiv.appendChild(cell);
			}

			gridWrapper.appendChild(rowDiv);
		}

		container.appendChild(gridWrapper);
	}

	updateShotsStats() {
		const stats = document.getElementById('shotsStats');
		if (!stats) return;

		const competitionType = getCompetitionType(this.selectedDiscipline);
		const shotCount = competitionType === CompetitionType.ANNEX_SCHEIBE ? 40 : 20;
		const filledShots = this.shots.slice(0, shotCount).filter(s => s !== null);
		const total = filledShots.reduce((sum, shot) => sum + shot, 0);

		const label = competitionType === CompetitionType.ANNEX_SCHEIBE ? 'Gesamt' : 'Punkte';
		
		// Clear and create new content
		stats.innerHTML = '';
		
		const shotCountSpan = document.createElement('span');
		shotCountSpan.textContent = `Shots: ${filledShots.length}/${shotCount}`;
		
		const totalSpan = document.createElement('span');
		totalSpan.textContent = `${label}: ${total}`;
		
		stats.appendChild(shotCountSpan);
		stats.appendChild(totalSpan);
	}

	updateSeriesSummary() {
		const summary = document.getElementById('seriesSummary');
		if (!summary) return;

		const competitionType = getCompetitionType(this.selectedDiscipline);
		if (competitionType !== CompetitionType.ANNEX_SCHEIBE) {
			summary.innerHTML = '';
			return;
		}

		// Calculate series sums
		const seriesSums = [];
		for (let i = 0; i < 5; i++) {
			const startIndex = i * 8;
			const endIndex = startIndex + 8;
			const seriesSum = this.shots.slice(startIndex, endIndex)
				.filter(s => s !== null)
				.reduce((sum, shot) => sum + shot, 0);
			seriesSums.push(seriesSum);
		}

		// Create summary display
		summary.innerHTML = '';
		
		const summaryCard = document.createElement('div');
		summaryCard.style.cssText = 'background: #f8f9fa; border-radius: 8px; padding: 12px;';
		
		const summaryTitle = document.createElement('div');
		summaryTitle.style.cssText = 'font-weight: 600; margin-bottom: 8px; text-align: center;';
		summaryTitle.textContent = 'Serien-Ergebnisse';
		summaryCard.appendChild(summaryTitle);
		
		const summaryGrid = document.createElement('div');
		summaryGrid.style.cssText = 'display: flex; justify-content: space-around; margin-bottom: 8px;';
		
		seriesSums.forEach((sum, i) => {
			const seriesDiv = document.createElement('div');
			seriesDiv.style.cssText = 'text-align: center;';
			
			const seriesLabel = document.createElement('div');
			seriesLabel.style.cssText = 'font-size: 12px; color: #666;';
			seriesLabel.textContent = `S${i + 1}`;
			
			const seriesValue = document.createElement('div');
			seriesValue.style.cssText = 'font-weight: 600;';
			seriesValue.textContent = sum.toString();
			
			seriesDiv.appendChild(seriesLabel);
			seriesDiv.appendChild(seriesValue);
			summaryGrid.appendChild(seriesDiv);
		});
		
		summaryCard.appendChild(summaryGrid);
		summary.appendChild(summaryCard);
	}

	// =================================================================
	// SAVE FUNCTIONALITY
	// =================================================================

	saveEntry() {
		try {
			if (!this.selectedShooterId) {
				throw new Error('Bitte wählen Sie einen Schützen aus.');
			}

			const entry = new ResultEntry(
				this.selectedTeamId,
				this.selectedShooterId,
				this.selectedDiscipline,
				[...this.shots]
			);

			storage.saveResult(entry);
			this.clear();
			UIUtils.showSuccessMessage('Ergebnis gespeichert!');
			
		} catch (error) {
			console.error('Error saving entry:', error);
			UIUtils.showError(`Fehler beim Speichern: ${error.message}`);
		}
	}

	// =================================================================
	// ERROR HANDLING
	// =================================================================

	showError(container, message) {
		const errorCard = document.createElement('div');
		errorCard.className = 'card';
		
		const errorText = document.createElement('p');
		errorText.style.color = 'red';
		errorText.textContent = UIUtils.sanitizeText(message);
		
		errorCard.appendChild(errorText);
		container.appendChild(errorCard);
	}

	// =================================================================
	// CLEANUP
	// =================================================================

	destroy() {
		this.isDestroyed = true;
		this.eventRegistry.cleanupAll();
		this.selectedTeamId = null;
		this.selectedShooterId = null;
		this.shots = new Array(40).fill(null);
	}
}