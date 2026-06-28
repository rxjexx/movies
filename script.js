/* ========================
   MOVIE STREAMING SITE JS
   ======================== */

const API_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_API_KEY = '9f3a94034c696a33133c40385d030817';

// Get the current host for remote control URL
function getRemoteURL() {
    // Get the current page's directory path
    const currentPath = window.location.pathname;
    const currentDir = currentPath.substring(0, currentPath.lastIndexOf('/') + 1);
    
    // Construct the remote URL relative to current directory
    if (window.location.protocol === 'file:') {
        // Local file access
        return window.location.href.replace(/\/[^\/]*\.html$/, '/remote.html');
    } else {
        // HTTP/HTTPS
        const protocol = window.location.protocol;
        const host = window.location.host;
        return `${protocol}//${host}${currentDir}remote.html`;
    }
}

// Cache popular movies for reuse across sections
let cachedPopularMovies = null;

document.addEventListener('DOMContentLoaded', function() {
    initializeSearch();
    initializeNavigation();
    loadPageData(); // Load all data in parallel for better performance
    initializeModal();
    initializeScrollAnimations();
    initializeCloudRemote();
    initializeRemoteConnectionMonitor();
    initializeResponsiveSystem();
});

// Load all page data in parallel to reduce sequential API calls
async function loadPageData() {
    try {
        // Check which page we're on
        const isMoviesPage = document.getElementById('movies') !== null;
        const isTVPage = document.getElementById('tv') !== null;
        const hasFloatingCards = document.getElementById('floatingCardsContainer') !== null;
        
        // Load all data simultaneously - call TMDB directly
        const [trendingData, showsData] = await Promise.all([
            fetchAPI('/movie/popular?page=1'), // Get popular movies
            fetchAPI('/tv/popular?page=1') // Get popular shows
        ]);
        
        // Cache the popular movies for floating cards
        if (trendingData && trendingData.results) {
            cachedPopularMovies = trendingData.results;
            
            // On index/home page: use carousel and floating cards
            if (hasFloatingCards) {
                displayMoviesCarousel(cachedPopularMovies, 'movies');
                initializeFloatingCardRotation(cachedPopularMovies);
            }
            // On dedicated movies page: use grid with infinite scroll
            else if (isMoviesPage) {
                initializeInfiniteScroll('movie', trendingData);
            }
        }
        
        // Display shows
        if (showsData && showsData.results) {
            // On index/home page: use carousel
            if (hasFloatingCards) {
                displayMoviesCarousel(showsData.results, 'tv');
            }
            // On dedicated TV page: use grid with infinite scroll
            else if (isTVPage) {
                initializeInfiniteScroll('tv', showsData);
            }
        }
    } catch (error) {
        console.error('Error loading page data:', error);
    }
}

// Infinite scroll variables
let currentMoviePage = 1;
let currentTVPage = 1;
let isLoadingMovies = false;
let isLoadingTV = false;
let hasMoreMovies = true;
let hasMoreTV = true;

function initializeInfiniteScroll(type, initialData) {
    const sectionId = type === 'movie' ? 'movies' : 'tv';
    const gridId = type === 'movie' ? 'moviesGrid' : 'tvGrid';
    
    // Display initial data
    if (type === 'movie') {
        displayMovies(initialData.results, sectionId);
        hasMoreMovies = initialData.page < initialData.total_pages;
    } else {
        displayShows(initialData.results, sectionId);
        hasMoreTV = initialData.page < initialData.total_pages;
    }
    
    // Set up infinite scroll listener
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                if (type === 'movie' && !isLoadingMovies && hasMoreMovies) {
                    loadMoreMovies();
                } else if (type === 'tv' && !isLoadingTV && hasMoreTV) {
                    loadMoreTV();
                }
            }
        });
    }, { rootMargin: '500px' });
    
    // Create sentinel element at the bottom
    const gridElement = document.getElementById(gridId);
    const sentinel = document.createElement('div');
    sentinel.id = `${type}-sentinel`;
    sentinel.style.height = '20px';
    gridElement.parentElement.appendChild(sentinel);
    observer.observe(sentinel);
    
    window.movieInfiniteObserver = observer;
}

async function loadMoreMovies() {
    if (isLoadingMovies || !hasMoreMovies) return;
    
    isLoadingMovies = true;
    currentMoviePage++;
    
    try {
        const data = await fetchAPI(`/movie/popular?page=${currentMoviePage}`);
        if (data && data.results) {
            appendMovies(data.results, 'movies');
            hasMoreMovies = currentMoviePage < data.total_pages;
        }
    } catch (error) {
        console.error('Error loading more movies:', error);
        currentMoviePage--;
    } finally {
        isLoadingMovies = false;
    }
}

async function loadMoreTV() {
    if (isLoadingTV || !hasMoreTV) return;
    
    isLoadingTV = true;
    currentTVPage++;
    
    try {
        const data = await fetchAPI(`/tv/popular?page=${currentTVPage}`);
        if (data && data.results) {
            appendShows(data.results, 'tv');
            hasMoreTV = currentTVPage < data.total_pages;
        }
    } catch (error) {
        console.error('Error loading more TV shows:', error);
        currentTVPage--;
    } finally {
        isLoadingTV = false;
    }
}

function appendMovies(movies, section) {
    const sectionElement = document.getElementById(section);
    if (!sectionElement) return;

    const gridElement = sectionElement.querySelector('.movie-grid');
    if (!gridElement) return;

    movies.forEach((movie, index) => {
        try {
            const card = createMovieCard(movie, 'movie');
            gridElement.appendChild(card);
        } catch (error) {
            console.error('Error creating card for movie', index, error);
        }
    });
}

function appendShows(shows, section) {
    const sectionElement = document.getElementById(section);
    if (!sectionElement) return;

    const gridElement = sectionElement.querySelector('.movie-grid');
    if (!gridElement) return;

    shows.forEach((show, index) => {
        try {
            const card = createMovieCard(show, 'show');
            gridElement.appendChild(card);
        } catch (error) {
            console.error('Error creating card for show', index, error);
        }
    });
}

/* ========================
   API CALLS
   ======================== */

