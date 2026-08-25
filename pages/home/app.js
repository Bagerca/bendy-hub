import { SiteHeader } from '../../shared/js/components/SiteHeader.js';
import { HomeModel } from './HomeModel.js';
import { HomeView } from './HomeView.js';
import { HomeController } from './HomeController.js';

// Инициализируем общую шапку сайта
customElements.define('site-header', SiteHeader);

document.addEventListener('DOMContentLoaded', () => {
    // Подключаем MVC архитектуру для загрузки JSON
    const model = new HomeModel();
    const view = new HomeView();
    const controller = new HomeController(model, view);

    // Запуск контроллера
    controller.init();
});