// =================================================================
// MODELS - Sichere ID-Generierung für alle Entitäten
// =================================================================

// ✅ SICHERHEITSFIX: Kollisionssichere ID-Generierung
class SecureIDGenerator {
  constructor() {
    this.counter = 0;
    this.lastTimestamp = 0;
  }

  generate(prefix = "entity") {
    const timestamp = Date.now();
    
    // Verhindere identische Timestamps durch Counter-Increment
    if (timestamp === this.lastTimestamp) {
      this.counter++;
    } else {
      this.counter = 0;
      this.lastTimestamp = timestamp;
    }
    
    // Kombination aus:
    // 1. Timestamp (Millisekunden)
    // 2. Performance-Counter (Mikrosekunden) 
    // 3. Interner Counter (für gleiche Millisekunde)
    // 4. Random (für zusätzliche Sicherheit)
    const performanceNow = Math.round((performance.now() * 1000) % 1000000); // 6 Stellen
    const random = Math.random().toString(36).substr(2, 9);
    
    return `${prefix}_${timestamp}_${performanceNow}_${this.counter}_${random}`;
  }
}

// Globale sichere ID-Generator Instanz
const secureIdGenerator = new SecureIDGenerator();

// =================================================================
// ENUMS UND KONSTANTEN (unverändert)
// =================================================================

const Discipline = {
  PRAEZISION: "Präzision",
  DUELL: "Duell",
  ANNEX_SCHEIBE: "Annex",
};

const CompetitionType = {
  PRAEZISION_DUELL: "Präzision/Duell",
  ANNEX_SCHEIBE: "Annex",
};

// Utility Functions (unverändert)
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

// =================================================================
// MODEL CLASSES mit sicherer ID-Generierung
// =================================================================

class Shooter {
  constructor(name, id = null) {
    this.id = id || this.generateId(); // ✅ Weiterhin exakt gleiche API
    this.name = name;
  }

  // ✅ SICHERHEITSFIX: Sichere ID-Generierung statt unsichere
  generateId() {
    return secureIdGenerator.generate("shooter");
  }

  static fromJSON(json) {
    return new Shooter(json.name, json.id);
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
    };
  }
}

class Encounter {
  constructor(date, opponent, id = null) {
    this.id = id || this.generateId();
    this.date = date; // Format: "DD.MM.YYYY"
    this.opponent = opponent; // Name des Gegners
  }

  generateId() {
    return secureIdGenerator.generate("encounter");
  }

  static fromJSON(json) {
    return new Encounter(json.date, json.opponent, json.id);
  }

  toJSON() {
    return {
      id: this.id,
      date: this.date,
      opponent: this.opponent,
    };
  }
}

class TeamLeader {
  constructor(name = "", email = "", phone = "") {
    this.name = name;
    this.email = email;
    this.phone = phone;
  }

  static fromJSON(json) {
    if (!json) return new TeamLeader();
    return new TeamLeader(json.name || "", json.email || "", json.phone || "");
  }

  toJSON() {
    return {
      name: this.name,
      email: this.email,
      phone: this.phone,
    };
  }
}

class Team {
  constructor(name, shooters = [], id = null, teamLeader = null, encounters = []) {
    this.id = id || this.generateId(); // ✅ Weiterhin exakt gleiche API
    this.name = name;
    this.shooters = shooters.map((s) =>
      s instanceof Shooter ? s : Shooter.fromJSON(s)
    );
    this.teamLeader = teamLeader instanceof TeamLeader ? teamLeader : TeamLeader.fromJSON(teamLeader);
    this.encounters = encounters.map((e) =>
      e instanceof Encounter ? e : Encounter.fromJSON(e)
    );
  }

  // ✅ SICHERHEITSFIX: Sichere ID-Generierung statt unsichere
  generateId() {
    return secureIdGenerator.generate("team");
  }

  static fromJSON(json) {
    const shooters = json.shooters.map((s) => Shooter.fromJSON(s));
    const teamLeader = TeamLeader.fromJSON(json.teamLeader);
    const encounters = (json.encounters || []).map((e) => Encounter.fromJSON(e));
    return new Team(json.name, shooters, json.id, teamLeader, encounters);
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      shooters: this.shooters.map((s) => s.toJSON()),
      teamLeader: this.teamLeader.toJSON(),
      encounters: this.encounters.map((e) => e.toJSON()),
    };
  }
}

class ResultEntry {
  constructor(teamId, shooterId, discipline, shots = null, id = null) {
    this.id = id || this.generateId(); // ✅ Weiterhin exakt gleiche API
    this.teamId = teamId; // null für Einzelschützen
    this.shooterId = shooterId;
    this.discipline = discipline;
    this.shots = shots || new Array(40).fill(null);
  }

  // ✅ SICHERHEITSFIX: Sichere ID-Generierung statt unsichere
  generateId() {
    return secureIdGenerator.generate("result");
  }

  total() {
    return this.shots
      .filter((shot) => shot !== null)
      .reduce((sum, shot) => sum + shot, 0);
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
      shots: this.shots,
    };
  }

  // seriesSums Methode (unverändert)
  seriesSums() {
    if (this.discipline !== Discipline.ANNEX_SCHEIBE) {
      return [];
    }

    const sums = [];
    for (let series = 0; series < 5; series++) {
      const startIndex = series * 8;
      const endIndex = startIndex + 8;
      const seriesSum = this.shots
        .slice(startIndex, endIndex)
        .filter((shot) => shot !== null)
        .reduce((sum, shot) => sum + shot, 0);
      sums.push(seriesSum);
    }
    return sums;
  }
}