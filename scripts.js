/* =============================================
   CADAO OS WEBSITE - ADVANCED ROUTING SYSTEM
   ============================================= */

(function() {
  'use strict';

  // Router configuration and utilities
  const Router = {
    siteRoot: null,
    currentPath: null,
    
    // Detect site root intelligently
    detectSiteRoot() {
      const url = new URL(window.location.href);
      const pathname = url.pathname.toLowerCase();
      
      // Check for known route patterns
      const patterns = [
        /\/installations\//,
        /\/laboratory\//,
        /\/finals\//
      ];
      
      for (const pattern of patterns) {
        const match = pathname.match(pattern);
        if (match) {
          return pathname.substring(0, match.index) + '/';
        }
      }
      
      // If no pattern matched, remove the filename
      const lastSlash = pathname.lastIndexOf('/');
      return pathname.substring(0, lastSlash + 1);
    },

    // Get the current page path relative to site root
    getCurrentPagePath() {
      const url = new URL(window.location.href);
      const pathname = url.pathname;
      const relative = pathname.substring(this.siteRoot.length);
      return relative || 'home.html';
    },

    // Normalize paths for comparison
    normalizePath(path) {
      return path.replace(/\\/g, '/').toLowerCase();
    },

    // Check if a data-path matches the current page
    isCurrentPage(dataPath) {
      const normPath = this.normalizePath(dataPath);
      const currentPath = this.normalizePath(this.getCurrentPagePath());
      
      // Exact match
      if (normPath === currentPath) return true;
      
      // Match by filename
      const normFile = normPath.split('/').pop();
      const currentFile = currentPath.split('/').pop();
      
      return normFile === currentFile && normPath.includes('/') === currentPath.includes('/');
    },

    // Build full URL from data-path
    buildUrl(dataPath) {
      if (!dataPath) return '#';
      
      // If already absolute URL, return as-is
      if (dataPath.startsWith('http')) return dataPath;
      
      // Construct relative to site root
      const baseUrl = new URL(window.location.href);
      const rootUrl = baseUrl.protocol + '//' + baseUrl.host + this.siteRoot;
      
      try {
        return new URL(dataPath, rootUrl).href;
      } catch (e) {
        return dataPath;
      }
    },

    // Initialize all navigation links
    initializeLinks() {
      const links = document.querySelectorAll('[data-path]');
      if (!links.length) return;

      links.forEach(link => {
        const dataPath = link.getAttribute('data-path');
        const href = this.buildUrl(dataPath);
        
        // Set href attribute
        link.setAttribute('href', href);
        link.style.cursor = 'pointer';

        // Update active state
        if (this.isCurrentPage(dataPath)) {
          link.classList.add('active');
          link.setAttribute('aria-current', 'page');
        } else {
          link.classList.remove('active');
          link.removeAttribute('aria-current');
        }

        // Add click handler
        link.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          
          // Add a brief visual feedback
          link.style.opacity = '0.7';
          
          // Navigate after a short delay
          setTimeout(() => {
            window.location.href = href;
          }, 100);
        });
      });
    },

    // Update active link styling
    updateActiveLinks() {
      const links = document.querySelectorAll('[data-path]');
      links.forEach(link => {
        const dataPath = link.getAttribute('data-path');
        if (this.isCurrentPage(dataPath)) {
          link.classList.add('active');
          link.setAttribute('aria-current', 'page');
        } else {
          link.classList.remove('active');
          link.removeAttribute('aria-current');
        }
      });
    },

    // Initialize router
    init() {
      this.siteRoot = this.detectSiteRoot();
      this.currentPath = this.getCurrentPagePath();
      
      this.initializeLinks();
      
      // Update on page visibility changes
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
          this.updateActiveLinks();
        }
      });
      
      // Handle back/forward buttons
      window.addEventListener('popstate', () => {
        this.currentPath = this.getCurrentPagePath();
        this.updateActiveLinks();
      });
    }
  };

  // Initialize when DOM is ready
  function initRouter() {
    Router.init();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initRouter);
  } else {
    initRouter();
  }

  // Expose Router globally for debugging
  window.Router = Router;

})();
