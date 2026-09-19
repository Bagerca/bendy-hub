// FILE: pages/project/ProjectController.js

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
            const { projectData, dependencies } = await this.model.fetchProjectWithDependencies(projectId);
            
            this.heroView.render(projectData, projectId);
            this.wikiView.render(projectData, projectId, dependencies);
            
            this.loader.style.display = 'none';
            this.content.style.display = 'block';

            if (dependencies.characters && dependencies.characters.length > 0) {
                this.wikiView.renderCharacters(dependencies.characters);
            }

        } catch (error) {
            // ВЫВОДИМ ОШИБКУ В КОНСОЛЬ, чтобы знать, что сломалось
            console.error('[ProjectController] Фатальная ошибка рендера:', error);
            this.showError('Информация о данном проекте отсутствует в архивах или файл поврежден.');
        }
    }

    showError(msg) {
        this.loader.style.display = 'none';
        this.content.style.display = 'block';
        // Улучшили верстку карточки ошибки, чтобы текст и кнопка стояли вертикально
        this.content.innerHTML = `
            <div class="error-card" style="margin: 4rem auto; max-width: 600px; flex-direction: column; text-align: center;">
                <p>${msg}</p>
                <a href="catalog.html" style="color:var(--bg-body); background:var(--accent-color); padding: 8px 16px; border-radius: 8px; text-decoration: none; font-weight: 700; margin-top: 10px; transition: 0.2s;">Вернуться в каталог</a>
            </div>`;
    }
}