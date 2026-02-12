// Router and Advanced Search Features - Enhanced Version

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

        this.currentData = {
            type: null,
            slug: null,
            allMovies: [],
            filteredMovies: [],
            currentSort: 'newest',
            currentPage: 1,
            itemsPerPage: 20
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
        return `
            <div class="advanced-filters">
                <!-- Sort -->
                <div class="filter-group">
                    <label class="filter-label">Sắp xếp:</label>
                    <select id="sortSelect" class="filter-select">
                        <option value="newest">Mới nhất</option>
                        <option value="oldest">Cũ nhất</option>
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
                            <input type="checkbox" value="phim-le" data-filter="type"> Phim lẻ
                        </label>
                        <label class="filter-checkbox">
                            <input type="checkbox" value="phim-bo" data-filter="type"> Phim bộ
                        </label>
                        <label class="filter-checkbox">
                            <input type="checkbox" value="hoat-hinh" data-filter="type"> Hoạt hình
                        </label>
                    </div>
                </div>

                <!-- Year Filter -->
                <div class="filter-group">
                    <label class="filter-label">Năm:</label>
                    <div class="filter-checkboxes">
                        <label class="filter-checkbox">
                            <input type="checkbox" value="2024" data-filter="year"> 2024
                        </label>
                        <label class="filter-checkbox">
                            <input type="checkbox" value="2023" data-filter="year"> 2023
                        </label>
                        <label class="filter-checkbox">
                            <input type="checkbox" value="2022" data-filter="year"> 2022
                        </label>
                        <label class="filter-checkbox">
                            <input type="checkbox" value="2021" data-filter="year"> 2021
                        </label>
                        <label class="filter-checkbox">
                            <input type="checkbox" value="old" data-filter="year"> Trước 2021
                        </label>
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
                            <input type="checkbox" value="Full HD" data-filter="quality"> Full HD
                        </label>
                        <label class="filter-checkbox">
                            <input type="checkbox" value="CAM" data-filter="quality"> CAM
                        </label>
                        <label class="filter-checkbox">
                            <input type="checkbox" value="Trailer" data-filter="quality"> Trailer
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

    sortMovies(movies, sortType) {
        const sorted = [...movies];

        switch (sortType) {
            case 'newest':
                // API default order (modified time)
                return sorted;
            case 'oldest':
                return sorted.reverse();
            case 'name-az':
                return sorted.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
            case 'name-za':
                return sorted.sort((a, b) => (b.name || '').localeCompare(a.name || ''));
            case 'year-desc':
                return sorted.sort((a, b) => (b.year || 0) - (a.year || 0));
            case 'year-asc':
                return sorted.sort((a, b) => (a.year || 0) - (b.year || 0));
            default:
                return sorted;
        }
    }

    renderMovies(movies, container) {
        if (!container) return;

        container.innerHTML = '';

        if (movies.length === 0) {
            container.innerHTML = '<div style="text-align: center; padding: 60px; color: var(--text-secondary); grid-column: 1/-1;">Không có phim nào</div>';
            return;
        }

        // Calculate pagination
        const totalPages = Math.ceil(movies.length / this.currentData.itemsPerPage);
        const startIndex = (this.currentData.currentPage - 1) * this.currentData.itemsPerPage;
        const endIndex = startIndex + this.currentData.itemsPerPage;
        const currentPageMovies = movies.slice(startIndex, endIndex);

        // Render current page movies
        currentPageMovies.forEach(movie => {
            container.appendChild(window.createMovieCard(movie));
        });

        // Update count
        const countElement = document.getElementById('movieCount');
        if (countElement) {
            countElement.textContent = `Tổng: ${movies.length} phim`;
        }

        // Add pagination controls
        this.renderPaginationControls(container, totalPages, movies.length);
    }

    renderPaginationControls(container, totalPages, totalMovies) {
        if (totalPages <= 1) return; // No pagination needed for single page

        const paginationDiv = document.createElement('div');
        paginationDiv.className = 'pagination-controls';
        paginationDiv.style.gridColumn = '1/-1';

        let paginationHTML = '';

        // Previous button
        paginationHTML += `
            <button class="pagination-btn" ${this.currentData.currentPage === 1 ? 'disabled' : ''} onclick="router.goToPage(${this.currentData.currentPage - 1})">
                ← Trước
            </button>
        `;

        // Page numbers
        const maxVisiblePages = 5;
        let startPage = Math.max(1, this.currentData.currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        // First page
        if (startPage > 1) {
            paginationHTML += `
                <button class="pagination-btn" onclick="router.goToPage(1)">1</button>
            `;
            if (startPage > 2) {
                paginationHTML += '<span class="pagination-info">...</span>';
            }
        }

        // Page numbers
        for (let i = startPage; i <= endPage; i++) {
            paginationHTML += `
                <button class="pagination-btn ${i === this.currentData.currentPage ? 'active' : ''}" onclick="router.goToPage(${i})">
                    ${i}
                </button>
            `;
        }

        // Last page
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                paginationHTML += '<span class="pagination-info">...</span>';
            }
            paginationHTML += `
                <button class="pagination-btn" onclick="router.goToPage(${totalPages})">${totalPages}</button>
            `;
        }

        // Next button
        paginationHTML += `
            <button class="pagination-btn" ${this.currentData.currentPage === totalPages ? 'disabled' : ''} onclick="router.goToPage(${this.currentData.currentPage + 1})">
                Tiếp →
            </button>
        `;

        // Page info
        const startItem = (this.currentData.currentPage - 1) * this.currentData.itemsPerPage + 1;
        const endItem = Math.min(this.currentData.currentPage * this.currentData.itemsPerPage, totalMovies);
        paginationHTML += `
            <span class="pagination-info">${startItem}-${endItem} / ${totalMovies}</span>
        `;

        paginationDiv.innerHTML = paginationHTML;
        container.appendChild(paginationDiv);
    }

    goToPage(page) {
        this.currentData.currentPage = page;
        const filteredMovies = document.getElementById('filteredMovies');
        const sorted = this.sortMovies(this.currentData.allMovies, this.currentData.currentSort);
        this.renderMovies(sorted, filteredMovies);

        // Scroll to top of filtered section
        const filteredSection = document.getElementById('filteredSection');
        if (filteredSection) {
            filteredSection.scrollIntoView({ behavior: 'smooth' });
        }
    }

    async loadGenre(slug) {
        if (!slug) return;

        this.hideHomeSections();

        const genreName = window.state?.genres?.find(g => g.slug === slug)?.name || slug;

        // Show filtered section
        const filteredSection = document.getElementById('filteredSection');
        const sectionTitle = filteredSection?.querySelector('.section-title');
        const filteredTitle = document.getElementById('filteredTitle');
        const filteredMovies = document.getElementById('filteredMovies');

        if (!filteredSection || !filteredTitle || !filteredMovies) return;

        filteredSection.style.display = 'block';

        // Update section title
        if (sectionTitle) {
            sectionTitle.textContent = `Thể loại: ${genreName}`;
        }

        // Add filter controls
        filteredTitle.innerHTML = this.createFilterControls();

        filteredMovies.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 40px;">
                <div class="skeleton" style="width: 200px; height: 200px; margin: 0 auto; border-radius: 12px;"></div>
                <p style="margin-top: 16px; color: var(--text-secondary);">Đang tải phim...</p>
            </div>
        `;

        // Scroll to filtered section
        filteredSection.scrollIntoView({ behavior: 'smooth' });

        // Store current filter
        this.currentData.type = 'genre';
        this.currentData.slug = slug;
        this.currentData.currentPage = 1; // Reset to first page

        // Load all pages
        const allMovies = await this.loadAllPages(`/v1/api/the-loai/${slug}`);

        if (allMovies.length === 0) {
            filteredMovies.innerHTML = '<div style="text-align: center; padding: 60px; color: var(--text-secondary); grid-column: 1/-1;">Không có phim nào trong thể loại này</div>';
            return;
        }

        this.currentData.allMovies = allMovies;
        this.currentData.filteredMovies = allMovies;

        // Setup all filter handlers
        this.setupFilterHandlers(filteredMovies);

        // Initial render
        this.renderMovies(allMovies, filteredMovies);
    }

    setupFilterHandlers(container) {
        // Sort handler
        const sortSelect = document.getElementById('sortSelect');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                this.currentData.currentSort = e.target.value;
                this.currentData.currentPage = 1;
                this.applyAllFilters(container);
            });
        }

        // Checkbox filter handlers
        const checkboxes = document.querySelectorAll('[data-filter]');
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                this.currentData.currentPage = 1;
                this.applyAllFilters(container);
            });
        });
    }

    applyAllFilters(container) {
        let filtered = [...this.currentData.allMovies];

        // Apply type filter
        const typeCheckboxes = Array.from(document.querySelectorAll('[data-filter="type"]:checked'));
        if (typeCheckboxes.length > 0) {
            const selectedTypes = typeCheckboxes.map(cb => cb.value);
            filtered = filtered.filter(movie => {
                const movieType = movie.type || '';
                return selectedTypes.includes(movieType);
            });
        }

        // Apply year filter
        const yearCheckboxes = Array.from(document.querySelectorAll('[data-filter="year"]:checked'));
        if (yearCheckboxes.length > 0) {
            filtered = filtered.filter(movie => {
                const movieYear = movie.year;
                return yearCheckboxes.some(cb => {
                    if (cb.value === 'old') {
                        return movieYear < 2021;
                    }
                    return movieYear == cb.value;
                });
            });
        }

        // Apply quality filter
        const qualityCheckboxes = Array.from(document.querySelectorAll('[data-filter="quality"]:checked'));
        if (qualityCheckboxes.length > 0) {
            const selectedQualities = qualityCheckboxes.map(cb => cb.value);
            filtered = filtered.filter(movie => {
                const movieQuality = movie.quality || '';
                return selectedQualities.some(q => movieQuality.includes(q));
            });
        }

        // Apply sort
        const sorted = this.sortMovies(filtered, this.currentData.currentSort);

        // Render
        this.renderMovies(sorted, container);
    }

    async loadCountry(slug) {
        if (!slug) return;

        this.hideHomeSections();

        const countryName = window.state?.countries?.find(c => c.slug === slug)?.name || slug;

        // Show filtered section
        const filteredSection = document.getElementById('filteredSection');
        const sectionTitle = filteredSection?.querySelector('.section-title');
        const filteredTitle = document.getElementById('filteredTitle');
        const filteredMovies = document.getElementById('filteredMovies');

        if (!filteredSection || !filteredTitle || !filteredMovies) return;

        filteredSection.style.display = 'block';

        // Update section title
        if (sectionTitle) {
            sectionTitle.textContent = `Quốc gia: ${countryName}`;
        }

        // Add filter controls
        filteredTitle.innerHTML = this.createFilterControls();

        filteredMovies.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 40px;">
                <div class="skeleton" style="width: 200px; height: 200px; margin: 0 auto; border-radius: 12px;"></div>
                <p style="margin-top: 16px; color: var(--text-secondary);">Đang tải phim...</p>
            </div>
        `;

        // Scroll to filtered section
        filteredSection.scrollIntoView({ behavior: 'smooth' });

        // Store current filter
        this.currentData.type = 'country';
        this.currentData.slug = slug;
        this.currentData.currentPage = 1; // Reset to first page

        // Load all pages
        const allMovies = await this.loadAllPages(`/v1/api/quoc-gia/${slug}`);

        if (allMovies.length === 0) {
            filteredMovies.innerHTML = '<div style="text-align: center; padding: 60px; color: var(--text-secondary); grid-column: 1/-1;">Không có phim nào từ quốc gia này</div>';
            return;
        }

        this.currentData.allMovies = allMovies;
        this.currentData.filteredMovies = allMovies;

        // Setup all filter handlers
        this.setupFilterHandlers(filteredMovies);

        // Initial render
        this.renderMovies(allMovies, filteredMovies);
    }

    async loadAllPages(endpoint) {
        let allMovies = [];
        let page = 1;

        while (true) {
            const data = await window.fetchAPI(endpoint, { page });

            if (!data) break;

            let movies = [];
            if (data.items) {
                movies = data.items;
            } else if (data.data && data.data.items) {
                movies = data.data.items;
            }

            if (movies.length === 0) break;

            allMovies = [...allMovies, ...movies];

            // Check if there are more pages
            const pagination = data.data?.params?.pagination;
            if (pagination && page >= pagination.totalPages) {
                break;
            }

            page++;
        }

        return allMovies;
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
