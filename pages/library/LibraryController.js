export class LibraryController {
    constructor(model, cardView) {
        this.model = model;
        this.cardView = cardView;
        this.container = document.getElementById('games-content');
        this.loader = document.getElementById('games-loader');
    }

    async init() {
        try {
            const games = await this.model.fetchAllGames();
            this.renderGrid(games);
        } catch (error) {
            this.showError('Сбой доступа к индексу архивов Joey Drew Studios.');
        }
    }

    renderGrid(games) {
        const fragment = document.createDocumentFragment();
        games.forEach(game => {
            fragment.appendChild(this.cardView.render(game));
        });
        this.loader.style.display = 'none';
        this.container.appendChild(fragment);
        this.container.style.display = 'grid';
    }

    showError(msg) {
        this.loader.style.display = 'none';
        this.container.innerHTML = `<div class="error-card" style="grid-column: 1/-1"><p>${msg}</p></div>`;
        this.container.style.display = 'block';
    }
}