async function fetchAPI(endpoint) {
    try {
        // Call TMDB API directly with the key
        // Handle query parameters correctly
        const separator = endpoint.includes('?') ? '&' : '?';
        const url = `${API_BASE_URL}${endpoint}${separator}api_key=${TMDB_API_KEY}`;
        
        console.log('Fetching:', url);
        
        const response = await fetch(url);
        
        console.log('Response status:', response.status);
        if (!response.ok) {
            console.error('API Error:', response.status, response.statusText);
            return null;
        }
        const data = await response.json();
        console.log('Response data:', data);
        return data;
    } catch (error) {
        console.error('Fetch Error:', error);
        return null;
    }
}

async function loadTrendingMovies() {
    // No longer needed - data loads in loadPageData
    console.log('Trending movies already loaded in parallel');
}

async function loadPopularSeries() {
    // No longer needed - data loads in loadPageData
    console.log('Popular series already loaded in parallel');
}

async function loadFloatingCards() {
    // No longer needed - data loads in loadPageData
    console.log('Floating cards already loaded in parallel');
}

function displayFloatingCards(movies) {
    console.log('Displaying floating cards:', movies.length);
    
    const container = document.getElementById('floatingCardsContainer');
    if (!container) {
        console.warn('Floating cards container not found');
        return;
    }

    container.innerHTML = '';

    if (!movies || movies.length === 0) {
        console.warn('No movies for floating cards');
        return;
    }

    movies.forEach((movie, index) => {
        try {
            const floatingCard = createFloatingCard(movie, 'movie', index);
            container.appendChild(floatingCard);
        } catch (error) {
            console.error('Error creating floating card', index, error);
        }
    });
}

function createFloatingCard(item, type, index) {
    const card = document.createElement('div');
    
    // Apply floating animation class
    const floatClasses = ['float-card-1', 'float-card-2', 'float-card-3', 'float-card-4', 'float-card-5', 'float-card-6'];
    const rotations = [-4, 3, -2, 2, 4, -3];
    const positions = [
        { top: '5%', left: '5%', width: '180px' },      // top-left
        { top: '15%', right: '5%', width: '220px' },    // top-right
        { top: '40%', left: '0%', width: '160px' },     // middle-left
        { top: '35%', right: '15%', width: '240px' },   // middle-right
        { bottom: '5%', left: '20%', width: '200px' },  // bottom-left
        { bottom: '0%', right: '10%', width: '160px' }  // bottom-right
    ];
    
    const pos = positions[index % 6];
    const rotation = rotations[index % 6];
    
    card.className = `glass-card ${floatClasses[index % 6]}`;
    card.style.cssText = `
        position: absolute;
        ${pos.top ? `top: ${pos.top};` : ''}
        ${pos.bottom ? `bottom: ${pos.bottom};` : ''}
        ${pos.left ? `left: ${pos.left};` : ''}
        ${pos.right ? `right: ${pos.right};` : ''}
        width: ${pos.width};
        aspect-ratio: 4/3;
        padding: 0.75rem;
        z-index: ${60 + index};
        cursor: pointer;
        transition: all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
        transform: rotate(${rotation}deg) scale(1);
        display: block;
        opacity: 1;
    `;
    
    card.onmouseenter = () => {
        card.style.transform = `scale(1.05) rotate(${rotation}deg) translateY(-10px)`;
        card.style.zIndex = String(100);
        card.style.transition = 'all 0.3s ease-out';
    };
    
    card.onmouseleave = () => {
        card.style.transform = `rotate(${rotation}deg) scale(1)`;
        card.style.zIndex = String(60 + index);
        card.style.transition = 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)';
    };
    
    const posterPath = item.poster_path ? `https://image.tmdb.org/t/p/w300${item.poster_path}` : 'https://via.placeholder.com/300x450?text=No+Image';
    const title = item.title || item.name;
    const year = item.release_date ? new Date(item.release_date).getFullYear() : (item.first_air_date ? new Date(item.first_air_date).getFullYear() : 'N/A');
    const rating = item.vote_average ? item.vote_average.toFixed(1) : 'N/A';
    const label = type === 'show' ? 'SERIES' : 'MOVIE';

    card.innerHTML = `
        <div style="position: relative; width: 100%; height: 100%; border-radius: 0.75rem; overflow: hidden; background: #18181b; box-shadow: 0 0 10px rgba(0, 0, 0, 0.5); transition: all 0.4s ease;">
            <img src="${posterPath}" alt="${title}" style="position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; opacity: 0.95; transition: transform 0.7s ease;" onerror="this.src='https://via.placeholder.com/300x450?text=No+Image'">
            <div style="background: linear-gradient(to top right, rgba(0,0,0,0.4), transparent); position: absolute; top: 0; right: 0; bottom: 0; left: 0;"></div>
            <div class="movie-overlay" style="position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.3s ease; background: rgba(0, 0, 0, 0.3); backdrop-filter: blur(4px);">
                <button class="play-btn" data-movie-id="${item.id}" data-movie-type="${type}" style="width: 40px; height: 40px; border-radius: 50%; background: rgba(255, 255, 255, 0.15); border: 1px solid rgba(255, 255, 255, 0.3); color: white; font-size: 1rem; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.3s ease;">
                    <svg viewBox="0 0 24 24" fill="currentColor" style="width: 16px; height: 16px; margin-left: 2px;">
                        <polygon points="5 3 19 12 5 21 5 3"></polygon>
                    </svg>
                </button>
            </div>
            <div class="glass-highlight" style="position: absolute; inset: 0; background: linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0) 40%, rgba(255, 255, 255, 0.05) 100%); border-radius: 0.75rem; z-index: 10; pointer-events: none;"></div>
        </div>
    `;

    // Add hover effects with smooth transitions
    const img = card.querySelector('img');
    const overlay = card.querySelector('.movie-overlay');
    
    card.addEventListener('mouseenter', () => {
        if (img) {
            img.style.transform = 'scale(1.1)';
            img.style.transition = 'transform 0.4s ease';
        }
        if (overlay) {
            overlay.style.opacity = '1';
            overlay.style.transition = 'opacity 0.3s ease';
        }
        card.style.transform = `scale(1.05) rotate(${rotation}deg) translateY(-10px)`;
        card.style.zIndex = '100';
        card.style.transition = 'all 0.3s ease-out';
    });

    card.addEventListener('mouseleave', () => {
        if (img) {
            img.style.transform = 'scale(1)';
            img.style.transition = 'transform 0.6s ease';
        }
        if (overlay) {
            overlay.style.opacity = '0';
            overlay.style.transition = 'opacity 0.3s ease';
        }
        card.style.transform = `rotate(${rotation}deg) scale(1)`;
        card.style.zIndex = String(60 + index);
        card.style.transition = 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)';
    });

    // Play button click handler
    const playBtn = card.querySelector('.play-btn');
    playBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        openMovieModal(item, type);
    });

    return card;
}


