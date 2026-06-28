/**
 * Carousel Controls - User-Controlled Smooth Scrolling
 * Adds drag and arrow controls to carousels with momentum
 */

function initializeCarouselControls() {
    // Find all carousel grids - look for elements with flex and overflow
    const carousels = document.querySelectorAll('.movie-grid, [style*="overflow-x"]');
    
    carousels.forEach((gridElement, index) => {
        // Skip if already initialized
        if (gridElement.dataset.carouselInitialized) return;
        gridElement.dataset.carouselInitialized = 'true';
        
        setupCarouselDragScroll(gridElement);
    });
}

function setupCarouselDragScroll(gridElement) {
    let isDragging = false;
    let startX = 0;
    let scrollLeft = 0;
    let velocity = 0;
    let lastX = 0;
    let lastTime = 0;
    let momentumAnimationId = null;

    // Prevent default scroll behavior on carousel
    gridElement.addEventListener('wheel', (e) => {
        e.preventDefault();
        gridElement.scrollLeft += e.deltaY;
    }, { passive: false });

    // Mouse down - start dragging
    gridElement.addEventListener('mousedown', (e) => {
        isDragging = true;
        startX = e.pageX;
        scrollLeft = gridElement.scrollLeft;
        lastX = e.pageX;
        lastTime = Date.now();
        gridElement.style.cursor = 'grabbing';
        gridElement.style.scrollBehavior = 'auto';
        gridElement.style.userSelect = 'none';
        
        if (momentumAnimationId) {
            cancelAnimationFrame(momentumAnimationId);
        }
        
        // Prevent text selection while dragging
        e.preventDefault();
    });

    // Mouse move - drag to scroll
    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        
        e.preventDefault();
        
        const x = e.pageX;
        const walk = (x - startX);
        gridElement.scrollLeft = scrollLeft - walk;
        
        // Calculate velocity for momentum
        const now = Date.now();
        const timeDelta = now - lastTime;
        if (timeDelta > 0) {
            velocity = (lastX - e.pageX) / timeDelta * 10;
        }
        lastX = e.pageX;
        lastTime = now;
    });

    // Mouse up - apply momentum
    document.addEventListener('mouseup', () => {
        if (!isDragging) return;
        isDragging = false;
        gridElement.style.cursor = 'grab';
        gridElement.style.scrollBehavior = 'smooth';
        gridElement.style.userSelect = 'auto';
        
        // Apply momentum scrolling
        applyMomentum();
    });

    function applyMomentum() {
        if (Math.abs(velocity) < 0.1) return;
        
        const applyFrame = () => {
            if (Math.abs(velocity) > 0.1) {
                gridElement.scrollLeft += velocity;
                velocity *= 0.92;
                momentumAnimationId = requestAnimationFrame(applyFrame);
            }
        };
        momentumAnimationId = requestAnimationFrame(applyFrame);
    }
    
    // Set default cursor
    gridElement.style.cursor = 'grab';
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeCarouselControls);
} else {
    initializeCarouselControls();
}

// Re-initialize when new content is loaded
document.addEventListener('carouselUpdated', initializeCarouselControls);

// Also watch for new movie grids being added
const observer = new MutationObserver(() => {
    setTimeout(initializeCarouselControls, 100);
});

observer.observe(document.body, {
    childList: true,
    subtree: true
});
