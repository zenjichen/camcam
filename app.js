// API Configuration
const API_BASE = 'https://ophim1.com';
const API_ENDPOINTS = {
    home: '/danh-sach/phim-moi-cap-nhat',
    single: '/v1/api/danh-sach/phim-le',
    series: '/v1/api/danh-sach/phim-bo',
    animation: '/v1/api/danh-sach/hoat-hinh',
    search: '/v1/api/tim-kiem',
    detail: '/v1/api/phim',
    categories: '/the-loai',
    countries: '/quoc-gia',
};

// State Management
const state = {
    currentPage: 'home',
    genres: [],
    countries: [],
    currentMovie: null,
    searchQuery: '',
};
// Expose state globally so player.js and router.js can access it
window.state = state;

// DOM Elements
const elements = {
    navbar: document.querySelector('.navbar'),
    searchInput: document.getElementById('searchInput'),
    heroSection: document.getElementById('heroSection'),
    heroTitle: document.querySelector('.hero-title'),
    heroDescription: document.querySelector('.hero-description'),
    heroYear: document.getElementById('heroYear'),
    heroPlayBtn: document.getElementById('heroPlayBtn'),
    heroInfoBtn: document.getElementById('heroInfoBtn'),
    newMovies: document.getElementById('newMovies'),
    singleMovies: document.getElementById('singleMovies'),
    seriesMovies: document.getElementById('seriesMovies'),
    animationMovies: document.getElementById('animationMovies'),
    movieModal: document.getElementById('movieModal'),
    modalBody: document.getElementById('modalBody'),
    modalClose: document.getElementById('modalClose'),
    playerModal: document.getElementById('playerModal'),
    playerContainer: document.getElementById('playerContainer'),
    playerClose: document.getElementById('playerClose'),
    genreDropdown: document.getElementById('genreDropdown'),
    countryDropdown: document.getElementById('countryDropdown'),
    menuToggle: document.getElementById('menuToggle'),
};

// Utility Functions
const fetchAPI = async (endpoint, params = {}) => {
    try {
        const url = new URL(`${API_BASE}${endpoint}`);
        Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));

        const response = await fetch(url);
        if (!response.ok) throw new Error('API request failed');

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('API Error:', error);
        return null;
    }
};

const createMovieCard = (movie) => {
    const card = document.createElement('div');
    card.className = 'movie-card';
    card.onclick = () => showMovieDetail(movie.slug);

    // Fix thumbnail URL - OPhim API returns just filenames, need to add full path
    let posterUrl = movie.poster_url || movie.thumb_url || 'https://via.placeholder.com/300x450?text=No+Image';
    if (posterUrl && !posterUrl.startsWith('http')) {
        // If it's just a filename or starts with /, add the full CDN path
        posterUrl = posterUrl.startsWith('/')
            ? `https://img.ophim.live${posterUrl}`
            : `https://img.ophim.live/uploads/movies/${posterUrl}`;
    }
    const quality = movie.quality || 'HD';
    const year = movie.year || new Date().getFullYear();
    const episodeCurrent = movie.episode_current || 'Full';
    const imdb = (movie.tmdb?.vote_average || movie.vote_average || 0).toFixed(1);

    card.innerHTML = `
        <img src="${posterUrl}" alt="${movie.name}" class="movie-poster" loading="lazy" onerror="this.src='https://via.placeholder.com/300x450?text=No+Image'">
        <div class="quality-badge">${quality}</div>
        <div class="movie-badge">${episodeCurrent}</div>
        ${imdb > 0 ? `<div class="imdb-badge" style="position: absolute; top: 40px; left: 12px; background: #f5c518; color: #000; padding: 2px 6px; border-radius: 4px; font-weight: bold; font-size: 11px; z-index: 2;">IMDb ${imdb}</div>` : ''}
        <div class="movie-overlay">
            <h3 class="movie-title">${movie.name}</h3>
            <div class="movie-info">
                <span>${year}</span>
                ${movie.lang ? `<span>${movie.lang}</span>` : ''}
                ${imdb > 0 ? `<span>⭐ ${imdb}</span>` : ''}
            </div>
        </div>
        <div class="movie-title-bottom">${movie.name}</div>
    `;

    return card;
};

const showLoading = (container) => {
    container.innerHTML = Array(6).fill(0).map(() => '<div class="movie-card skeleton"></div>').join('');
};