// Carousel display with smooth hover scrolling
function displayMoviesCarousel(items, section) {
    console.log('Displaying carousel:', section, 'Count:', items ? items.length : 0);
    
    const sectionElement = document.getElementById(section);
    if (!sectionElement) {
        console.warn('Section not found:', section);
        return;
    }

    const gridElement = sectionElement.querySelector('.movie-grid');
    if (!gridElement) {
        console.warn('Grid element not found in section:', section);
        return;
    }

    gridElement.innerHTML = '';
    gridElement.style.display = 'flex';
    gridElement.style.overflowX = 'auto';
    gridElement.style.gap = '1rem';
    gridElement.style.paddingBottom = '1rem';
    gridElement.style.scrollBehavior = 'smooth';
    gridElement.style.scrollbarWidth = 'none';
    
    // Smooth hover scrolling
    let scrollAnimationId = null;
    let scrollVelocity = 0;
    const maxScrollVelocity = 8;
    const scrollAcceleration = 0.3;
    const scrollFriction = 0.95;
    
    gridElement.addEventListener('mouseenter', () => {
        // Start smooth scrolling animation
        if (!scrollAnimationId) {
            scrollVelocity = maxScrollVelocity;
            const animateScroll = () => {
                if (scrollVelocity > 0.5) {
                    gridElement.scrollLeft += scrollVelocity;
                    scrollVelocity *= scrollFriction;
                    scrollAnimationId = requestAnimationFrame(animateScroll);
                } else {
                    // Loop back to start smoothly
                    if (gridElement.scrollLeft >= gridElement.scrollWidth - gridElement.clientWidth - 50) {
                        gridElement.scrollLeft = 0;
                        scrollVelocity = maxScrollVelocity;
                        scrollAnimationId = requestAnimationFrame(animateScroll);
                    } else {
                        scrollAnimationId = null;
                    }
                }
            };
            scrollAnimationId = requestAnimationFrame(animateScroll);
        }
    });
    
    gridElement.addEventListener('mouseleave', () => {
        // Keep momentum but gradually stop
        if (scrollAnimationId) {
            cancelAnimationFrame(scrollAnimationId);
            scrollAnimationId = null;
        }
        scrollVelocity = 0;
    });

    if (!items || items.length === 0) {
        gridElement.innerHTML = '<p style="color: #999;">No items found</p>';
        return;
    }

    items.forEach((item, index) => {
        try {
            const card = createCarouselCard(item, section === 'tv' ? 'show' : 'movie');
            gridElement.appendChild(card);
        } catch (error) {
            console.error('Error creating card for item', index, error);
        }
    });
}

function createCarouselCard(item, type) {
    const card = document.createElement('div');
    card.style.cssText = `
        flex: 0 0 120px;
        cursor: pointer;
        transition: transform 0.3s ease;
        position: relative;
        border-radius: 0.5rem;
        overflow: hidden;
    `;
    
    const posterPath = item.poster_path ? `https://image.tmdb.org/t/p/w300${item.poster_path}` : 'https://via.placeholder.com/120x180?text=No+Image';
    const title = item.title || item.name;

    card.innerHTML = `
        <div style="position: relative; width: 100%; height: 180px; border-radius: 0.5rem; overflow: hidden; background: #18181b;">
            <img src="${posterPath}" alt="${title}" style="width: 100%; height: 100%; object-fit: cover; opacity: 0.9; transition: transform 0.3s ease;" onerror="this.src='https://via.placeholder.com/120x180?text=No+Image'">
            <div style="position: absolute; inset: 0; background: linear-gradient(to top right, rgba(0,0,0,0.4), transparent); opacity: 0; transition: opacity 0.3s ease; display: flex; align-items: center; justify-content: center;" class="card-overlay">
                <button style="width: 40px; height: 40px; border-radius: 50%; background: rgba(255, 255, 255, 0.2); border: 1px solid rgba(255, 255, 255, 0.4); color: white; cursor: pointer; display: flex; align-items: center; justify-content: center;">
                    <svg viewBox="0 0 24 24" fill="currentColor" style="width: 16px; height: 16px; margin-left: 2px;">
                        <polygon points="5 3 19 12 5 21 5 3"></polygon>
                    </svg>
                </button>
            </div>
        </div>
    `;

    const img = card.querySelector('img');
    const overlay = card.querySelector('.card-overlay');
    const button = card.querySelector('button');

    card.addEventListener('mouseenter', () => {
        card.style.transform = 'scale(1.1)';
        if (img) img.style.transform = 'scale(1.1)';
        if (overlay) overlay.style.opacity = '1';
    });

    card.addEventListener('mouseleave', () => {
        card.style.transform = 'scale(1)';
        if (img) img.style.transform = 'scale(1)';
        if (overlay) overlay.style.opacity = '0';
    });

    if (button) {
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            openMovieModal(item, type);
        });
    }

    card.addEventListener('click', () => {
        openMovieModal(item, type);
    });

    return card;
}

// Rotating floating cards with smooth movie transitions (no position change)
let floatingCardIndex = 0;
let floatingCardRotationInterval = null;
let isTransitioning = false;

function initializeFloatingCardRotation(movies) {
    if (!movies || movies.length === 0) return;
    
    const container = document.getElementById('floatingCardsContainer');
    if (!container) return;

    // Initial display
    displayFloatingCards(movies.slice(0, 6));

    // Rotate every 5 seconds with smooth image transitions
    if (floatingCardRotationInterval) {
        clearInterval(floatingCardRotationInterval);
    }

    floatingCardRotationInterval = setInterval(() => {
        if (isTransitioning) return;
        
        isTransitioning = true;
        
        // Get current cards
        const cards = container.querySelectorAll('.float-card-1, .float-card-2, .float-card-3, .float-card-4, .float-card-5, .float-card-6');
        
        // Fade out images smoothly
        cards.forEach(card => {
            const img = card.querySelector('img');
            if (img) {
                img.style.opacity = '0.3';
                img.style.transition = 'opacity 0.5s ease-out';
            }
        });

        // After fade out, switch movies
        setTimeout(() => {
            floatingCardIndex = (floatingCardIndex + 1) % Math.max(1, movies.length - 5);
            const nextSet = movies.slice(floatingCardIndex, floatingCardIndex + 6);
            
            if (nextSet.length === 6) {
                // Update each card's image without changing position/rotation
                cards.forEach((card, index) => {
                    const movie = nextSet[index];
                    const posterPath = movie.poster_path ? `https://image.tmdb.org/t/p/w300${movie.poster_path}` : 'https://via.placeholder.com/300x450?text=No+Image';
                    
                    const img = card.querySelector('img');
                    if (img) {
                        // Set new image and fade in
                        img.src = posterPath;
                        img.alt = movie.title || movie.name;
                        
                        setTimeout(() => {
                            img.style.opacity = '0.95';
                            img.style.transition = 'opacity 0.6s ease-in';
                        }, 50);
                    }
                });
            }
            
            isTransitioning = false;
        }, 500);
    }, 5000);
}

