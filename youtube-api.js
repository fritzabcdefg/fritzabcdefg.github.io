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

      if (!this.apiKey || this.apiKey === 'AIzaSyBnIMfNz0_2DLKrzYzB_EzPgQCNmMhZ-x8') {
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
      console.log('YouTubeAPI: Found', videos.length, 'videos');
      if (!videos.length) return;

      const descriptionSection = document.querySelector('#description p');
      console.log('YouTubeAPI: Description section found?', !!descriptionSection);
      if (!descriptionSection) return;

      // Save original content
      const originalContent = descriptionSection.innerHTML;
      console.log('YouTubeAPI: Original content:', originalContent);

      // Check if API key is configured
      if (!this.apiKey || this.apiKey === 'YOUR_YOUTUBE_API_KEY_HERE') {
        console.warn('YouTube API key not configured');
        descriptionSection.innerHTML = '<em style="color: #d9534f;">Add your YouTube API key to config.js to load descriptions</em>';
        return;
      }

      // Extract first video ID (main video)
      const videoId = this.extractVideoId(videos[0]);
      console.log('YouTubeAPI: Video ID extracted:', videoId);
      if (!videoId) {
        console.warn('YouTubeAPI: Could not extract video ID');
        return;
      }

      // Show loading state
      descriptionSection.innerHTML = '<em>Loading description...</em>';

      // Fetch description
      const description = await this.fetchDescription(videoId);
      console.log('YouTubeAPI: Description from API:', description);
      
      if (description && description.trim().length > 0) {
        // YouTube has a description, use it
        console.log('YouTubeAPI: Using YouTube description');
        descriptionSection.innerHTML = this.formatDescription(description);
      } else {
        // No YouTube description, keep original or show message
        console.log('YouTubeAPI: No YouTube description found, keeping original content');
        descriptionSection.innerHTML = originalContent || '<em>Add a description to the YouTube video to display it here</em>';
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
    if (!window.YouTubeConfig?.apiKey) {
      console.warn('YouTubeConfig not available yet, retrying...');
      setTimeout(initYouTubeAPI, 500);
      return;
    }
    
    // Wait for description element to exist
    function waitForDescription() {
      const descSection = document.querySelector('#description p');
      if (!descSection) {
        setTimeout(waitForDescription, 100);
        return;
      }
      YouTubeAPI.init(window.YouTubeConfig.apiKey);
    }
    
    waitForDescription();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initYouTubeAPI);
  } else {
    // DOM already loaded, run immediately
    setTimeout(initYouTubeAPI, 100);
  }

  // Expose API globally
  window.YouTubeAPI = YouTubeAPI;

})();
