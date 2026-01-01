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
<p style="color: #666; margin-top: 8px;">Modus: ${storage.selectedCompetitionType}</‚
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
<div style="text-align: left; font-weight: bold; font-size: 8px;">Mannschaft Gesamt: </div>
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
<div style="text-align: left; font-weight: bold; font-size: 8px;">Mannschaft Gesamt: </div>
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
	
	// Header
	const header = document.createElement('div');
	header.innerHTML = '<h3 style="margin: 0 0 16px 0;">Einzelschützen</h3>';
	card.appendChild(header);
	
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

// Helper methods
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
	try {
	const filteredTeams = this.getFilteredTeams();
	const competitionType = storage.selectedCompetitionType;
	
	// Build export data (gleich wie vorher)
	let exportData = '';
	
	if (filteredTeams.length > 0) {
	filteredTeams.forEach(team => {
exportData += `<h2>${UIUtils.escapeHtml(team.name)} (${team.shooters.length} Schützen)</h2>`;

if (competitionType === CompetitionType.ANNEX_SCHEIBE) {
	exportData += this.createTeamTableAnnexHTML(team);
} else {
	exportData += this.createTeamTableStandardHTML(team);
}
});
}

if (storage.standaloneShooters.length > 0) {
	exportData += '<h2>Einzelschützen</h2>';
	
	if (competitionType === CompetitionType.ANNEX_SCHEIBE) {
	exportData += this.createSoloShootersTableAnnexHTML();
} else {
	exportData += this.createSoloShootersTableStandardHTML();
}
}

// Logo laden und als base64 konvertieren
this.loadLogoAsBase64().then(logoBase64 => {
	// HTML für PDF erstellen
	const htmlContent = `
	<div style="font-family: Arial, sans-serif; font-size: 10px; line-height: 1.2;">
	<div style="display: flex; align-items: flex-start; margin-bottom: 15px;">
	<div style="width: 100px; height: 100px; margin-right: 15px; flex-shrink: 0;">
	${logoBase64 ? 
	`<img src="${logoBase64}" style="width: 75%; height: 80%; object-fit: contain;">` :
	`<div style="width: 100%; height: 100%; background: #4CAF50; border-radius: 6px; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 9px; text-align: center; flex-direction: column;">
	<div>SCHÜTZEN</div>
	<div>VEREIN</div>
	<div>LOGO</div>
	</div>`
}
</div>
<div>
<h1 style="margin: 0 0 10px 0; font-size: 22px; font-weight: bold; color: #333;">Rundenkampfbericht</h1>
<div style="margin: 5px 0; font-size: 12px; color: #555;"><strong>Disziplin:</strong> ${storage.selectedDiscipline || 'Nicht gewählt'}</div>
<div style="margin: 5px 0; font-size: 12px; color: #555;"><strong>Wettkampfdatum:</strong> ${new Date().toLocaleDateString('de-DE')}</div>
</div>
</div>

<!--<hr style="border: 1px solid #ddd; margin: 15px 0;">-->

<div style="margin-bottom: 60px;">
${exportData}
</div>

<div style="border-top: 1px solid #666; padding-top: 8px; font-size: 8px; line-height: 1.3; color: #666; text-align: justify; width: 100%; margin: 0; max-width: 100%;">
Die Mannschaftsführer bestätigen, dass alle Mannschaftschützen gemäß Rundenkampfordnung startberechtigt waren und der Wettkampf nach SpO des DSB in Verbindung mit der RKO des PSSB durchgeführt wurde.
</div>
</div>

<style>

</style>`;

// PDF-Optionen
const options = {
	margin: [1, 1.5, 2.5, 1.5],
filename: `Rundenkampfbericht_${new Date().toLocaleDateString('de-DE').replace(/\./g, '_')}.pdf`,
image: { type: 'jpeg', quality: 0.98 },
html2canvas: { 
	scale: 2,
	useCORS: true,
	letterRendering: true,
	allowTaint: true
},
jsPDF: { 
	unit: 'cm', 
	format: 'a4', 
	orientation: 'portrait' 
}
};

// PDF erstellen und herunterladen
html2pdf().set(options).from(htmlContent).save();

}).catch(error => {
	console.error('Error loading logo:', error);
	// Fallback ohne Logo
	alert('Logo konnte nicht geladen werden. PDF wird ohne Logo erstellt.');
});

} catch (error) {
	console.error('Error exporting PDF:', error);
	alert('Fehler beim PDF-Export: ' + error.message);
}
}

