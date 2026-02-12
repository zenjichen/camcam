// Router and Advanced Search Features

// ========== HASH ROUTING ==========
class Router {
    constructor() {
        this.routes = {
            '': () => this.loadHome(),
            'the-loai': (slug) => this.loadGenre(slug),
            'quoc-gia': (slug) => this.loadCountry(slug),
            'tim-kiem': (query) => this.loadSearch(query),
            'dien-vien': (name) => this.searchByActor(name)
        };

        window.addEventListener('hashchange', () => this.handleRoute());
        window.addEventListener('load', () => this.handleRoute());
    }

    handleRoute() {
        const hash = window.location.hash.slice(1) || '';
        const [route, ...params] = hash.split('/');

        if (this.routes[route]) {
            this.routes[route](...params);
        } else {
            this.loadHome();
        }
    }

    loadHome() {
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    async loadGenre(slug) {
        if (!slug) return;

        const genreName = window.state?.genres?.find(g => g.slug === slug)?.name || slug;

        // Update page title
        document.querySelector('.section-title')?.scrollIntoView({ behavior: 'smooth' });

        // Load movies
        await window.loadMoviesByGenre(slug);

        // Update section title
        const sectionTitle = document.querySelector('#newMovies').previousElementSibling;
        if (sectionTitle) {
            sectionTitle.innerHTML = `
                <h2>Thể loại: ${genreName}</h2>
                <a href="#" onclick="window.location.hash=''; return false;">← Quay lại trang chủ</a>
            `;
        }
    }

    async loadCountry(slug) {
        if (!slug) return;

        const countryName = window.state?.countries?.find(c => c.slug === slug)?.name || slug;

        // Update page title
        document.querySelector('.section-title')?.scrollIntoView({ behavior: 'smooth' });

        // Load movies
        await window.loadMoviesByCountry(slug);

        // Update section title
        const sectionTitle = document.querySelector('#newMovies').previousElementSibling;
        if (sectionTitle) {
            sectionTitle.innerHTML = `
                <h2>Quốc gia: ${countryName}</h2>
                <a href="#" onclick="window.location.hash=''; return false;">← Quay lại trang chủ</a>
            `;
        }
    }

    async loadSearch(query) {
        if (!query) return;

        const decodedQuery = decodeURIComponent(query);

        // Update search input
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.value = decodedQuery;
        }

        // Perform search
        await window.searchMovies(decodedQuery);
    }

    async searchByActor(name) {
        if (!name) return;

        const decodedName = decodeURIComponent(name);

        // Search for movies with this actor
        await window.searchMoviesByActor(decodedName);
    }
}

// ========== ACTOR SEARCH WITH AUTOCOMPLETE ==========
class ActorSearch {
    constructor() {
        this.actorCache = new Set();
        this.setupActorSearch();
    }

    setupActorSearch() {
        // Create actor search UI
        const searchContainer = document.querySelector('.search-container');
        if (!searchContainer) return;

        const actorSearchHTML = `
            <div class="actor-search-wrapper" style="position: relative; margin-top: 10px;">
                <input 
                    type="text" 
                    id="actorSearchInput" 
                    class="search-input" 
                    placeholder="🎭 Tìm theo diễn viên..."
                    autocomplete="off"
                />
                <div id="actorSuggestions" class="actor-suggestions"></div>
            </div>
        `;

        searchContainer.insertAdjacentHTML('beforeend', actorSearchHTML);

        const actorInput = document.getElementById('actorSearchInput');
        const suggestionsDiv = document.getElementById('actorSuggestions');

        if (!actorInput || !suggestionsDiv) return;

        let debounceTimer;

        actorInput.addEventListener('input', (e) => {
            clearTimeout(debounceTimer);
            const query = e.target.value.trim();

            if (query.length < 2) {
                suggestionsDiv.innerHTML = '';
                suggestionsDiv.style.display = 'none';
                return;
            }

            debounceTimer = setTimeout(() => {
                this.showActorSuggestions(query, suggestionsDiv);
            }, 300);
        });

        actorInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const query = e.target.value.trim();
                if (query) {
                    window.location.hash = `dien-vien/${encodeURIComponent(query)}`;
                    suggestionsDiv.innerHTML = '';
                    suggestionsDiv.style.display = 'none';
                }
            }
        });

        // Close suggestions when clicking outside
        document.addEventListener('click', (e) => {
            if (!actorInput.contains(e.target) && !suggestionsDiv.contains(e.target)) {
                suggestionsDiv.innerHTML = '';
                suggestionsDiv.style.display = 'none';
            }
        });
    }

    async showActorSuggestions(query, suggestionsDiv) {
        // Get actors from cache
        const matchingActors = Array.from(this.actorCache)
            .filter(actor => actor.toLowerCase().includes(query.toLowerCase()))
            .slice(0, 10);

        if (matchingActors.length === 0) {
            // Try to fetch from API search
            const data = await window.fetchAPI(window.API_ENDPOINTS.search, { keyword: query });

            if (data) {
                let movies = [];
                if (data.items) {
                    movies = data.items;
                } else if (data.data && data.data.items) {
                    movies = data.data.items;
                }

                // Extract actors from search results
                movies.forEach(movie => {
                    if (movie.actor && Array.isArray(movie.actor)) {
                        movie.actor.forEach(actor => this.actorCache.add(actor));
                    }
                });

                // Try again with updated cache
                const newMatches = Array.from(this.actorCache)
                    .filter(actor => actor.toLowerCase().includes(query.toLowerCase()))
                    .slice(0, 10);

                this.renderSuggestions(newMatches, suggestionsDiv, query);
            }
        } else {
            this.renderSuggestions(matchingActors, suggestionsDiv, query);
        }
    }

    renderSuggestions(actors, suggestionsDiv, query) {
        if (actors.length === 0) {
            suggestionsDiv.innerHTML = `
                <div class="suggestion-item no-results">
                    Không tìm thấy diễn viên. Thử tìm kiếm trực tiếp...
                </div>
            `;
            suggestionsDiv.style.display = 'block';
            return;
        }

        const html = actors.map(actor => `
            <div class="suggestion-item" onclick="window.location.hash='dien-vien/${encodeURIComponent(actor)}'">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
                ${this.highlightMatch(actor, query)}
            </div>
        `).join('');

        suggestionsDiv.innerHTML = html;
        suggestionsDiv.style.display = 'block';
    }

    highlightMatch(text, query) {
        const regex = new RegExp(`(${query})`, 'gi');
        return text.replace(regex, '<strong>$1</strong>');
    }
}