const showError = (container, message = 'Không thể tải dữ liệu') => {
    container.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-secondary);">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin: 0 auto 16px;">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <p>${message}</p>
        </div>
    `;
};

// Load Movies
const loadMovies = async (endpoint, container, page = 1) => {
    showLoading(container);

    const data = await fetchAPI(endpoint, { page });

    if (!data) {
        showError(container);
        return;
    }

    // Handle different API response formats
    let movies = [];
    if (data.items) {
        // Format 1: {status: true, items: [...]}
        movies = data.items;
    } else if (data.data && data.data.items) {
        // Format 2: {status: "success", data: {items: [...]}}
        movies = data.data.items;
    } else {
        showError(container);
        return;
    }

    if (movies.length === 0) {
        showError(container, 'Không có phim nào');
        return;
    }

    container.innerHTML = '';
    movies.slice(0, 12).forEach(movie => {
        container.appendChild(createMovieCard(movie));
    });
};

// Load Hero Movie
const loadHeroMovie = async () => {
    const data = await fetchAPI(API_ENDPOINTS.home, { page: 1 });

    if (!data) {
        return;
    }

    // Handle different API response formats
    let movies = [];
    if (data.items) {
        movies = data.items;
    } else if (data.data && data.data.items) {
        movies = data.data.items;
    }

    if (!movies || movies.length === 0) {
        return;
    }

    const movie = movies[0];
    const heroSlide = document.querySelector('.hero-slide');
    const heroBg = document.querySelector('.hero-bg');

    // Set background
    if (movie.poster_url || movie.thumb_url) {
        let bgUrl = movie.poster_url || movie.thumb_url;
        if (!bgUrl.startsWith('http')) {
            bgUrl = bgUrl.startsWith('/')
                ? `https://img.ophim.live${bgUrl}`
                : `https://img.ophim.live/uploads/movies/${bgUrl}`;
        }
        heroBg.style.backgroundImage = `url(${bgUrl})`;
    }

    // Set content
    elements.heroTitle.textContent = movie.name;
    elements.heroDescription.textContent = movie.content ?
        movie.content.replace(/<[^>]*>/g, '').substring(0, 200) + '...' :
        'Xem ngay để khám phá nội dung hấp dẫn!';
    elements.heroYear.textContent = movie.year || new Date().getFullYear();

    // Set button actions
    elements.heroPlayBtn.onclick = () => showMovieDetail(movie.slug);
    elements.heroInfoBtn.onclick = () => showMovieDetail(movie.slug);
};

// Show Movie Detail
const showMovieDetail = async (slug) => {
    elements.movieModal.classList.add('active');
    document.body.style.overflow = 'hidden';

    elements.modalBody.innerHTML = '<div style="text-align: center; padding: 60px;"><div class="skeleton" style="width: 100%; height: 400px; border-radius: 12px;"></div></div>';

    const data = await fetchAPI(`${API_ENDPOINTS.detail}/${slug}`);

    if (!data || !data.data || !data.data.item) {
        elements.modalBody.innerHTML = '<div style="text-align: center; padding: 60px; color: var(--text-secondary);">Không thể tải thông tin phim</div>';
        return;
    }

    const movie = data.data.item;
    state.currentMovie = movie;
    window.currentMovie = movie; // Also store in window to prevent loss

    // Debug: Log movie data to see structure
    console.log('Movie Detail Data:', movie);
    console.log('Movie Episodes:', movie.episodes);
    console.log('Movie Episode Count:', movie.episodes?.length);

    // Fix poster URL - OPhim API returns just filenames or paths
    let posterUrl = movie.poster_url || movie.thumb_url || 'https://via.placeholder.com/300x450?text=No+Image';
    if (posterUrl && !posterUrl.startsWith('http')) {
        posterUrl = posterUrl.startsWith('/')
            ? `https://img.ophim.live${posterUrl}`
            : `https://img.ophim.live/uploads/movies/${posterUrl}`;
    }
    const categories = movie.category?.map(cat => cat.name).join(', ') || 'Chưa phân loại';
    const countries = movie.country?.map(c => c.name).join(', ') || 'Không rõ';
    const actors = movie.actor?.join(', ') || 'Đang cập nhật';
    const director = movie.director?.join(', ') || 'Đang cập nhật';

    let episodesHTML = '';
    if (movie.episodes && movie.episodes.length > 0) {
        const serverData = movie.episodes[0];
        if (serverData.server_data && serverData.server_data.length > 0) {
            episodesHTML = `
                <div class="episodes-section">
                    <h3 class="episodes-title">Danh sách tập phim</h3>
                    <div class="episodes-grid">
                        ${serverData.server_data.map((ep, idx) => `
                            <button class="episode-btn" onclick="playEpisode('${ep.link_embed.replace(/'/g, "\\'")}', '${ep.name.replace(/'/g, "\\'")}', 0, ${idx})">
                                ${ep.name}
                            </button>
                        `).join('')}
                    </div>
                </div>
            `;
        }
    }

    elements.modalBody.innerHTML = `
        <div class="detail-header">
            <div class="detail-poster">
                <img src="${posterUrl}" alt="${movie.name}" onerror="this.src='https://via.placeholder.com/300x450?text=No+Image'">
            </div>
            <div class="detail-info">
                <h2 class="detail-title">${movie.name}</h2>
                <div class="detail-meta">
                    <span><strong>Tên gốc:</strong> ${movie.origin_name || movie.name}</span>
                    <span><strong>Năm:</strong> ${movie.year || 'N/A'}</span>
                    <span><strong>Thời lượng:</strong> ${movie.time || 'N/A'}</span>
                    <span><strong>Chất lượng:</strong> ${movie.quality || 'HD'}</span>
                    <span><strong>Ngôn ngữ:</strong> ${movie.lang || 'Vietsub'}</span>
                    <span><strong>Trạng thái:</strong> ${movie.episode_current || 'Full'}</span>
                </div>
                <p class="detail-description">${movie.content ? movie.content.replace(/<[^>]*>/g, '') : 'Đang cập nhật nội dung...'}</p>
                <div class="detail-tags">
                    <div class="tag"><strong>Thể loại:</strong> ${categories}</div>
                    <div class="tag"><strong>Quốc gia:</strong> ${countries}</div>
                </div>
                <div class="detail-tags">
                    <div class="tag"><strong>Đạo diễn:</strong> ${director}</div>
                </div>
                <div class="detail-tags">
                    <div class="tag"><strong>Diễn viên:</strong> ${actors}</div>
                </div>
                <div class="hero-actions">
                    <button class="btn btn-primary" onclick="playMovie()">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M8 5v14l11-7z"/>
                        </svg>
                        Xem phim
                    </button>
                </div>
            </div>
        </div>
        ${episodesHTML}
    `;
};