function displayMovies(movies, section) {
    console.log('Displaying movies in section:', section, 'Count:', movies ? movies.length : 0);
    
    const sectionElement = document.getElementById(section);
    if (!sectionElement) {
        console.warn('Section not found:', section);
        return;
    }

    const gridElement = sectionElement.querySelector('.movie-grid');
    if (!gridElement) {
        console.warn('Grid element not found in section:', section);
        return;
    }

    gridElement.innerHTML = '';

    if (!movies || movies.length === 0) {
        gridElement.innerHTML = '<p style="color: #999;">No movies found</p>';
        return;
    }

    // Display initial batch (will load more on scroll)
    movies.forEach((movie, index) => {
        try {
            const card = createMovieCard(movie, 'movie');
            gridElement.appendChild(card);
        } catch (error) {
            console.error('Error creating card for movie', index, error);
        }
    });
}

function displayShows(shows, section) {
    console.log('Displaying shows in section:', section, 'Count:', shows ? shows.length : 0);
    
    const sectionElement = document.getElementById(section);
    if (!sectionElement) {
        console.warn('Section not found:', section);
        return;
    }

    const gridElement = sectionElement.querySelector('.movie-grid');
    if (!gridElement) {
        console.warn('Grid element not found in section:', section);
        return;
    }

    gridElement.innerHTML = '';

    if (!shows || shows.length === 0) {
        gridElement.innerHTML = '<p style="color: #999;">No shows found</p>';
        return;
    }

    // Display initial batch (will load more on scroll)
    shows.forEach((show, index) => {
        try {
            const card = createMovieCard(show, 'show');
            gridElement.appendChild(card);
        } catch (error) {
            console.error('Error creating card for show', index, error);
        }
    });
}

function createMovieCard(item, type) {
    const card = document.createElement('div');
    card.className = 'movie-card';
    card.style.flexBasis = '0 0 auto';
    card.style.width = '200px';
    card.style.cursor = 'pointer';
    card.style.transition = 'transform 0.3s ease';
    
    const posterPath = item.poster_path ? `https://image.tmdb.org/t/p/w300${item.poster_path}` : 'https://via.placeholder.com/300x450?text=No+Image';
    const title = item.title || item.name;
    const year = item.release_date ? new Date(item.release_date).getFullYear() : (item.first_air_date ? new Date(item.first_air_date).getFullYear() : 'N/A');
    const rating = item.vote_average ? item.vote_average.toFixed(1) : 'N/A';
    const label = type === 'show' ? 'SERIES' : 'MOVIE';

    card.innerHTML = `
        <div class="movie-image">
            <img src="${posterPath}" alt="${title}" onerror="this.src='https://via.placeholder.com/300x450?text=No+Image'">
            <div class="movie-overlay">
                <button class="play-btn" data-movie-id="${item.id}" data-movie-type="${type}">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                        <polygon points="5 3 19 12 5 21 5 3"></polygon>
                    </svg>
                </button>
            </div>
        </div>
        <div>
            <span class="movie-label ${type === 'show' ? 'series-label' : ''}">${label}</span>
            <h3 class="movie-title">${title}</h3>
            <p class="movie-meta">${year} • ${rating}/10</p>
        </div>
    `;

    // Add hover effect
    card.addEventListener('mouseenter', () => {
        card.style.transform = 'translateY(-10px)';
    });

    card.addEventListener('mouseleave', () => {
        card.style.transform = 'translateY(0)';
    });

    // Store movie data in the button element
    const playBtn = card.querySelector('.play-btn');
    playBtn.addEventListener('click', function() {
        openMovieModal(item, type);
    });

    return card;
}

/* ========================
   SEARCH FUNCTIONALITY
   ======================== */

let searchPreviewContainer = null;

function initializeSearch() {
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) {
        console.warn('Search input not found');
        return;
    }

    // Create search preview container if it doesn't exist
    if (!searchPreviewContainer) {
        searchPreviewContainer = document.createElement('div');
        searchPreviewContainer.id = 'searchPreview';
        searchPreviewContainer.style.cssText = `
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            background: rgba(20, 20, 25, 0.95);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 8px;
            max-height: 500px;
            overflow-y: auto;
            z-index: 10000;
            margin-top: 8px;
            display: none;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
        `;
        searchInput.parentElement.style.position = 'relative';
        searchInput.parentElement.appendChild(searchPreviewContainer);
    }

    let searchTimeout;
    searchInput.addEventListener('input', function(e) {
        clearTimeout(searchTimeout);
        const query = e.target.value.trim();
        
        console.log('Search input:', query);
        
        if (query.length < 1) {
            hideSearchPreview();
            resetSearch();
            return;
        }

        searchTimeout = setTimeout(() => {
            console.log('Performing live search for:', query);
            performLiveSearch(query);
        }, 300);
    });

    // Close preview when clicking outside
    document.addEventListener('click', function(e) {
        if (!e.target.closest('#searchInput') && !e.target.closest('#searchPreview')) {
            hideSearchPreview();
        }
    });

    // Handle Enter key - do nothing
    searchInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
        }
    });
}

async function performLiveSearch(query) {
    try {
        console.log('Searching TMDB for:', query);
        const data = await fetchAPI(`/search/multi?query=${encodeURIComponent(query)}&page=1`);
        console.log('Search response:', data);
        
        if (data && data.results) {
            // Ensure results is an array
            const results = Array.isArray(data.results) ? data.results : [];
            console.log('Results array:', results);
            displaySearchPreview(results);
        } else {
            console.error('Invalid search response:', data);
            searchPreviewContainer.innerHTML = '<div style="padding: 16px; text-align: center; color: rgba(255, 255, 255, 0.5);">Error loading results</div>';
            showSearchPreview();
        }
    } catch (error) {
        console.error('Search error:', error);
        searchPreviewContainer.innerHTML = '<div style="padding: 16px; text-align: center; color: rgba(255, 255, 255, 0.5);">Error: ' + error.message + '</div>';
        showSearchPreview();
    }
}


