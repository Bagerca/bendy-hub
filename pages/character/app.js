import { CharacterModel } from './CharacterModel.js';
import { CharacterView } from './CharacterView.js';
import { CharacterController } from './CharacterController.js';

export async function init() {
    const model = new CharacterModel();
    const view = new CharacterView();
    const controller = new CharacterController(model, view);

    await controller.init();
    return controller; // <-- Возвращаем контроллер
}