import { SiteHeader } from '../../shared/js/components/SiteHeader.js';

// Регистрируем веб-компонент шапки
customElements.define('site-header', SiteHeader);

document.addEventListener('DOMContentLoaded', () => {
    // В будущем здесь можно добавить логику (например, выводить статистику: "В базе 50 персонажей и 12 игр")
    // Но пока страница статичная и красивая.
});