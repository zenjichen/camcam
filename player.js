// Enhanced Player with HLS.js Support, Server Selector and Episode List
// This file extends the main app.js with advanced player features

// Override the playEpisode function with enhanced version
window.playEpisode = (embedUrl, episodeName, serverIndex = 0, episodeIndex = 0) => {
    const elements = {
        movieModal: document.getElementById('movieModal'),
        playerModal: document.getElementById('playerModal'),
        playerContainer: document.getElementById('playerContainer')
    };

    elements.movieModal.classList.remove('active');
    elements.playerModal.classList.add('active');

    const movie = window.state?.currentMovie;

    // Debug logging
    console.log('Player - Current Movie:', movie);
    console.log('Player - Episodes:', movie?.episodes);

    // Validate movie data
    if (!movie) {
        elements.playerContainer.innerHTML = `
            <div class="player-error">
                <p>Không tìm thấy thông tin phim. Vui lòng thử lại.</p>
                <button onclick="closePlayer()" class="btn btn-primary">Đóng</button>
            </div>
        `;
        return;
    }

    if (!movie.episodes || !Array.isArray(movie.episodes) || movie.episodes.length === 0) {
        elements.playerContainer.innerHTML = `
            <div class="player-error">
                <p>Phim này chưa có tập nào để xem.</p>
                <p style="font-size: 0.9rem; color: var(--text-secondary); margin-top: 10px;">
                    Vui lòng thử lại sau hoặc chọn phim khác.
                </p>
                <button onclick="closePlayer()" class="btn btn-primary" style="margin-top: 20px;">Đóng</button>
            </div>
        `;
        return;
    }

    // Validate server index
    if (!movie.episodes[serverIndex]) {
        console.error('Invalid server index:', serverIndex);
        serverIndex = 0;
    }

    const currentServer = movie.episodes[serverIndex];

    // Validate server data
    if (!currentServer.server_data || !Array.isArray(currentServer.server_data) || currentServer.server_data.length === 0) {
        elements.playerContainer.innerHTML = `
            <div class="player-error">
                <p>Server này không có dữ liệu phim.</p>
                <button onclick="closePlayer()" class="btn btn-primary" style="margin-top: 20px;">Đóng</button>
            </div>
        `;
        return;
    }

    // Validate episode index
    if (episodeIndex >= currentServer.server_data.length) {
        episodeIndex = 0;
    }

    const currentEpisode = currentServer.server_data[episodeIndex];
    const m3u8Url = currentEpisode.link_m3u8;
    const actualEmbedUrl = currentEpisode.link_embed || embedUrl;

    console.log('Player - m3u8 URL:', m3u8Url);
    console.log('Player - Embed URL:', actualEmbedUrl);

    // Build server tabs
    const serverTabs = movie.episodes.map((server, idx) => `
        <button class="server-tab ${idx === serverIndex ? 'active' : ''}" 
                onclick="switchServer(${idx}, 0)"
                title="${server.server_name}">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20 13H4c-.55 0-1 .45-1 1v6c0 .55.45 1 1 1h16c.55 0 1-.45 1-1v-6c0-.55-.45-1-1-1zM7 19c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zM20 3H4c-.55 0-1 .45-1 1v6c0 .55.45 1 1 1h16c.55 0 1-.45 1-1V4c0-.55-.45-1-1-1zM7 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/>
            </svg>
            ${server.server_name}
        </button>
    `).join('');

    // Build episode list for current server
    const episodeList = currentServer.server_data.map((ep, idx) => `
        <button class="episode-item ${idx === episodeIndex ? 'active' : ''}" 
                onclick="switchEpisode(${serverIndex}, ${idx})"
                title="Xem ${ep.name}">
            ${ep.name}
        </button>
    `).join('');

    // Calculate episode navigation
    const totalEpisodes = currentServer.server_data.length;
    const hasPrev = episodeIndex > 0;
    const hasNext = episodeIndex < totalEpisodes - 1;

    // Determine player type: prefer m3u8, fallback to embed
    let videoHTML;
    if (m3u8Url && m3u8Url.trim() !== '') {
        // Use HLS.js player with native video element
        videoHTML = `
            <div class="video-container" id="videoPlayerContainer">
                <video id="hlsVideoPlayer" controls autoplay playsinline 
                       style="width:100%;height:100%;position:absolute;top:0;left:0;background:#000;">
                    Your browser does not support the video tag.
                </video>
                <div id="playerLoading" class="player-loading">
                    <div class="loading-spinner"></div>
                    <p>Đang tải phim...</p>
                </div>
            </div>
        `;
    } else {
        // Fallback to iframe embed
        videoHTML = `
            <div class="video-container">
                <iframe 
                    src="${actualEmbedUrl}" 
                    allowfullscreen 
                    allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                    frameborder="0"
                    scrolling="no">
                </iframe>
            </div>
        `;
    }

    // Player mode toggle buttons
    const playerModeHTML = (m3u8Url && m3u8Url.trim() !== '') ? `
        <div class="player-mode-toggle">
            <button class="mode-btn active" id="hlsMode" onclick="setPlayerMode('hls', ${serverIndex}, ${episodeIndex})">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M21 3H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H3V5h18v14zM10 8v8l5-4z"/>
                </svg>
                HLS Player
            </button>
            <button class="mode-btn" id="embedMode" onclick="setPlayerMode('embed', ${serverIndex}, ${episodeIndex})">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 4H5a2 2 0 00-2 2v12a2 2 0 002 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H5V8h14v12z"/>
                </svg>
                Embed Player
            </button>
        </div>
    ` : '';

    elements.playerContainer.innerHTML = `
        <div class="player-wrapper">
            <div class="player-header">
                <div class="player-title">
                    <h3>${movie.name}</h3>
                    <span class="episode-badge">${episodeName}</span>
                </div>
                <button class="close-player" onclick="closePlayer()" title="Đóng">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                    </svg>
                </button>
            </div>
            
            ${videoHTML}
            ${playerModeHTML}
            
            <div class="player-controls">
                <button class="control-btn" ${!hasPrev ? 'disabled' : ''} 
                        onclick="${hasPrev ? `switchEpisode(${serverIndex}, ${episodeIndex - 1})` : 'return false'}"
                        title="Tập trước">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/>
                    </svg>
                    Tập trước
                </button>
                
                <div class="episode-info">
                    <span>Tập ${episodeIndex + 1}/${totalEpisodes}</span>
                </div>
                
                <button class="control-btn" ${!hasNext ? 'disabled' : ''}
                        onclick="${hasNext ? `switchEpisode(${serverIndex}, ${episodeIndex + 1})` : 'return false'}"
                        title="Tập sau">
                    Tập sau
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M16 18h2V6h-2zm-11-6l8.5-6v12z"/>
                    </svg>
                </button>
            </div>
            
            <div class="server-selector">
                <h4>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M20 13H4c-.55 0-1 .45-1 1v6c0 .55.45 1 1 1h16c.55 0 1-.45 1-1v-6c0-.55-.45-1-1-1zM7 19c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zM20 3H4c-.55 0-1 .45-1 1v6c0 .55.45 1 1 1h16c.55 0 1-.45 1-1V4c0-.55-.45-1-1-1zM7 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/>
                    </svg>
                    Chọn Server
                </h4>
                <div class="server-tabs">${serverTabs}</div>
            </div>
            
            <div class="episode-selector">
                <h4>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-1 9H9V9h10v2zm-4 4H9v-2h6v2zm4-8H9V5h10v2z"/>
                    </svg>
                    Danh sách tập (${totalEpisodes} tập)
                </h4>
                <div class="episode-grid">${episodeList}</div>
            </div>
            
            <div class="player-info">
                <div class="info-item">
                    <strong>Server:</strong> ${currentServer.server_name}
                </div>
                <div class="info-item">
                    <strong>Tập hiện tại:</strong> ${episodeName}
                </div>
                <div class="info-item">
                    <strong>Chất lượng:</strong> ${movie.quality || 'HD'}
                </div>
                <div class="info-item">
                    <strong>Ngôn ngữ:</strong> ${movie.lang || 'Vietsub'}
                </div>
            </div>
        </div>
    `;

    // Initialize HLS player if using m3u8
    if (m3u8Url && m3u8Url.trim() !== '') {
        initHLSPlayer(m3u8Url);
    }

    // Scroll to top of player
    elements.playerModal.scrollTop = 0;
};

