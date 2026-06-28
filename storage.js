/* ========================
   LOCAL STORAGE UTILITIES
   For saving recently watched and user preferences
   ======================== */

class LumiereStorage {
    constructor() {
        this.storageKey = 'lumiere_user_data';
        this.adBlockerKey = 'lumiere_adblocker_shown';
        this.initStorage();
    }

    initStorage() {
        if (!localStorage.getItem(this.storageKey)) {
            localStorage.setItem(this.storageKey, JSON.stringify({
                recentlyWatched: [],
                watchHistory: [],
                preferences: {},
                createdAt: new Date().toISOString()
            }));
        }
    }

    getData() {
        try {
            return JSON.parse(localStorage.getItem(this.storageKey)) || this.getDefaultData();
        } catch (e) {
            console.error('Error reading localStorage:', e);
            return this.getDefaultData();
        }
    }

    getDefaultData() {
        return {
            recentlyWatched: [],
            watchHistory: [],
            preferences: {},
            createdAt: new Date().toISOString()
        };
    }

    saveData(data) {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(data));
        } catch (e) {
            console.error('Error saving to localStorage:', e);
        }
    }

    // Add to recently watched
    addToRecentlyWatched(movie) {
        const data = this.getData();
        
        // Remove if already exists
        data.recentlyWatched = data.recentlyWatched.filter(m => m.id !== movie.id);
        
        // Add to top with timestamp
        data.recentlyWatched.unshift({
            id: movie.id,
            title: movie.title || movie.name,
            type: movie.type || 'movie',
            poster: movie.poster_path,
            rating: movie.vote_average,
            timestamp: new Date().toISOString()
        });
        
        // Keep only last 20
        data.recentlyWatched = data.recentlyWatched.slice(0, 20);
        
        this.saveData(data);
        return data.recentlyWatched;
    }

    // Get recently watched
    getRecentlyWatched() {
        const data = this.getData();
        return data.recentlyWatched || [];
    }

    // Clear recently watched
    clearRecentlyWatched() {
        const data = this.getData();
        data.recentlyWatched = [];
        this.saveData(data);
    }

    // Save preferences
    savePreference(key, value) {
        const data = this.getData();
        data.preferences[key] = value;
        this.saveData(data);
    }

    // Get preference
    getPreference(key) {
        const data = this.getData();
        return data.preferences[key];
    }

    // Ad blocker popup shown
    markAdBlockerShown() {
        localStorage.setItem(this.adBlockerKey, 'true');
    }

    // Check if ad blocker popup was shown
    hasAdBlockerBeenShown() {
        return localStorage.getItem(this.adBlockerKey) === 'true';
    }

    // Export all data
    exportData() {
        return this.getData();
    }

    // Import data (for migration/backup)
    importData(data) {
        this.saveData(data);
    }

    // Clear all data
    clearAllData() {
        localStorage.removeItem(this.storageKey);
        localStorage.removeItem(this.adBlockerKey);
        this.initStorage();
    }
}

// Global instance
const lumiereStorage = new LumiereStorage();
