export class RecordsController {
    constructor(model, view) {
        this.model = model;
        this.view = view;
    }

    async init() {
        this.view.showLoader();

        try {
            const categories = await this.model.loadArchives();
            
            // Рендерим меню и передаем коллбэк для клика
            this.view.renderSidebar(categories, (category) => this.handleCategorySelect(category));
            
            // По умолчанию загружаем первую категорию
            if (categories.length > 0) {
                this.handleCategorySelect(categories[0]);
            }

        } catch (error) {
            this.view.renderError('Не удалось подключиться к главному терминалу Архивариуса.');
        }
    }

    handleCategorySelect(category) {
        this.view.updateActiveCategoryBtn(category.title);
        
        // Рендерим сетку и передаем коллбэк для клика по карточке
        this.view.renderGrid(category, (record) => this.handleRecordClick(record));
    }

    handleRecordClick(record) {
        this.view.openModal(record);
    }
}