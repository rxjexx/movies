/* ========================
   MOVIE STREAMING SITE JS
   ======================== */

const API_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_API_KEY = '9f3a94034c696a33133c40385d030817';

// Get the current host for remote control URL
function getRemoteURL() {
    const protocol = window.location.protocol;
    const host = window.location.host;
    return `${protocol}//${host}/remote.html`;
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
    initializeResponsiveSystem();
});

// Load all page data in parallel to reduce sequential API calls
async function loadPageData() {
    try {
        // Load all data simultaneously - call TMDB directly
        const [trendingData, showsData] = await Promise.all([
            fetchAPI('/movie/popular?page=1'), // Get popular movies
            fetchAPI('/tv/popular?page=1') // Get popular shows
        ]);
        
        // Cache the popular movies for floating cards
        if (trendingData && trendingData.results) {
            cachedPopularMovies = trendingData.results;
            displayMoviesCarousel(cachedPopularMovies, 'movies');
            initializeFloatingCardRotation(cachedPopularMovies);
        }
        
        // Display shows
        if (showsData && showsData.results) {
            displayMoviesCarousel(showsData.results, 'tv');
        }
    } catch (error) {
        console.error('Error loading page data:', error);
    }
}

/* ========================
   API CALLS
   ======================== */

async function fetchAPI(endpoint) {
    try {
        // Call TMDB API directly with the key
        const url = `${API_BASE_URL}${endpoint}&api_key=${TMDB_API_KEY}`;
        
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
        transition: all 0.5s ease-out;
        transform: rotate(${rotation}deg);
        display: block;
    `;
    
    card.onmouseenter = () => {
        card.style.transform = `scale(1.05) rotate(${rotation}deg) translateY(-10px)`;
        card.style.zIndex = String(100);
    };
    
    card.onmouseleave = () => {
        card.style.transform = `rotate(${rotation}deg)`;
        card.style.zIndex = String(60 + index);
    };
    
    const posterPath = item.poster_path ? `https://image.tmdb.org/t/p/w300${item.poster_path}` : 'https://via.placeholder.com/300x450?text=No+Image';
    const title = item.title || item.name;
    const year = item.release_date ? new Date(item.release_date).getFullYear() : (item.first_air_date ? new Date(item.first_air_date).getFullYear() : 'N/A');
    const rating = item.vote_average ? item.vote_average.toFixed(1) : 'N/A';
    const label = type === 'show' ? 'SERIES' : 'MOVIE';

    card.innerHTML = `
        <div style="position: relative; width: 100%; height: 100%; border-radius: 0.75rem; overflow: hidden; background: #18181b; box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);">
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

    // Add hover effects
    const img = card.querySelector('img');
    const overlay = card.querySelector('.movie-overlay');
    
    card.addEventListener('mouseenter', () => {
        if (img) img.style.transform = 'scale(1.1)';
        if (overlay) overlay.style.opacity = '1';
        card.style.transform = `scale(1.05) rotate(${rotation}deg) translateY(-10px)`;
        card.style.zIndex = '100';
    });

    card.addEventListener('mouseleave', () => {
        if (img) img.style.transform = 'scale(1)';
        if (overlay) overlay.style.opacity = '0';
        card.style.transform = `rotate(${rotation}deg)`;
        card.style.zIndex = String(60 + index);
    });

    // Play button click handler
    const playBtn = card.querySelector('.play-btn');
    playBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        openMovieModal(item, type);
    });

    return card;
}


// Carousel display with smaller cards and hover scrolling
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
    
    // Add hover scrolling
    let isScrolling = false;
    gridElement.addEventListener('mouseenter', () => {
        isScrolling = true;
        const scrollAmount = 5;
        const scrollInterval = setInterval(() => {
            if (!isScrolling) {
                clearInterval(scrollInterval);
                return;
            }
            gridElement.scrollLeft += scrollAmount;
            if (gridElement.scrollLeft >= gridElement.scrollWidth - gridElement.clientWidth) {
                gridElement.scrollLeft = 0;
            }
        }, 50);
    });
    
    gridElement.addEventListener('mouseleave', () => {
        isScrolling = false;
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

// Rotating floating cards
let floatingCardIndex = 0;
let floatingCardRotationInterval = null;

function initializeFloatingCardRotation(movies) {
    if (!movies || movies.length === 0) return;
    
    const container = document.getElementById('floatingCardsContainer');
    if (!container) return;

    // Initial display
    displayFloatingCards(movies.slice(0, 6));

    // Rotate every 5 seconds
    if (floatingCardRotationInterval) {
        clearInterval(floatingCardRotationInterval);
    }

    floatingCardRotationInterval = setInterval(() => {
        floatingCardIndex = (floatingCardIndex + 1) % Math.max(1, movies.length - 5);
        const nextSet = movies.slice(floatingCardIndex, floatingCardIndex + 6);
        if (nextSet.length === 6) {
            displayFloatingCards(nextSet);
        }
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

    movies.slice(0, 12).forEach((movie, index) => {
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

    shows.slice(0, 12).forEach((show, index) => {
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
    const cloudRemoteModal = document.getElementById('cloudRemoteModal');
    const cloudRemoteOverlay = document.getElementById('cloudRemoteOverlay');
    const closeCloudRemote = document.getElementById('closeCloudRemote');
    const closeCloudRemoteBtn = document.getElementById('closeCloudRemoteBtn');
    const copyRemoteLinkBtn = document.getElementById('copyRemoteLinkBtn');
    const remoteLink = document.getElementById('remoteLink');

    if (!cloudRemoteBtn || !cloudRemoteModal) return;

    const remoteURL = getRemoteURL();
    remoteLink.textContent = remoteURL;

    // Open modal
    cloudRemoteBtn.addEventListener('click', () => {
        cloudRemoteModal.classList.add('active');
        generateQRCode(remoteURL);
    });

    // Close modal functions
    const closeModal = () => {
        cloudRemoteModal.classList.remove('active');
    };

    cloudRemoteOverlay.addEventListener('click', closeModal);
    closeCloudRemote.addEventListener('click', closeModal);
    closeCloudRemoteBtn.addEventListener('click', closeModal);

    // Copy to clipboard
    copyRemoteLinkBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(remoteURL).then(() => {
            const originalText = copyRemoteLinkBtn.innerHTML;
            copyRemoteLinkBtn.innerHTML = '<iconify-icon icon="solar:check-circle-linear" style="width: 18px; height: 18px;"></iconify-icon>';
            setTimeout(() => {
                copyRemoteLinkBtn.innerHTML = originalText;
            }, 2000);
        }).catch(err => {
            console.error('Failed to copy:', err);
        });
    });

    // Close with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && cloudRemoteModal.classList.contains('active')) {
            closeModal();
        }
    });
}

function generateQRCode(url) {
    const qrcodeDiv = document.getElementById('qrcode');
    qrcodeDiv.innerHTML = ''; // Clear previous QR code
    
    new QRCode(qrcodeDiv, {
        text: url,
        width: 200,
        height: 200,
        colorDark: '#000000',
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.H
    });
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
