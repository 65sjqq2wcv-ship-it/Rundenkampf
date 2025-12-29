// Storage Class - Vollständige Version
class Storage {
	constructor() {
		this.teams = [];
		this.standaloneShooters = [];
		this.results = [];
		this.visibleTeamIds = null; // null = alle sichtbar
		this.availableDisciplines = [];
		this.selectedDiscipline = null;
		this.selectedCompetitionType = CompetitionType.PRAEZISION_DUELL;
		
		this.load();
	}

	// Standarddisziplinen
	defaultDisciplines() {
		return [
		'2.47 KK Pistole/Revolver - Kreisliga',
		'2.5X GK Pistole/Revolver - Kreisliga',
		'1.65 KK Unterhebel 25 m - Kreisliga',
		'1.66 GK Unterhebel 25m - Kreisliga',
		'KK SLG 25 m - Kreisliga'
		];
	}

	// Initiale Demodaten
	setupInitialData() {
		if (this.teams.length === 0 && this.results.length === 0 && this.standaloneShooters.length === 0) {
			this.teams = [];
			//this.teams = [
			//new Team('SV Musterhausen', [
			//new Shooter('Fritz'),
			//new Shooter('Fred'),
			//new Shooter('Ernst'),
			//new Shooter('Dieter')
			//]),
			//];
			this.standaloneShooters = [];
			//this.standaloneShooters = [new Shooter('Emil')];
			this.availableDisciplines = this.defaultDisciplines();
			this.selectedDiscipline = this.availableDisciplines[0];
			this.selectedCompetitionType = CompetitionType.PRAEZISION_DUELL;
		}
	}

	// Laden aus localStorage
	load() {
		try {
			const saved = localStorage.getItem('rundenkampf_bericht');
			if (saved) {
				const data = JSON.parse(saved);
				
				this.teams = (data.teams || []).map(t => Team.fromJSON(t));
				this.standaloneShooters = (data.standaloneShooters || []).map(s => Shooter.fromJSON(s));
				this.results = (data.results || []).map(r => ResultEntry.fromJSON(r));
				this.visibleTeamIds = data.visibleTeamIds ? new Set(data.visibleTeamIds) : null;
				this.availableDisciplines = data.availableDisciplines || this.defaultDisciplines();
				this.selectedDiscipline = data.selectedDiscipline || this.availableDisciplines[0];
				this.selectedCompetitionType = data.selectedCompetitionType || CompetitionType.PRAEZISION_DUELL;
			} else {
				this.setupInitialData();
			}
		} catch (error) {
			console.error('Fehler beim Laden der Daten:', error);
			this.setupInitialData();
		}
	}

	// Speichern in localStorage
	save() {
		try {
			const data = {
				teams: this.teams.map(t => t.toJSON()),
				standaloneShooters: this.standaloneShooters.map(s => s.toJSON()),
				results: this.results.map(r => r.toJSON()),
				visibleTeamIds: this.visibleTeamIds ? Array.from(this.visibleTeamIds) : null,
				availableDisciplines: this.availableDisciplines,
				selectedDiscipline: this.selectedDiscipline,
				selectedCompetitionType: this.selectedCompetitionType
			};
			localStorage.setItem('rundenkampf_bericht', JSON.stringify(data));
			console.log('Data saved successfully');
		} catch (error) {
			console.error('Fehler beim Speichern der Daten:', error);
			throw new Error('Speichern fehlgeschlagen: ' + error.message);
		}
	}

	// Team-Management
	addTeam(team) {
		if (!team || !team.name || !team.name.trim()) {
			throw new Error('Team muss einen Namen haben');
		}
		
		this.teams.push(team);
		this.save();
		console.log('Team added:', team.name);
		return true;
	}

	updateTeam(updatedTeam) {
		if (!updatedTeam || !updatedTeam.id) {
			throw new Error('Team muss eine ID haben');
		}

		const index = this.teams.findIndex(t => t.id === updatedTeam.id);
		if (index !== -1) {
			// Entferne Ergebnisse für gelöschte Schützen
			const oldShooters = this.teams[index].shooters;
			const newShooterIds = new Set(updatedTeam.shooters.map(s => s.id));
			const removedShooters = oldShooters.filter(s => !newShooterIds.has(s.id));
			
			removedShooters.forEach(s => {
				console.log('Deleting results for removed shooter:', s.name);
				this.deleteResultsForShooter(s.id);
			});

			this.teams[index] = updatedTeam;
			this.save();
			console.log('Team updated:', updatedTeam.name);
			return true;
		}
		
		console.warn('Team not found for update:', updatedTeam.id);
		return false;
	}

