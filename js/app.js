class App {
  constructor() {
    this.currentView = "overview";
    this.views = {}; // GEÄNDERT: Leeres Object statt direkte Initialisierung
    this.isInitialized = false;
  }

  init() {
    console.log("App initializing...");

    try {
      // Check for required dependencies
      if (typeof storage === "undefined") {
        throw new Error("Storage not available");
      }

      // SICHERE VIEW-INITIALISIERUNG
      this.initializeViews();

      this.setupTabNavigation();
      this.isInitialized = true;
      this.showView("overview");

      console.log("App initialized successfully");
      return true;
    } catch (error) {
      console.error("Error initializing app:", error);
      this.showError("Initialisierungsfehler: " + error.message);
      return false;
    }
  }

  // NEU: Sichere View-Initialisierung
  initializeViews() {
    console.log("Initializing views...");
    
    try {
      // Prüfe jede View-Klasse einzeln
      if (typeof OverviewView !== "undefined") {
        this.views.overview = new OverviewView();
        console.log("✓ OverviewView initialized");
      } else {
        console.error("✗ OverviewView not found");
        throw new Error("OverviewView not available");
      }

      if (typeof EntryView !== "undefined") {
        this.views.entry = new EntryView();
        console.log("✓ EntryView initialized");
      } else {
        console.error("✗ EntryView not found");
        throw new Error("EntryView not available");
      }

      if (typeof TeamsView !== "undefined") {
        this.views.teams = new TeamsView();
        console.log("✓ TeamsView initialized");
      } else {
        console.error("✗ TeamsView not found");
        throw new Error("TeamsView not available");
      }

      if (typeof SettingsView !== "undefined") {
        this.views.settings = new SettingsView();
        console.log("✓ SettingsView initialized");
      } else {
        console.error("✗ SettingsView not found");
        throw new Error("SettingsView not available");
      }

      console.log("All views initialized successfully");
    } catch (error) {
      console.error("Error initializing views:", error);
      throw error;
    }
  }

  setupTabNavigation() {
    const tabItems = document.querySelectorAll(".tab-item");
    tabItems.forEach((item) => {
      // Remove existing listeners by cloning
      const newItem = item.cloneNode(true);
      item.parentNode.replaceChild(newItem, item);

      newItem.addEventListener("click", (e) => {
        e.preventDefault();
        const tabName = e.currentTarget.getAttribute("data-tab");
        if (tabName && this.isInitialized) {
          this.showView(tabName);
        }
      });
    });
  }

  showView(viewName) {
    if (!this.isInitialized) {
      console.warn("App not initialized");
      return;
    }

    if (!this.views[viewName]) {
      console.error("View not available:", viewName);
      return;
    }

    try {
      console.log("Showing view:", viewName);

      // Update tab selection
      document.querySelectorAll(".tab-item").forEach((item) => {
        item.classList.remove("active");
        if (item.getAttribute("data-tab") === viewName) {
          item.classList.add("active");
        }
      });

      // Clear navigation buttons
      const navButtons = document.getElementById("navButtons");
      if (navButtons) {
        navButtons.innerHTML = "";
      }

      // Update content
      const mainContent = document.getElementById("mainContent");
      if (!mainContent) {
        console.error("Main content element not found");
        return;
      }

      mainContent.innerHTML = "";

      const viewContent = this.views[viewName].render();
      if (viewContent) {
        mainContent.appendChild(viewContent);
        this.currentView = viewName;
        console.log("View loaded successfully:", viewName);
      } else {
        mainContent.innerHTML =
          '<div class="card"><p>Ansicht konnte nicht geladen werden.</p></div>';
      }
    } catch (error) {
      console.error("Error showing view:", error);
      const mainContent = document.getElementById("mainContent");
      if (mainContent) {
        mainContent.innerHTML = `<div class="card"><p style="color: red;">Fehler beim Laden der Ansicht: ${error.message}</p></div>`;
      }
    }
  }

  showError(message) {
    const mainContent = document.getElementById("mainContent");
    if (mainContent) {
      mainContent.innerHTML = `
        <div class="card" style="text-align: center;">
          <h3 style="color: red;">Fehler</h3>
          <p>${message}</p>
          <button class="btn btn-primary" onclick="location.reload()">Neu laden</button>
        </div>
      `;
    }
  }

  // Public API methods
  getView(viewName) {
    return this.views[viewName];
  }

  getCurrentView() {
    return this.currentView;
  }

  isReady() {
    return this.isInitialized;
  }
}

// Global app instance
let app = null;

