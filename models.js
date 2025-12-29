// Enums und Konstanten
const Discipline = {
	PRAEZISION: 'Präzision',
	DUELL: 'Duell',
	ANNEX_SCHEIBE: 'Annex Scheibe'
};

const CompetitionType = {
	PRAEZISION_DUELL: 'Präzision/Duell',
	ANNEX_SCHEIBE: 'Annex Scheibe'
};

// Utility Functions
function getCompetitionType(discipline) {
	switch (discipline) {
		case Discipline.PRAEZISION:
		case Discipline.DUELL:
		return CompetitionType.PRAEZISION_DUELL;
		case Discipline.ANNEX_SCHEIBE:
		return CompetitionType.ANNEX_SCHEIBE;
		default:
		return CompetitionType.PRAEZISION_DUELL;
	}
}

// Model Classes
class Shooter {
	constructor(name, id = null) {
		this.id = id || this.generateId();
		this.name = name;
	}

	generateId() {
		return 'shooter_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
	}

	static fromJSON(json) {
		return new Shooter(json.name, json.id);
	}

	toJSON() {
		return {
			id: this.id,
			name: this.name
		};
	}
}

class Team {
	constructor(name, shooters = [], id = null) {
		this.id = id || this.generateId();
		this.name = name;
		this.shooters = shooters.map(s => s instanceof Shooter ? s : Shooter.fromJSON(s));
	}

	generateId() {
		return 'team_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
	}

	static fromJSON(json) {
		const shooters = json.shooters.map(s => Shooter.fromJSON(s));
		return new Team(json.name, shooters, json.id);
	}

	toJSON() {
		return {
			id: this.id,
			name: this.name,
			shooters: this.shooters.map(s => s.toJSON())
		};
	}
}

class ResultEntry {
	constructor(teamId, shooterId, discipline, shots = null, id = null) {
		this.id = id || this.generateId();
		this.teamId = teamId; // null für Einzelschützen
		this.shooterId = shooterId;
		this.discipline = discipline;
		this.shots = shots || new Array(40).fill(null);
	}

	generateId() {
		return 'result_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
	}

	total() {
		return this.shots.filter(shot => shot !== null).reduce((sum, shot) => sum + shot, 0);
	}

	static fromJSON(json) {
		return new ResultEntry(
		json.teamId,
		json.shooterId,
		json.discipline,
		json.shots || new Array(40).fill(null),
		json.id
		);
	}

	toJSON() {
		return {
			id: this.id,
			teamId: this.teamId,
			shooterId: this.shooterId,
			discipline: this.discipline,
			shots: this.shots
		};
	}
	
	// In ResultEntry class hinzufügen:
	seriesSums() {
		if (this.discipline !== Discipline.ANNEX_SCHEIBE) {
			return [];
		}
		
		const sums = [];
		for (let series = 0; series < 5; series++) {
			const startIndex = series * 8;
			const endIndex = startIndex + 8;
			const seriesSum = this.shots.slice(startIndex, endIndex)
			.filter(shot => shot !== null)
			.reduce((sum, shot) => sum + shot, 0);
			sums.push(seriesSum);
		}
		return sums;
	}
}