import { BoardModel } from './BoardModel.js';
import { BoardView } from './BoardView.js';
import { BoardController } from './BoardController.js';

export async function init() {
    const model = new BoardModel();
    const view = new BoardView();
    const controller = new BoardController(model, view);

    await controller.init();
    
    // Возвращаем контроллер роутеру, чтобы он мог вызвать destroy() при уходе со страницы
    return controller; 
}