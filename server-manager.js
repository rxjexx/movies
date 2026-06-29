/**
 * Server Manager
 * Manages backend streaming server configuration and status
 */

class ServerManager {
    constructor() {
        this.servers = [
            // Personal server
            {
                id: 'lumiere-local',
                name: 'Ethan\'s Server',
                url: 'http://localhost:5000',
                type: 'backend',
                quality: '1080p/4K',
                status: 'offline',
                provider: 'Personal',
                description: 'Your personal streaming backend',
                maintenance: true
            },
            // 2Embed - reliable provider
            {
                id: '2embed-cc',
                name: '2Embed.cc',
                url: 'https://www.2embed.cc',
                type: 'third-party',
                quality: '1080p',
                status: 'online',
                provider: '2Embed',
                description: 'Reliable Provider'
            },
            // VidSrc - reliable provider
            {
                id: 'vidsrc',
                name: 'VidSrc',
                url: 'https://vidsrc-embed.ru/embed',
                type: 'third-party',
                quality: '1080p',
                status: 'online',
                provider: 'VidSrc',
                description: 'High Quality'
            },
            // VidFast - fast provider
            {
                id: 'vidfast',
                name: 'VidFast.pro',
                url: 'https://vidfast.pro',
                type: 'third-party',
                quality: '1080p',
                status: 'online',
                provider: 'VidFast',
                description: 'Super Fast'
            }
        ];

        this.selectedServer = localStorage.getItem('selectedServer') || null;
        this.initCheckInterval();
    }

    /**
     * Check if backend server is available
     */
    async checkBackendServer() {
        try {
            // Try to reach the server without strict CORS (for file:// protocol)
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);
            
            const response = await fetch('http://localhost:5000/health', {
                method: 'GET',
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (response.ok) {
                this.updateServerStatus('lumiere-local', 'online');
                console.log('✅ Ethan\'s Server is online');
                return true;
            }
        } catch (error) {
            this.updateServerStatus('lumiere-local', 'offline');
            console.warn('⚠️ Ethan\'s Server status check blocked (CORS from file:// origin - this is normal)', error.message);
            // Even if health check fails, server might still work for streaming
            return false;
        }
    }

    /**
     * Initialize periodic health checks
     */
    initCheckInterval() {
        // Check immediately
        this.checkBackendServer();

        // Check every 30 seconds
        setInterval(() => {
            this.checkBackendServer();
        }, 30000);
    }

    /**
     * Update server status
     */
    updateServerStatus(serverId, status) {
        const server = this.servers.find(s => s.id === serverId);
        if (server) {
            server.status = status;
            this.notifyStatusUpdate(serverId, status);
        }
    }

    /**
     * Notify listeners of status update
     */
    notifyStatusUpdate(serverId, status) {
        const event = new CustomEvent('serverStatusChanged', {
            detail: { serverId, status }
        });
        document.dispatchEvent(event);
    }

    /**
     * Get all servers
     */
    getAllServers() {
        return this.servers;
    }

    /**
     * Get backend servers only
     */
    getBackendServers() {
        return this.servers.filter(s => s.type === 'backend');
    }

    /**
     * Get third-party servers
     */
    getThirdPartyServers() {
        return this.servers.filter(s => s.type === 'third-party');
    }

    /**
     * Get server by ID
     */
    getServer(id) {
        return this.servers.find(s => s.id === id);
    }

    /**
     * Select a server
     */
    selectServer(serverId) {
        const server = this.getServer(serverId);
        if (server) {
            this.selectedServer = serverId;
            localStorage.setItem('selectedServer', serverId);
            console.log('Selected server:', server.name);
            return true;
        }
        return false;
    }

    /**
     * Get selected server
     */
    getSelectedServer() {
        return this.getServer(this.selectedServer);
    }

    /**
     * Generate stream URL for content
     */
    generateStreamUrl(movieId, mediaType, serverId) {
        const server = serverId ? this.getServer(serverId) : this.getSelectedServer();
        if (!server) return null;

        const type = mediaType === 'show' ? 'tv' : 'movie';

        // Handle backend server (your custom server)
        if (server.id === 'lumiere-local') {
            return `${server.url}/${type}/${movieId}`;
        }

        // Provider-specific URL formats
        switch(server.id) {
            case '2embed-cc':
                return type === 'tv'
                    ? `${server.url}/embedtv/${movieId}`
                    : `${server.url}/embed/${movieId}`;
            
            case 'vidsrc':
                return type === 'tv'
                    ? `${server.url}/tv/${movieId}`
                    : `${server.url}/movie/${movieId}`;
            
            case 'vidfast':
                return type === 'tv'
                    ? `${server.url}/tv/${movieId}/1/1?autoPlay=true`
                    : `${server.url}/movie/${movieId}?autoPlay=true`;
            
            default:
                // Standard format: /embed/type/id
                return `${server.url}/${type}/${movieId}`;
        }
    }
}

// Initialize globally
const serverManager = new ServerManager();

// Listen for server status changes
document.addEventListener('serverStatusChanged', (event) => {
    const { serverId, status } = event.detail;
    console.log(`Server ${serverId} status changed to: ${status}`);

    // Update UI if server manager is displayed
    const statusElement = document.querySelector(`[data-server-id="${serverId}"] .server-status`);
    if (statusElement) {
        statusElement.textContent = status;
        statusElement.classList.toggle('online', status === 'online');
        statusElement.classList.toggle('offline', status === 'offline');
    }
});

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ServerManager;
}
