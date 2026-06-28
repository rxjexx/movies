/* ========================
   RESPONSIVE DEVICE DETECTOR
   Detects device type and aspect ratio for responsive optimization
   ======================== */

class DeviceDetector {
    constructor() {
        this.init();
    }

    init() {
        this.detectDevice();
        this.setupResizeListener();
        this.logDeviceInfo();
    }

    detectDevice() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        const aspectRatio = (width / height).toFixed(2);

        this.device = {
            width,
            height,
            aspectRatio,
            type: this.getDeviceType(width),
            orientation: this.getOrientation(width, height),
            dpi: this.getDeviceDPI(),
            isTouchDevice: this.isTouchDevice(),
            isMobile: width < 768,
            isTablet: width >= 768 && width < 1024,
            isDesktop: width >= 1024,
            isUltraWide: parseFloat(aspectRatio) >= 2.0
        };

        return this.device;
    }

    getDeviceType(width) {
        if (width < 320) return 'small-phone';
        if (width < 480) return 'phone';
        if (width < 600) return 'small-phone-landscape';
        if (width < 768) return 'tablet-portrait';
        if (width < 1024) return 'tablet-landscape';
        if (width < 1280) return 'desktop';
        if (width < 1536) return 'desktop-lg';
        return 'ultrawide';
    }

    getOrientation(width, height) {
        return width > height ? 'landscape' : 'portrait';
    }

    getDeviceDPI() {
        return window.devicePixelRatio || 1;
    }

    isTouchDevice() {
        return (('ontouchstart' in window) ||
                (navigator.maxTouchPoints > 0) ||
                (navigator.msMaxTouchPoints > 0));
    }

    setupResizeListener() {
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.detectDevice();
                this.updateLayout();
            }, 250);
        }, { passive: true });
    }

    updateLayout() {
        // Update CSS variables based on device
        const root = document.documentElement;
        root.style.setProperty('--device-width', `${this.device.width}px`);
        root.style.setProperty('--device-height', `${this.device.height}px`);
        root.style.setProperty('--aspect-ratio', this.device.aspectRatio);
        
        // Update body class for CSS hooks
        document.body.className = document.body.className.replace(/device-\w+/g, '');
        document.body.classList.add(`device-${this.device.type}`);
        
        if (this.device.isTouchDevice) {
            document.body.classList.add('touch-device');
        } else {
            document.body.classList.remove('touch-device');
        }

        // Emit custom event
        window.dispatchEvent(new CustomEvent('devicechange', { detail: this.device }));
    }

    logDeviceInfo() {
        console.log('📱 Device Information:');
        console.log(`   Type: ${this.device.type}`);
        console.log(`   Dimensions: ${this.device.width}x${this.device.height}`);
        console.log(`   Aspect Ratio: ${this.device.aspectRatio}`);
        console.log(`   Orientation: ${this.device.orientation}`);
        console.log(`   DPI: ${this.device.dpi}`);
        console.log(`   Touch: ${this.device.isTouchDevice ? 'Yes' : 'No'}`);
        console.log(`   Category: ${this.device.isMobile ? 'Mobile' : this.device.isTablet ? 'Tablet' : 'Desktop'}`);
    }

    getInfo() {
        return this.device;
    }

    isMobile() {
        return this.device.isMobile;
    }

    isTablet() {
        return this.device.isTablet;
    }

    isDesktop() {
        return this.device.isDesktop;
    }

    isTouch() {
        return this.device.isTouchDevice;
    }

    getAspectRatio() {
        return this.device.aspectRatio;
    }

    matchesMediaQuery(query) {
        return window.matchMedia(query).matches;
    }
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.deviceDetector = new DeviceDetector();
    });
} else {
    window.deviceDetector = new DeviceDetector();
}

/* ========================
   RESPONSIVE UTILITIES
   ======================== */

