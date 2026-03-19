/* =============================================
   YOUTUBE API INTEGRATION
   ============================================= */

(function() {
  'use strict';

  const YouTubeAPI = {
    apiKey: null,
    cache: {},
    CACHE_DURATION: 24 * 60 * 60 * 1000, // 24 hours
    
    init(apiKey) {
      this.apiKey = apiKey;
      this.loadCache();
      this.extractAndFetchDescriptions();
    },

    // Extract video ID from YouTube iframe
    extractVideoId(iframe) {
      const src = iframe.getAttribute('src');
      const match = src?.match(/(?:youtube\.com\/embed\/|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
      return match ? match[1] : null;
    },

    // Get all YouTube iframes on the page
    getVideoElements() {
      return document.querySelectorAll('iframe[src*="youtube"]');
    },

    // Load cache from localStorage
    loadCache() {
      const stored = localStorage.getItem('youtubeDescriptionCache');
      if (stored) {
        try {
          const data = JSON.parse(stored);
          // Clean up expired entries
          const now = Date.now();
          for (const key in data) {
            if (now - data[key].timestamp > this.CACHE_DURATION) {
              delete data[key];
            }
          }
          this.cache = data;
          localStorage.setItem('youtubeDescriptionCache', JSON.stringify(this.cache));
        } catch (e) {
          console.warn('Failed to load YouTube cache', e);
        }
      }
    },

    // Save cache to localStorage
    saveCache() {
      try {
        localStorage.setItem('youtubeDescriptionCache', JSON.stringify(this.cache));
      } catch (e) {
        console.warn('Failed to save YouTube cache', e);
      }
    },

    // Fetch video description from YouTube API
    async fetchDescription(videoId) {
      // Check cache first
      if (this.cache[videoId]) {
        return this.cache[videoId].description;
      }

      if (!this.apiKey || this.apiKey === 'YOUR_YOUTUBE_API_KEY_HERE') {
        console.warn('YouTube API key not configured. Set YOUTUBE_API_KEY in config.js');
        return null;
      }

      try {
        const url = new URL('https://www.googleapis.com/youtube/v3/videos');
        url.searchParams.append('part', 'snippet');
        url.searchParams.append('id', videoId);
        url.searchParams.append('key', this.apiKey);

        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        const description = data.items?.[0]?.snippet?.description || null;

        // Cache the result
        this.cache[videoId] = {
          description: description,
          timestamp: Date.now()
        };
        this.saveCache();

        return description;
      } catch (error) {
        console.error(`Failed to fetch description for video ${videoId}:`, error);
        return null;
      }
    },

    // Convert plain text URLs to clickable links
    linkifyText(text) {
      if (!text) return text;
      const urlRegex = /(https?:\/\/[^\s]+)/g;
      return text.replace(urlRegex, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');
    },

    // Format description text
    formatDescription(text) {
      if (!text) return '';
      // Replace line breaks
      text = text.replace(/\n/g, '<br>');
      // Linkify URLs
      text = this.linkifyText(text);
      return text;
    },

    // Extract and fetch all video descriptions on page
    async extractAndFetchDescriptions() {
      const videos = this.getVideoElements();
      if (!videos.length) return;

      const descriptionSection = document.querySelector('#description p');
      if (!descriptionSection) return;

      // Extract first video ID (main video)
      const videoId = this.extractVideoId(videos[0]);
      if (!videoId) return;

      // Show loading state
      descriptionSection.innerHTML = '<em>Loading description...</em>';

      // Fetch description
      const description = await this.fetchDescription(videoId);
      
      if (description) {
        descriptionSection.innerHTML = this.formatDescription(description);
      } else {
        // Restore original content if fetch failed
        const originalContent = descriptionSection.getAttribute('data-original');
        if (originalContent) {
          descriptionSection.innerHTML = originalContent;
        }
      }
    },

    // Allow manual refresh of descriptions
    refresh() {
      this.cache = {};
      localStorage.removeItem('youtubeDescriptionCache');
      this.extractAndFetchDescriptions();
    }
  };

  // Initialize when DOM and config are ready
  function initYouTubeAPI() {
    if (window.YouTubeConfig?.apiKey) {
      YouTubeAPI.init(window.YouTubeConfig.apiKey);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initYouTubeAPI);
  } else {
    initYouTubeAPI();
  }

  // Expose API globally
  window.YouTubeAPI = YouTubeAPI;

})();
