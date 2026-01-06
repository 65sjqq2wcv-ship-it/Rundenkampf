class InputValidator {
  static validateShooterName(name) {
    if (!name || typeof name !== "string") {
      throw new Error("Schützername ist erforderlich");
    }

    const trimmed = name.trim();
    if (trimmed.length === 0) {
      throw new Error("Schützername darf nicht leer sein");
    }

    if (trimmed.length > 50) {
      throw new Error("Schützername darf maximal 50 Zeichen lang sein");
    }

    // Gefährliche Zeichen prüfen
    if (/<script|javascript:|on\w+=/i.test(trimmed)) {
      throw new Error("Schützername enthält ungültige Zeichen");
    }

    return trimmed;
  }

  static validateTeamName(name) {
    return this.validateShooterName(name); // Gleiche Regeln
  }

  static validateDisciplineName(name) {
    if (!name || typeof name !== "string") {
      throw new Error("Disziplinname ist erforderlich");
    }

    const trimmed = name.trim();
    if (trimmed.length === 0) {
      throw new Error("Disziplinname darf nicht leer sein");
    }

    if (trimmed.length > 100) {
      throw new Error("Disziplinname darf maximal 100 Zeichen lang sein");
    }

    return trimmed;
  }

  static validateShotValue(value, discipline) {
    const num = Number(value);

    if (isNaN(num) || !Number.isInteger(num)) {
      throw new Error("Schusswert muss eine ganze Zahl sein");
    }

    const competitionType = getCompetitionType(discipline);
    const maxValue = competitionType === CompetitionType.ANNEX_SCHEIBE ? 3 : 10;

    if (num < 0 || num > maxValue) {
      throw new Error(`Schusswert muss zwischen 0 und ${maxValue} liegen`);
    }

    return num;
  }
}
