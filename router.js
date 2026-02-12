// Router and Advanced Search Features - Enhanced Version

// ========== HASH ROUTING ==========
class Router {
    constructor() {
        this.routes = {
            '': () => this.loadHome(),
            'the-loai': (slug) => this.loadGenre(slug),
            'quoc-gia': (slug) => this.loadCountry(slug),
            'tim-kiem': (query) => this.loadSearch(query),
            'dien-vien': (name) => this.searchByActor(name),
            'phim-moi': () => this.initFilteredPage('moi', 'phim-moi', 'Phim mới cập nhật', window.API_ENDPOINTS.home),
            'phim-le': () => this.initFilteredPage('le', 'phim-le', 'Phim lẻ', window.API_ENDPOINTS.single),
            'phim-bo': () => this.initFilteredPage('bo', 'phim-bo', 'Phim bộ', window.API_ENDPOINTS.series),
            'hoat-hinh': () => this.initFilteredPage('hoathinh', 'hoat-hinh', 'Hoạt hình', window.API_ENDPOINTS.animation)
        };

        this.currentData = {
            type: null, // 'genre', 'country', 'search'
            slug: null,
            endpoint: null, // API endpoint for pagination
            currentPage: 1,
            totalPages: 1,
            movies: [], // Movies of current page only
            itemsPerPage: 24, // Consistent with API
            filterConfig: {
                sort: 'newest',
                types: [],
                years: [],
                qualities: []
            }
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
        // Hide filtered section and show home sections
        const filteredSection = document.getElementById('filteredSection');
        const heroSection = document.getElementById('heroSection');
        const mainSections = document.querySelectorAll('.movie-section:not(#filteredSection)');

        if (filteredSection) {
            filteredSection.style.display = 'none';
        }

        if (heroSection) {
            heroSection.style.display = 'block';
        }

        mainSections.forEach(section => {
            if (section.id !== 'filteredSection') {
                section.style.display = 'block';
            }
        });

        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    hideHomeSections() {
        // Hide hero and main movie sections when viewing filtered content
        const heroSection = document.getElementById('heroSection');
        const mainSections = document.querySelectorAll('.movie-section:not(#filteredSection)');

        if (heroSection) {
            heroSection.style.display = 'none';
        }

        mainSections.forEach(section => {
            if (section.id !== 'filteredSection') {
                section.style.display = 'none';
            }
        });
    }

    createFilterControls() {
        const currentYear = new Date().getFullYear();

        // Generate Year Checkboxes (Current Year down to Current - 4)
        let yearCheckboxesHTML = '';
        for (let i = 0; i < 5; i++) {
            const y = currentYear - i;
            yearCheckboxesHTML += `
                <label class="filter-checkbox">
                    <input type="checkbox" value="${y}" data-filter="year"> ${y}
                </label>`;
        }
        // Add "Before" option
        yearCheckboxesHTML += `
            <label class="filter-checkbox">
                <input type="checkbox" value="<${currentYear - 4}" data-filter="year"> Trước ${currentYear - 4}
            </label>`;

        return `
            <div class="advanced-filters">
                <!-- Sort -->
                <div class="filter-group">
                    <label class="filter-label">Sắp xếp:</label>
                    <select id="sortSelect" class="filter-select">
                        <option value="newest">Mới nhất</option>
                        <option value="oldest">Cũ nhất</option>
                        <option value="imdb-desc">Điểm IMDB cao nhất</option>
                        <option value="imdb-asc">Điểm IMDB thấp nhất</option>
                        <option value="name-az">Tên A-Z</option>
                        <option value="name-za">Tên Z-A</option>
                        <option value="year-desc">Năm giảm dần</option>
                        <option value="year-asc">Năm tăng dần</option>
                    </select>
                </div>

                <!-- Type Filter -->
                <div class="filter-group">
                    <label class="filter-label">Loại phim:</label>
                    <div class="filter-checkboxes">
                        <label class="filter-checkbox">
                            <input type="checkbox" value="single" data-filter="type"> Phim lẻ
                        </label>
                        <label class="filter-checkbox">
                            <input type="checkbox" value="series" data-filter="type"> Phim bộ
                        </label>
                        <label class="filter-checkbox">
                            <input type="checkbox" value="hoathinh" data-filter="type"> Hoạt hình
                        </label>
                        <label class="filter-checkbox">
                            <input type="checkbox" value="tvshows" data-filter="type"> TV Shows
                        </label>
                        <label class="filter-checkbox">
                            <input type="checkbox" value="chieurap" data-filter="type"> Phim chiếu rạp
                        </label>
                    </div>
                </div>

                <!-- Year Filter -->
                <div class="filter-group">
                    <label class="filter-label">Năm:</label>
                    <div class="filter-checkboxes">
                        ${yearCheckboxesHTML}
                    </div>
                </div>

                <!-- Quality Filter -->
                <div class="filter-group">
                    <label class="filter-label">Chất lượng:</label>
                    <div class="filter-checkboxes">
                        <label class="filter-checkbox">
                            <input type="checkbox" value="HD" data-filter="quality"> HD
                        </label>
                        <label class="filter-checkbox">
                            <input type="checkbox" value="Full" data-filter="quality"> Full HD
                        </label>
                        <label class="filter-checkbox">
                            <input type="checkbox" value="CAM" data-filter="quality"> CAM
                        </label>
                         <label class="filter-checkbox">
                            <input type="checkbox" value="Trailer" data-filter="quality"> Trailer
                        </label>
                         <label class="filter-checkbox">
                            <input type="checkbox" value="Vietsub" data-filter="quality"> Vietsub
                        </label>
                         <label class="filter-checkbox">
                            <input type="checkbox" value="Thuyết Minh" data-filter="quality"> Thuyết Minh
                        </label>
                    </div>
                </div>

                <!-- Movie Count -->
                <div class="filter-group" style="margin-left: auto;">
                    <span id="movieCount" class="movie-count"></span>
                </div>
            </div>
        `;
    }

    setupFilterHandlers(container) {
        const updateFilters = () => {
            // Collect filter states
            const sort = document.getElementById('sortSelect').value;
            const types = Array.from(document.querySelectorAll('[data-filter="type"]:checked')).map(cb => cb.value);
            const years = Array.from(document.querySelectorAll('[data-filter="year"]:checked')).map(cb => cb.value);
            const qualities = Array.from(document.querySelectorAll('[data-filter="quality"]:checked')).map(cb => cb.value);

            this.currentData.filterConfig = { sort, types, years, qualities };

            // Re-render current page specific data
            this.renderFilteredMovies(container);
        };

        const sortSelect = document.getElementById('sortSelect');
        if (sortSelect) sortSelect.addEventListener('change', updateFilters);

        const checkboxes = document.querySelectorAll('[data-filter]');
        checkboxes.forEach(cb => cb.addEventListener('change', updateFilters));
    }

    // --- Core Data Fetching ---
    async fetchAndRenderPage(page, container) {
        container.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 40px;">
                <div class="skeleton" style="width: 200px; height: 200px; margin: 0 auto; border-radius: 12px;"></div>
                <p style="margin-top: 16px; color: var(--text-secondary);">Đang tải trang ${page}...</p>
            </div>
        `;

        // Fetch specific page
        const params = { page, ...this.currentData.extraParams };
        let url = this.currentData.endpoint;

        try {
            const data = await window.fetchAPI(url, params);

            if (!data) {
                throw new Error('No data');
            }

            // Normalize Data
            let movies = [];
            let totalPages = 1;

            if (data.items) {
                movies = data.items;
            } else if (data.data && data.data.items) {
                movies = data.data.items;
                const pagination = data.data.params?.pagination;
                if (pagination) {
                    totalPages = Math.ceil(pagination.totalItems / pagination.totalItemsPerPage);
                }
            }

            // Fallback for total pages if not provided (OPhim specific)
            if (data.data?.params?.pagination?.totalPages) {
                totalPages = data.data.params.pagination.totalPages;
            } else if (!totalPages && movies.length > 0) {
                totalPages = 100; // Unknown limit
            }

            this.currentData.movies = movies;
            this.currentData.currentPage = page;
            this.currentData.totalPages = totalPages;

            this.renderFilteredMovies(container);

        } catch (e) {
            container.innerHTML = '<div style="text-align: center; padding: 60px; color: var(--text-error);">Lỗi kết nối API. Vui lòng thử lại.</div>';
        }
    }

    // --- Rendering with Client-side Filter apply on Current Page Data ---
    // --- Rendering with Client-side Filter apply on Current Page Data ---
    renderFilteredMovies(container) {
        if (!container) container = document.getElementById('filteredMovies');
        if (!container) return;

        let displayMovies = [...this.currentData.movies];
        const { sort, types, years, qualities } = this.currentData.filterConfig;

        // 1. Client-side Filtering (on the 24 loaded items)
        if (types.length > 0) {
            displayMovies = displayMovies.filter(m => {
                const type = (m.type || '').toLowerCase(); // API type: single, series, hoathinh, tvshows
                const slug = (m.slug || '').toLowerCase();
                const isTheatrical = m.chieurap === true || m.chieurap === 'true' || slug.includes('chieu-rap') || (m.category || []).some(c => c.slug === 'phim-chieu-rap');

                return types.some(t => {
                    if (t === 'chieurap') return isTheatrical;
                    if (t === type) return true;
                    if (t === 'hoathinh' && slug.includes('hoat-hinh')) return true;
                    if (t === 'tvshows' && (slug.includes('tv-shows') || slug.includes('tvshow'))) return true;
                    if (t === 'single' && type === 'single') return true;
                    if (t === 'series' && type === 'series') return true;
                    return false;
                });
            });
        }

        if (years.length > 0) {
            displayMovies = displayMovies.filter(m => {
                const y = m.year;
                if (!y) return false;
                return years.some(cond => {
                    // Handle dynamic "Before X"
                    if (String(cond).startsWith('<')) {
                        const maxYear = parseInt(String(cond).substring(1));
                        return y < maxYear;
                    }
                    return y == cond;
                });
            });
        }

        if (qualities.length > 0) {
            displayMovies = displayMovies.filter(m => {
                const q = (m.quality || '').toLowerCase();
                // Some API providers put Vietsub/Thuyết Minh in lang field
                const lang = (m.lang || '').toLowerCase();

                return qualities.some(ql => {
                    const query = ql.toLowerCase();
                    return q.includes(query) || lang.includes(query);
                });
            });
        }

        // 2. Client-side Sorting
        switch (sort) {
            case 'oldest': displayMovies.reverse(); break;
            case 'imdb-desc':
                displayMovies.sort((a, b) => {
                    const scoreA = a.tmdb?.vote_average || a.vote_average || 0;
                    const scoreB = b.tmdb?.vote_average || b.vote_average || 0;
                    return scoreB - scoreA;
                });
                break;
            case 'imdb-asc':
                displayMovies.sort((a, b) => {
                    const scoreA = a.tmdb?.vote_average || a.vote_average || 0;
                    const scoreB = b.tmdb?.vote_average || b.vote_average || 0;
                    return scoreA - scoreB;
                });
                break;
            case 'name-az': displayMovies.sort((a, b) => (a.name || '').localeCompare(b.name || '')); break;
            case 'name-za': displayMovies.sort((a, b) => (b.name || '').localeCompare(a.name || '')); break;
            case 'year-desc': displayMovies.sort((a, b) => (b.year || 0) - (a.year || 0)); break;
            case 'year-asc': displayMovies.sort((a, b) => (a.year || 0) - (b.year || 0)); break;
        }

        // 3. Render Items
        container.innerHTML = '';
        if (displayMovies.length === 0) {
            container.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-secondary);">
                    <p>Không tìm thấy phim phù hợp trong trang này.</p>
                    <p style="font-size: 0.9em; margin-top: 8px;">Hãy thử chuyển sang trang tiếp theo hoặc lọc ít điều kiện hơn.</p>
                </div>
            `;
        } else {
            displayMovies.forEach(movie => {
                container.appendChild(window.createMovieCard(movie));
            });
        }

        // Update Count
        const countElement = document.getElementById('movieCount');
        if (countElement) {
            countElement.textContent = `Trang ${this.currentData.currentPage}: ${displayMovies.length} phim`;
        }

        // 4. Render Pagination Controls
        this.renderPagination(container);
    }

    renderPagination(container) {
        const { currentPage } = this.currentData;

        const controls = document.createElement('div');
        controls.className = 'pagination-controls';
        controls.style.gridColumn = '1/-1';

        controls.innerHTML = `
            <button class="pagination-btn" ${currentPage === 1 ? 'disabled' : ''} id="prevPageBtn">
                ← Trang trước
            </button>
            <span class="pagination-info">Trang ${currentPage}</span>
            <button class="pagination-btn" id="nextPageBtn">
                Trang sau →
            </button>
        `;

        container.appendChild(controls);

        // Bind events
        controls.querySelector('#prevPageBtn').onclick = () => {
            if (currentPage > 1) {
                this.fetchAndRenderPage(currentPage - 1, container);
                document.getElementById('filteredSection').scrollIntoView({ behavior: 'smooth' });
            }
        };
        controls.querySelector('#nextPageBtn').onclick = () => {
            this.fetchAndRenderPage(currentPage + 1, container);
            document.getElementById('filteredSection').scrollIntoView({ behavior: 'smooth' });
        };
    }

    async loadGenre(slug) {
        if (!slug) return;
        const name = window.state?.genres?.find(g => g.slug === slug)?.name || slug;
        await this.initFilteredPage('genre', slug, `Thể loại: ${name}`, `/v1/api/the-loai/${slug}`);
    }

    async loadCountry(slug) {
        if (!slug) return;
        const name = window.state?.countries?.find(c => c.slug === slug)?.name || slug;
        await this.initFilteredPage('country', slug, `Quốc gia: ${name}`, `/v1/api/quoc-gia/${slug}`);
    }

    async loadSearch(query) {
        if (!query) return;
        const decodedQuery = decodeURIComponent(query);
        await this.initFilteredPage('search', decodedQuery, `Tìm kiếm: ${decodedQuery}`, window.API_ENDPOINTS.search, { keyword: decodedQuery });
    }

    async initFilteredPage(type, slug, title, endpoint, extraParams = {}) {
        this.hideHomeSections();
        const filteredSection = document.getElementById('filteredSection');
        const sectionTitle = filteredSection?.querySelector('.section-title');
        const filteredTitle = document.getElementById('filteredTitle');
        const filteredMovies = document.getElementById('filteredMovies');

        if (!filteredSection || !filteredTitle || !filteredMovies) return;

        filteredSection.style.display = 'block';
        if (sectionTitle) sectionTitle.textContent = title;

        filteredTitle.innerHTML = this.createFilterControls();
        filteredMovies.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 40px;">
                <div class="skeleton" style="width: 200px; height: 200px; margin: 0 auto; border-radius: 12px;"></div>
                <p style="margin-top: 16px; color: var(--text-secondary);">Đang tải phim...</p>
            </div>
        `;
        filteredSection.scrollIntoView({ behavior: 'smooth' });

        // Reset state
        this.currentData = {
            ...this.currentData,
            type,
            slug,
            endpoint,
            extraParams,
            currentPage: 1,
            movies: []
        };

        this.setupFilterHandlers(filteredMovies);
        await this.fetchAndRenderPage(1, filteredMovies);
    }

    async searchByActor(name) {
        window.location.hash = `tim-kiem/${name}`;
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
    // Use filtered section
    const filteredSection = document.getElementById('filteredSection');
    const filteredTitle = document.getElementById('filteredTitle');
    const filteredMovies = document.getElementById('filteredMovies');

    if (!filteredSection || !filteredTitle || !filteredMovies) return;

    filteredSection.style.display = 'block';
    filteredTitle.textContent = `🎭 Phim của diễn viên: ${actorName}`;
    filteredMovies.innerHTML = '<div class="skeleton" style="width: 100%; height: 300px; border-radius: 12px;"></div>';

    // Scroll to filtered section
    filteredSection.scrollIntoView({ behavior: 'smooth' });

    // Search for movies
    const data = await window.fetchAPI(window.API_ENDPOINTS.search, { keyword: actorName });

    if (!data) {
        filteredMovies.innerHTML = `
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
    const filteredMoviesList = movies.filter(movie => {
        if (!movie.actor || !Array.isArray(movie.actor)) return false;
        return movie.actor.some(actor =>
            actor.toLowerCase().includes(actorName.toLowerCase())
        );
    });

    if (filteredMoviesList.length === 0) {
        filteredMovies.innerHTML = `
            <div style="text-align: center; padding: 60px; color: var(--text-secondary);">
                Không tìm thấy phim nào của diễn viên "${actorName}"
            </div>
        `;
        return;
    }

    // Display movies
    filteredMovies.innerHTML = '';
    filteredMoviesList.forEach(movie => {
        filteredMovies.appendChild(window.createMovieCard(movie));
    });
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
