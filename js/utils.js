// Utility Functions and Components - Sichere und wartbare Version

// ===== SICHERHEITS-KLASSEN =====

class InputValidator {
	static validateShooterName(name) {
		if (!name || typeof name !== 'string') {
			throw new Error('Schützername ist erforderlich');
		}
		
		const trimmed = name.trim();
		if (trimmed.length === 0) {
			throw new Error('Schützername darf nicht leer sein');
		}
		
		if (trimmed.length > 50) {
			throw new Error('Schützername darf maximal 50 Zeichen lang sein');
		}
		
		// Gefährliche Zeichen prüfen
		if (/<script|javascript:|on\w+=/i.test(trimmed)) {
			throw new Error('Schützername enthält ungültige Zeichen');
		}
		
		return trimmed;
	}

	static validateTeamName(name) {
		return this.validateShooterName(name); // Gleiche Regeln
	}

	static validateDisciplineName(name) {
		if (!name || typeof name !== 'string') {
			throw new Error('Disziplinname ist erforderlich');
		}
		
		const trimmed = name.trim();
		if (trimmed.length === 0) {
			throw new Error('Disziplinname darf nicht leer sein');
		}
		
		if (trimmed.length > 100) {
			throw new Error('Disziplinname darf maximal 100 Zeichen lang sein');
		}
		
		// Gefährliche Zeichen prüfen
		if (/<script|javascript:|on\w+=/i.test(trimmed)) {
			throw new Error('Disziplinname enthält ungültige Zeichen');
		}
		
		return trimmed;
	}

	static validateShotValue(value, discipline) {
		const num = Number(value);
		
		if (isNaN(num) || !Number.isInteger(num)) {
			throw new Error('Schusswert muss eine ganze Zahl sein');
		}
		
		const competitionType = getCompetitionType(discipline);
		const maxValue = competitionType === CompetitionType.ANNEX_SCHEIBE ? 3 : 10;
		
		if (num < 0 || num > maxValue) {
			throw new Error(`Schusswert muss zwischen 0 und ${maxValue} liegen`);
		}
		
		return num;
	}
}

// ===== EVENT-VERWALTUNG =====

class EventRegistry {
	constructor() {
		this.handlers = new Map();
		this.nextId = 1;
	}

	register(element, event, handler, options = {}) {
		if (!element || !event || !handler) {
			console.warn('Invalid event registration parameters');
			return null;
		}

		const id = `event_${this.nextId++}`;
		const key = `${element.tagName || 'unknown'}_${element.id || 'unnamed'}_${event}_${id}`;
		
		// Cleanup existing handler if element already has one
		this.cleanupElementHandlers(element, event);
		
		// Wrapping handler for error handling
		const safeHandler = (e) => {
			try {
				handler(e);
			} catch (error) {
				console.error('Error in event handler:', error);
				UIUtils.showSuccessMessage('Ein Fehler ist aufgetreten');
			}
		};
		
		element.addEventListener(event, safeHandler, options);
		this.handlers.set(key, { element, event, handler: safeHandler, options, originalHandler: handler });
		
		return key;
	}

	cleanupElementHandlers(element, event) {
		for (const [key, registration] of this.handlers.entries()) {
			if (registration.element === element && registration.event === event) {
				this.cleanup(key);
			}
		}
	}

	cleanup(key) {
		const registration = this.handlers.get(key);
		if (registration) {
			registration.element.removeEventListener(
				registration.event, 
				registration.handler, 
				registration.options
			);
			this.handlers.delete(key);
		}
	}

	cleanupAll() {
		for (const key of this.handlers.keys()) {
			this.cleanup(key);
		}
	}

	getHandlerCount() {
		return this.handlers.size;
	}
}

// ===== VERBESSERTE UI-UTILITIES =====

class UIUtils {
	static showSuccessMessage(message) {
		// Sichere Textzuweisung
		const successDiv = document.createElement('div');
		successDiv.className = 'success-message';
		successDiv.textContent = this.sanitizeText(message);
		
		document.body.appendChild(successDiv);
		
		// Fade in
		setTimeout(() => {
			successDiv.style.opacity = '1';
		}, 100);
		
		// Fade out and remove
		setTimeout(() => {
			successDiv.style.opacity = '0';
			setTimeout(() => {
				if (document.body.contains(successDiv)) {
					document.body.removeChild(successDiv);
				}
			}, 300);
		}, 2000);
	}