function displaySearchPreview(results) {
    if (!searchPreviewContainer) return;

    console.log('Displaying preview with', results.length, 'results');

    if (!results || results.length === 0) {
        searchPreviewContainer.innerHTML = '<div style="padding: 16px; text-align: center; color: rgba(255, 255, 255, 0.5);">No results found</div>';
        showSearchPreview();
        return;
    }

    const previewHTML = results.slice(0, 8).map(item => {
        const type = item.media_type === 'tv' ? 'show' : 'movie';
        const title = item.title || item.name;
        const posterPath = item.poster_path ? `https://image.tmdb.org/t/p/w92${item.poster_path}` : 'https://via.placeholder.com/92x138?text=No+Image';
        const year = item.release_date ? new Date(item.release_date).getFullYear() : (item.first_air_date ? new Date(item.first_air_date).getFullYear() : 'N/A');
        const label = type === 'show' ? 'TV Series' : 'Movie';

        return `
            <div class="search-preview-item" style="
                padding: 10px 12px;
                display: flex;
                gap: 12px;
                cursor: pointer;
                transition: background 0.2s ease;
                border-bottom: 1px solid rgba(255, 255, 255, 0.05);
                align-items: center;
            " data-movie-id="${item.id}" data-movie-type="${type}">
                <img src="${posterPath}" alt="${title}" style="width: 50px; height: 75px; border-radius: 4px; object-fit: cover;" onerror="this.src='https://via.placeholder.com/50x75?text=No+Image'">
                <div style="flex: 1; min-width: 0;">
                    <div style="color: #ffffff; font-size: 0.9rem; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${title}</div>
                    <div style="color: rgba(255, 255, 255, 0.5); font-size: 0.8rem; margin-top: 4px;">${label} • ${year}</div>
                </div>
            </div>
        `;
    }).join('');

    searchPreviewContainer.innerHTML = previewHTML;

    // Add event listeners to preview items
    searchPreviewContainer.querySelectorAll('.search-preview-item').forEach(item => {
        item.addEventListener('click', function() {
            const movieId = this.dataset.movieId;
            const movieType = this.dataset.movieType;
            
            // Find the full movie data from the results
            const selectedMovie = results.find(r => r.id.toString() === movieId);
            if (selectedMovie) {
                console.log('Opening modal for:', selectedMovie);
                hideSearchPreview();
                openMovieModal(selectedMovie, movieType);
            }
        });

        item.addEventListener('mouseenter', function() {
            this.style.background = 'rgba(255, 255, 255, 0.08)';
        });

        item.addEventListener('mouseleave', function() {
            this.style.background = 'transparent';
        });
    });

    showSearchPreview();
}


function hideSearchPreview() {
    if (searchPreviewContainer) {
        searchPreviewContainer.style.display = 'none';
    }
}

function showSearchPreview() {
    if (searchPreviewContainer) {
        searchPreviewContainer.style.display = 'block';
    }
}

function resetSearch() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.value = '';
    }
    hideSearchPreview();
    
    // Reload movies from cache instead of making new API call
    if (cachedPopularMovies) {
        displayMovies(cachedPopularMovies, 'movies');
    }
}

/* ========================
   NAVIGATION
   ======================== */

function initializeNavigation() {
    const navLinks = document.querySelectorAll('.nav-link, [href^="#"]');
    
    navLinks.forEach(link => {
        if (link.getAttribute('href') && link.getAttribute('href').startsWith('#')) {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const targetId = this.getAttribute('href').substring(1);
                const targetElement = document.getElementById(targetId);
                
                if (targetElement) {
                    targetElement.scrollIntoView({ behavior: 'smooth' });
                }
            });
        }
    });
}

/* ========================
   MODAL FUNCTIONS
   ======================== */

let currentMovie = null;
let currentMediaType = null;

function openMovieModal(movie, type) {
    console.log('Opening modal for movie:', movie.title || movie.name, 'ID:', movie.id);
    currentMovie = movie;
    currentMediaType = type;

    const modal = document.getElementById('movieModal');
    const posterPath = movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : 'https://via.placeholder.com/300x450?text=No+Image';
    
    document.getElementById('modalPoster').src = posterPath;
    document.getElementById('modalTitle').textContent = movie.title || movie.name;
    
    const year = movie.release_date ? new Date(movie.release_date).getFullYear() : (movie.first_air_date ? new Date(movie.first_air_date).getFullYear() : 'N/A');
    const releaseDate = movie.release_date || movie.first_air_date || 'N/A';
    document.getElementById('modalYear').textContent = `${year} • ${releaseDate}`;
    
    const rating = movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A';
    document.getElementById('modalRating').textContent = `★ ${rating}/10 Rating`;
    
    document.getElementById('modalOverview').textContent = movie.overview || 'No description available';
    
    document.getElementById('modalGenre').textContent = type === 'show' ? 'TV Series' : 'Movie';
    document.getElementById('modalStatus').textContent = movie.status || (movie.release_date ? 'Released' : 'Upcoming');
    
    modal.classList.add('active');
    console.log('Modal should now be visible');
}

function closeMovieModal() {
    const modal = document.getElementById('movieModal');
    modal.classList.remove('active');
    currentMovie = null;
    currentMediaType = null;
}

function goToWatchPage() {
    console.log('=== goToWatchPage called ===');
    console.log('currentMovie:', currentMovie);
    console.log('currentMediaType:', currentMediaType);
    
    if (currentMovie && currentMediaType) {
        console.log('Movie data present, storing and navigating...');
        
        // Store the movie data BEFORE closing modal (which nullifies currentMovie)
        const movieData = {
            id: currentMovie.id,
            type: currentMediaType,
            title: currentMovie.title || currentMovie.name
        };
        
        console.log('Stored movie data:', movieData);
        
        // Close the modal
        closeMovieModal();
        
        // Give the modal time to close smoothly before navigating
        setTimeout(() => {
            const watchUrl = `watch.html?id=${movieData.id}&type=${movieData.type}&title=${encodeURIComponent(movieData.title)}`;
            console.log('Final watch URL:', watchUrl);
            window.location.href = watchUrl;
        }, 300);
    } else {
        console.error('=== ERROR ===');
        console.error('currentMovie:', currentMovie);
        console.error('currentMediaType:', currentMediaType);
        alert('Please select a movie first');
    }
}