// Play Movie
window.playMovie = () => {
    console.log('playMovie called');
    console.log('state.currentMovie:', state.currentMovie);

    if (!state.currentMovie) {
        alert('Không tìm thấy thông tin phim. Vui lòng thử lại.');
        console.error('state.currentMovie is null or undefined');
        return;
    }

    if (!state.currentMovie.episodes || !Array.isArray(state.currentMovie.episodes) || state.currentMovie.episodes.length === 0) {
        alert('Phim này chưa có tập nào để xem.');
        console.error('No episodes found:', state.currentMovie.episodes);
        return;
    }

    const firstServer = state.currentMovie.episodes[0];
    if (!firstServer.server_data || !Array.isArray(firstServer.server_data) || firstServer.server_data.length === 0) {
        alert('Server không có dữ liệu phim.');
        console.error('No server_data found:', firstServer);
        return;
    }

    const firstEpisode = firstServer.server_data[0];
    console.log('Playing episode:', firstEpisode);
    playEpisode(firstEpisode.link_embed, firstEpisode.name, 0, 0);
};

// Play Episode
window.playEpisode = (embedUrl, episodeName) => {
    elements.movieModal.classList.remove('active');
    elements.playerModal.classList.add('active');

    elements.playerContainer.innerHTML = `
        <iframe src="${embedUrl}" allowfullscreen allow="autoplay; encrypted-media"></iframe>
    `;
};

// Search Movies
const searchMovies = async (query) => {
    if (!query || query.trim().length < 2) return;

    const data = await fetchAPI(API_ENDPOINTS.search, { keyword: query });

    if (!data) {
        showError(elements.newMovies, 'Không tìm thấy kết quả');
        return;
    }

    // Handle different API response formats
    let movies = [];
    if (data.items) {
        movies = data.items;
    } else if (data.data && data.data.items) {
        movies = data.data.items;
    } else {
        showError(elements.newMovies, 'Không tìm thấy kết quả');
        return;
    }

    elements.newMovies.innerHTML = '';
    movies.forEach(movie => {
        elements.newMovies.appendChild(createMovieCard(movie));
    });

    // Scroll to results
    elements.newMovies.scrollIntoView({ behavior: 'smooth' });
};

