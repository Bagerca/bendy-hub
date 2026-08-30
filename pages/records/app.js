import { RecordsModel } from './RecordsModel.js';
import { RecordsView } from './RecordsView.js';
import { RecordsController } from './RecordsController.js';

export async function init() {
    const model = new RecordsModel();
    const view = new RecordsView();
    const controller = new RecordsController(model, view);

    await controller.init();
    
    return controller; // <-- Возвращаем контроллер
}