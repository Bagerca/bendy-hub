import { ProjectModel } from './ProjectModel.js';
import { HeroView } from './HeroView.js';
import { WikiView } from './WikiView.js';
import { ProjectController } from './ProjectController.js';

export async function init() {
    const urlParams = new URLSearchParams(window.location.search);
    const projectId = urlParams.get('id');

    const model = new ProjectModel();
    const heroView = new HeroView();
    const wikiView = new WikiView(window.globalLightbox);
    
    const controller = new ProjectController(model, heroView, wikiView);
    await controller.init(projectId);
    
    return controller; // <-- Возвращаем контроллер
}