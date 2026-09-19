// FILE: pages/project/renderers/GalleryRenderer.js

import { Icons } from '../../../shared/js/icons.js';
import { VideoPlayerHelper } from '../../../shared/js/VideoPlayerHelper.js';

export class GalleryRenderer {
    constructor(lightboxManager, baseAssetPath, containerElement) {
        this.lightbox = lightboxManager;
        this.baseAssetPath = baseAssetPath;
        this.container = containerElement;
    }

    render(assets, projectId) {
        this.container.innerHTML = '';
        const mediaItems = [];

        // 1. Собираем видео
        if (assets.videos && assets.videos.length > 0) {
            assets.videos.forEach(url => {
                if (url === '...') return;
                
                const ytId = this._extractYouTubeId(url);
                if (ytId) {
                    mediaItems.push({
                        type: 'youtube',
                        src: `https://www.youtube.com/embed/${ytId}?rel=0`, 
                        thumb: `https://img.youtube.com/vi/${ytId}/mqdefault.jpg`
                    });
                } else if (url.match(/\.(mp4|webm|ogg)$/i)) {
                    const basePath = `${this.baseAssetPath}${projectId}/`;
                    const fileName = url.substring(0, url.lastIndexOf('.')) || url;
                    
                    mediaItems.push({
                        type: 'local_video',
                        src: `${basePath}${url}`, 
                        thumb: `${basePath}${fileName}.jpg`, 
                        fallbackThumb: `${basePath}${fileName}.png` 
                    });
                }
            });
        }

        // 2. Собираем скриншоты
        if (assets.screenshots && assets.screenshots.length > 0) {
            assets.screenshots.forEach(src => {
                if (src === '...') return;
                const fullUrl = `${this.baseAssetPath}${projectId}/${src}`;
                mediaItems.push({ type: 'image', src: fullUrl, thumb: fullUrl });
            });
        }

        // 3. Проверка на пустоту
        if (mediaItems.length === 0) {
            this.container.style.display = 'none';
            return;
        } else {
            this.container.style.display = 'block';
        }

        // 4. Генерация HTML каркаса галереи
        const galleryHtml = `
            <div class="media-gallery">
                <div class="gallery-main-view" id="gallery-main-view"></div>
                
                ${mediaItems.length > 1 ? `
                <div class="gallery-nav">
                    <button class="gallery-arrow left" id="gallery-prev" aria-label="Назад">${Icons.gallery_prev}</button>
                    
                    <div class="gallery-thumbnails" id="gallery-thumbnails">
                        ${mediaItems.map((item, idx) => {
                            let thumbHtml = '';
                            if (item.type === 'local_video') {
                                thumbHtml = `<img src="${item.thumb}" alt="Thumbnail" loading="lazy" 
                                              onerror="if(this.getAttribute('data-fallback')!=='true'){ this.setAttribute('data-fallback', 'true'); this.src='${item.fallbackThumb}'; } else { this.style.display='none'; this.nextElementSibling.style.display='block'; }">
                                             <div class="local-vid-fallback" style="display: none; width: 100%; height: 100%; background: linear-gradient(135deg, var(--bg-body) 0%, var(--bg-card) 100%);"></div>`;
                            } else if (item.thumb) {
                                thumbHtml = `<img src="${item.thumb}" alt="Thumbnail" loading="lazy">`;
                            } else {
                                thumbHtml = `<div style="width: 100%; height: 100%; background: linear-gradient(135deg, var(--bg-body) 0%, var(--bg-card) 100%);"></div>`;
                            }

                            return `
                            <button class="gallery-thumb-btn ${idx === 0 ? 'active' : ''}" data-index="${idx}">
                                ${thumbHtml}
                                ${(item.type === 'youtube' || item.type === 'local_video') ? `<div class="play-indicator">${Icons.player_play}</div>` : ''}
                            </button>
                            `;
                        }).join('')}
                    </div>
                    
                    <button class="gallery-arrow right" id="gallery-next" aria-label="Вперед">${Icons.gallery_next}</button>
                </div>
                ` : ''}
            </div>
        `;

        this.container.innerHTML = galleryHtml;
        this._bindEvents(mediaItems);
    }

    _bindEvents(mediaItems) {
        let currentIndex = 0;
        const mainView = document.getElementById('gallery-main-view');
        const thumbnailsWrapper = document.getElementById('gallery-thumbnails');
        const thumbs = document.querySelectorAll('.gallery-thumb-btn');

        const updateMainView = (index) => {
            const item = mediaItems[index];
            
            if (item.type === 'image') {
                mainView.innerHTML = `<img src="${item.src}" alt="Screenshot" class="gallery-main-img">`;
                const imgEl = mainView.querySelector('.gallery-main-img');
                
                const imageItems = mediaItems.filter(m => m.type === 'image');
                const imageUrls = imageItems.map(m => m.src);
                const clickedIndex = imageUrls.indexOf(item.src);
                
                imgEl.onclick = () => {
                    if (imageUrls.length > 1) {
                        this.lightbox.open(imageUrls, false, clickedIndex);
                    } else {
                        this.lightbox.open(item.src);
                    }
                };
            } 
            else if (item.type === 'youtube') {
                mainView.innerHTML = `
                    <div class="video-wrapper">
                        <iframe src="${item.src}" title="YouTube video" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
                    </div>
                `;
            }
            else if (item.type === 'local_video') {
                mainView.innerHTML = `
                    <div class="custom-video-wrapper">
                        <video src="${item.src}" poster="${item.thumb}" preload="metadata" playsinline></video>
                    </div>
                `;
                VideoPlayerHelper.setup(mainView.querySelector('.custom-video-wrapper'));
                
                const videoEl = mainView.querySelector('video');
                const imgTest = new Image();
                imgTest.onerror = () => { videoEl.setAttribute('poster', item.fallbackThumb); };
                imgTest.src = item.thumb;
            }

            if (thumbs.length > 0) {
                thumbs.forEach(t => t.classList.remove('active'));
                const activeThumb = thumbs[index];
                activeThumb.classList.add('active');
                
                if (thumbnailsWrapper) {
                    activeThumb.scrollIntoView({ 
                        behavior: 'smooth', 
                        block: 'nearest', 
                        inline: 'center' 
                    });
                }
            }
        };

        if (mediaItems.length > 1) {
            document.getElementById('gallery-prev').addEventListener('click', () => {
                currentIndex = currentIndex === 0 ? mediaItems.length - 1 : currentIndex - 1;
                updateMainView(currentIndex);
            });

            document.getElementById('gallery-next').addEventListener('click', () => {
                currentIndex = currentIndex === mediaItems.length - 1 ? 0 : currentIndex + 1;
                updateMainView(currentIndex);
            });

            thumbs.forEach(thumb => {
                thumb.addEventListener('click', () => {
                    currentIndex = parseInt(thumb.dataset.index);
                    updateMainView(currentIndex);
                });
            });
        }

        updateMainView(0);
    }

    _extractYouTubeId(url) {
        const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
        return match ? match[1] : null;
    }
}