// Hilfsfunktion zum Laden des Logos
loadLogoAsBase64() {
	return new Promise((resolve, reject) => {
	const img = new Image();
	img.crossOrigin = 'anonymous';
	
	img.onload = function() {
	const canvas = document.createElement('canvas');
	const ctx = canvas.getContext('2d');
	
	canvas.width = this.naturalWidth;
	canvas.height = this.naturalHeight;
	
	ctx.drawImage(this, 0, 0);
	
	try {
	const base64 = canvas.toDataURL('image/png');
	resolve(base64);
} catch (e) {
	reject(e);
}
};

img.onerror = function() {
	resolve(null); // Kein Logo verfügbar
};

// Versuche verschiedene Logo-Pfade
const logoPaths = [
'./assets/logo.png',
'./icons/icon-192x192.png',
'assets/logo.png',
'icons/icon-192x192.png'
];

img.src = logoPaths[0];
});
}

// HTML für PDF-Export (Standard-Tabelle) - Mobile-optimiert
createTeamTableStandardHTML(team) {
	const shooterData = this.prepareShooterData(team);
	const worstShooterId = this.getWorstShooterId(team);
	const teamTotal = storage.calculateBestThreeSum(team);
	
	let html = `
	<table style="width: 100%; border-radius: 8px; border: 1px solid #e9ecef; border-collapse: collapse; margin-bottom: 15px;">
	<thead>
	<tr>
	<th style="background-color: #f0f0f0; font-weight: bold; text-align: left; font-size: 12px; padding: 6px 3px; border: 0; border-top-left-radius: 6px;">Name</th>
	<th style="background-color: #f0f0f0; font-weight: bold; text-align: center; font-size: 12px; padding: 6px 3px; border: 0;">Präzision</th>
	<th style="background-color: #f0f0f0; font-weight: bold; text-align: center; font-size: 12px; padding: 6px 3px; border: 0;">Duell</th>
	<th style="background-color: #f0f0f0; font-weight: bold; text-align: right; font-size: 12px; padding: 6px 3px; border: 0; border-top-right-radius: 6px;">Gesamt</th>
	</tr>
	</thead>
	<tbody>
	`;
	
	shooterData.forEach((data, index) => {
	const [shooter, precision, duell, total] = data;
	const isWorst = shooter.id === worstShooterId && team.shooters.length >= 4;
	const zebraStyle = index % 2 === 1 ? 'background-color: #f8f9fa;' : '';
	const worstStyle = isWorst ? 'color: #dc3545; text-decoration: underline;' : '';
	
	html += `
	<tr style="${zebraStyle}">
<td style="padding: 4px 3px; text-align: left; font-size: 12px; vertical-align: middle; border: 0; width: 40%; ${worstStyle}">${UIUtils.escapeHtml(shooter.name)}</td>
<td style="padding: 4px 3px; text-align: center; font-size: 12px; vertical-align: middle; border: 0; width: 20%;">${precision}</td>
<td style="padding: 4px 3px; text-align: center; font-size: 12px; vertical-align: middle; border: 0; width: 20%;">${duell}</td>
<td style="padding: 4px 3px; text-align: right; font-size: 12px; vertical-align: middle; border: 0; width: 20%; font-weight: bold; ${worstStyle}">${total}</td>
</tr>
`;
});

html += `
<tr>
<td colspan="3" style="background-color: #e9ecef; text-align: left; font-weight: bold; font-size: 12px; padding: 6px 3px; border: 0; border-bottom-left-radius: 6px;">Mannschaft Gesamt</td>
<td style="background-color: #e9ecef; text-align: right; font-weight: bold; font-size: 12px; padding: 6px 3px; border: 0; border-bottom-right-radius: 6px;">${teamTotal}</td>
</tr>
</tbody>
</table>
`;

return html;
}

