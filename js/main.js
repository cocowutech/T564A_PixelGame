// Main Application Entry Point
import studentController from './student-controller.js';
import teacherController from './teacher-controller.js';

class App {
    constructor() {
        this.currentScreen = 'landing';
        this.highContrastMode = false;
    }

    init() {
        this.setupLandingPage();
        this.setupAccessibility();
        this.loadSettings();
    }

    setupLandingPage() {
        const studentBtn = document.getElementById('btn-student');
        const teacherBtn = document.getElementById('btn-teacher');
        const backStudentBtn = document.getElementById('btn-back-student');
        const backTeacherBtn = document.getElementById('btn-back-teacher');

        // Student mode
        studentBtn.addEventListener('click', () => {
            this.showScreen('student-join');
            studentController.init();
        });

        // Teacher mode
        teacherBtn.addEventListener('click', () => {
            this.showScreen('teacher-setup');
            teacherController.init();
        });

        // Back buttons
        backStudentBtn.addEventListener('click', () => {
            this.showScreen('landing-page');
        });

        backTeacherBtn.addEventListener('click', () => {
            this.showScreen('landing-page');
        });
    }

    setupAccessibility() {
        // High contrast toggle (Ctrl+Shift+C)
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.shiftKey && e.key === 'C') {
                this.toggleHighContrast();
            }
        });

        // Keyboard navigation
        this.setupKeyboardNavigation();

        // Screen reader announcements
        this.setupAriaLive();

        // Focus management
        this.setupFocusManagement();
    }

    toggleHighContrast() {
        this.highContrastMode = !this.highContrastMode;
        document.body.classList.toggle('high-contrast', this.highContrastMode);

        // Save to localStorage
        localStorage.setItem('highContrastMode', this.highContrastMode);

        // Announce to screen reader
        this.announce(`High contrast mode ${this.highContrastMode ? 'enabled' : 'disabled'}`);
    }

    setupKeyboardNavigation() {
        // Tab navigation for nodes
        document.addEventListener('keydown', (e) => {
            const activeScreen = document.querySelector('.screen.active');
            if (!activeScreen) return;

            const focusableElements = activeScreen.querySelectorAll(
                'button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );

            const firstElement = focusableElements[0];
            const lastElement = focusableElements[focusableElements.length - 1];

            // Trap focus within modal
            if (e.key === 'Tab') {
                if (e.shiftKey && document.activeElement === firstElement) {
                    e.preventDefault();
                    lastElement.focus();
                } else if (!e.shiftKey && document.activeElement === lastElement) {
                    e.preventDefault();
                    firstElement.focus();
                }
            }

            // Escape to close modals
            if (e.key === 'Escape') {
                const modal = activeScreen.querySelector('.modal:not(.hidden)');
                if (modal) {
                    modal.classList.add('hidden');
                }
            }
        });
    }

    setupAriaLive() {
        // Create aria-live region for announcements
        const liveRegion = document.createElement('div');
        liveRegion.setAttribute('role', 'status');
        liveRegion.setAttribute('aria-live', 'polite');
        liveRegion.setAttribute('aria-atomic', 'true');
        liveRegion.className = 'sr-only';
        liveRegion.id = 'aria-live-region';
        document.body.appendChild(liveRegion);
    }

    setupFocusManagement() {
        // When screens change, focus first interactive element
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName === 'class') {
                    const target = mutation.target;
                    if (target.classList.contains('active')) {
                        const firstInput = target.querySelector('input, button');
                        if (firstInput) {
                            setTimeout(() => firstInput.focus(), 100);
                        }
                    }
                }
            });
        });

        document.querySelectorAll('.screen').forEach((screen) => {
            observer.observe(screen, { attributes: true });
        });
    }

    showScreen(screenId) {
        // Hide all screens
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });

        // Show target screen
        const targetScreen = document.getElementById(screenId);
        if (targetScreen) {
            targetScreen.classList.add('active');
            this.currentScreen = screenId;

            // Announce screen change
            const screenTitle = targetScreen.querySelector('h2')?.textContent || screenId;
            this.announce(`Navigated to ${screenTitle}`);
        }
    }

    announce(message) {
        const liveRegion = document.getElementById('aria-live-region');
        if (liveRegion) {
            liveRegion.textContent = message;
            // Clear after announcement
            setTimeout(() => {
                liveRegion.textContent = '';
            }, 1000);
        }
    }

    loadSettings() {
        // Load saved settings from localStorage
        const highContrast = localStorage.getItem('highContrastMode') === 'true';
        if (highContrast) {
            this.highContrastMode = true;
            document.body.classList.add('high-contrast');
        }

        // Load font size preference
        const fontSize = localStorage.getItem('fontSize');
        if (fontSize) {
            document.documentElement.style.setProperty('--font-size-md', fontSize + 'px');
        }
    }

    saveSettings() {
        localStorage.setItem('highContrastMode', this.highContrastMode);
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const app = new App();
    app.init();

    // Expose app globally for debugging
    window.pixelRelayApp = app;

    console.log('%c Pixel Relay: Connect & Compose ', 'background: #00ff9f; color: #0a0e27; font-size: 16px; font-weight: bold; padding: 8px;');
    console.log('Press Ctrl+Shift+C to toggle high contrast mode');
});

// Handle page unload
window.addEventListener('beforeunload', (e) => {
    // Clean up Firebase listeners
    // This would be called from gameState
});
