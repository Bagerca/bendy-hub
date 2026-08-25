import { SiteHeader } from '../../shared/js/components/SiteHeader.js';
import { LightboxManager } from '../../shared/js/Lightbox.js';

import { ProjectModel } from './ProjectModel.js';
import { HeroView } from './HeroView.js';
import { WikiView } from './WikiView.js';
import { ProjectController } from './ProjectController.js';

customElements.define('site-header', SiteHeader);

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const projectId = urlParams.get('id');

    const lightbox = new LightboxManager('lightbox', 'lightbox-img');
    
    const model = new ProjectModel();
    const heroView = new HeroView();
    const wikiView = new WikiView(lightbox);
    
    const controller = new ProjectController(model, heroView, wikiView);
    controller.init(projectId);
});