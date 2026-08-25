import { SiteHeader } from '../../shared/js/components/SiteHeader.js';
import { LibraryModel } from './LibraryModel.js';
import { GameCardView } from './views/GameCardView.js';
import { LibraryController } from './LibraryController.js';

customElements.define('site-header', SiteHeader);

document.addEventListener('DOMContentLoaded', () => {
    const model = new LibraryModel();
    const cardView = new GameCardView('game-card-template');
    const controller = new LibraryController(model, cardView);
    controller.init();
});