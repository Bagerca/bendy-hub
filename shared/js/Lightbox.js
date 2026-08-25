export class LightboxManager {
    constructor(lightboxId, imgId) {
        this.lightbox = document.getElementById(lightboxId);
        this.lightboxImg = document.getElementById(imgId);
        
        // Кнопка закрытия
        this.closeBtn = this.lightbox?.querySelector('.lightbox-close');
        
        this.init();
    }

    init() {
        if (!this.lightbox) return;

        // Закрытие по клику на фон (всё, что не является картинкой)
        this.lightbox.addEventListener('click', (e) => {
            if (e.target !== this.lightboxImg) this.close();
        });
        
        // Закрытие по клавише Esc
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.lightbox.classList.contains('active')) {
                // Предотвращаем дефолтное закрытие <dialog>, чтобы проиграть нашу CSS анимацию
                e.preventDefault();
                this.close();
            }
        });
        
        // Закрытие по крестику
        if (this.closeBtn) {
            this.closeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.close();
            });
        }
    }

    open(imgSrc) {
        this.lightboxImg.src = imgSrc;
        
        // Открываем диалог (мгновенно, без анимации)
        this.lightbox.showModal(); 
        
        // Принудительный reflow браузера, чтобы CSS-транзиция сработала
        // без этого браузер попытается анимировать от display:none, что сломает плавность
        void this.lightbox.offsetWidth;
        
        // Добавляем класс, запускающий CSS-анимацию
        this.lightbox.classList.add('active');
    }

    close() {
        // Убираем класс (запускается CSS анимация исчезновения)
        this.lightbox.classList.remove('active');
        
        // Ждем ровно столько, сколько длится CSS анимация (0.3s = 300ms)
        setTimeout(() => {
            this.lightbox.close();
            this.lightboxImg.src = ''; // Очищаем источник, чтобы не мигал при следующем открытии
        }, 300);
    }
}