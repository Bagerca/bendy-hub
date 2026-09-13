import { CommunityModel } from './CommunityModel.js';
import { CommunityView } from './CommunityView.js';
import { CommunityController } from './CommunityController.js';

export async function init() {
    const model = new CommunityModel();
    const view = new CommunityView();
    const controller = new CommunityController(model, view);

    await controller.init();
    return controller;
}