const ResponsiveUtils = {
    // Check common breakpoints
    isXSmall: () => window.matchMedia('(max-width: 320px)').matches,
    isSmall: () => window.matchMedia('(min-width: 321px) and (max-width: 480px)').matches,
    isMedium: () => window.matchMedia('(min-width: 481px) and (max-width: 768px)').matches,
    isLarge: () => window.matchMedia('(min-width: 769px) and (max-width: 1024px)').matches,
    isXLarge: () => window.matchMedia('(min-width: 1025px)').matches,
    
    // Orientation
    isPortrait: () => window.matchMedia('(orientation: portrait)').matches,
    isLandscape: () => window.matchMedia('(orientation: landscape)').matches,
    
    // Aspect ratios
    isSquareish: () => parseFloat(window.deviceDetector.getAspectRatio()) < 1.2,
    isWidescreen: () => parseFloat(window.deviceDetector.getAspectRatio()) >= 1.5,
    isUltraWide: () => parseFloat(window.deviceDetector.getAspectRatio()) >= 2.0,
    
    // Device capabilities
    isRetina: () => window.devicePixelRatio > 1,
    isHighRes: () => window.devicePixelRatio >= 2,
    hasTouch: () => window.deviceDetector.isTouch(),
    
    // Performance hints
    isSlowConnection: () => {
        if ('connection' in navigator) {
            return navigator.connection.saveData || navigator.connection.effectiveType === '4g' || navigator.connection.effectiveType === '3g';
        }
        return false;
    }
};

// Make utilities globally available
window.ResponsiveUtils = ResponsiveUtils;

/* ========================
   RESPONSIVE IMAGE LOADER
   Loads appropriate resolution based on device
   ======================== */

class ResponsiveImageLoader {
    static getSrcSet(basePath) {
        return `
            ${basePath}-small.jpg 320w,
            ${basePath}-medium.jpg 768w,
            ${basePath}-large.jpg 1024w,
            ${basePath}-xl.jpg 1280w
        `;
    }

    static getSizes() {
        return `
            (max-width: 480px) 100vw,
            (max-width: 768px) 90vw,
            (max-width: 1024px) 80vw,
            (max-width: 1536px) 70vw,
            60vw
        `;
    }

    static loadOptimalResolution(element, basePath) {
        if (!element) return;
        
        const width = window.innerWidth;
        let suffix = '-small';
        
        if (width >= 1280) suffix = '-xl';
        else if (width >= 1024) suffix = '-large';
        else if (width >= 768) suffix = '-medium';
        else if (width >= 480) suffix = '-medium';
        
        element.src = `${basePath}${suffix}.jpg`;
    }
}

window.ResponsiveImageLoader = ResponsiveImageLoader;

/* ========================
   EVENT LISTENERS FOR RESPONSIVE CHANGES
   ======================== */

window.addEventListener('devicechange', (e) => {
    const { type, isMobile, isTablet, isDesktop } = e.detail;
    
    // Log device change
    console.log(`🔄 Device changed to: ${type}`);
    
    // Trigger any responsive callbacks
    if (window.onDeviceChange) {
        window.onDeviceChange(e.detail);
    }
});

/* ========================
   SAFE AREA HANDLING (Notch Devices)
   ======================== */

function applySafeAreas() {
    const root = document.documentElement;
    
    // Check for safe areas (iPhone X+, etc.)
    const insetTop = getComputedStyle(root).getPropertyValue('env(safe-area-inset-top)') || '0px';
    const insetBottom = getComputedStyle(root).getPropertyValue('env(safe-area-inset-bottom)') || '0px';
    const insetLeft = getComputedStyle(root).getPropertyValue('env(safe-area-inset-left)') || '0px';
    const insetRight = getComputedStyle(root).getPropertyValue('env(safe-area-inset-right)') || '0px';
    
    root.style.setProperty('--safe-area-inset-top', insetTop);
    root.style.setProperty('--safe-area-inset-bottom', insetBottom);
    root.style.setProperty('--safe-area-inset-left', insetLeft);
    root.style.setProperty('--safe-area-inset-right', insetRight);
}

document.addEventListener('DOMContentLoaded', applySafeAreas);
window.addEventListener('orientationchange', applySafeAreas);

/* ========================
   EXPORT FOR TESTING
   ======================== */

export { DeviceDetector, ResponsiveUtils, ResponsiveImageLoader };
