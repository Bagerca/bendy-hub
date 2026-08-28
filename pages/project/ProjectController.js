export class ProjectController {
    constructor(model, heroView, wikiView) {
        this.model = model;
        this.heroView = heroView;
        this.wikiView = wikiView;
        
        this.loader = document.getElementById('project-loader');
        this.content = document.getElementById('project-content');
    }

    async init(projectId) {
        if (!projectId) {
            this.showError('Проект не найден. Некорректная ссылка.');
            return;
        }

        try {
            const data = await this.model.fetchProject(projectId);
            
            this.wikiView.setupTabs(data.type || 'game');
            this.heroView.render(data, projectId);
            
            // Загружаем команды (если есть массив russifiers с айдишниками команд)
            let teamsData = [];
            if (data.russifiers && data.russifiers.length > 0) {
                // Предполагаем, что data.russifiers теперь массив строк ["fanic", "ybt"]
                if (typeof data.russifiers[0] === 'string') {
                    teamsData = await this.model.fetchTranslators(data.russifiers);
                } else {
                    // Fallback для старых данных, пока скрипт не отработает
                    teamsData = data.russifiers;
                }
            }

            this.wikiView.render(data, projectId, teamsData);
            
            this.loader.style.display = 'none';
            this.content.style.display = 'block';

            if (data.wiki?.characters?.length > 0) {
                this.wikiView.showCharLoader();
                const chars = await this.model.fetchCharacters(data.wiki.characters);
                this.wikiView.renderCharacters(chars, data.wiki.characters);
            }

        } catch (error) {
            this.showError('Информация о данном проекте отсутствует в архивах или файл поврежден.');
        }
    }

    showError(msg) {
        this.loader.style.display = 'none';
        this.content.style.display = 'block';
        this.content.innerHTML = `<div class="error-card" style="margin: 4rem auto; max-width: 600px;"><p>${msg}</p><a href="catalog.html" style="color:var(--accent-color);">Вернуться в каталог</a></div>`;
    }
}