// Initialize HLS.js player
function initHLSPlayer(m3u8Url) {
    const video = document.getElementById('hlsVideoPlayer');
    const loading = document.getElementById('playerLoading');

    if (!video) {
        console.error('Video element not found');
        return;
    }

    // Check if HLS.js is loaded
    if (typeof Hls !== 'undefined') {
        if (Hls.isSupported()) {
            const hls = new Hls({
                maxBufferLength: 30,
                maxMaxBufferLength: 60,
                startLevel: -1, // Auto quality
            });

            hls.loadSource(m3u8Url);
            hls.attachMedia(video);

            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                console.log('HLS manifest loaded, starting playback');
                if (loading) loading.style.display = 'none';
                video.play().catch(e => {
                    console.log('Autoplay blocked:', e);
                    if (loading) loading.style.display = 'none';
                });
            });

            hls.on(Hls.Events.ERROR, (event, data) => {
                console.error('HLS Error:', data);
                if (data.fatal) {
                    switch (data.type) {
                        case Hls.ErrorTypes.NETWORK_ERROR:
                            console.log('Network error, trying to recover...');
                            hls.startLoad();
                            break;
                        case Hls.ErrorTypes.MEDIA_ERROR:
                            console.log('Media error, trying to recover...');
                            hls.recoverMediaError();
                            break;
                        default:
                            console.error('Fatal HLS error, falling back to embed');
                            hls.destroy();
                            fallbackToEmbed();
                            break;
                    }
                }
            });

            // Store hls instance for cleanup
            window._currentHls = hls;
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            // Native HLS support (Safari)
            video.src = m3u8Url;
            video.addEventListener('loadedmetadata', () => {
                if (loading) loading.style.display = 'none';
                video.play().catch(() => { });
            });
        }
    } else {
        // HLS.js not loaded yet, load it dynamically
        console.log('Loading HLS.js dynamically...');
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/hls.js@latest';
        script.onload = () => {
            console.log('HLS.js loaded successfully');
            initHLSPlayer(m3u8Url);
        };
        script.onerror = () => {
            console.error('Failed to load HLS.js, falling back to embed');
            fallbackToEmbed();
        };
        document.head.appendChild(script);
    }
}

