// =================================================================
// ENTRY VIEW - Erweitert mit Scheibendokumentation
// =================================================================

class EntryView {
	constructor() {
	this.selectedTeamId = null;
	this.selectedShooterId = null;
	this.selectedDiscipline = Discipline.PRAEZISION;
	this.shots = new Array(40).fill(null);
	this.eventRegistry = new EventRegistry();
	this.isDestroyed = false;
	// Neu für Scheibendokumentation
	this.cameraStream = null;
	this.isCapturing = false;
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
// CONTROLS SECTION - Erweitert mit Kamera-Button
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

	// NEU: Scheibe Dokumentieren Button
	const cameraBtn = document.createElement('button');
	cameraBtn.className = 'btn btn-secondary';
	cameraBtn.id = 'cameraBtn';
	cameraBtn.style.cssText = 'padding: 10px 14px; font-size: 14px; background-color: #34c759; color: white;';
	cameraBtn.textContent = '📷 Scheibe';
	buttonsContainer.appendChild(cameraBtn);

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

// =================================================================
// NEU: SCHEIBENDOKUMENTATION
// =================================================================

async documentTarget() {
	try {
	// Validierung
	if (!this.selectedShooterId) {
	UIUtils.showError('Bitte wählen Sie zuerst einen Schützen aus.');
	return;
}

// Schützen-Informationen ermitteln
const shooterInfo = this.getShooterInfo();
if (!shooterInfo) {
	UIUtils.showError('Schützeninformationen nicht verfügbar.');
	return;
}

// Kamera-Modal anzeigen
this.showCameraModal(shooterInfo);

} catch (error) {
	console.error('Error starting target documentation:', error);
	UIUtils.showError('Fehler beim Starten der Kamera: ' + error.message);
}
}

getShooterInfo() {
	try {
	let shooter = null;
	let teamName = null;
	let displayName = '';

	// Schützen finden
	if (this.selectedTeamId) {
	const team = storage.teams.find(t => t.id === this.selectedTeamId);
	if (team) {
	shooter = team.shooters.find(s => s.id === this.selectedShooterId);
	teamName = team.name;
	// Mannschaftsschütze: Name - Verein
displayName = shooter ? `${shooter.name} - ${teamName}` : '';
}
} else {
	shooter = storage.standaloneShooters.find(s => s.id === this.selectedShooterId);
	// Einzelschütze: nur Name
	displayName = shooter ? shooter.name : '';
}

if (!shooter) return null;

return {
	name: displayName,
	shooterName: shooter.name,
	team: teamName,
	isTeamShooter: !!teamName,
	discipline: this.selectedDiscipline,
	currentDiscipline: storage.selectedDiscipline || 'Keine ausgewählt', // Aus Settings
	date: new Date().toLocaleDateString('de-DE'),
	competitionType: storage.selectedCompetitionType || 'Rundenkampf'
};

} catch (error) {
	console.error('Error getting shooter info:', error);
	return null;
}
}

showCameraModal(shooterInfo) {
	// Modal Container
	const modalContent = document.createElement('div');
	modalContent.style.cssText = 'width: 100%; max-width: 500px;';

	// Kamera-Bereich
	const cameraContainer = document.createElement('div');
	cameraContainer.style.cssText = 'position: relative; margin-bottom: 16px;';
	
	// Video Element für Kamera-Preview
	const video = document.createElement('video');
	video.style.cssText = 'width: 100%; height: 300px; background: #000; border-radius: 8px; object-fit: cover; aspect-ratio: 1/1;';
	video.autoplay = true;
	video.muted = true;
	video.playsInline = true;
	cameraContainer.appendChild(video);

	// Canvas für Foto (versteckt)
	const canvas = document.createElement('canvas');
	canvas.style.display = 'none';
	cameraContainer.appendChild(canvas);

	// === NEU: POSITIONSHILFEN-OVERLAY ===
	const guidesOverlay = document.createElement('div');
	guidesOverlay.className = 'guides-overlay';
	guidesOverlay.style.cssText = `
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	pointer-events: none;
	border: 2px dashed rgba(255, 255, 255, 0.8);
	border-radius: 8px;
	display: block;
	`;

	// Zielkreis für Scheibenmitte
	const targetCircle = document.createElement('div');
	targetCircle.style.cssText = `
	position: absolute;
	top: 50%;
	left: 50%;
	width: 80px;
	height: 80px;
	border: 3px solid rgba(255, 255, 255, 0.9);
	border-radius: 50%;
	transform: translate(-50%, -50%);
	box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.4);
	`;
	guidesOverlay.appendChild(targetCircle);

	// Innerer Zielkreis
	const innerCircle = document.createElement('div');
	innerCircle.style.cssText = `
	position: absolute;
	top: 50%;
	left: 50%;
	width: 40px;
	height: 40px;
	border: 2px solid rgba(255, 255, 255, 0.7);
	border-radius: 50%;
	transform: translate(-50%, -50%);
	`;
	guidesOverlay.appendChild(innerCircle);

	// Ecken-Markierungen
	const corners = [
{ position: 'top: 20px; left: 20px;', borders: 'border-top: 3px solid rgba(255, 255, 255, 0.9); border-left: 3px solid rgba(255, 255, 255, 0.9);' },
{ position: 'top: 20px; right: 20px;', borders: 'border-top: 3px solid rgba(255, 255, 255, 0.9); border-right: 3px solid rgba(255, 255, 255, 0.9);' },
{ position: 'bottom: 20px; left: 20px;', borders: 'border-bottom: 3px solid rgba(255, 255, 255, 0.9); border-left: 3px solid rgba(255, 255, 255, 0.9);' },
{ position: 'bottom: 20px; right: 20px;', borders: 'border-bottom: 3px solid rgba(255, 255, 255, 0.9); border-right: 3px solid rgba(255, 255, 255, 0.9);' }
];

corners.forEach(corner => {
	const cornerMark = document.createElement('div');
	cornerMark.style.cssText = `
	position: absolute;
${corner.position}
width: 25px;
height: 25px;
${corner.borders}
box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.3);
`;
guidesOverlay.appendChild(cornerMark);
});

// Mittellinie (horizontal)
const centerLineH = document.createElement('div');
centerLineH.style.cssText = `
position: absolute;
top: 50%;
left: 25%;
right: 25%;
height: 1px;
background: rgba(255, 255, 255, 0.6);
transform: translateY(-50%);
`;
guidesOverlay.appendChild(centerLineH);

// Mittellinie (vertikal)
const centerLineV = document.createElement('div');
centerLineV.style.cssText = `
position: absolute;
left: 50%;
top: 25%;
bottom: 25%;
width: 1px;
background: rgba(255, 255, 255, 0.6);
transform: translateX(-50%);
`;
guidesOverlay.appendChild(centerLineV);

cameraContainer.appendChild(guidesOverlay);
// === ENDE: POSITIONSHILFEN-OVERLAY ===

// Info-Overlay
const infoOverlay = document.createElement('div');
infoOverlay.style.cssText = `
position: absolute;
top: 10px;
left: 10px;
background: rgba(0,0,0,0.7);
color: white;
padding: 8px;
border-radius: 4px;
font-size: 12px;
line-height: 1.3;
z-index: 10;
`;
infoOverlay.innerHTML = `
Name: ${UIUtils.escapeHtml(shooterInfo.name)}<br>
Disziplin: ${UIUtils.escapeHtml(shooterInfo.currentDiscipline)}<br>
Scheibe: ${UIUtils.escapeHtml(shooterInfo.discipline)}<br>
Wettkampfdatum: ${shooterInfo.date}
`;
cameraContainer.appendChild(infoOverlay);

modalContent.appendChild(cameraContainer);

// Status-Anzeige - erweitert
const statusDiv = document.createElement('div');
statusDiv.id = 'cameraStatus';
statusDiv.style.cssText = 'text-align: center; margin-bottom: 16px; font-size: 14px; color: #666;';
statusDiv.innerHTML = `
<div>Kamera wird gestartet...</div>
<div style="font-size: 12px; margin-top: 4px; color: #999;">
🎯 Scheibe in den Zielkreis zentrieren<br>
📏 Scheibe sollte 80% des Bildbereichs ausfüllen
</div>
`;
modalContent.appendChild(statusDiv);

// Modal erstellen und anzeigen
const modal = new ModalComponent('Scheibe dokumentieren', modalContent);

modal.addAction('Abbrechen', () => {
	this.stopCamera();
}, false, false);

// === NEU: HILFEN TOGGLE BUTTON ===
modal.addAction('🎯 Hilfen ein/aus', () => {
	const overlay = cameraContainer.querySelector('.guides-overlay');
	if (overlay) {
	const isVisible = overlay.style.display !== 'none';
	overlay.style.display = isVisible ? 'none' : 'block';
}
}, false, false);

modal.addAction('Foto aufnehmen', () => {
	this.capturePhoto(video, canvas, shooterInfo);
}, true, false);

modal.onCloseHandler(() => {
	this.stopCamera();
});

modal.show();

// Kamera starten
setTimeout(() => {
	this.startCamera(video, statusDiv);
}, 200);
}

async startCamera(video, statusDiv) {
	try {
	// Kamera-Zugriff anfordern
	const stream = await navigator.mediaDevices.getUserMedia({
	video: { 
	facingMode: 'environment', // Rückkamera bevorzugen
width: { ideal: 1080 },
height: { ideal: 1080 }
},
audio: false
});

video.srcObject = stream;
this.cameraStream = stream;

// Erweiterte Status-Anzeige
statusDiv.innerHTML = `
<div style="color: #34c759; font-weight: bold;">📷 Kamera bereit</div>
<div style="font-size: 12px; margin-top: 4px; color: #666;">
🎯 Scheibe in den Zielkreis zentrieren<br>
📏 Scheibe sollte 80% des Bildbereichs ausfüllen<br>
💡 Für beste Qualität gut ausleuchten
</div>
`;

} catch (error) {
	console.error('Camera access error:', error);
	statusDiv.innerHTML = `
	<div style="color: #ff3b30;">Kamera-Zugriff fehlgeschlagen</div>
	<div style="font-size: 12px; margin-top: 4px;">
	Überprüfen Sie die Kamera-Berechtigungen
	</div>
	`;
	
	UIUtils.showError('Kamera-Zugriff nicht möglich. Stellen Sie sicher, dass die Kamera-Berechtigung erteilt wurde.');
}
}

stopCamera() {
	if (this.cameraStream) {
	this.cameraStream.getTracks().forEach(track => track.stop());
	this.cameraStream = null;
}
this.isCapturing = false;
}

capturePhoto(video, canvas, shooterInfo) {
	try {
	if (this.isCapturing) return;
	this.isCapturing = true;

	// Canvas Größe setzen - quadratisch
	const size = Math.min(video.videoWidth || 640, video.videoHeight || 640);
	canvas.width = size;
	canvas.height = size;
	
	const ctx = canvas.getContext('2d');
	
	// Video-Frame auf Canvas zeichnen (quadratisch zentriert)
	const sourceX = ((video.videoWidth || 640) - size) / 2;
	const sourceY = ((video.videoHeight || 640) - size) / 2;
	ctx.drawImage(video, sourceX, sourceY, size, size, 0, 0, size, size);
	
	// Text-Overlay hinzufügen
	this.addTextOverlay(ctx, canvas, shooterInfo);
	
	// Foto als Download anbieten
	this.downloadPhoto(canvas, shooterInfo);
	
	UIUtils.showSuccessMessage('Foto wurde aufgenommen!');
	
	// Modal schließen
	setTimeout(() => {
	this.stopCamera();
	// Modal schließen (falls noch offen)
	const modalOverlay = document.querySelector('.modal-overlay');
	if (modalOverlay) {
	modalOverlay.remove();
}
}, 1000);

} catch (error) {
	console.error('Error capturing photo:', error);
	UIUtils.showError('Fehler beim Aufnehmen des Fotos: ' + error.message);
	this.isCapturing = false;
}
}

addTextOverlay(ctx, canvas, shooterInfo) {
	// Text-Stil setzen
	ctx.font = 'bold 24px Arial';
	ctx.textAlign = 'left';

	// Text-Inhalt - angepasst nach Anforderungen
	const textLines = [
`Name: ${shooterInfo.name}`,
`Disziplin: ${shooterInfo.currentDiscipline}`, // Ersetzt "Verein"
`Scheibe: ${shooterInfo.discipline}`, // "Disziplin" zu "Scheibe" geändert
`Wettkampfdatum: ${shooterInfo.date}`
];

const lineHeight = 30;
const padding = 15;
const cornerRadius = 12;
const textHeight = textLines.length * lineHeight + padding * 2;

// Maximale Textbreite ermitteln
const maxTextWidth = Math.max(...textLines.map(line => ctx.measureText(line).width));
const textWidth = maxTextWidth + padding * 2;

// Position links oben
const x = 20;
const y = 20;

// Abgerundetes Rechteck für den weißen Hintergrund zeichnen
ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
this.drawRoundedRect(ctx, x, y, textWidth, textHeight, cornerRadius);
ctx.fill();

// Abgerundeten Rand um das Textfeld zeichnen
ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
ctx.lineWidth = 1;
this.drawRoundedRect(ctx, x, y, textWidth, textHeight, cornerRadius);
ctx.stroke();

// Schwarzen Text zeichnen
ctx.fillStyle = 'black';
textLines.forEach((line, index) => {
	const textY = y + padding + (index + 1) * lineHeight;
	ctx.fillText(line, x + padding, textY);
});
}

// Hilfsmethode für abgerundete Rechtecke
drawRoundedRect(ctx, x, y, width, height, radius) {
	ctx.beginPath();
	ctx.moveTo(x + radius, y);
	ctx.lineTo(x + width - radius, y);
	ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
	ctx.lineTo(x + width, y + height - radius);
	ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
	ctx.lineTo(x + radius, y + height);
	ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
	ctx.lineTo(x, y + radius);
	ctx.quadraticCurveTo(x, y, x + radius, y);
	ctx.closePath();
}

downloadPhoto(canvas, shooterInfo) {
	try {
	// Dateiname erstellen im Format: <Datum>-<Name>-<Scheibe>
	const date = new Date().toLocaleDateString('de-DE').replace(/\./g, '-'); // DD-MM-YYYY
	
	// Name normalisieren (bereits mit Verein kombiniert falls Mannschaftsschütze)
	const normalizedName = this.normalizeFileName(shooterInfo.name);
	
	// Scheibe/Disziplin normalisieren
	const normalizedDiscipline = this.normalizeFileName(shooterInfo.discipline);
	
const fileName = `${date}-${normalizedName}-${normalizedDiscipline}.jpg`;

// Canvas zu Blob konvertieren
canvas.toBlob((blob) => {
	if (!blob) {
	throw new Error('Fehler beim Erstellen des Bildes');
}

// Download-Link erstellen
const url = URL.createObjectURL(blob);
const link = document.createElement('a');
link.href = url;
link.download = fileName;
link.style.display = 'none';

document.body.appendChild(link);
link.click();
document.body.removeChild(link);

// URL freigeben
setTimeout(() => URL.revokeObjectURL(url), 1000);

}, 'image/jpeg', 0.95);

} catch (error) {
	console.error('Error downloading photo:', error);
	UIUtils.showError('Fehler beim Speichern des Fotos: ' + error.message);
}
}

// =================================================================
// ERWEITERTE CONTROLS SETUP
// =================================================================

setupControls() {
	if (this.isDestroyed) return;

	this.updateKeypad();

	const saveBtn = document.getElementById('saveBtn');
	const clearBtn = document.getElementById('clearBtn');
	const cameraBtn = document.getElementById('cameraBtn'); // NEU

	if (saveBtn) {
	this.eventRegistry.register(saveBtn, 'click', () => this.saveEntry());
}

if (clearBtn) {
	this.eventRegistry.register(clearBtn, 'click', () => this.clear());
}

// NEU: Kamera Button Event Listener
if (cameraBtn) {
	this.eventRegistry.register(cameraBtn, 'click', () => this.documentTarget());
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

normalizeFileName(text) {
	return text
	.replace(/ä/g, 'ae')
	.replace(/ö/g, 'oe')
	.replace(/ü/g, 'ue')
	.replace(/Ä/g, 'Ae')
	.replace(/Ö/g, 'Oe')
	.replace(/Ü/g, 'Ue')
	.replace(/ß/g, 'ss')
	.replace(/[^a-zA-Z0-9]/g, '_');
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
	keypad.style.cssText = 'display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; max-width: 100px; margin-bottom: 20px;';

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
deleteBtn.textContent = '⌫';

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
// ERWEITERTE CLEANUP-METHODE
// =================================================================

destroy() {
	this.isDestroyed = true;
	this.stopCamera(); // NEU: Kamera stoppen
	this.eventRegistry.cleanupAll();
	this.selectedTeamId = null;
	this.selectedShooterId = null;
	this.shots = new Array(40).fill(null);
}
}