import { HomeModel } from './HomeModel.js';
import { HomeView } from './HomeView.js';
import { HomeController } from './HomeController.js';

export async function init() {
    const model = new HomeModel();
    const view = new HomeView();
    const controller = new HomeController(model, view);

    await controller.init();
    return controller; // Возвращаем, если роутеру нужно будет его убить при переходе
}