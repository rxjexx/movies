/* ========================
   AD BLOCKER POPUP INITIALIZATION
   Runs on each visit - shows every 6 visits if "Maybe Later" is pressed
   ======================== */

function initializeAdBlockerPopup() {
    // Get current dismiss count from storage
    let dismissCount = localStorage.getItem('adBlockerDismissCount') || '0';
    dismissCount = parseInt(dismissCount);

    // Check if ad blocker has been confirmed
    const isConfirmed = localStorage.getItem('adBlockerConfirmed') === 'true';
    
    // If confirmed, don't show anymore
    if (isConfirmed) {
        console.log('Ad blocker already confirmed');
        return;
    }

    // Show popup after a brief delay
    setTimeout(() => {
        const modal = document.getElementById('adBlockerModal');
        if (modal) {
            modal.classList.add('active');
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
    
    // "Maybe Later" button - increment counter and close
    if (dismissBtn) {
        dismissBtn.addEventListener('click', () => {
            dismissCount++;
            
            // If they've dismissed 6 times, reset counter and show again on next visit
            if (dismissCount >= 6) {
                dismissCount = 0;
            }
            
            localStorage.setItem('adBlockerDismissCount', dismissCount.toString());
            closePopup();
        });
    }
    
    // "Got It" button - mark as confirmed
    if (confirmBtn) {
        confirmBtn.addEventListener('click', () => {
            localStorage.setItem('adBlockerConfirmed', 'true');
            localStorage.setItem('adBlockerDismissCount', '0');
            closePopup();
        });
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
