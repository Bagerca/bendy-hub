import { TimelineModel } from './TimelineModel.js';
import { TimelineView } from './TimelineView.js';
import { TimelineController } from './TimelineController.js';

export async function init() {
    const model = new TimelineModel();
    const view = new TimelineView();
    const controller = new TimelineController(model, view);

    await controller.init();
    
    return controller; // <-- Возвращаем контроллер
}