// ========== SEARCH BY ACTOR ==========
window.searchMoviesByActor = async (actorName) => {
    const elements = {
        newMovies: document.getElementById('newMovies')
    };

    if (!elements.newMovies) return;

    // Show loading
    elements.newMovies.innerHTML = `
        <div style="text-align: center; padding: 60px; color: var(--text-secondary);">
            <div class="skeleton" style="width: 100%; height: 300px; border-radius: 12px;"></div>
            <p style="margin-top: 20px;">Đang tìm phim của ${actorName}...</p>
        </div>
    `;

    // Search for movies
    const data = await window.fetchAPI(window.API_ENDPOINTS.search, { keyword: actorName });

    if (!data) {
        elements.newMovies.innerHTML = `
            <div style="text-align: center; padding: 60px; color: var(--text-secondary);">
                Không tìm thấy phim nào của diễn viên "${actorName}"
            </div>
        `;
        return;
    }

    let movies = [];
    if (data.items) {
        movies = data.items;
    } else if (data.data && data.data.items) {
        movies = data.data.items;
    }

    // Filter movies that actually have this actor
    const filteredMovies = movies.filter(movie => {
        if (!movie.actor || !Array.isArray(movie.actor)) return false;
        return movie.actor.some(actor =>
            actor.toLowerCase().includes(actorName.toLowerCase())
        );
    });

    if (filteredMovies.length === 0) {
        elements.newMovies.innerHTML = `
            <div style="text-align: center; padding: 60px; color: var(--text-secondary);">
                Không tìm thấy phim nào của diễn viên "${actorName}"
            </div>
        `;
        return;
    }

    // Update section title
    const sectionTitle = elements.newMovies.previousElementSibling;
    if (sectionTitle) {
        sectionTitle.innerHTML = `
            <h2>🎭 Phim của diễn viên: ${actorName}</h2>
            <a href="#" onclick="window.location.hash=''; return false;">← Quay lại trang chủ</a>
        `;
    }

    // Display movies
    elements.newMovies.innerHTML = '';
    filteredMovies.forEach(movie => {
        elements.newMovies.appendChild(window.createMovieCard(movie));
    });

    // Scroll to results
    elements.newMovies.scrollIntoView({ behavior: 'smooth' });
};

// ========== UPDATE GENRE AND COUNTRY LINKS ==========
window.updateFilterLinks = () => {
    // Update genre links
    const genreDropdown = document.getElementById('genreDropdown');
    if (genreDropdown && window.state?.genres) {
        genreDropdown.innerHTML = window.state.genres.map(genre => `
            <a href="#the-loai/${genre.slug}" class="dropdown-item">
                ${genre.name}
            </a>
        `).join('');
    }

    // Update country links
    const countryDropdown = document.getElementById('countryDropdown');
    if (countryDropdown && window.state?.countries) {
        countryDropdown.innerHTML = window.state.countries.map(country => `
            <a href="#quoc-gia/${country.slug}" class="dropdown-item">
                ${country.name}
            </a>
        `).join('');
    }
};

// Initialize router and actor search
const router = new Router();
const actorSearch = new ActorSearch();

// Override loadFilters to update links after loading
const originalLoadFilters = window.loadFilters;
if (originalLoadFilters) {
    window.loadFilters = async () => {
        await originalLoadFilters();
        window.updateFilterLinks();
    };
}

console.log('Router and Actor Search initialized');
