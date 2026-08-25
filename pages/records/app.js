import { SiteHeader } from '../../shared/js/components/SiteHeader.js';
import { RecordsModel } from './RecordsModel.js';
import { RecordsView } from './RecordsView.js';
import { RecordsController } from './RecordsController.js';

customElements.define('site-header', SiteHeader);

document.addEventListener('DOMContentLoaded', () => {
    const model = new RecordsModel();
    const view = new RecordsView();
    const controller = new RecordsController(model, view);

    controller.init();
});