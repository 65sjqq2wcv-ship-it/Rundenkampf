class App {
  constructor() {
    this.currentView = "overview";
    this.views = {
      overview: new OverviewView(),
      entry: new EntryView(),
      teams: new TeamsView(),
      settings: new SettingsView(),
    };
    this.isInitialized = false;
  }

  init() {
    console.log("App initializing...");

    try {
      // Check for required dependencies
      if (typeof storage === "undefined") {
        throw new Error("Storage not available");
      }

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
