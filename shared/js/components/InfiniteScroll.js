/**
 * Универсальный класс для бесконечного скролла
 * Не привязан к конкретному UI, только логика Observer'а.
 */
export class InfiniteScroll {
    /**
     * @param {String} sentinelId - ID HTML элемента, который служит триггером (якорь внизу страницы)
     * @param {Function} onReachBottom - Коллбэк функция (async/sync), вызываемая при скролле
     * @param {String} rootMargin - Отступ до срабатывания
     */
    constructor(sentinelId, onReachBottom, rootMargin = '200px') {
        this.sentinel = document.getElementById(sentinelId);
        this.onReachBottom = onReachBottom;
        this.observer = null;
        this.rootMargin = rootMargin;
    }

    start() {
        if (!this.sentinel) return;
        if (this.observer) this.observer.disconnect();

        this.observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                this.onReachBottom();
            }
        }, { rootMargin: this.rootMargin });

        this.observer.observe(this.sentinel);
    }

    stop() {
        if (this.observer) {
            this.observer.disconnect();
        }
    }
}