	deleteTeam(teamId) {
		if (!teamId) {
			throw new Error('Team-ID ist erforderlich');
		}

		const team = this.teams.find(t => t.id === teamId);
		if (team) {
			console.log('Deleting team and all related data:', team.name);
			
			// Lösche alle Ergebnisse für Schützen in diesem Team
			team.shooters.forEach(s => {
				console.log('Deleting results for shooter:', s.name);
				this.deleteResultsForShooter(s.id);
			});
			
			// Entferne Team aus der Liste
			this.teams = this.teams.filter(t => t.id !== teamId);
			
			// Entferne Team aus Sichtbarkeitsfilter
			if (this.visibleTeamIds && this.visibleTeamIds.has(teamId)) {
				this.visibleTeamIds.delete(teamId);
			}
			
			this.save();
			console.log('Team deleted successfully');
			return true;
		}
		
		console.warn('Team not found for deletion:', teamId);
		return false;
	}

	// Einzelschützen-Management
	addStandaloneShooter(shooter) {
		if (!shooter || !shooter.name || !shooter.name.trim()) {
			throw new Error('Schütze muss einen Namen haben');
		}
		
		this.standaloneShooters.push(shooter);
		this.save();
		console.log('Standalone shooter added:', shooter.name);
		return true;
	}

	updateStandaloneShooter(updatedShooter) {
		if (!updatedShooter || !updatedShooter.id) {
			throw new Error('Schütze muss eine ID haben');
		}

		const index = this.standaloneShooters.findIndex(s => s.id === updatedShooter.id);
		if (index !== -1) {
			this.standaloneShooters[index] = updatedShooter;
			this.save();
			console.log('Standalone shooter updated:', updatedShooter.name);
			return true;
		}
		
		console.warn('Standalone shooter not found for update:', updatedShooter.id);
		return false;
	}

	deleteStandaloneShooter(shooterId) {
		if (!shooterId) {
			throw new Error('Schützen-ID ist erforderlich');
		}

		const shooter = this.standaloneShooters.find(s => s.id === shooterId);
		if (shooter) {
			console.log('Deleting standalone shooter:', shooter.name);
			
			// Lösche alle Ergebnisse für diesen Schützen
			this.deleteResultsForShooter(shooterId);
			
			// Entferne Schützen aus der Liste
			this.standaloneShooters = this.standaloneShooters.filter(s => s.id !== shooterId);
			this.save();
			
			console.log('Standalone shooter deleted successfully');
			return true;
		}
		
		console.warn('Standalone shooter not found for deletion:', shooterId);
		return false;
	}

	// In Storage class hinzufügen/ersetzen:
	saveResult(entry) {
		if (!entry || !entry.shooterId || !entry.discipline) {
			throw new Error('Ergebnis muss Schützen-ID und Disziplin haben');
		}

		const existingIndex = this.results.findIndex(r => 
		r.shooterId === entry.shooterId &&
		r.discipline === entry.discipline &&
		r.teamId === entry.teamId
		);

		if (existingIndex !== -1) {
			// Update existing result, keep the ID
			entry.id = this.results[existingIndex].id;
			this.results[existingIndex] = entry;
			console.log('Result updated for shooter:', entry.shooterId);
		} else {
			// Add new result
			this.results.push(entry);
			console.log('New result added for shooter:', entry.shooterId);
		}
		
		this.save();
		return true;
	}

	deleteResult(resultId) {
		if (!resultId) {
			throw new Error('Ergebnis-ID ist erforderlich');
		}

		const oldLength = this.results.length;
		this.results = this.results.filter(r => r.id !== resultId);
		
		if (this.results.length < oldLength) {
			this.save();
			console.log('Result deleted:', resultId);
			return true;
		}
		
		console.warn('Result not found for deletion:', resultId);
		return false;
	}

