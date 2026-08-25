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
            
            // Настраиваем табы в зависимости от типа (книга, игра, фильм)
            this.wikiView.setupTabs(data.type || 'game');
            
            this.heroView.render(data, projectId);
            this.wikiView.render(data, projectId);
            
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