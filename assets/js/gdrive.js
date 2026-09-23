/**
 * Google Drive URL Utility — Segorokuwat
 * 
 * Converts various Google Drive URL formats into embeddable image URLs.
 * Handles thumbnail generation and fallback for broken images.
 */

const GDrive = {
  /**
   * Extract the file ID from various Google Drive URL formats.
   * 
   * Supported formats:
   * - https://drive.google.com/file/d/FILE_ID/view?usp=sharing
   * - https://drive.google.com/file/d/FILE_ID/view
   * - https://drive.google.com/open?id=FILE_ID
   * - https://drive.google.com/uc?id=FILE_ID
   * - https://drive.google.com/thumbnail?id=FILE_ID
   * - https://lh3.googleusercontent.com/d/FILE_ID
   * - Direct FILE_ID (no URL)
   * 
   * @param {string} url - Google Drive URL or file ID
   * @returns {string|null} File ID or null if not a valid URL
   */
  extractFileId(url) {
    if (!url || typeof url !== 'string') return null;

    url = url.trim();

    // Pattern: /file/d/FILE_ID/
    const filePattern = /\/file\/d\/([a-zA-Z0-9_-]+)/;
    const fileMatch = url.match(filePattern);
    if (fileMatch) return fileMatch[1];

    // Pattern: ?id=FILE_ID or &id=FILE_ID
    const idPattern = /[?&]id=([a-zA-Z0-9_-]+)/;
    const idMatch = url.match(idPattern);
    if (idMatch) return idMatch[1];

    // Pattern: lh3.googleusercontent.com/d/FILE_ID
    const lh3Pattern = /lh3\.googleusercontent\.com\/d\/([a-zA-Z0-9_-]+)/;
    const lh3Match = url.match(lh3Pattern);
    if (lh3Match) return lh3Match[1];

    // If it looks like a bare file ID (alphanumeric + underscore/hyphen, 20+ chars)
    if (/^[a-zA-Z0-9_-]{20,}$/.test(url)) {
      return url;
    }

    return null;
  },

  /**
   * Convert a Google Drive URL to an embeddable image URL.
   * Uses the thumbnail endpoint for better compatibility.
   * 
   * @param {string} url - Google Drive URL or file ID
   * @param {string} size - Size parameter: 's' (small), 'm' (medium), 'l' (large), 'xl' (extra large)
   * @returns {string} Embeddable image URL or the original URL if not a GDrive link
   */
  getImageUrl(url, size = 'l') {
    if (!url) return '';

    // If it's not a Google Drive URL, return as-is (could be a direct image URL)
    const fileId = this.extractFileId(url);
    if (!fileId) return url;

    // Use lh3.googleusercontent.com for the best compatibility
    // This endpoint supports size parameters via =s{pixels}
    const sizeMap = {
      's': 200,   // Small thumbnail
      'm': 400,   // Medium thumbnail 
      'l': 800,   // Large
      'xl': 1600, // Extra large / full view
      'full': 0,  // Original size (no size param)
    };

    const pixels = sizeMap[size] || sizeMap['l'];

    if (pixels === 0) {
      return `https://lh3.googleusercontent.com/d/${fileId}`;
    }

    return `https://lh3.googleusercontent.com/d/${fileId}=s${pixels}`;
  },

  /**
   * Get a thumbnail URL suitable for gallery grids.
   * 
   * @param {string} url - Google Drive URL or file ID
   * @returns {string} Thumbnail URL
   */
  getThumbnailUrl(url) {
    return this.getImageUrl(url, 'm');
  },

  /**
   * Get a full-size URL suitable for lightbox viewing.
   * 
   * @param {string} url - Google Drive URL or file ID
   * @returns {string} Full-size image URL
   */
  getFullUrl(url) {
    return this.getImageUrl(url, 'xl');
  },

  /**
   * Check if a URL is a valid Google Drive URL.
   * 
   * @param {string} url - URL to validate
   * @returns {boolean} True if valid Google Drive URL
   */
  isValidGDriveUrl(url) {
    return this.extractFileId(url) !== null;
  },

  /**
   * Fallback placeholder SVG as a data URI.
   * Used when an image fails to load.
   */
  FALLBACK_IMAGE: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23f1f3f5'/%3E%3Cg fill='%23adb5bd' transform='translate(150,100)'%3E%3Crect x='20' y='20' width='60' height='50' rx='4'/%3E%3Ccircle cx='40' cy='38' r='8'/%3E%3Cpath d='M20 70 L45 50 L55 58 L70 42 L80 55 L80 70 Z'/%3E%3C/g%3E%3Ctext x='200' y='200' text-anchor='middle' fill='%23adb5bd' font-family='sans-serif' font-size='14'%3EFoto tidak tersedia%3C/text%3E%3C/svg%3E`,

  /**
   * Attach error handler to an image element for fallback display.
   * 
   * @param {HTMLImageElement} imgElement - The image element
   * @param {string} [fallbackSrc] - Custom fallback image source
   */
  handleImageError(imgElement, fallbackSrc) {
    if (!imgElement) return;

    imgElement.addEventListener('error', function onError() {
      // Prevent infinite loop if fallback also fails
      this.removeEventListener('error', onError);
      this.src = fallbackSrc || GDrive.FALLBACK_IMAGE;
      this.classList.add('img-fallback-active');
      this.alt = 'Foto tidak tersedia';
    });
  },

  /**
   * Process all images within a container — convert GDrive URLs
   * and attach fallback handlers.
   * 
   * @param {HTMLElement} container - Container element
   */
  processImages(container) {
    if (!container) return;

    const images = container.querySelectorAll('img[data-gdrive-url]');
    images.forEach(img => {
      const url = img.getAttribute('data-gdrive-url');
      const size = img.getAttribute('data-gdrive-size') || 'l';

      img.src = this.getImageUrl(url, size);
      this.handleImageError(img);
    });
  },

  /**
   * Get a cover image URL for an activity, rotating per session.
   *
   * Priority:
   * 1. activity.cover_photo.image_url  — cover yang di-set manual di DB
   * 2. Foto unggulan (is_featured=true) untuk kegiatan ini — dipilih acak
   *    satu kali per sesi (disimpan di sessionStorage agar konsisten selama
   *    user browsing, tapi berganti di sesi/tab baru)
   * 3. null — caller harus tampilkan placeholder
   *
   * Cara pakai:
   *   const coverUrl = await GDrive.getSessionCover(activity);
   *
   * @param {object} activity - Object kegiatan dari DB.getActivities()
   * @returns {Promise<string|null>} Image URL atau null
   */
  async getSessionCover(activity) {
    // 1. Cover manual sudah ada di DB
    if (activity.cover_photo?.image_url) {
      return this.getImageUrl(activity.cover_photo.image_url, 'm');
    }

    const activityId = activity.id;
    const storageKey = `sgw_cover_${activityId}`;

    // 2a. Cek sessionStorage — sudah dipilih di sesi ini?
    try {
      const cached = sessionStorage.getItem(storageKey);
      if (cached) return this.getImageUrl(cached, 'm');
    } catch { /* sessionStorage tidak tersedia, lanjut */ }

    // 2b. Fetch foto unggulan kegiatan ini dari DB
    try {
      const featured = await DB.getFeaturedPhotosByActivity(activityId);
      if (featured && featured.length > 0) {
        // Pilih acak satu foto
        const picked = featured[Math.floor(Math.random() * featured.length)];
        const url = picked.image_url;

        // Simpan ke sessionStorage supaya konsisten selama sesi
        try { sessionStorage.setItem(storageKey, url); } catch { /* ignore */ }

        return this.getImageUrl(url, 'm');
      }
    } catch (err) {
      console.warn('[GDrive] getSessionCover fetch error:', err.message);
    }

    // 3. Tidak ada cover sama sekali
    return null;
  },
};

// Expose globally
window.GDrive = GDrive;
