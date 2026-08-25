import { SiteHeader } from '../../shared/js/components/SiteHeader.js';
import { TimelineModel } from './TimelineModel.js';
import { TimelineView } from './TimelineView.js';
import { TimelineController } from './TimelineController.js';

customElements.define('site-header', SiteHeader);

document.addEventListener('DOMContentLoaded', () => {
    const model = new TimelineModel();
    const view = new TimelineView();
    const controller = new TimelineController(model, view);

    controller.init();
});