	deleteResultsForShooter(shooterId) {
		if (!shooterId) {
			console.warn('No shooter ID provided for result deletion');
			return false;
		}

		const oldLength = this.results.length;
		this.results = this.results.filter(r => r.shooterId !== shooterId);
		
		if (this.results.length < oldLength) {
			const deletedCount = oldLength - this.results.length;
			console.log(`Deleted ${deletedCount} results for shooter:`, shooterId);
			// Don't save here as this is usually called from other methods that will save
			return true;
		}
		
		return false;
	}

	// Disziplin-Management
	addDiscipline(name) {
		const trimmed = name.trim();
		if (!trimmed) {
			throw new Error('Disziplinname darf nicht leer sein');
		}
		
		if (this.availableDisciplines.includes(trimmed)) {
			throw new Error('Diese Disziplin existiert bereits');
		}
		
		this.availableDisciplines.push(trimmed);
		if (!this.selectedDiscipline) {
			this.selectedDiscipline = trimmed;
		}
		this.save();
		console.log('Discipline added:', trimmed);
		return true;
	}

	updateDiscipline(index, newName) {
		if (index < 0 || index >= this.availableDisciplines.length) {
			throw new Error('Ungültiger Disziplin-Index');
		}
		
		const trimmed = newName.trim();
		if (!trimmed) {
			throw new Error('Disziplinname darf nicht leer sein');
		}
		
		if (this.availableDisciplines.includes(trimmed)) {
			throw new Error('Diese Disziplin existiert bereits');
		}
		
		const oldName = this.availableDisciplines[index];
		this.availableDisciplines[index] = trimmed;
		
		if (this.selectedDiscipline === oldName) {
			this.selectedDiscipline = trimmed;
		}
		
		this.save();
		console.log('Discipline updated:', oldName, '->', trimmed);
		return true;
	}

	deleteDiscipline(index) {
		if (index < 0 || index >= this.availableDisciplines.length) {
			throw new Error('Ungültiger Disziplin-Index');
		}
		
		const removedName = this.availableDisciplines[index];
		this.availableDisciplines.splice(index, 1);
		
		if (this.selectedDiscipline === removedName) {
			this.selectedDiscipline = this.availableDisciplines[0] || null;
		}
		
		this.save();
		console.log('Discipline deleted:', removedName);
		return true;
	}

	// Filter-Management
	setVisibleTeams(teamIds) {
		this.visibleTeamIds = teamIds;
		this.save();
		return true;
	}

	getFilteredTeams() {
		if (this.visibleTeamIds) {
			return this.teams.filter(team => this.visibleTeamIds.has(team.id));
		}
		return this.teams;
	}

	// Berechnung von Mannschaftsergebnissen
	calculateTeamTotal(team, competitionType) {
		if (!team) return 0;
		
		switch (competitionType) {
			case CompetitionType.PRAEZISION_DUELL:
			return this.calculateBestThreeSum(team);
			case CompetitionType.ANNEX_SCHEIBE:
			return this.calculateBestThreeSumAnnex(team);
			default:
			return this.calculateBestThreeSum(team);
		}
	}

	// Original Logik für Präzision/Duell
	// Original Logik für Präzision/Duell
	calculateBestThreeSum(team) {
		if (!team || !team.shooters) return 0;
		
		const totals = team.shooters.map(shooter => {
			const precision = this.results
			.filter(r => r.teamId === team.id && r.shooterId === shooter.id && r.discipline === Discipline.PRAEZISION)
			.reduce((sum, r) => sum + r.total(), 0);
			const duell = this.results
			.filter(r => r.teamId === team.id && r.shooterId === shooter.id && r.discipline === Discipline.DUELL)
			.reduce((sum, r) => sum + r.total(), 0);
			return precision + duell;
		});

		const sortedDesc = totals.sort((a, b) => b - a);
		return sortedDesc.slice(0, 3).reduce((sum, total) => sum + total, 0);
	}