function initializeModal() {
    console.log('Initializing modal...');
    const modal = document.getElementById('movieModal');
    const modalOverlay = document.getElementById('modalOverlay');
    const closeBtn = document.getElementById('closeBtn');
    const modalCloseBtn = document.querySelector('.modal-close');
    const watchBtn = document.getElementById('watchBtn');

    console.log('Modal elements found:', { modal: !!modal, modalOverlay: !!modalOverlay, closeBtn: !!closeBtn, modalCloseBtn: !!modalCloseBtn, watchBtn: !!watchBtn });

    if (modalOverlay) {
        modalOverlay.addEventListener('click', closeMovieModal);
    }

    if (closeBtn) {
        closeBtn.addEventListener('click', closeMovieModal);
    }

    if (modalCloseBtn) {
        modalCloseBtn.addEventListener('click', closeMovieModal);
    }

    if (watchBtn) {
        console.log('Watch button found, adding click listener');
        watchBtn.addEventListener('click', function(e) {
            console.log('=== WATCH BUTTON CLICKED ===');
            console.log('Event:', e);
            console.log('currentMovie:', currentMovie);
            console.log('currentMediaType:', currentMediaType);
            goToWatchPage();
        });
    } else {
        console.error('Watch button NOT FOUND');
    }

    // Close modal with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeMovieModal();
        }
    });
    
    console.log('Modal initialization complete');
}

/* ========================
   PAGE LOAD
   ======================== */

window.addEventListener('load', function() {
    console.log('LUMIÈRE Frontend loaded');
});

/* ========================
   ERROR HANDLING
   ======================== */

window.addEventListener('error', function(e) {
    console.error('JavaScript error:', e.error);
});

/* ========================
   SCROLL ANIMATIONS
   ======================== */

function initializeScrollAnimations() {
    // Scroll animations disabled for performance
    // Elements load once and stay visible
    console.log('Scroll animations disabled for optimal performance');
}

// Enhance scroll experience with parallax effect on hero section
window.addEventListener('scroll', () => {
    const heroSection = document.querySelector('.lg\\:h-\\[650px\\], [style*="lg:h-[650px]"]');
    if (heroSection && window.scrollY < 1000) {
        const scrolled = window.scrollY;
        heroSection.style.transform = `translateY(${scrolled * 0.5}px)`;
    }
}, { passive: true });

/* ========================
   CLOUD REMOTE FUNCTIONALITY
   ======================== */

function initializeCloudRemote() {
    const cloudRemoteBtn = document.getElementById('cloudRemoteBtn');
    
    if (!cloudRemoteBtn) return;

    const remoteURL = getRemoteURL();
    console.log('Cloud Remote URL:', remoteURL);

    // Open modal instead of new window
    cloudRemoteBtn.addEventListener('click', () => {
        showCloudRemoteModal(remoteURL);
    });
}

// Monitor remote connection status
function initializeRemoteConnectionMonitor() {
    console.log('📡 Remote connection monitor started');
    
    const updateIconState = () => {
        const cloudRemoteIcon = document.getElementById('cloudRemoteIcon');
        if (!cloudRemoteIcon) return;
        
        const isRemoteConnected = localStorage.getItem('lumiereRemoteConnected') === 'true';
        
        if (isRemoteConnected) {
            // Check if code is still valid
            const codeData = localStorage.getItem('lumiereRemoteCode');
            if (codeData) {
                try {
                    const code = JSON.parse(codeData);
                    const currentTime = Date.now();
                    // Code expires after 5 minutes
                    if (currentTime - code.timestamp > 5 * 60 * 1000) {
                        // Code expired, disconnect
                        localStorage.removeItem('lumiereRemoteConnected');
                        cloudRemoteIcon.style.filter = 'none';
                        cloudRemoteIcon.style.opacity = '0.7';
                        return;
                    }
                } catch (e) {}
            }
            
            // Connected and valid
            cloudRemoteIcon.style.filter = 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.8))';
            cloudRemoteIcon.style.opacity = '1';
        } else {
            // Not connected
            cloudRemoteIcon.style.filter = 'none';
            cloudRemoteIcon.style.opacity = '0.7';
        }
    };
    
    // Check periodically
    setInterval(updateIconState, 500);
    
    // Also listen for storage changes
    window.addEventListener('storage', (e) => {
        if (e.key === 'lumiereRemoteConnected' || e.key === 'lumiereRemoteCode') {
            console.log('🔄 Remote connection status changed');
            updateIconState();
        }
    });
}

