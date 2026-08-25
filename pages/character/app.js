import { SiteHeader } from '../../shared/js/components/SiteHeader.js';
import { CharacterModel } from './CharacterModel.js';
import { CharacterView } from './CharacterView.js';
import { CharacterController } from './CharacterController.js';

customElements.define('site-header', SiteHeader);

document.addEventListener('DOMContentLoaded', () => {
    const model = new CharacterModel();
    const view = new CharacterView();
    const controller = new CharacterController(model, view);

    controller.init();
});