	static escapeHtml(text) {
		if (!text && text !== 0) return '';
		const div = document.createElement('div');
		div.textContent = String(text);
		return div.innerHTML;
	}

	static sanitizeText(text) {
		if (typeof text !== 'string') {
			text = String(text || '');
		}
		return text
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&#39;')
			.replace(/&(?!(amp|lt|gt|quot|#39);)/g, '&amp;');
	}

	static createElement(tag, className = '', textContent = '', attributes = {}) {
		// Sichere Element-Erstellung
		const allowedTags = ['div', 'span', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 
						   'button', 'input', 'select', 'option', 'label', 'table', 'tr', 'td', 'th'];
		
		if (!allowedTags.includes(tag.toLowerCase())) {
			console.warn(`Potentially unsafe tag: ${tag}`);
			tag = 'div';
		}

		const element = document.createElement(tag);
		
		if (className) element.className = String(className);
		if (textContent) element.textContent = this.sanitizeText(textContent);
		
		// Sichere Attribute-Zuweisung
		for (const [key, value] of Object.entries(attributes)) {
			if (this.isSafeAttribute(key)) {
				element.setAttribute(key, this.sanitizeText(value));
			}
		}
		
		return element;
	}

	static isSafeAttribute(attr) {
		const safeAttributes = ['id', 'class', 'data-*', 'aria-*', 'role', 'title', 
							   'value', 'placeholder', 'type', 'name'];
		return safeAttributes.some(safe => 
			safe.endsWith('*') ? attr.startsWith(safe.slice(0, -1)) : attr === safe
		);
	}

	static createSafeModal(title, contentElement) {
		if (!(contentElement instanceof Element)) {
			console.error('Modal content must be a DOM element');
			contentElement = this.createElement('div', '', 'Invalid content');
		}
		return new ModalComponent(this.sanitizeText(title), contentElement);
	}

	static showError(message, duration = 3000) {
		const errorDiv = document.createElement('div');
		errorDiv.className = 'error-message';
		errorDiv.style.cssText = `
			position: fixed;
			top: 80px;
			left: 50%;
			transform: translateX(-50%);
			background-color: #ff3b30;
			color: white;
			padding: 12px 20px;
			border-radius: 8px;
			font-size: 14px;
			font-weight: 500;
			z-index: 1000;
			opacity: 0;
			transition: opacity 0.3s;
		`;
		errorDiv.textContent = this.sanitizeText(message);
		
		document.body.appendChild(errorDiv);
		
		setTimeout(() => errorDiv.style.opacity = '1', 100);
		setTimeout(() => {
			errorDiv.style.opacity = '0';
			setTimeout(() => {
				if (document.body.contains(errorDiv)) {
					document.body.removeChild(errorDiv);
				}
			}, 300);
		}, duration);
	}
}

// ===== SICHERE MODAL-KOMPONENTE =====

class ModalComponent {
	constructor(title, content) {
		this.title = UIUtils.sanitizeText(title);
		this.content = content; // Nur DOM-Elemente akzeptieren
		this.actions = [];
		this.onClose = null;
		this.eventRegistry = new EventRegistry();
		this.overlay = null;
	}

	addAction(text, handler, isPrimary = false, isDanger = false) {
		this.actions.push({ 
			text: UIUtils.sanitizeText(text), 
			handler, 
			isPrimary, 
			isDanger 
		});
		return this;
	}

	onCloseHandler(handler) {
		if (typeof handler === 'function') {
			this.onClose = handler;
		}
		return this;
	}

	show() {
		// Cleanup existing modals
		this.removeExistingModals();

		const overlay = this.createOverlay();
		const modal = this.createModal();
		
		overlay.appendChild(modal);
		document.body.appendChild(overlay);

		// Sichere Event-Registrierung
		this.setupEvents(overlay);
		this.overlay = overlay;

		// Focus management für Accessibility
		const firstButton = modal.querySelector('button');
		if (firstButton) {
			setTimeout(() => firstButton.focus(), 100);
		}
	}

	removeExistingModals() {
		const existingModals = document.querySelectorAll('.modal-overlay');
		existingModals.forEach(modal => modal.remove());
	}

	createOverlay() {
		const overlay = document.createElement('div');
		overlay.className = 'modal-overlay';
		overlay.style.cssText = `
			position: fixed;
			top: 0;
			left: 0;
			width: 100%;
			height: 100%;
			background-color: rgba(0,0,0,0.5);
			display: flex;
			align-items: center;
			justify-content: center;
			z-index: 1000;
		`;
		return overlay;
	}

	createModal() {
		const modal = document.createElement('div');
		modal.className = 'modal';
		modal.style.cssText = `
			background: white;
			border-radius: 12px;
			max-width: 90%;
			max-height: 90%;
			overflow-y: auto;
			box-shadow: 0 10px 30px rgba(0,0,0,0.3);
		`;

		// Header
		const header = this.createHeader();
		modal.appendChild(header);

		// Body - nur DOM-Elemente
		const body = this.createBody();
		modal.appendChild(body);

		// Footer
		if (this.actions.length > 0) {
			const footer = this.createFooter();
			modal.appendChild(footer);
		}

		return modal;
	}

	createHeader() {
		const header = document.createElement('div');
		header.style.cssText = `
			padding: 16px 20px;
			border-bottom: 1px solid #f0f0f0;
			display: flex;
			justify-content: space-between;
			align-items: center;
		`;

		const title = document.createElement('h2');
		title.style.cssText = 'font-size: 18px; font-weight: 600; margin: 0;';
		title.textContent = this.title;
		header.appendChild(title);

		const closeButton = document.createElement('button');
		closeButton.style.cssText = `
			background: none;
			border: none;
			font-size: 24px;
			cursor: pointer;
			color: #666;
			padding: 0;
			width: 32px;
			height: 32px;
			display: flex;
			align-items: center;
			justify-content: center;
		`;
		closeButton.textContent = '×';
		closeButton.setAttribute('aria-label', 'Modal schließen');
		
		this.eventRegistry.register(closeButton, 'click', () => this.close());
		header.appendChild(closeButton);

		return header;
	}

	createBody() {
		const body = document.createElement('div');
		body.style.padding = '20px';
		
		if (this.content instanceof Element) {
			body.appendChild(this.content);
		} else if (typeof this.content === 'string') {
			// Fallback für String-Content (sicher)
			body.textContent = this.content;
		} else {
			body.textContent = 'Invalid content';
		}
		
		return body;
	}

	createFooter() {
		const footer = document.createElement('div');
		footer.style.cssText = `
			padding: 16px 20px;
			border-top: 1px solid #f0f0f0;
			display: flex;
			gap: 12px;
			justify-content: flex-end;
		`;

		this.actions.forEach((action, index) => {
			const button = document.createElement('button');
			button.className = 'btn';
			
			if (action.isPrimary) button.classList.add('btn-primary');
			else if (action.isDanger) button.classList.add('btn-danger');
			else button.classList.add('btn-secondary');

			button.textContent = action.text;
			
			this.eventRegistry.register(button, 'click', () => {
				try {
					if (action.handler) action.handler();
				} catch (error) {
					console.error('Error in modal action handler:', error);
					UIUtils.showError('Aktion fehlgeschlagen');
				}
				this.close();
			});

			// Keyboard navigation
			if (index === 0) button.setAttribute('data-default', 'true');

			footer.appendChild(button);
		});

		return footer;
	}

	setupEvents(overlay) {
		// Background click handler
		this.eventRegistry.register(overlay, 'click', (e) => {
			if (e.target === overlay) this.close();
		});

		// Keyboard handlers
		this.eventRegistry.register(document, 'keydown', (e) => {
			if (e.key === 'Escape') {
				e.preventDefault();
				this.close();
			}
		});
	}

	close() {
		if (this.overlay) {
			this.eventRegistry.cleanupAll();
			this.overlay.remove();
			this.overlay = null;
		}
		
		try {
			if (this.onClose) this.onClose();
		} catch (error) {
			console.error('Error in modal close handler:', error);
		}
	}
}

// ===== GLOBALE EVENT REGISTRY =====

// Globale Event Registry für die gesamte App
const globalEventRegistry = new EventRegistry();

// Cleanup beim Verlassen der Seite
window.addEventListener('beforeunload', () => {
	globalEventRegistry.cleanupAll();
});

// Debug-Methoden (nur in Development)
if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
	window.debugEventRegistry = () => {
		console.log('Active event handlers:', globalEventRegistry.getHandlerCount());
		console.log('Registry:', globalEventRegistry.handlers);
	};
}