// Initialize app when DOM is loaded
function initApp() {
  console.log("DOM loaded, initializing app...");

  try {
    app = new App();
    const success = app.init();

    if (success) {
      // Make app and views globally available
      window.app = app;
      window.overviewView = app.getView("overview");
      window.entryView = app.getView("entry");
      window.teamsView = app.getView("teams");
      window.settingsView = app.getView("settings");

      console.log("App ready");
    } else {
      throw new Error("App initialization failed");
    }
  } catch (error) {
    console.error("Failed to initialize app:", error);

    const mainContent = document.getElementById("mainContent");
    if (mainContent) {
      mainContent.innerHTML = `
        <div class="card" style="text-align: center; margin-top: 50px;">
          <h3 style="color: red;">Fehler beim Laden</h3>
          <p>${error.message}</p>
          <p style="font-size: 14px; color: #666; margin-top: 16px;">
            Überprüfen Sie die Browser-Konsole für weitere Details.
          </p>
          <button class="btn btn-primary" onclick="location.reload()" style="margin-top: 16px;">
            Neu laden
          </button>
        </div>
      `;
    }
  }
}

// Global utility function
window.showView = function (viewName) {
  if (app && app.isReady()) {
    app.showView(viewName);
  } else {
    console.warn("App not ready");
  }
};

// Initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initApp);
} else {
  // DOM already loaded
  setTimeout(initApp, 100);
}

// Handle uncaught errors
window.addEventListener("error", (event) => {
  console.error("Uncaught error:", event.error);
  if (event.error && event.error.message) {
    UIUtils.showSuccessMessage("Fehler: " + event.error.message);
  }
});

window.addEventListener("unhandledrejection", (event) => {
  console.error("Unhandled promise rejection:", event.reason);
});

// Service Worker Registration mit Update-Handling
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    registerServiceWorker();
  });
}

async function registerServiceWorker() {
  try {
    const registration = await navigator.serviceWorker.register('./sw.js');

    console.log('Service Worker registered successfully:', registration);

    // Update-Handling
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;

      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          // Neuer Service Worker ist verfügbar
          showUpdateAvailable(newWorker);
        }
      });
    });

    // Message-Listener für Service Worker
    navigator.serviceWorker.addEventListener('message', event => {
      if (event.data && event.data.type === 'SW_UPDATED') {
        UIUtils.showSuccessMessage(event.data.message);
      }
    });

  } catch (error) {
    console.error('Service Worker registration failed:', error);
  }
}

function showUpdateAvailable(newWorker) {
  const updateButton = document.createElement('div');
  updateButton.innerHTML = `
    <div style="
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: #ff9500;
      color: black;
      padding: 16px 24px;
      border-radius: 12px;
      z-index: 1000;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 6px 20px rgba(0,0,0,0.3);
      min-width: 280px;
      text-align: center;
      max-width: 90vw;
    ">
      📱 App-Update verfügbar - Klicken zum Aktualisieren
    </div>
  `;

  updateButton.addEventListener('click', () => {
    newWorker.postMessage({ type: 'SKIP_WAITING' });
    window.location.reload();
  });

  document.body.appendChild(updateButton);

  // Automatisch nach 10 Sekunden entfernen
  setTimeout(() => {
    if (document.body.contains(updateButton)) {
      document.body.removeChild(updateButton);
    }
  }, 10000);
}

// Debug-Test beim Laden
console.log("=== FINAL DEBUG CHECK ===");
console.log("Available classes:");
console.log("- OverviewView:", typeof OverviewView !== 'undefined' ? "✓" : "✗");
console.log("- EntryView:", typeof EntryView !== 'undefined' ? "✓" : "✗");
console.log("- TeamsView:", typeof TeamsView !== 'undefined' ? "✓" : "✗");
console.log("- SettingsView:", typeof SettingsView !== 'undefined' ? "✓" : "✗");
console.log("- labelPrinter:", typeof labelPrinter !== 'undefined' ? "✓" : "✗");
console.log("- window.labelPrinter:", typeof window.labelPrinter !== 'undefined' ? "✓" : "✗");
console.log("- storage:", typeof storage !== 'undefined' ? "✓" : "✗");
console.log("- UIUtils:", typeof UIUtils !== 'undefined' ? "✓" : "✗");

// Offline/Online Status anzeigen
window.addEventListener('online', () => {
  if (typeof UIUtils !== 'undefined') {
    UIUtils.showSuccessMessage('🌐 Verbindung wiederhergestellt');
  }
});

window.addEventListener('offline', () => {
  if (typeof UIUtils !== 'undefined') {
    UIUtils.showSuccessMessage('📵 Offline-Modus aktiviert');
  }
});