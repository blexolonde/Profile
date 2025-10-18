/**
 * Portfolio Website JavaScript
 * Handles modals, navigation, theme switching, and interactions
 */

// ========================
// Constants & Configuration
// ========================
const CONFIG = {
  THEME_KEY: 'theme',
  SCROLL_OFFSET: 80,
  ANIMATION_DURATION: 300,
  NAVBAR_SCROLL_THRESHOLD: 50
};

const MODAL_MAP = {
  aviation: 'aviation-modal',
  articles: 'movie-modal',
  plugins: 'web-modal',
  mobile: 'churn-modal',
  light: 'ecommerce-modal',
  dark: 'bank-modal'
};

// ========================
// Utility Functions
// ========================
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

const trapFocus = (element) => {
  const focusableElements = element.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  const firstFocusable = focusableElements[0];
  const lastFocusable = focusableElements[focusableElements.length - 1];

  element.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab') return;

    if (e.shiftKey) {
      if (document.activeElement === firstFocusable) {
        lastFocusable.focus();
        e.preventDefault();
      }
    } else {
      if (document.activeElement === lastFocusable) {
        firstFocusable.focus();
        e.preventDefault();
      }
    }
  });

  firstFocusable?.focus();
};

// ========================
// Modal Management
// ========================
class ModalManager {
  constructor() {
    this.activeModal = null;
    this.init();
  }

  init() {
    // Close button handlers
    $$('.close-btn').forEach(btn => {
      btn.addEventListener('click', () => this.close());
    });

    // Click outside to close
    window.addEventListener('click', (e) => {
      if (e.target.classList.contains('modal')) {
        this.close();
      }
    });

    // Escape key to close
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.activeModal) {
        this.close();
      }
    });
  }

  open(modalId) {
    const modal = $(`#${modalId}`);
    if (!modal) {
      console.warn(`Modal with id "${modalId}" not found`);
      return;
    }

    // Close any open modal first
    if (this.activeModal) {
      this.close();
    }

    this.activeModal = modal;
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
    
    // Trap focus within modal for accessibility
    trapFocus(modal);

    // Announce to screen readers
    modal.setAttribute('aria-hidden', 'false');
    
    // Smooth fade-in
    requestAnimationFrame(() => {
      modal.classList.add('modal-open');
    });
  }

  close() {
    if (!this.activeModal) return;

    this.activeModal.style.display = 'none';
    this.activeModal.setAttribute('aria-hidden', 'true');
    this.activeModal.classList.remove('modal-open');
    document.body.style.overflow = 'auto';
    this.activeModal = null;
  }
}

// ========================
// Navigation
// ========================
class Navigation {
  constructor() {
    this.navbar = $('.navbar');
    this.navLinks = $$('.navbar a');
    this.init();
  }

  init() {
    // Scroll behavior
    window.addEventListener('scroll', debounce(() => {
      this.handleScroll();
    }, 10));

    // Active link highlighting
    this.navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        if (link.getAttribute('href').startsWith('#')) {
          e.preventDefault();
          this.smoothScroll(link.getAttribute('href'));
          this.setActiveLink(link);
        }
      });
    });

    // Set initial active link
    this.updateActiveLink();
    window.addEventListener('scroll', debounce(() => {
      this.updateActiveLink();
    }, 100));
  }

  handleScroll() {
    if (!this.navbar) return;

    if (window.scrollY > CONFIG.NAVBAR_SCROLL_THRESHOLD) {
      this.navbar.classList.add('scrolled');
    } else {
      this.navbar.classList.remove('scrolled');
    }
  }

  smoothScroll(target) {
    const element = $(target);
    if (!element) return;

    const offsetTop = element.offsetTop - CONFIG.SCROLL_OFFSET;
    window.scrollTo({
      top: offsetTop,
      behavior: 'smooth'
    });
  }

  setActiveLink(link) {
    this.navLinks.forEach(l => l.classList.remove('active'));
    link.classList.add('active');
  }

  updateActiveLink() {
    const sections = $$('section[id], .hero[id]');
    const scrollPos = window.scrollY + CONFIG.SCROLL_OFFSET + 100;

    sections.forEach(section => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.offsetHeight;
      const sectionId = section.getAttribute('id');

      if (scrollPos >= sectionTop && scrollPos < sectionTop + sectionHeight) {
        this.navLinks.forEach(link => {
          link.classList.remove('active');
          if (link.getAttribute('href') === `#${sectionId}`) {
            link.classList.add('active');
          }
        });
      }
    });
  }
}

// ========================
// Project Cards
// ========================
class ProjectCards {
  constructor(modalManager) {
    this.modalManager = modalManager;
    this.init();
  }

  init() {
    // Case study buttons
    $$('.btn-primary').forEach(button => {
      if (button.textContent.trim().includes('Case Study')) {
        button.addEventListener('click', (e) => {
          e.stopPropagation();
          this.handleCaseStudyClick(button);
        });
      }
    });

    // Make entire cards clickable (optional)
    $$('.project-card').forEach(card => {
      const hasButton = card.querySelector('.btn-primary');
      if (hasButton) {
        card.style.cursor = 'pointer';
        card.addEventListener('click', () => {
          const modalId = this.getModalIdFromCard(card);
          if (modalId) {
            this.modalManager.open(modalId);
          }
        });
      }
    });
  }

  handleCaseStudyClick(button) {
    const projectCard = button.closest('.project-card, .project');
    const modalId = this.getModalIdFromCard(projectCard);
    
    if (modalId) {
      this.modalManager.open(modalId);
    }
  }

  getModalIdFromCard(card) {
    // Find matching modal based on card classes
    for (const [className, modalId] of Object.entries(MODAL_MAP)) {
      if (card.classList.contains(className)) {
        return modalId;
      }
    }
    return null;
  }
}

