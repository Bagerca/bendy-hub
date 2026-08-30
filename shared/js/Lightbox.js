import { Icons } from './icons.js';

export class LightboxManager {
    constructor(lightboxId, imgId) {
        this.lightbox = document.getElementById(lightboxId);
        this.lightboxImg = document.getElementById(imgId);
        this.closeBtn = this.lightbox?.querySelector('.lightbox-close');
        
        // Применяем глобальную иконку закрытия
        if (this.closeBtn) this.closeBtn.innerHTML = Icons.close;

        // Создаем контейнер для видео (если его еще нет)
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

        this.init();
    }

    init() {
        if (!this.lightbox) return;

        this.lightbox.addEventListener('click', (e) => {
            if (e.target === this.lightbox) this.close();
        });
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.lightbox.classList.contains('active')) {
                e.preventDefault();
                this.close();
            }
        });
        
        if (this.closeBtn) {
            this.closeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.close();
            });
        }
    }

    open(src, isVideo = false) {
        if (isVideo) {
            // Режим видео (YouTube iframe)
            this.lightboxImg.style.display = 'none';
            this.videoContainer.style.display = 'block';
            
            // Превращаем обычную ссылку ютуба в embed
            const videoId = this._extractYouTubeId(src);
            const embedUrl = videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0` : src;
            
            this.videoContainer.innerHTML = `<iframe width="100%" height="100%" src="${embedUrl}" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>`;
        } else {
            // Режим картинки
            this.videoContainer.style.display = 'none';
            this.videoContainer.innerHTML = '';
            this.lightboxImg.style.display = 'block';
            this.lightboxImg.src = src;
        }
        
        this.lightbox.showModal(); 
        void this.lightbox.offsetWidth;
        this.lightbox.classList.add('active');
    }

    close() {
        this.lightbox.classList.remove('active');
        setTimeout(() => {
            this.lightbox.close();
            this.lightboxImg.src = ''; 
            this.videoContainer.innerHTML = ''; // Убиваем iframe, чтобы звук видео остановился
        }, 300);
    }

    _extractYouTubeId(url) {
        const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
        return match ? match[1] : null;
    }
}