// HTML für PDF-Export (Annex-Tabelle) - Mobile-optimiert
createTeamTableAnnexHTML(team) {
	const shooterData = this.prepareShooterDataAnnex(team);
	const worstShooterId = this.getWorstShooterIdAnnex(team);
	const teamTotal = storage.calculateTeamTotal(team, CompetitionType.ANNEX_SCHEIBE);
	
	let html = `
	<table style="width: 100%; border-radius: 8px; border: 1px solid #e9ecef; border-collapse: collapse; margin-bottom: 15px;">
	<thead>
	<tr>
	<th style="background-color: #f0f0f0; font-weight: bold; text-align: left; font-size: 12px; padding: 6px 3px; border: 0; width: 30%; border-top-left-radius: 6px;">Name</th>
	<th style="background-color: #f0f0f0; font-weight: bold; text-align: center; font-size: 12px; padding: 6px 3px; border: 0; width: 10%;">S1</th>
	<th style="background-color: #f0f0f0; font-weight: bold; text-align: center; font-size: 12px; padding: 6px 3px; border: 0; width: 10%;">S2</th>
	<th style="background-color: #f0f0f0; font-weight: bold; text-align: center; font-size: 12px; padding: 6px 3px; border: 0; width: 10%;">S3</th>
	<th style="background-color: #f0f0f0; font-weight: bold; text-align: center; font-size: 12px; padding: 6px 3px; border: 0; width: 10%;">S4</th>
	<th style="background-color: #f0f0f0; font-weight: bold; text-align: center; font-size: 12px; padding: 6px 3px; border: 0; width: 10%;">S5</th>
	<th style="background-color: #f0f0f0; font-weight: bold; text-align: right; font-size: 12px; padding: 6px 3px; border: 0; width: 20%; border-top-right-radius: 6px;">Gesamt</th>
	</tr>
	</thead>
	<tbody>
	`;
	
	shooterData.forEach((data, index) => {
	const [shooter, seriesSums, total] = data;
	const isWorst = shooter.id === worstShooterId && team.shooters.length >= 4;
	const zebraStyle = index % 2 === 1 ? 'background-color: #f8f9fa;' : '';
	const worstStyle = isWorst ? 'color: #dc3545; text-decoration: underline;' : '';
	
	html += `<tr style="${zebraStyle}">`;
html += `<td style="padding: 4px 3px; text-align: left; font-size: 12px; vertical-align: middle; border: 0; ${worstStyle}">${UIUtils.escapeHtml(shooter.name)}</td>`;

for (let i = 0; i < 5; i++) {
	const seriesValue = i < seriesSums.length ? seriesSums[i] : 0;
html += `<td style="padding: 4px 3px; text-align: center; font-size: 12px; vertical-align: middle; border: 0;">${seriesValue}</td>`;
}

html += `<td style="padding: 4px 3px; text-align: right; font-size: 12px; vertical-align: middle; border: 0; font-weight: bold; ${worstStyle}">${total}</td>`;
html += `</tr>`;
});

html += `
<tr>
<td colspan="6" style="background-color: #e9ecef; text-align: left; font-weight: bold; font-size: 12px; padding: 6px 3px; border: 0; border-bottom-left-radius: 6px;">Mannschaft Gesamt</td>
<td style="background-color: #e9ecef; text-align: right; font-weight: bold; font-size: 12px; padding: 6px 3px; border: 0; border-bottom-right-radius: 6px;">${teamTotal}</td>
</tr>
</tbody>
</table>
`;

return html;
}