// Load Categories and Countries
const loadFilters = async () => {
    // Load genres - API returns direct array
    const genresData = await fetchAPI('/the-loai');
    if (genresData && Array.isArray(genresData)) {
        state.genres = genresData;
        elements.genreDropdown.innerHTML = state.genres.map(genre => `
            <a href="#the-loai/${genre.slug}" class="dropdown-item">
                ${genre.name}
            </a>
        `).join('');
    }

    // Load countries - API returns direct array
    const countriesData = await fetchAPI('/quoc-gia');
    if (countriesData && Array.isArray(countriesData)) {
        state.countries = countriesData;
        elements.countryDropdown.innerHTML = state.countries.map(country => `
            <a href="#quoc-gia/${country.slug}" class="dropdown-item">
                ${country.name}
            </a>
        `).join('');
    }
};

// Load Movies by Genre
window.loadMoviesByGenre = async (slug) => {
    const data = await fetchAPI(`/v1/api/the-loai/${slug}`, { page: 1 });

    if (!data) {
        showError(elements.newMovies, 'Không có phim nào trong thể loại này');
        return;
    }

    // Handle different API response formats
    let movies = [];
    if (data.items) {
        movies = data.items;
    } else if (data.data && data.data.items) {
        movies = data.data.items;
    } else {
        showError(elements.newMovies, 'Không có phim nào trong thể loại này');
        return;
    }

    elements.newMovies.innerHTML = '';
    movies.slice(0, 12).forEach(movie => {
        elements.newMovies.appendChild(createMovieCard(movie));
    });

    elements.newMovies.scrollIntoView({ behavior: 'smooth' });
};

// Load Movies by Country
window.loadMoviesByCountry = async (slug) => {
    const data = await fetchAPI(`/v1/api/quoc-gia/${slug}`, { page: 1 });

    if (!data) {
        showError(elements.newMovies, 'Không có phim nào từ quốc gia này');
        return;
    }

    // Handle different API response formats
    let movies = [];
    if (data.items) {
        movies = data.items;
    } else if (data.data && data.data.items) {
        movies = data.data.items;
    } else {
        showError(elements.newMovies, 'Không có phim nào từ quốc gia này');
        return;
    }

    elements.newMovies.innerHTML = '';
    movies.slice(0, 12).forEach(movie => {
        elements.newMovies.appendChild(createMovieCard(movie));
    });

    elements.newMovies.scrollIntoView({ behavior: 'smooth' });
};

// Event Listeners
window.addEventListener('scroll', () => {
    if (window.scrollY > 100) {
        elements.navbar.classList.add('scrolled');
    } else {
        elements.navbar.classList.remove('scrolled');
    }
});

elements.searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const query = e.target.value.trim();
        if (query) {
            searchMovies(query);
        }
    }
});

elements.modalClose.addEventListener('click', () => {
    elements.movieModal.classList.remove('active');
    document.body.style.overflow = 'auto';
});

elements.playerClose.addEventListener('click', () => {
    elements.playerModal.classList.remove('active');
    elements.playerContainer.innerHTML = '';
    document.body.style.overflow = 'auto';
});

// Close modal on backdrop click
elements.movieModal.addEventListener('click', (e) => {
    if (e.target === elements.movieModal || e.target.classList.contains('modal-backdrop')) {
        elements.movieModal.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
});

elements.playerModal.addEventListener('click', (e) => {
    if (e.target === elements.playerModal || e.target.classList.contains('modal-backdrop')) {
        elements.playerModal.classList.remove('active');
        elements.playerContainer.innerHTML = '';
        document.body.style.overflow = 'auto';
    }
});

// Mobile menu toggle
elements.menuToggle.addEventListener('click', () => {
    const navLinks = document.querySelector('.nav-links');
    navLinks.style.display = navLinks.style.display === 'flex' ? 'none' : 'flex';
});

// Expose functions globally for router.js and player.js
window.fetchAPI = fetchAPI;
window.createMovieCard = createMovieCard;
window.API_ENDPOINTS = API_ENDPOINTS;
window.searchMovies = searchMovies;
window.loadFilters = loadFilters;
window.showMovieDetail = showMovieDetail;

// Initialize App
const init = async () => {
    console.log('🎬 Initializing zMovie App...');

    // Load hero movie
    await loadHeroMovie();

    // Load all movie sections
    await Promise.all([
        loadMovies(API_ENDPOINTS.home, elements.newMovies),
        loadMovies(API_ENDPOINTS.single, elements.singleMovies),
        loadMovies(API_ENDPOINTS.series, elements.seriesMovies),
        loadMovies(API_ENDPOINTS.animation, elements.animationMovies),
    ]);

    // Load filters
    await loadFilters();

    console.log('✅ App initialized successfully!');
};

// Start the app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// Handle errors globally
window.addEventListener('error', (e) => {
    console.error('Global error:', e.error);
});

window.addEventListener('unhandledrejection', (e) => {
    console.error('Unhandled promise rejection:', e.reason);
});
