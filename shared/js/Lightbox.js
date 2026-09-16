import { Icons } from './icons.js';

export class LightboxManager {
    constructor(lightboxId, imgId) {
        this.lightbox = document.getElementById(lightboxId);
        this.lightboxImg = document.getElementById(imgId);
        this.closeBtn = this.lightbox?.querySelector('.lightbox-close');
        
        if (this.closeBtn) this.closeBtn.innerHTML = Icons.close;

        // Контейнер для видео
        this.videoContainer = document.createElement('div');
        this.videoContainer.className = 'lightbox-video-wrapper';
        this.videoContainer.style.display = 'none';
        this.videoContainer.style.width = '90vw';
        this.videoContainer.style.maxWidth = '1000px';
        this.videoContainer.style.aspectRatio = '16 / 9';
        this.videoContainer.style.borderRadius = '12px';
        this.videoContainer.style.overflow = 'hidden';
        this.videoContainer.style.boxShadow = '0 25px 50px rgba(0, 0, 0, 0.5)';
        
        if (this.lightboxImg && this.lightboxImg.parentNode) {
            this.lightboxImg.parentNode.insertBefore(this.videoContainer, this.lightboxImg.nextSibling);
        }

        // Состояние галереи
        this.galleryUrls = [];
        this.currentIndex = 0;
        this.isVideoMode = false;

        this._injectGalleryUI();
        this.init();
    }

    _injectGalleryUI() {
        if (!this.lightbox) return;

        this.navLeft = document.createElement('button');
        this.navLeft.className = 'lightbox-arrow left';
        this.navLeft.innerHTML = Icons.gallery_prev;
        this.navLeft.style.display = 'none';

        this.navRight = document.createElement('button');
        this.navRight.className = 'lightbox-arrow right';
        this.navRight.innerHTML = Icons.gallery_next;
        this.navRight.style.display = 'none';

        this.thumbnailsWrapper = document.createElement('div');
        this.thumbnailsWrapper.className = 'lightbox-thumbnails';
        this.thumbnailsWrapper.style.display = 'none';

        this.lightbox.appendChild(this.navLeft);
        this.lightbox.appendChild(this.navRight);
        this.lightbox.appendChild(this.thumbnailsWrapper);

        this.navLeft.addEventListener('click', (e) => { e.stopPropagation(); this.prev(); });
        this.navRight.addEventListener('click', (e) => { e.stopPropagation(); this.next(); });
    }

    init() {
        if (!this.lightbox) return;

        // Закрытие по клику на фон
        this.lightbox.addEventListener('click', (e) => {
            if (e.target === this.lightbox) this.close();
        });
        
        // Управление с клавиатуры
        document.addEventListener('keydown', (e) => {
            if (!this.lightbox.classList.contains('active')) return;
            
            if (e.key === 'Escape') {
                e.preventDefault();
                this.close();
            } else if (e.key === 'ArrowLeft') {
                this.prev();
            } else if (e.key === 'ArrowRight') {
                this.next();
            }
        });
        
        if (this.closeBtn) {
            this.closeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.close();
            });
        }
    }

    /**
     * Открывает Лайтбокс.
     * @param {string|Array} src - URL картинки/видео ИЛИ массив URL картинок для галереи.
     * @param {boolean} isVideo - Если true, грузит как YouTube iframe.
     * @param {number} startIndex - Индекс картинки, если передана галерея.
     */
    open(src, isVideo = false, startIndex = 0) {
        this.isVideoMode = isVideo;

        if (isVideo) {
            this.galleryUrls = [];
            this.currentIndex = 0;
            
            this.lightboxImg.style.display = 'none';
            this.videoContainer.style.display = 'block';
            
            const videoId = this._extractYouTubeId(src);
            const embedUrl = videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0` : src;
            
            this.videoContainer.innerHTML = `<iframe width="100%" height="100%" src="${embedUrl}" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>`;
            
            this._updateGalleryUI();
        } else {
            this.videoContainer.style.display = 'none';
            this.videoContainer.innerHTML = '';
            this.lightboxImg.style.display = 'block';
            
            if (Array.isArray(src)) {
                this.galleryUrls = src;
                this.currentIndex = startIndex;
            } else {
                this.galleryUrls = [src];
                this.currentIndex = 0;
            }

            this._updateGalleryUI();
        }
        
        this.lightbox.showModal(); 
        void this.lightbox.offsetWidth;
        this.lightbox.classList.add('active');
    }

    _updateGalleryUI() {
        if (this.galleryUrls.length > 1 && !this.isVideoMode) {
            this.lightbox.setAttribute('data-has-gallery', 'true');
            this.navLeft.style.display = 'flex';
            this.navRight.style.display = 'flex';
            this.thumbnailsWrapper.style.display = 'flex';

            // Генерируем миниатюры
            this.thumbnailsWrapper.innerHTML = this.galleryUrls.map((url, i) => `
                <button class="lb-thumb ${i === this.currentIndex ? 'active' : ''}" data-index="${i}">
                    <img src="${url}" alt="thumb">
                </button>
            `).join('');

            // Вешаем слушатели на миниатюры
            this.thumbnailsWrapper.querySelectorAll('.lb-thumb').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.goTo(parseInt(btn.dataset.index));
                });
            });
            
            // Ставим главное фото
            this.lightboxImg.src = this.galleryUrls[this.currentIndex];
            
            // Плавно скроллим контейнер к активной миниатюре
            const activeThumb = this.thumbnailsWrapper.querySelector('.active');
            if (activeThumb) {
                const scrollLeft = activeThumb.offsetLeft - (this.thumbnailsWrapper.offsetWidth / 2) + (activeThumb.offsetWidth / 2);
                this.thumbnailsWrapper.scrollTo({ left: scrollLeft, behavior: 'smooth' });
            }
        } else {
            // Одиночный режим
            this.lightbox.removeAttribute('data-has-gallery');
            this.navLeft.style.display = 'none';
            this.navRight.style.display = 'none';
            this.thumbnailsWrapper.style.display = 'none';
            this.thumbnailsWrapper.innerHTML = '';
            
            if (!this.isVideoMode && this.galleryUrls.length > 0) {
                this.lightboxImg.src = this.galleryUrls[0];
            }
        }
    }

    next() {
        if (this.galleryUrls.length <= 1 || this.isVideoMode) return;
        this.currentIndex = (this.currentIndex + 1) % this.galleryUrls.length;
        this._updateGalleryUI();
    }

    prev() {
        if (this.galleryUrls.length <= 1 || this.isVideoMode) return;
        this.currentIndex = (this.currentIndex - 1 + this.galleryUrls.length) % this.galleryUrls.length;
        this._updateGalleryUI();
    }

    goTo(index) {
        if (this.galleryUrls.length <= 1 || this.isVideoMode) return;
        this.currentIndex = index;
        this._updateGalleryUI();
    }

    close() {
        this.lightbox.classList.remove('active');
        setTimeout(() => {
            this.lightbox.close();
            this.lightboxImg.src = ''; 
            this.videoContainer.innerHTML = ''; 
        }, 300);
    }

    _extractYouTubeId(url) {
        const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
        return match ? match[1] : null;
    }
}