// ========================
// Theme Management
// ========================
class ThemeManager {
  constructor() {
    this.themeToggle = $('#themeToggle');
    this.init();
  }

  init() {
    if (!this.themeToggle) return;

    // Load saved theme
    this.loadTheme();

    // Toggle handler
    this.themeToggle.addEventListener('click', () => {
      this.toggle();
    });

    // Listen for system theme changes
    if (window.matchMedia) {
      window.matchMedia('(prefers-color-scheme: dark)')
        .addEventListener('change', (e) => {
          if (!localStorage.getItem(CONFIG.THEME_KEY)) {
            this.applyTheme(e.matches ? 'dark' : 'light');
          }
        });
    }
  }

  toggle() {
    const isDark = document.body.classList.contains('dark-mode');
    const newTheme = isDark ? 'light' : 'dark';
    this.applyTheme(newTheme);
    this.saveTheme(newTheme);
  }

  applyTheme(theme) {
    if (theme === 'dark') {
      document.body.classList.add('dark-mode');
      this.themeToggle.textContent = '🌙';
      this.themeToggle.setAttribute('aria-label', 'Switch to light mode');
    } else {
      document.body.classList.remove('dark-mode');
      this.themeToggle.textContent = '☀️';
      this.themeToggle.setAttribute('aria-label', 'Switch to dark mode');
    }
  }

  saveTheme(theme) {
    try {
      localStorage.setItem(CONFIG.THEME_KEY, theme);
    } catch (e) {
      console.warn('Could not save theme preference:', e);
    }
  }

  loadTheme() {
    try {
      const savedTheme = localStorage.getItem(CONFIG.THEME_KEY);
      
      // Use saved theme, or default to system preference
      if (savedTheme) {
        this.applyTheme(savedTheme);
      } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        this.applyTheme('dark');
      }
    } catch (e) {
      console.warn('Could not load theme preference:', e);
    }
  }
}

// ========================
// Back to Top Button
// ========================
class BackToTop {
  constructor() {
    this.button = $('.back-to-top');
    this.init();
  }

  init() {
    if (!this.button) return;

    window.addEventListener('scroll', debounce(() => {
      this.toggle();
    }, 100));

    this.button.addEventListener('click', () => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });
  }

  toggle() {
    if (window.scrollY > 300) {
      this.button.classList.add('show');
    } else {
      this.button.classList.remove('show');
    }
  }
}

// ========================
// Form Validation (Contact Form)
// ========================
class FormValidator {
  constructor(formSelector) {
    this.form = $(formSelector);
    if (this.form) {
      this.init();
    }
  }

  init() {
    this.form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (this.validate()) {
        this.handleSubmit();
      }
    });

    // Real-time validation
    this.form.querySelectorAll('input, textarea').forEach(field => {
      field.addEventListener('blur', () => {
        this.validateField(field);
      });
    });
  }

  validateField(field) {
    const value = field.value.trim();
    let isValid = true;
    let errorMessage = '';

    if (field.hasAttribute('required') && !value) {
      isValid = false;
      errorMessage = 'This field is required';
    } else if (field.type === 'email' && value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        isValid = false;
        errorMessage = 'Please enter a valid email address';
      }
    }

    this.showFieldError(field, isValid, errorMessage);
    return isValid;
  }

  validate() {
    const fields = this.form.querySelectorAll('input, textarea');
    let isFormValid = true;

    fields.forEach(field => {
      if (!this.validateField(field)) {
        isFormValid = false;
      }
    });

    return isFormValid;
  }

  showFieldError(field, isValid, message) {
    const errorEl = field.parentElement.querySelector('.input-error');
    
    if (isValid) {
      field.classList.remove('error');
      if (errorEl) errorEl.textContent = '';
    } else {
      field.classList.add('error');
      if (errorEl) {
        errorEl.textContent = message;
      } else {
        const error = document.createElement('span');
        error.className = 'input-error';
        error.textContent = message;
        field.parentElement.appendChild(error);
      }
    }
  }

  handleSubmit() {
    // Add your form submission logic here
    const formData = new FormData(this.form);
    console.log('Form submitted:', Object.fromEntries(formData));
    
    // Show success notification
    this.showNotification('Message sent successfully!', 'success');
    this.form.reset();
  }

  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => notification.classList.add('show'), 10);
    
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), CONFIG.ANIMATION_DURATION);
    }, 3000);
  }
}

// ========================
// Intersection Observer for Animations
// ========================
class AnimationObserver {
  constructor() {
    this.init();
  }

  init() {
    if (!('IntersectionObserver' in window)) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('fade-in-up');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    });

    // Observe elements
    $$('.project-card, .principle, .hobby-image').forEach(el => {
      observer.observe(el);
    });
  }
}

// ========================
// Initialize Everything
// ========================
class App {
  constructor() {
    this.modalManager = null;
    this.navigation = null;
    this.projectCards = null;
    this.themeManager = null;
    this.backToTop = null;
    this.formValidator = null;
    this.animationObserver = null;
  }

  init() {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setup());
    } else {
      this.setup();
    }
  }

  setup() {
    try {
      this.modalManager = new ModalManager();
      this.navigation = new Navigation();
      this.projectCards = new ProjectCards(this.modalManager);
      this.themeManager = new ThemeManager();
      this.backToTop = new BackToTop();
      this.formValidator = new FormValidator('.contact-form');
      this.animationObserver = new AnimationObserver();

      console.log('✅ Portfolio app initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing app:', error);
    }
  }
}

// ========================
// Start the Application
// ========================
const app = new App();
app.init();

// Export for potential module use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { App, ModalManager, Navigation, ThemeManager };
}