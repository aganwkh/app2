
import { get, set, del, update } from 'idb-keyval';
import { GeneratedImage } from '../types';

const HISTORY_KEY = 'comfy_image_history';
const MAX_HISTORY_ITEMS = 50; // Limit to prevent DB from getting too huge

export const storageService = {
  /**
   * Loads all saved images from IndexedDB
   */
  async loadHistory(): Promise<GeneratedImage[]> {
    try {
      const history = await get<GeneratedImage[]>(HISTORY_KEY);
      return history || [];
    } catch (error) {
      console.error('Failed to load history from IDB:', error);
      return [];
    }
  },

  /**
   * Saves a new image to IndexedDB with JPEG compression
   */
  async saveImage(image: GeneratedImage): Promise<GeneratedImage> {
    try {
      // Ensure ID exists
      if (!image.id) image.id = crypto.randomUUID();

      let base64Url = image.url;

      // If it's a remote URL, fetch and convert to Compressed Base64 (JPEG)
      if (image.url.startsWith('http')) {
        try {
            const response = await fetch(image.url);
            const blob = await response.blob();
            // Convert to JPEG 0.8 quality to save space (PNG base64 is too huge)
            base64Url = await this.blobToCompressedBase64(blob);
        } catch (e) {
            console.warn("Fetch failed, saving original URL as fallback", e);
        }
      }

      const imageToSave: GeneratedImage = {
        ...image,
        url: base64Url, // Store Base64
        type: 'local_history'
      };

      await update(HISTORY_KEY, (val: GeneratedImage[] | undefined) => {
        const current = val || [];
        // Deduplicate just in case
        const filtered = current.filter(i => i.id !== imageToSave.id);
        const updated = [...filtered, imageToSave];
        
        // Keep only last N items
        if (updated.length > MAX_HISTORY_ITEMS) {
            return updated.slice(updated.length - MAX_HISTORY_ITEMS);
        }
        return updated;
      });

      return imageToSave;
    } catch (error) {
      console.error('Failed to save image to IDB:', error);
      return image; // Return original if save fails
    }
  },

  /**
   * Deletes a single image by ID
   */
  async deleteImage(imageId: string): Promise<GeneratedImage[]> {
      try {
          let newHistory: GeneratedImage[] = [];
          await update(HISTORY_KEY, (val: GeneratedImage[] | undefined) => {
              const current = val || [];
              newHistory = current.filter(img => img.id !== imageId);
              return newHistory;
          });
          return newHistory;
      } catch (error) {
          console.error("Failed to delete image", error);
          return [];
      }
  },

  /**
   * Clears all history
   */
  async clearHistory(): Promise<void> {
    await del(HISTORY_KEY);
  },

  /**
   * Helper: Convert Blob to JPEG Base64 to save storage space
   */
  blobToCompressedBase64(blob: Blob): Promise<string> {
    return new Promise((resolve) => {
      const url = URL.createObjectURL(blob);
      const img = new Image();
      img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
              // Draw on white background (for transparency handling)
              ctx.fillStyle = '#FFFFFF';
              ctx.fillRect(0, 0, canvas.width, canvas.height);
              ctx.drawImage(img, 0, 0);
              // Compress to JPEG 80% quality
              const data = canvas.toDataURL('image/jpeg', 0.8);
              URL.revokeObjectURL(url);
              resolve(data);
          } else {
              URL.revokeObjectURL(url);
              resolve(""); // Fail gracefully
          }
      };
      img.onerror = () => {
          // Fallback to raw reader if canvas fails
          URL.revokeObjectURL(url);
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
      };
      img.src = url;
    });
  }
};