	// Neue Logik für Annex Scheibe
	calculateBestThreeSumAnnex(team) {
		if (!team || !team.shooters) return 0;
		
		const totals = team.shooters.map(shooter => {
			const result = this.results.find(r => 
			r.teamId === team.id && 
			r.shooterId === shooter.id && 
			r.discipline === Discipline.ANNEX_SCHEIBE
			);
			return result ? this.calculateBestFiveSeriesSum(result) : 0;
		});

		const sortedDesc = totals.sort((a, b) => b - a);
		return sortedDesc.slice(0, 3).reduce((sum, total) => sum + total, 0);
	}

	// Berechne beste 5 Serien aus 5 für einen einzelnen Schützen
	calculateBestFiveSeriesSum(result) {
		if (!result || !result.seriesSums) return 0;
		
		const seriesSums = result.seriesSums();
		return seriesSums.sort((a, b) => b - a).slice(0, 5).reduce((sum, series) => sum + series, 0);
	}

	// Utility-Methoden
	getTeamById(teamId) {
		if (!teamId) return null;
		return this.teams.find(t => t.id === teamId) || null;
	}

	getShooterById(shooterId) {
		if (!shooterId) return null;
		
		// Suche in Teams
		for (const team of this.teams) {
			const shooter = team.shooters.find(s => s.id === shooterId);
			if (shooter) return shooter;
		}
		
		// Suche in Einzelschützen
		return this.standaloneShooters.find(s => s.id === shooterId) || null;
	}

	getResultsForShooter(shooterId, discipline = null, teamId = null) {
		if (!shooterId) return [];
		
		return this.results.filter(r => {
			if (r.shooterId !== shooterId) return false;
			if (discipline && r.discipline !== discipline) return false;
			if (teamId !== null && r.teamId !== teamId) return false;
			return true;
		});
	}

	getResultsForTeam(teamId, discipline = null) {
		if (!teamId) return [];
		
		return this.results.filter(r => {
			if (r.teamId !== teamId) return false;
			if (discipline && r.discipline !== discipline) return false;
			return true;
		});
	}

	// Statistiken
	getStats() {
		return {
			teams: this.teams.length,
			standaloneShooters: this.standaloneShooters.length,
			totalShooters: this.teams.reduce((sum, t) => sum + t.shooters.length, 0) + this.standaloneShooters.length,
			results: this.results.length,
			disciplines: this.availableDisciplines.length,
			selectedDiscipline: this.selectedDiscipline,
			selectedCompetitionType: this.selectedCompetitionType
		};
	}

	// Debug-Methoden
	exportData() {
		return {
			teams: this.teams.map(t => t.toJSON()),
			standaloneShooters: this.standaloneShooters.map(s => s.toJSON()),
			results: this.results.map(r => r.toJSON()),
			availableDisciplines: this.availableDisciplines,
			selectedDiscipline: this.selectedDiscipline,
			selectedCompetitionType: this.selectedCompetitionType,
			exportDate: new Date().toISOString()
		};
	}

	importData(data) {
		try {
			if (data.teams) this.teams = data.teams.map(t => Team.fromJSON(t));
			if (data.standaloneShooters) this.standaloneShooters = data.standaloneShooters.map(s => Shooter.fromJSON(s));
			if (data.results) this.results = data.results.map(r => ResultEntry.fromJSON(r));
			if (data.availableDisciplines) this.availableDisciplines = data.availableDisciplines;
			if (data.selectedDiscipline) this.selectedDiscipline = data.selectedDiscipline;
			if (data.selectedCompetitionType) this.selectedCompetitionType = data.selectedCompetitionType;
			
			this.save();
			console.log('Data imported successfully');
			return true;
		} catch (error) {
			console.error('Error importing data:', error);
			throw new Error('Import fehlgeschlagen: ' + error.message);
		}
	}

	// Vollständiges Reset
	reset() {
		this.teams = [];
		this.standaloneShooters = [];
		this.results = [];
		this.visibleTeamIds = null;
		this.availableDisciplines = this.defaultDisciplines();
		this.selectedDiscipline = this.availableDisciplines[0];
		this.selectedCompetitionType = CompetitionType.PRAEZISION_DUELL;
		
		localStorage.removeItem('rundenkampf_bericht');
		console.log('Storage reset completed');
		return true;
	}
}

// Initialize storage
const storage = new Storage();

// Make storage available globally for debugging
if (typeof window !== 'undefined') {
	window.storage = storage;
}