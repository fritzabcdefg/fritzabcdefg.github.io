/* =============================================
   CADAO OS WEBSITE - MAIN SCRIPTS
   ============================================= */

(function() {
  'use strict';

  // Initialize navigation when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeNavigation);
  } else {
    initializeNavigation();
  }

  function initializeNavigation() {
    const elems = document.querySelectorAll('[data-path]');
    if (!elems.length) return;

    const base = (document.baseURI || location.href || '').toString();
    const lower = base.toLowerCase();
    const markers = ['/installations/', '/laboratory/', '/finals/', '/about.html', '/home.html'];
    
    let cut = -1;
    for (const m of markers) {
      const i = lower.indexOf(m);
      if (i !== -1 && (cut === -1 || i < cut)) cut = i;
    }

    let siteRoot;
    if (cut !== -1) {
      siteRoot = base.slice(0, cut);
      if (!siteRoot.endsWith('/')) siteRoot += '/';
    } else {
      const last = base.lastIndexOf('/');
      siteRoot = last !== -1 ? base.slice(0, last + 1) : base + '/';
    }

    // Normalize URL for comparison
    function normalizeUrl(url) {
      try {
        const resolved = new URL(url, siteRoot);
        return resolved.href.toLowerCase();
      } catch (e) {
        return url.toLowerCase();
      }
    }

    // Update active link states
    function updateActiveLinks() {
      const currentUrl = normalizeUrl(window.location.href);
      elems.forEach(el => {
        const path = el.getAttribute('data-path');
        const href = normalizeUrl(el.getAttribute('href') || path);
        const isActive = currentUrl.includes(href.split('/').pop()) || href === currentUrl;

        if (isActive) {
          el.classList.add('active');
          el.setAttribute('aria-current', 'page');
        } else {
          el.classList.remove('active');
          el.removeAttribute('aria-current');
        }
      });
    }

    // Setup navigation links
    elems.forEach(el => {
      const p = el.getAttribute('data-path');
      try {
        const resolved = new URL(p, siteRoot).href;
        el.setAttribute('href', resolved);
      } catch (e) {
        el.setAttribute('href', p);
      }

      el.style.cursor = 'pointer';
      el.addEventListener('click', function(e) {
        const href = this.getAttribute('href');
        if (href) {
          e.preventDefault();
          e.stopPropagation();
          this.classList.remove('active');
          setTimeout(() => {
            location.href = href;
          }, 100);
        }
      });
    });

    // Update active links on load and when page changes
    updateActiveLinks();
    window.addEventListener('load', updateActiveLinks);
    window.addEventListener('popstate', updateActiveLinks);
  }

})();
