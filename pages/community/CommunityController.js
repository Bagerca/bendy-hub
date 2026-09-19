export class CommunityController {
    constructor(model, view) {
        this.model = model;
        this.view = view;
    }

    async init() {
        try {
            await this.model.loadData();
            this._bindEvents();
            this.updateUI();
        } catch (err) {
            console.error("Ошибка загрузки музыки", err);
        }
    }

    _bindEvents() {
        // Кнопки категорий
        this.view.els.categoryBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const catId = btn.dataset.cat;
                if (catId === 'skip') {
                    this.model.skipCurrent();
                } else {
                    this.model.categorizeCurrent(catId);
                }
                this.updateUI();
            });
        });

        // Кнопка экспорта
        this.view.els.btnExport.addEventListener('click', () => {
            const data = this.model.getSortedData();
            const blob = new Blob([JSON.stringify(data, null, 4)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = 'music_categories_update.json';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        });

        // Полный сброс
        this.view.els.btnReset.addEventListener('click', () => {
            if (confirm("Точно сбросить весь прогресс сортировки?")) {
                this.model.resetProgress();
                this.updateUI();
            }
        });
    }

    updateUI() {
        const currentTrack = this.model.getCurrentTrack();
        const stats = this.model.getStats();
        const history = this.model.getHistory();

        this.view.render(currentTrack, stats, history, (trackId) => {
            // Коллбэк для кнопки "Отменить" в истории
            this.model.undoTrack(trackId);
            this.updateUI();
        });
    }

    destroy() {}
}