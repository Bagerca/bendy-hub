import { SiteHeader } from '../../shared/js/components/SiteHeader.js';
import { LightboxManager } from '../../shared/js/Lightbox.js';

// Прямые импорты из ЭТОЙ ЖЕ папки
import { GameModel } from './GameModel.js';
import { HeroView } from './HeroView.js';
import { WikiView } from './WikiView.js';
import { GameController } from './GameController.js';

customElements.define('site-header', SiteHeader);

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const gameId = urlParams.get('id');

    const lightbox = new LightboxManager('lightbox', 'lightbox-img');
    
    const model = new GameModel();
    const heroView = new HeroView();
    const wikiView = new WikiView(lightbox);
    
    const controller = new GameController(model, heroView, wikiView);
    controller.init(gameId);
});