function showCloudRemoteModal(remoteURL) {
    // Always generate a NEW code each time the modal is opened
    function generateConnectionCode() {
        return Math.random().toString().slice(2, 8).padEnd(6, '0').substring(0, 6);
    }
    
    const connectionCode = generateConnectionCode();
    const codeTimestamp = Date.now();
    
    // Store the code in localStorage for the remote page to validate
    localStorage.setItem('lumiereRemoteCode', JSON.stringify({
        code: connectionCode,
        timestamp: codeTimestamp
    }));
    
    // Clear remote connected flag when new code is shown
    localStorage.removeItem('lumiereRemoteConnected');
    
    console.log('Generated NEW connection code:', connectionCode);
    
    // Create modal if it doesn't exist
    let modal = document.getElementById('cloudRemoteModal');
    
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'cloudRemoteModal';
        document.body.appendChild(modal);
    }
    
    // Add animation styles if not already added
    if (!document.getElementById('modalAnimations')) {
        const style = document.createElement('style');
        style.id = 'modalAnimations';
        style.textContent = `
            @keyframes fadeInBlur {
                0% {
                    opacity: 0;
                    backdrop-filter: blur(0px);
                }
                100% {
                    opacity: 1;
                    backdrop-filter: blur(8px);
                }
            }
            
            @keyframes slideUpScale {
                0% {
                    opacity: 0;
                    transform: translate(-50%, calc(-50% + 30px)) scale(0.85);
                }
                100% {
                    opacity: 1;
                    transform: translate(-50%, -50%) scale(1);
                }
            }
            
            .modal-card {
                animation: slideUpScale 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
            }
        `;
        document.head.appendChild(style);
    }
    
    // Apply modal styles
    modal.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.4);
        backdrop-filter: blur(8px);
        z-index: 9999;
        display: flex;
        align-items: center;
        justify-content: center;
        animation: fadeInBlur 0.4s ease-out;
    `;
    
    // Update modal content with new URL - NO GLOW
    modal.innerHTML = `
        <div class="modal-card" style="
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 20px;
            padding: 1.2rem;
            width: 320px;
            max-width: 90%;
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            z-index: 10000;
        ">
            <button id="closeCloudRemoteBtn" style="
                position: absolute;
                top: 0.75rem;
                right: 0.75rem;
                background: rgba(255, 255, 255, 0.1);
                border: 1px solid rgba(255, 255, 255, 0.2);
                color: #ffffff;
                font-size: 1.3rem;
                cursor: pointer;
                padding: 0;
                width: 30px;
                height: 30px;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
                border-radius: 50%;
                backdrop-filter: blur(10px);
                z-index: 10001;
            " title="Close">×</button>
            
            <h2 style="
                color: #ffffff;
                margin: 0 0 0.8rem 0;
                font-size: 1.2rem;
                font-weight: 700;
                letter-spacing: -0.5px;
                position: relative;
                z-index: 1;
            ">Cloud Remote</h2>
            
            <div style="
                display: flex;
                flex-direction: column;
                gap: 0.8rem;
                position: relative;
                z-index: 1;
            ">
                <!-- Connection Code -->
                <div style="
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.8rem;
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 14px;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    backdrop-filter: blur(10px);
                ">
                    <p style="
                        color: rgba(255, 255, 255, 0.8);
                        margin: 0;
                        font-size: 0.75rem;
                        font-weight: 600;
                        letter-spacing: 0.5px;
                    ">CONNECTION CODE</p>
                    <p style="
                        color: #ffffff;
                        margin: 0;
                        font-size: 1.8rem;
                        font-weight: 700;
                        letter-spacing: 0.3em;
                        font-family: 'Courier New', monospace;
                    ">${connectionCode}</p>
                    <p style="
                        color: rgba(255, 255, 255, 0.6);
                        margin: 0.5rem 0 0 0;
                        font-size: 0.7rem;
                    ">Valid for 5 minutes</p>
                </div>
                
                <!-- Divider -->
                <div style="
                    height: 1px;
                    background: linear-gradient(90deg, rgba(255, 255, 255, 0), rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0));
                "></div>
                
                <!-- QR Code -->
                <div style="
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.8rem;
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 14px;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    backdrop-filter: blur(10px);
                ">
                    <p style="
                        color: rgba(255, 255, 255, 0.8);
                        margin: 0;
                        font-size: 0.75rem;
                        font-weight: 600;
                        letter-spacing: 0.5px;
                    ">OR SCAN QR</p>
                    <div id="qrcode" style="
                        background: #ffffff;
                        padding: 0.5rem;
                        border-radius: 8px;
                    "></div>
                </div>
                
                <!-- Divider -->
                <div style="
                    height: 1px;
                    background: linear-gradient(90deg, rgba(255, 255, 255, 0), rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0));
                "></div>
                
                <!-- Copy Button -->
                <button id="copyRemoteLinkBtn" style="
                    background: rgba(255, 255, 255, 0.1);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    color: #ffffff;
                    padding: 0.6rem;
                    border-radius: 8px;
                    cursor: pointer;
                    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
                    font-size: 0.8rem;
                    font-weight: 600;
                    backdrop-filter: blur(10px);
                    width: 100%;
                ">Copy Link</button>
                
                <!-- Open Remote Button -->
                <button id="openRemoteWindowBtn" style="
                    background: linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.08) 100%);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    color: #ffffff;
                    padding: 0.7rem;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 0.9rem;
                    font-weight: 700;
                    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
                    width: 100%;
                    backdrop-filter: blur(10px);
                    letter-spacing: 0.5px;
                ">Open Remote</button>
            </div>
        </div>
    `;
    
    // Set up event listeners
    setTimeout(() => {
        const closeBtn = modal.querySelector('#closeCloudRemoteBtn');
        const copyBtn = modal.querySelector('#copyRemoteLinkBtn');
        const openWindowBtn = modal.querySelector('#openRemoteWindowBtn');
        const remoteLink = remoteURL;
        
        if (closeBtn) {
            closeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                closeModal();
            });
            
            closeBtn.addEventListener('mouseenter', () => {
                closeBtn.style.background = 'rgba(255, 255, 255, 0.2)';
                closeBtn.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                closeBtn.style.transform = 'scale(1.1)';
            });
            
            closeBtn.addEventListener('mouseleave', () => {
                closeBtn.style.background = 'rgba(255, 255, 255, 0.1)';
                closeBtn.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                closeBtn.style.transform = 'scale(1)';
            });
        }
        
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    closeModal();
                }
            });
        }
        
        if (copyBtn) {
            copyBtn.addEventListener('click', () => {
                navigator.clipboard.writeText(remoteLink).then(() => {
                    const originalText = copyBtn.textContent;
                    copyBtn.textContent = '✓ Copied';
                    copyBtn.style.background = 'rgba(100, 200, 100, 0.2)';
                    copyBtn.style.borderColor = 'rgba(100, 200, 100, 0.4)';
                    setTimeout(() => {
                        copyBtn.textContent = originalText;
                        copyBtn.style.background = 'rgba(255, 255, 255, 0.1)';
                        copyBtn.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                    }, 2000);
                });
            });
            
            copyBtn.addEventListener('mouseenter', () => {
                copyBtn.style.background = 'rgba(255, 255, 255, 0.15)';
                copyBtn.style.borderColor = 'rgba(255, 255, 255, 0.25)';
                copyBtn.style.transform = 'scale(1.02)';
            });
            
            copyBtn.addEventListener('mouseleave', () => {
                copyBtn.style.background = 'rgba(255, 255, 255, 0.1)';
                copyBtn.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                copyBtn.style.transform = 'scale(1)';
            });
        }
        
        if (openWindowBtn) {
            openWindowBtn.addEventListener('click', () => {
                // Check if we're on a console/device where window.open won't work
                if (!window.open || typeof window.open !== 'function') {
                    // Load remote in same window/tab
                    window.location.href = remoteURL;
                    return;
                }
                
                const remoteWindow = window.open(remoteURL, 'lumiereRemote', 'width=500,height=800,resizable=yes');
                if (remoteWindow) {
                    remoteWindow.focus();
                }
            });
            
            openWindowBtn.addEventListener('mouseenter', () => {
                openWindowBtn.style.background = 'linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0.12) 100%)';
                openWindowBtn.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                openWindowBtn.style.transform = 'translateY(-2px)';
            });
            
            openWindowBtn.addEventListener('mouseleave', () => {
                openWindowBtn.style.background = 'linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.08) 100%)';
                openWindowBtn.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                openWindowBtn.style.transform = 'translateY(0)';
            });
        }
    }, 0);
    
    function closeModal() {
        modal.style.animation = 'fadeInBlur 0.4s ease-out reverse';
        setTimeout(() => {
            modal.style.display = 'none';
        }, 400);
    }
    
    // Show modal
    modal.style.display = 'flex';
    
    // Generate QR code
    setTimeout(() => {
        const qrcodeDiv = modal.querySelector('#qrcode');
        if (qrcodeDiv) {
            qrcodeDiv.innerHTML = '';
            
            if (typeof QRCode !== 'undefined') {
                new QRCode(qrcodeDiv, {
                    text: remoteURL,
                    width: 120,
                    height: 120,
                    colorDark: '#000000',
                    colorLight: '#ffffff',
                    correctLevel: QRCode.CorrectLevel.H
                });
            }
        }
    }, 50);
}

/* ========================
   RESPONSIVE SYSTEM
   ======================== */

let currentBreakpoint = getBreakpoint();
let resizeTimeout;

function getBreakpoint() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const aspectRatio = width / height;
    
    let breakpoint;
    if (width < 480) breakpoint = 'xs';
    else if (width < 768) breakpoint = 'sm';
    else if (width < 1024) breakpoint = 'md';
    else if (width < 1280) breakpoint = 'lg';
    else if (width < 1536) breakpoint = 'xl';
    else breakpoint = '2xl';
    
    return {
        width,
        height,
        aspectRatio,
        breakpoint,
        isPortrait: height > width,
        isLandscape: width > height,
        isTablet: width >= 768 && width < 1280,
        isMobile: width < 768,
        isDesktop: width >= 1280
    };
}

function initializeResponsiveSystem() {
    // Handle window resize
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(function() {
            const newBreakpoint = getBreakpoint();
            
            // Only recalculate if breakpoint changed
            if (newBreakpoint.breakpoint !== currentBreakpoint.breakpoint ||
                newBreakpoint.isPortrait !== currentBreakpoint.isPortrait) {
                currentBreakpoint = newBreakpoint;
                applyResponsiveLayout();
            }
        }, 250); // Debounce resize events
    });
    
    // Initial layout application
    applyResponsiveLayout();
    
    // Handle orientation change
    window.addEventListener('orientationchange', function() {
        setTimeout(function() {
            currentBreakpoint = getBreakpoint();
            applyResponsiveLayout();
        }, 100);
    });
    
    // Handle visibility change (resume/pause animations)
    document.addEventListener('visibilitychange', function() {
        if (document.hidden) {
            pauseAnimations();
        } else {
            resumeAnimations();
        }
    });
}

function applyResponsiveLayout() {
    const { breakpoint, isMobile, isTablet, isDesktop } = currentBreakpoint;
    
    // Adjust movie card widths based on breakpoint
    const movieCards = document.querySelectorAll('.movie-card');
    let cardWidth;
    
    if (breakpoint === 'xs') {
        cardWidth = 'clamp(100px, 40vw, 150px)';
    } else if (breakpoint === 'sm') {
        cardWidth = 'clamp(140px, 35vw, 180px)';
    } else if (breakpoint === 'md') {
        cardWidth = 'clamp(160px, 25vw, 200px)';
    } else if (breakpoint === 'lg') {
        cardWidth = 'clamp(180px, 22vw, 220px)';
    } else {
        cardWidth = '200px';
    }
    
    movieCards.forEach(card => {
        card.style.width = cardWidth;
        card.style.flexBasis = cardWidth;
    });
    
    // Adjust grid gaps
    const grids = document.querySelectorAll('.movie-grid');
    grids.forEach(grid => {
        if (breakpoint === 'xs') {
            grid.style.gap = 'var(--space-md)';
        } else if (breakpoint === 'sm') {
            grid.style.gap = 'var(--space-lg)';
        } else {
            grid.style.gap = 'var(--space-xl)';
        }
    });
    
    // Adjust hero section
    const heroSection = document.querySelector('.lg\\:h-\\[650px\\]');
    if (heroSection) {
        if (breakpoint === 'xs' || breakpoint === 'sm') {
            heroSection.style.display = 'none';
        } else {
            heroSection.style.display = 'block';
        }
    }
    
    // Adjust navigation
    const navbar = document.querySelector('.navbar');
    if (navbar) {
        if (isMobile) {
            navbar.style.padding = 'var(--space-sm) 0';
        } else {
            navbar.style.padding = 'var(--space-md) 0';
        }
    }
    
    // Dispatch custom event for other scripts
    window.dispatchEvent(new CustomEvent('breakpointChange', {
        detail: currentBreakpoint
    }));
}

function pauseAnimations() {
    const animatedElements = document.querySelectorAll('[style*="animation"], .float-card-*');
    animatedElements.forEach(el => {
        el.style.animationPlayState = 'paused';
    });
}

function resumeAnimations() {
    const animatedElements = document.querySelectorAll('[style*="animation"], .float-card-*');
    animatedElements.forEach(el => {
        el.style.animationPlayState = 'running';
    });
}

// Listen for breakpoint changes from other scripts
window.addEventListener('breakpointChange', function(e) {
    console.log('Breakpoint changed to:', e.detail.breakpoint);
    console.log('Device info:', {
        isMobile: e.detail.isMobile,
        isTablet: e.detail.isTablet,
        isDesktop: e.detail.isDesktop,
        isPortrait: e.detail.isPortrait,
        aspectRatio: e.detail.aspectRatio.toFixed(2)
    });
});

// Auto-reload on significant breakpoint changes (optional)
window.addEventListener('breakpointChange', function(e) {
    // Re-initialize search preview position on major layout changes
    if (searchPreviewContainer) {
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.parentElement.style.position = 'relative';
            if (searchPreviewContainer.parentElement !== searchInput.parentElement) {
                searchInput.parentElement.appendChild(searchPreviewContainer);
            }
        }
    }
});
