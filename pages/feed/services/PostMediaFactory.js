import { Icons } from '../../../shared/js/icons.js';
import { VideoPlayerHelper } from '../../../shared/js/VideoPlayerHelper.js';

export class PostMediaFactory {
    constructor(lightboxManager) {
        this.lightbox = lightboxManager;
    }

    setupYouTubeEmbed(clone, post, rawText) {
        let ytId = null;
        const textMatch = rawText.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
        if (textMatch) ytId = textMatch[1];
        
        if (!ytId && post.linkCards && post.linkCards.length > 0) {
            const card = post.linkCards.find(c => c.url.includes('youtu'));
            if (card) {
                const cardMatch = card.url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
                if (cardMatch) ytId = cardMatch[1];
            }
        }

        if (ytId) {
            const container = clone.querySelector('.post-media-grid');
            container.style.display = 'block';
            container.className = 'post-media-container single-media';
            container.innerHTML = '';
            container.style.backgroundImage = `url('https://img.youtube.com/vi/${ytId}/hqdefault.jpg')`;

            const wrapper = document.createElement('div');
            wrapper.className = 'media-item video-thumb-wrapper';
            wrapper.innerHTML = `
                <img class="media-item img-media" src="https://img.youtube.com/vi/${ytId}/maxresdefault.jpg" onerror="this.src='https://img.youtube.com/vi/${ytId}/hqdefault.jpg'" loading="lazy" draggable="false">
                <div class="video-thumb-overlay"><div class="video-play-btn">${Icons.player_play}</div></div>
            `;
            wrapper.title = 'Смотреть видео';
            
            wrapper.addEventListener('click', (e) => {
                e.stopPropagation();
                this.lightbox.open(`https://youtu.be/${ytId}`, true); 
            });

            container.appendChild(wrapper);
            
            const cardsContainer = clone.querySelector('.post-cards-container');
            if (cardsContainer) cardsContainer.style.display = 'none';

            return true;
        }
        return false;
    }

    setupMedia(clone, post) {
        const container = clone.querySelector('.post-media-grid');
        
        if (!post.media || post.media.length === 0) {
            container.style.display = 'none';
            return;
        }

        const galleryUrls = post.media
            .filter(m => m.type === 'image' || (!m.type && !m.url.endsWith('.mp4') && !m.url.includes('youtube')))
            .map(m => m.url);

        container.style.display = 'block';
        container.innerHTML = ''; 
        container.style.backgroundImage = 'none'; 

        if (post.media.length === 1) {
            container.className = 'post-media-container single-media';
            if (post.media[0].url && post.media[0].type !== 'video' && !post.media[0].url.endsWith('.mp4')) {
                container.style.backgroundImage = `url('${post.media[0].url}')`;
            }
            container.appendChild(this._createMediaElement(post.media[0], post, galleryUrls));
        } else {
            container.className = 'post-media-container multi-media-slider';
            this._buildSlider(container, post.media, post, galleryUrls);
        }
    }

    setupCards(clone, post) {
        const cardsContainer = clone.querySelector('.post-cards-container');
        if (!post.linkCards || post.linkCards.length === 0) {
            cardsContainer.style.display = 'none';
            return;
        }
        
        cardsContainer.style.display = 'flex';
        post.linkCards.forEach(card => {
            const a = document.createElement('a');
            a.className = 'link-card';
            a.href = card.url;
            a.target = '_blank';
            a.rel = 'noopener noreferrer';
            a.innerHTML = `
                ${card.image ? `<img src="${card.image}" class="lc-image" alt="Cover" loading="lazy">` : ''}
                <div class="lc-content">
                    ${card.domain ? `<div class="lc-domain">${card.domain}</div>` : ''}
                    <div class="lc-title">${card.title}</div>
                    ${card.description ? `<div class="lc-desc">${card.description}</div>` : ''}
                </div>
            `;
            cardsContainer.appendChild(a);
        });
    }

    _buildSlider(container, mediaArray, post, galleryUrls = []) {
        const total = mediaArray.length;
        const counter = document.createElement('div');
        counter.className = 'media-slider-counter';
        counter.textContent = `1 / ${total}`;
        container.appendChild(counter);

        const track = document.createElement('div');
        track.className = 'media-slider-track';

        mediaArray.forEach(m => {
            const slide = document.createElement('div');
            slide.className = 'media-slide';
            if (m.url && m.type !== 'video' && !m.url.endsWith('.mp4')) {
                slide.style.backgroundImage = `url('${m.url}')`;
            }
            slide.appendChild(this._createMediaElement(m, post, galleryUrls));
            track.appendChild(slide);
        });

        container.appendChild(track);
    }

    _createMediaElement(m, post, galleryUrls = []) {
        if (m.type === 'video_thumb') {
            const wrapper = document.createElement('div');
            wrapper.className = 'media-item video-thumb-wrapper';
            
            const imgEl = document.createElement('img');
            imgEl.className = 'media-item img-media';
            imgEl.src = m.url;
            imgEl.loading = 'lazy';
            imgEl.draggable = false; 
            
            const overlay = document.createElement('div');
            overlay.className = 'video-thumb-overlay';
            overlay.innerHTML = `<div class="video-play-btn">${Icons.player_play}</div>`;
            
            wrapper.appendChild(imgEl);
            wrapper.appendChild(overlay);
            
            wrapper.title = 'Смотреть оригинальное видео в X (Twitter)';
            wrapper.addEventListener('click', (e) => {
                e.stopPropagation();
                const cleanHandle = (post.authorHandle || '').replace('@', '');
                const cleanId = post.id.split('#')[0]; 
                window.open(`https://twitter.com/${cleanHandle}/status/${cleanId}`, '_blank', 'noopener,noreferrer');
            });
            return wrapper;
        } 
        else if (m.type === 'video' || m.type === 'gif' || m.url.endsWith('.mp4')) {
            const wrapper = document.createElement('div');
            wrapper.className = 'media-item custom-video-wrapper'; // Используем наш класс
            wrapper.style.width = '100%';
            wrapper.style.height = '100%';
            
            const videoEl = document.createElement('video');
            videoEl.src = m.url;
            videoEl.playsInline = true;
            videoEl.preload = 'metadata';
            
            if (m.type === 'gif') {
                videoEl.autoplay = true; videoEl.loop = true; videoEl.muted = true;
                wrapper.appendChild(videoEl);
            } else {
                wrapper.appendChild(videoEl);
                VideoPlayerHelper.setup(wrapper); // Инициализация кастомного плеера
            }
            
            wrapper.addEventListener('click', (e) => e.stopPropagation()); 
            return wrapper;
        } 
        else {
            const imgEl = document.createElement('img');
            imgEl.className = 'media-item img-media';
            imgEl.src = m.url;
            imgEl.loading = 'lazy';
            imgEl.title = 'Нажмите для увеличения';
            imgEl.draggable = false; 
            imgEl.addEventListener('click', (e) => {
                e.stopPropagation();
                if (galleryUrls && galleryUrls.length > 1) {
                    const idx = galleryUrls.indexOf(m.url);
                    this.lightbox.open(galleryUrls, false, idx > -1 ? idx : 0);
                } else {
                    this.lightbox.open(m.url);
                }
            });
            imgEl.onerror = () => imgEl.style.display = 'none';
            return imgEl;
        }
    }
}