/* ========================
   AD BLOCKER POPUP INITIALIZATION
   Runs on first visit
   ======================== */

function initializeAdBlockerPopup() {
    // Check if ad blocker popup has been shown
    if (lumiereStorage.hasAdBlockerBeenShown()) {
        console.log('Ad blocker popup already shown');
        return;
    }

    // Show popup after a brief delay
    setTimeout(() => {
        const modal = document.getElementById('adBlockerModal');
        if (modal) {
            modal.classList.add('active');
            lumiereStorage.markAdBlockerShown();
        }
    }, 1500);

    // Setup close buttons
    const adBlockerOverlay = document.getElementById('adBlockerOverlay');
    const closeAdBlocker = document.getElementById('closeAdBlocker');
    const dismissBtn = document.getElementById('dismissAdBlocker');
    const confirmBtn = document.getElementById('confirmAdBlocker');

    const closePopup = () => {
        const modal = document.getElementById('adBlockerModal');
        if (modal) {
            modal.classList.remove('active');
        }
    };

    if (adBlockerOverlay) {
        adBlockerOverlay.addEventListener('click', closePopup);
    }
    if (closeAdBlocker) {
        closeAdBlocker.addEventListener('click', closePopup);
    }
    if (dismissBtn) {
        dismissBtn.addEventListener('click', closePopup);
    }
    if (confirmBtn) {
        confirmBtn.addEventListener('click', closePopup);
    }

    // Add button hover effects
    const adBlockerLinks = document.querySelectorAll('#adBlockerModal a');
    adBlockerLinks.forEach(link => {
        link.addEventListener('mouseenter', function() {
            this.style.background = 'linear-gradient(135deg, rgba(255, 255, 255, 0.18) 0%, rgba(255, 255, 255, 0.08) 100%)';
            this.style.borderColor = 'rgba(255, 255, 255, 0.25)';
        });
        link.addEventListener('mouseleave', function() {
            this.style.background = 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)';
            this.style.borderColor = 'rgba(255, 255, 255, 0.15)';
        });
    });
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeAdBlockerPopup);
} else {
    initializeAdBlockerPopup();
}
