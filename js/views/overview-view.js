class OverviewView {
	constructor() {
		this.showingFilter = false;
	}

	render() {
		const container = document.createElement('div');
		
		try {
			// Setup navigation buttons
			this.setupNavButtons();
			
			// Current discipline and competition type info
			if (storage.selectedDiscipline) {
				const infoCard = this.createInfoCard();
				container.appendChild(infoCard);
			}

			// Teams overview
			const filteredTeams = this.getFilteredTeams();

			// Always show teams even without results
			if (filteredTeams.length > 0) {
				filteredTeams.forEach(team => {
					const teamCard = this.createTeamOverviewCard(team);
					container.appendChild(teamCard);
				});
			}

			// Standalone shooters overview
			if (storage.standaloneShooters.length > 0) {
				const soloCard = this.createSoloShootersCard();
				container.appendChild(soloCard);
			}

			// Empty state only if NO teams AND no standalone shooters
			if (filteredTeams.length === 0 && storage.standaloneShooters.length === 0) {
				const emptyState = document.createElement('div');
				emptyState.className = 'card empty-state';
				emptyState.style.cssText = 'margin-bottom: 30px;'; // Zusätzlicher Abstand
				emptyState.innerHTML = `
					<h3>Keine Teams oder Schützen vorhanden</h3>
					<p style="margin: 16px 0;">Fügen Sie zuerst Teams und Schützen hinzu.</p>
					<div style="display: flex; gap: 12px; justify-content: center; margin-top: 20px;">
						<button class="btn btn-primary" style="width: 50%; height: 70px;" onclick="app.showView('teams')">
							Teams verwalten
						</button>
						<button class="btn btn-secondary" style="width: 50%; height: 70px;" onclick="app.showView('entry')">
							Ergebnisse erfassen
						</button>
					</div>
				`;
				container.appendChild(emptyState);
			} else if (this.hasNoResults()) {
				// Show info card if teams exist but no results
				const infoCard = document.createElement('div');
				infoCard.className = 'card';
				infoCard.style.cssText = 'background: #fff3cd; border: 1px solid #ffeaa7; text-align: center; margin-bottom: 30px;';
				infoCard.innerHTML = `
					<h4 style="margin: 0 0 8px 0; color: #856404;">Noch keine Ergebnisse erfasst</h4>
					<p style="margin: 0; color: #856404;">Die Teams sind angelegt, aber es wurden noch keine Schussergebnisse erfasst.</p>
					<button class="btn btn-primary" style="width: 100%; height: 70px; margin-top: 20px;" onclick="app.showView('entry')" style="margin-top: 12px;">
						Jetzt Ergebnisse erfassen
					</button>
				`;
				container.appendChild(infoCard);
			}

		} catch (error) {
			console.error('Error rendering overview:', error);
			container.innerHTML = `<div class="card" style="margin-bottom: 30px;"><p style="color: red;">Fehler beim Laden der Übersicht: ${error.message}</p></div>`;
		}

		return container;
	}

	hasNoResults() {
		return storage.results.length === 0;
	}

	setupNavButtons() {
		setTimeout(() => {
			const navButtons = document.getElementById('navButtons');
			if (navButtons) {
				navButtons.innerHTML = '';
				
				// Filter Button
				const filterBtn = document.createElement('button');
				filterBtn.className = 'nav-btn';
				filterBtn.textContent = '🔍';
				filterBtn.title = 'Filter';
				filterBtn.addEventListener('click', () => this.showFilterModal());
				navButtons.appendChild(filterBtn);
				
				// PDF Export Button
				const pdfBtn = document.createElement('button');
				pdfBtn.className = 'nav-btn';
				pdfBtn.textContent = '📄';
				pdfBtn.title = 'PDF Export';
				pdfBtn.addEventListener('click', () => this.exportToPDF());
				navButtons.appendChild(pdfBtn);
			}
		}, 100);
	}

	createInfoCard() {
		const card = document.createElement('div');
		card.className = 'card';
		card.innerHTML = `
			<div style="text-align: center;">
				<h3>${storage.selectedDiscipline}</h3>
				<p style="color: #666; margin-top: 8px;">Modus: ${storage.selectedCompetitionType}</p>
			</div>
		`;
		return card;
	}

	createTeamOverviewCard(team) {
		const competitionType = storage.selectedCompetitionType;
		
		if (competitionType === CompetitionType.ANNEX_SCHEIBE) {
			return this.createTeamOverviewCardAnnex(team);
		} else {
			return this.createTeamOverviewCardStandard(team);
		}
	}

	createTeamOverviewCardStandard(team) {
		const card = document.createElement('div');
		card.className = 'card';
		
		// Prepare shooter data
		const shooterData = this.prepareShooterData(team);
		const worstShooterId = this.getWorstShooterId(team);
		const teamTotal = storage.calculateBestThreeSum(team);
		
		// Header
		const header = document.createElement('div');
		header.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;';
		header.innerHTML = `
			<h3 style="margin: 0; flex: 1; line-height: 1.3;">${UIUtils.escapeHtml(team.name)}</h3>
			<span style="color: #666; font-size: 14px;">Schützen: ${team.shooters.length}</span>
		`;
		card.appendChild(header);

		// Show message if no shooters
		if (team.shooters.length === 0) {
			const noShooters = document.createElement('div');
			noShooters.style.cssText = 'text-align: center; color: #666; padding: 20px;';
			noShooters.textContent = 'Keine Schützen in dieser Mannschaft';
			card.appendChild(noShooters);
			return card;
		}

		// Table
		const table = document.createElement('div');
		table.style.cssText = 'border: 1px solid #f0f0f0; border-radius: 8px; overflow: hidden;';

		// Table header
		const tableHeader = document.createElement('div');
		tableHeader.style.cssText = 'background: #f8f9fa; padding: 8px; display: grid; grid-template-columns: 1fr 50px 50px 50px; gap: 8px; font-weight: 600; font-size: 12px;';
		tableHeader.innerHTML = `
			<div>Name</div>
			<div style="text-align: center;">Präz.</div>
			<div style="text-align: center;">Duell</div>
			<div style="text-align: right;">Gesamt</div>
		`;
		table.appendChild(tableHeader);

		// Shooter rows
		shooterData.forEach((data, index) => {
			const [shooter, precision, duell, total] = data;
			const isWorst = shooter.id === worstShooterId && team.shooters.length >= 4;
			
			const row = document.createElement('div');
			row.style.cssText = `
				padding: 8px; 
				display: grid; 
				grid-template-columns: 1fr 50px 50px 50px; 
				gap: 4px; 
				font-size: 12px;
				border-top: 1px solid #f0f0f0;
				${index % 2 === 1 ? 'background: #f8f9fa;' : ''}
				${isWorst ? 'color: #ff3b30;' : ''}
			`;
			row.innerHTML = `
				<div style="overflow: hidden; text-overflow: ellipsis; ${isWorst ? 'text-decoration: underline;' : ''}">${UIUtils.escapeHtml(shooter.name)}</div>
				<div style="text-align: center;">${precision}</div>
				<div style="text-align: center;">${duell}</div>
				<div style="text-align: right; font-weight: 500; ${isWorst ? 'text-decoration: underline;' : ''}">${total}</div>
			`;
			table.appendChild(row);
		});

		// Team total row
		const totalRow = document.createElement('div');
		totalRow.style.cssText = 'background: #e9ecef; padding: 8px; display: grid; grid-template-columns: 1fr 50px; gap: 4px; font-weight: 600; border-top: 1px solid #f0f0f0;';
		totalRow.innerHTML = `
			<div style="text-align: left; font-weight: bold; font-size: 12px;">Mannschaft Gesamt: </div>
			<div style="text-align: right; font-weight: bold; font-size: 12px;">${teamTotal}</div>
		`;

		table.appendChild(totalRow);

		card.appendChild(table);
		return card;
	}

	createTeamOverviewCardAnnex(team) {
		const card = document.createElement('div');
		card.className = 'card';
		
		// Prepare shooter data for Annex
		const shooterData = this.prepareShooterDataAnnex(team);
		const worstShooterId = this.getWorstShooterIdAnnex(team);
		
		// Header
		const header = document.createElement('div');
		header.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;';
		header.innerHTML = `
			<h3 style="margin: 0; flex: 1; line-height: 1.3;">${UIUtils.escapeHtml(team.name)}</h3>
			<span style="color: #666; font-size: 14px;">Schützen: ${team.shooters.length}</span>
		`;
		card.appendChild(header);

		// Show message if no shooters
		if (team.shooters.length === 0) {
			const noShooters = document.createElement('div');
			noShooters.style.cssText = 'text-align: center; color: #666; padding: 20px;';
			noShooters.textContent = 'Keine Schützen in dieser Mannschaft';
			card.appendChild(noShooters);
			return card;
		}

		// Scrollable table container
		const tableContainer = document.createElement('div');
		tableContainer.style.cssText = 'overflow-x: auto; border: 1px solid #f0f0f0; border-radius: 8px;';

		const table = document.createElement('div');
		table.style.cssText = 'min-width: 340px;';

		// Table header - narrower columns for series, wider for Gesamt
		const tableHeader = document.createElement('div');
		tableHeader.style.cssText = 'background: #f8f9fa; padding: 8px; display: grid; grid-template-columns: 1fr repeat(5, 28px) 35px; gap: 4px; font-weight: 600; font-size: 12px;';
		tableHeader.innerHTML = `
			<div>Name</div>
			<div style="text-align: center;">S1</div>
			<div style="text-align: center;">S2</div>
			<div style="text-align: center;">S3</div>
			<div style="text-align: center;">S4</div>
			<div style="text-align: center;">S5</div>
			<div style="text-align: right;">Ges.</div>
		`;
		table.appendChild(tableHeader);

		// Shooter rows
		shooterData.forEach((data, index) => {
			const [shooter, seriesSums, total] = data;
			const isWorst = shooter.id === worstShooterId && team.shooters.length >= 4;
			
			const row = document.createElement('div');
			row.style.cssText = `
				padding: 8px; 
				display: grid; 
				grid-template-columns: 1fr repeat(5, 28px) 35px; 
				gap: 4px; 
				font-size: 12px;
				border-top: 1px solid #f0f0f0;
				${index % 2 === 1 ? 'background: #f8f9fa;' : ''}
				${isWorst ? 'color: #ff3b30;' : ''}
			`;
			
			let rowHTML = `<div style="overflow: hidden; text-overflow: ellipsis; ${isWorst ? 'text-decoration: underline;' : ''}">${UIUtils.escapeHtml(shooter.name)}</div>`;

			// Series sums
			for (let i = 0; i < 5; i++) {
				const seriesValue = i < seriesSums.length ? seriesSums[i] : 0;
				rowHTML += `<div style="text-align: center;">${seriesValue}</div>`;
			}

			rowHTML += `<div style="text-align: right; font-weight: 500; ${isWorst ? 'text-decoration: underline;' : ''}">${total}</div>`;

			row.innerHTML = rowHTML;
			table.appendChild(row);
		});

		// Calculate team total using storage method
		const teamTotal = storage.calculateTeamTotal(team, CompetitionType.ANNEX_SCHEIBE);

		// Team total row - spanning across name and series columns
		const totalRow = document.createElement('div');
		totalRow.style.cssText = 'background: #e9ecef; padding: 8px; display: grid; grid-template-columns: 1fr 50px; gap: 4px; font-weight: 600; border-top: 1px solid #f0f0f0;';
		totalRow.innerHTML = `
			<div style="text-align: left; font-weight: bold; font-size: 12px;">Mannschaft Gesamt: </div>
			<div style="text-align: right; font-weight: bold; font-size: 12px;">${teamTotal}</div>
		`;

		table.appendChild(totalRow);

		tableContainer.appendChild(table);
		card.appendChild(tableContainer);
		return card;
	}

	createSoloShootersCard() {
		const competitionType = storage.selectedCompetitionType;
		
		if (competitionType === CompetitionType.ANNEX_SCHEIBE) {
			return this.createSoloShootersCardAnnex();
		} else {
			return this.createSoloShootersCardStandard();
		}
	}

	createSoloShootersCardStandard() {
		const card = document.createElement('div');
		card.className = 'card';
		
		// Header
		const header = document.createElement('div');
		header.innerHTML = '<h3 style="margin: 0 0 16px 0;">Einzelschützen</h3>';
		card.appendChild(header);
		
		// Table
		const table = document.createElement('div');
		table.style.cssText = 'border: 1px solid #f0f0f0; border-radius: 8px; overflow: hidden;';
		
		// Table header
		const tableHeader = document.createElement('div');
		tableHeader.style.cssText = 'background: #f8f9fa; padding: 8px; display: grid; grid-template-columns: 1fr 50px 50px 50px; gap: 4px; font-weight: 600; font-size: 12px;';
		tableHeader.innerHTML = `
			<div>Name</div>
			<div style="text-align: center;">Präz.</div>
			<div style="text-align: center;">Duell</div>
			<div style="text-align: right;">Gesamt</div>
		`;
		table.appendChild(tableHeader);
		
		// Sort shooters by name
		const sortedShooters = [...storage.standaloneShooters].sort((a, b) => 
			a.name.localeCompare(b.name, 'de', { sensitivity: 'base' })
		);

		// Shooter rows
		sortedShooters.forEach((shooter, index) => {
			const precision = storage.results
				.filter(r => r.teamId === null && r.shooterId === shooter.id && r.discipline === Discipline.PRAEZISION)
				.reduce((sum, r) => sum + r.total(), 0);
			const duell = storage.results
				.filter(r => r.teamId === null && r.shooterId === shooter.id && r.discipline === Discipline.DUELL)
				.reduce((sum, r) => sum + r.total(), 0);
			const total = precision + duell;
			
			const row = document.createElement('div');
			row.style.cssText = `
				padding: 8px; 
				display: grid; 
				grid-template-columns: 1fr 50px 50px 50px; 
				gap: 4px; 
				font-size: 12px;
				border-top: 1px solid #f0f0f0;
				${index % 2 === 1 ? 'background: #f8f9fa;' : ''}
			`;
			row.innerHTML = `
				<div style="overflow: hidden; text-overflow: ellipsis;">${UIUtils.escapeHtml(shooter.name)}</div>
				<div style="text-align: center;">${precision}</div>
				<div style="text-align: center;">${duell}</div>
				<div style="text-align: right; font-weight: 500;">${total}</div>
			`;
			table.appendChild(row);
		});

		card.appendChild(table);
		return card;
	}

	createSoloShootersCardAnnex() {
		const card = document.createElement('div');
		card.className = 'card';
		card.style.cssText = 'margin-bottom: 30px;'; // Zusätzlicher Abstand
		
		// Header
		const header = document.createElement('div');
		header.innerHTML = '<h3 style="margin: 0 0 16px 0;">Einzelschützen</h3>';
		card.appendChild(header);
		
		// Scrollable table container
		const tableContainer = document.createElement('div');
		tableContainer.style.cssText = 'overflow-x: auto; border: 1px solid #f0f0f0; border-radius: 8px;';

		const table = document.createElement('div');
		table.style.cssText = 'min-width: 340px;';

		// Table header
		const tableHeader = document.createElement('div');
		tableHeader.style.cssText = 'background: #f8f9fa; padding: 8px; display: grid; grid-template-columns: 1fr repeat(5, 28px) 35px; gap: 4px; font-weight: 600; font-size: 12px;';
		tableHeader.innerHTML = `
			<div>Name</div>
			<div style="text-align: center;">S1</div>
			<div style="text-align: center;">S2</div>
			<div style="text-align: center;">S3</div>
			<div style="text-align: center;">S4</div>
			<div style="text-align: center;">S5</div>
			<div style="text-align: right;">Ges.</div>
		`;
		table.appendChild(tableHeader);

		// Sort shooters by name
		const sortedShooters = [...storage.standaloneShooters].sort((a, b) => 
			a.name.localeCompare(b.name, 'de', { sensitivity: 'base' })
		);

		// Shooter rows
		sortedShooters.forEach((shooter, index) => {
			const result = storage.results.find(r => 
				r.teamId === null && 
				r.shooterId === shooter.id && 
				r.discipline === Discipline.ANNEX_SCHEIBE
			);
			
			let seriesSums = [0, 0, 0, 0, 0];
			let total = 0;
			
			if (result && result.seriesSums) {
				seriesSums = result.seriesSums();
				total = result.total();
			}
			
			const row = document.createElement('div');
			row.style.cssText = `
				padding: 8px; 
				display: grid; 
				grid-template-columns: 1fr repeat(5, 28px) 35px; 
				gap: 4px; 
				font-size: 12px;
				border-top: 1px solid #f0f0f0;
				${index % 2 === 1 ? 'background: #f8f9fa;' : ''}
			`;
			
			let rowHTML = `<div style="overflow: hidden; text-overflow: ellipsis;">${UIUtils.escapeHtml(shooter.name)}</div>`;

			// Series sums
			for (let i = 0; i < 5; i++) {
				const seriesValue = i < seriesSums.length ? seriesSums[i] : 0;
				rowHTML += `<div style="text-align: center;">${seriesValue}</div>`;
			}

			rowHTML += `<div style="text-align: right; font-weight: 500;">${total}</div>`;

			row.innerHTML = rowHTML;
			table.appendChild(row);
		});

		tableContainer.appendChild(table);
		card.appendChild(tableContainer);
		return card;
	}

	prepareShooterData(team) {
		return team.shooters.map(shooter => {
			const precision = storage.results
				.filter(r => r.teamId === team.id && r.shooterId === shooter.id && r.discipline === Discipline.PRAEZISION)
				.reduce((sum, r) => sum + r.total(), 0);
			const duell = storage.results
				.filter(r => r.teamId === team.id && r.shooterId === shooter.id && r.discipline === Discipline.DUELL)
				.reduce((sum, r) => sum + r.total(), 0);
			return [shooter, precision, duell, precision + duell];
		}).sort((a, b) => a[0].name.localeCompare(b[0].name, 'de', { sensitivity: 'base' }));
	}

	prepareShooterDataAnnex(team) {
		return team.shooters.map(shooter => {
			const result = storage.results.find(r => 
				r.teamId === team.id && 
				r.shooterId === shooter.id && 
				r.discipline === Discipline.ANNEX_SCHEIBE
			);
			
			if (result && result.seriesSums) {
				const seriesSums = result.seriesSums();
				const total = result.total();
				return [shooter, seriesSums, total];
			}
			return [shooter, [0, 0, 0, 0, 0], 0];
		}).sort((a, b) => a[0].name.localeCompare(b[0].name, 'de', { sensitivity: 'base' }));
	}

	getWorstShooterId(team) {
		if (team.shooters.length < 4) return null;
		
		const shooterTotals = team.shooters.map(shooter => {
			const precision = storage.results
				.filter(r => r.teamId === team.id && r.shooterId === shooter.id && r.discipline === Discipline.PRAEZISION)
				.reduce((sum, r) => sum + r.total(), 0);
			const duell = storage.results
				.filter(r => r.teamId === team.id && r.shooterId === shooter.id && r.discipline === Discipline.DUELL)
				.reduce((sum, r) => sum + r.total(), 0);
			return { id: shooter.id, total: precision + duell };
		});

		const sorted = shooterTotals.sort((a, b) => a.total - b.total);
		return sorted[0]?.id;
	}

	getWorstShooterIdAnnex(team) {
		if (team.shooters.length < 4) return null;
		
		const shooterTotals = team.shooters.map(shooter => {
			const result = storage.results.find(r => 
				r.teamId === team.id && 
				r.shooterId === shooter.id && 
				r.discipline === Discipline.ANNEX_SCHEIBE
			);
			const total = result ? result.total() : 0;
			return { id: shooter.id, total: total };
		});

		const sorted = shooterTotals.sort((a, b) => a.total - b.total);
		return sorted[0]?.id;
	}

	getFilteredTeams() {
		if (storage.visibleTeamIds) {
			return storage.teams.filter(team => storage.visibleTeamIds.has(team.id));
		}
		return storage.teams;
	}

	showFilterModal() {
		const content = document.createElement('div');
		content.innerHTML = `
			<div class="form-section">
				<div class="form-section-header">Anzuzeigende Mannschaften</div>
				<div class="form-row">
					<label style="display: flex; align-items: center; gap: 8px;">
						<input type="checkbox" id="showAllTeams" ${!storage.visibleTeamIds ? 'checked' : ''}>
						<span>Alle anzeigen</span>
					</label>
				</div>
				<div id="teamCheckboxes"></div>
			</div>
		`;
		
		const modal = new ModalComponent('Filter', content);
		modal.addAction('Fertig', () => {
			this.saveFilter();
			app.showView('overview');
		}, true, false);

		modal.show();

		setTimeout(() => {
			this.setupFilterModal();
		}, 100);
	}

	setupFilterModal() {
		const showAllCheckbox = document.getElementById('showAllTeams');
		const checkboxesContainer = document.getElementById('teamCheckboxes');
		
		if (showAllCheckbox && checkboxesContainer) {
			// Show all teams checkbox handler
			showAllCheckbox.addEventListener('change', (e) => {
				const teamCheckboxes = checkboxesContainer.querySelectorAll('input[type="checkbox"]');
				teamCheckboxes.forEach(cb => {
					cb.disabled = e.target.checked;
				});
			});

			// Team checkboxes
			storage.teams.forEach(team => {
				const row = document.createElement('div');
				row.className = 'form-row';
				row.innerHTML = `
					<label style="display: flex; align-items: center; gap: 8px;">
						<input type="checkbox" class="team-checkbox" data-team-id="${team.id}" 
							${!storage.visibleTeamIds || storage.visibleTeamIds.has(team.id) ? 'checked' : ''}
							${!storage.visibleTeamIds ? 'disabled' : ''}>
						<span>${UIUtils.escapeHtml(team.name)}</span>
					</label>
				`;
				checkboxesContainer.appendChild(row);
			});
		}
	}

	saveFilter() {
		const showAllCheckbox = document.getElementById('showAllTeams');
		
		if (showAllCheckbox && showAllCheckbox.checked) {
			storage.visibleTeamIds = null;
		} else {
			const teamCheckboxes = document.querySelectorAll('.team-checkbox');
			const visibleTeamIds = new Set();
			
			teamCheckboxes.forEach(checkbox => {
				if (checkbox.checked) {
					visibleTeamIds.add(checkbox.dataset.teamId);
				}
			});

			storage.visibleTeamIds = visibleTeamIds;
		}

		storage.save();
		UIUtils.showSuccessMessage('Filter aktualisiert');
	}

	exportToPDF() {
		// Verwende den neuen PDF-Exporter
		if (typeof pdfExporter !== 'undefined' && pdfExporter.exportToPDF) {
			pdfExporter.exportToPDF();
		} else if (typeof window.exportToPDF === 'function') {
			window.exportToPDF();
		} else {
			console.error('PDF-Exporter not available');
			UIUtils.showError('PDF-Exporter nicht verfügbar. Bitte laden Sie die Seite neu.');
		}
	}
}