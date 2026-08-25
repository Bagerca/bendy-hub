export class GameController {
    constructor(model, heroView, wikiView) {
        this.model = model;
        this.heroView = heroView;
        this.wikiView = wikiView;
        
        this.loader = document.getElementById('game-loader');
        this.content = document.getElementById('game-content');
    }

    async init(gameId) {
        if (!gameId) {
            this.showError('Игра не найдена. Некорректная ссылка.');
            return;
        }

        try {
            // 1. Грузим саму игру
            const gameData = await this.model.fetchGame(gameId);
            
            // 2. Рендерим шапку и базовые табы
            this.heroView.render(gameData, gameId);
            this.wikiView.render(gameData, gameId);
            
            // 3. Показываем контент
            this.loader.style.display = 'none';
            this.content.style.display = 'block';

            // 4. Догружаем персонажей параллельно, чтобы не тормозить показ страницы
            if (gameData.wiki?.characters?.length > 0) {
                this.wikiView.showCharLoader();
                const chars = await this.model.fetchCharacters(gameData.wiki.characters);
                this.wikiView.renderCharacters(chars, gameData.wiki.characters);
            }

        } catch (error) {
            this.showError('Информация о данной игре отсутствует в архивах или файл поврежден.');
        }
    }

    showError(msg) {
        this.loader.style.display = 'none';
        this.content.style.display = 'block';
        this.content.innerHTML = `<div class="error-card" style="margin: 4rem auto; max-width: 600px;"><p>${msg}</p><a href="library.html" style="color:var(--accent-color);">Вернуться назад</a></div>`;
    }
}