// Fallback to embed player
function fallbackToEmbed() {
    const movie = window.state?.currentMovie;
    if (!movie) return;

    const container = document.getElementById('videoPlayerContainer');
    if (!container) return;

    // Get current episode embed URL from data attributes or movie data
    const serverIndex = parseInt(container.dataset.serverIndex || '0');
    const episodeIndex = parseInt(container.dataset.episodeIndex || '0');

    let embedUrl = '';
    if (movie.episodes && movie.episodes[serverIndex] && movie.episodes[serverIndex].server_data[episodeIndex]) {
        embedUrl = movie.episodes[serverIndex].server_data[episodeIndex].link_embed;
    }

    if (embedUrl) {
        container.innerHTML = `
            <iframe 
                src="${embedUrl}" 
                allowfullscreen 
                allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                frameborder="0"
                scrolling="no"
                style="position:absolute;top:0;left:0;width:100%;height:100%;border:none;">
            </iframe>
        `;
    }
}

// Set player mode (HLS or Embed)
window.setPlayerMode = (mode, serverIndex, episodeIndex) => {
    const movie = window.state?.currentMovie;
    if (!movie) return;

    const ep = movie.episodes[serverIndex]?.server_data[episodeIndex];
    if (!ep) return;

    const container = document.getElementById('videoPlayerContainer');
    if (!container) return;

    // Cleanup existing HLS
    if (window._currentHls) {
        window._currentHls.destroy();
        window._currentHls = null;
    }

    // Update mode buttons
    document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active'));

    if (mode === 'hls' && ep.link_m3u8) {
        document.getElementById('hlsMode')?.classList.add('active');
        container.innerHTML = `
            <video id="hlsVideoPlayer" controls autoplay playsinline 
                   style="width:100%;height:100%;position:absolute;top:0;left:0;background:#000;">
                Your browser does not support the video tag.
            </video>
            <div id="playerLoading" class="player-loading">
                <div class="loading-spinner"></div>
                <p>Đang tải phim...</p>
            </div>
        `;
        initHLSPlayer(ep.link_m3u8);
    } else {
        document.getElementById('embedMode')?.classList.add('active');
        container.innerHTML = `
            <iframe 
                src="${ep.link_embed}" 
                allowfullscreen 
                allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                frameborder="0"
                scrolling="no"
                style="position:absolute;top:0;left:0;width:100%;height:100%;border:none;">
            </iframe>
        `;
    }
};

// Switch Episode function
window.switchEpisode = (serverIndex, episodeIndex) => {
    const movie = window.state?.currentMovie;
    if (!movie || !movie.episodes || !movie.episodes[serverIndex]) {
        console.error('Invalid server index');
        return;
    }

    const server = movie.episodes[serverIndex];
    if (!server.server_data || !server.server_data[episodeIndex]) {
        console.error('Invalid episode index');
        return;
    }

    // Cleanup existing HLS
    if (window._currentHls) {
        window._currentHls.destroy();
        window._currentHls = null;
    }

    const episode = server.server_data[episodeIndex];
    playEpisode(episode.link_embed, episode.name, serverIndex, episodeIndex);
};

// Switch Server function
window.switchServer = (serverIndex, episodeIndex = 0) => {
    const movie = window.state?.currentMovie;
    if (!movie || !movie.episodes || !movie.episodes[serverIndex]) {
        console.error('Invalid server index');
        return;
    }

    const server = movie.episodes[serverIndex];
    if (!server.server_data || !server.server_data[episodeIndex]) {
        console.error('Invalid episode index');
        return;
    }

    // Cleanup existing HLS
    if (window._currentHls) {
        window._currentHls.destroy();
        window._currentHls = null;
    }

    const episode = server.server_data[episodeIndex];
    playEpisode(episode.link_embed, episode.name, serverIndex, episodeIndex);
};

// Close Player function
window.closePlayer = () => {
    // Cleanup HLS
    if (window._currentHls) {
        window._currentHls.destroy();
        window._currentHls = null;
    }

    // Pause any playing video
    const video = document.getElementById('hlsVideoPlayer');
    if (video) {
        video.pause();
        video.src = '';
    }

    const playerModal = document.getElementById('playerModal');
    const movieModal = document.getElementById('movieModal');

    playerModal.classList.remove('active');
    movieModal.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Clear player container
    document.getElementById('playerContainer').innerHTML = '';
};

console.log('Enhanced player with HLS.js support loaded successfully');