createSoloShootersTableStandardHTML() {
	const sortedShooters = [...storage.standaloneShooters].sort((a, b) => 
a.name.localeCompare(b.name, 'de', { sensitivity: 'base' })
);

let html = `
<table style="width: 100%; border-radius: 8px; border: 1px solid #e9ecef; border-collapse: collapse; margin-bottom: 15px;">
<thead>
<tr>
<th style="background-color: #f0f0f0; font-weight: bold; text-align: left; font-size: 12px; padding: 6px 3px; border: 0; width: 40%; border-top-left-radius: 6px;">Name</th>
<th style="background-color: #f0f0f0; font-weight: bold; text-align: center; font-size: 12px; padding: 6px 3px; border: 0; width: 20%;">Präzision</th>
<th style="background-color: #f0f0f0; font-weight: bold; text-align: center; font-size: 12px; padding: 6px 3px; border: 0; width: 20%;">Duell</th>
<th style="background-color: #f0f0f0; font-weight: bold; text-align: right; font-size: 12px; padding: 6px 3px; border: 0; width: 20%; border-top-right-radius: 6px;">Gesamt</th>
</tr>
</thead>
<tbody>
`;

sortedShooters.forEach((shooter, index) => {
	const precision = storage.results
	.filter(r => r.teamId === null && r.shooterId === shooter.id && r.discipline === Discipline.PRAEZISION)
	.reduce((sum, r) => sum + r.total(), 0);
	const duell = storage.results
	.filter(r => r.teamId === null && r.shooterId === shooter.id && r.discipline === Discipline.DUELL)
	.reduce((sum, r) => sum + r.total(), 0);
	const total = precision + duell;
	
	const zebraStyle = index % 2 === 1 ? 'background-color: #f8f9fa;' : '';
	
	html += `
	<tr style="${zebraStyle}">
<td style="padding: 4px 3px; text-align: left; font-size: 12px; vertical-align: middle; border: 0;">${UIUtils.escapeHtml(shooter.name)}</td>
<td style="padding: 4px 3px; text-align: center; font-size: 12px; vertical-align: middle; border: 0;">${precision}</td>
<td style="padding: 4px 3px; text-align: center; font-size: 12px; vertical-align: middle; border: 0;">${duell}</td>
<td style="padding: 4px 3px; text-align: right; font-size: 12px; vertical-align: middle; border: 0; font-weight: bold;">${total}</td>
</tr>
`;
});

html += `
</tbody>
</table>
`;

return html;
}

createSoloShootersTableAnnexHTML() {
	const sortedShooters = [...storage.standaloneShooters].sort((a, b) => 
a.name.localeCompare(b.name, 'de', { sensitivity: 'base' })
);

let html = `
<table style="width: 100%; border-radius: 8px; border: 1px solid #e9ecef; border-collapse: collapse; margin-bottom: 15px;">
<thead>
<tr>
<th style="background-color: #f0f0f0; font-weight: bold; text-align: left; font-size: 12px; padding: 6px 3px; border: 0; width: 30%; border-top-left-radius: 6px;">Name</th>
<th style="background-color: #f0f0f0; font-weight: bold; text-align: center; font-size: 12px; padding: 6px 3px; border: 0; width: 10%;">S1</th>
<th style="background-color: #f0f0f0; font-weight: bold; text-align: center; font-size: 12px; padding: 6px 3px; border: 0; width: 10%;">S2</th>
<th style="background-color: #f0f0f0; font-weight: bold; text-align: center; font-size: 12px; padding: 6px 3px; border: 0; width: 10%;">S3</th>
<th style="background-color: #f0f0f0; font-weight: bold; text-align: center; font-size: 12px; padding: 6px 3px; border: 0; width: 10%;">S4</th>
<th style="background-color: #f0f0f0; font-weight: bold; text-align: center; font-size: 12px; padding: 6px 3px; border: 0; width: 10%;">S5</th>
<th style="background-color: #f0f0f0; font-weight: bold; text-align: right; font-size: 12px; padding: 6px 3px; border: 0; width: 20%; border-top-right-radius: 6px;">Gesamt</th>
</tr>
</thead>
<tbody>
`;

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

const zebraStyle = index % 2 === 1 ? 'background-color: #f8f9fa;' : '';

html += `<tr style="${zebraStyle}">`;
html += `<td style="padding: 4px 3px; text-align: left; font-size: 12px; vertical-align: middle; border: 0;">${UIUtils.escapeHtml(shooter.name)}</td>`;

for (let i = 0; i < 5; i++) {
	const seriesValue = i < seriesSums.length ? seriesSums[i] : 0;
html += `<td style="padding: 4px 3px; text-align: center; font-size: 12px; vertical-align: middle; border: 0;">${seriesValue}</td>`;
}

html += `<td style="padding: 4px 3px; text-align: right; font-size: 12px; vertical-align: middle; border: 0; font-weight: bold;">${total}</td>`;
html += `</tr>`;
});

html += `
</tbody>
</table>
`;

return html;
}
}