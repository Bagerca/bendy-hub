export class CharacterView {
    constructor() {
        this.els = {
            loader: document.getElementById('char-loader'),
            content: document.getElementById('char-content'),
            bg: document.getElementById('char-bg'),
            img: document.getElementById('char-image'),
            fallback: document.getElementById('char-fallback'),
            name: document.getElementById('char-name'),
            metaContainer: document.getElementById('char-meta-container'),
            quote: document.getElementById('char-quote'),
            
            appearance: document.getElementById('char-appearance'),
            personality: document.getElementById('char-personality'),
            appearances: document.getElementById('char-appearances'),
            
            historyContainer: document.getElementById('char-history'),
            triviaContainer: document.getElementById('char-trivia'),
            btnHistory: document.getElementById('btn-tab-history'),
            btnTrivia: document.getElementById('btn-tab-trivia'),
            
            backBtn: document.getElementById('back-btn')
        };

        this._initTabs();
        this._initBackButton();
    }

    _initTabs() {
        const tabs = document.querySelectorAll('.char-tab');
        const tabContents = document.querySelectorAll('.char-tab-content');
        
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => t.classList.remove('active'));
                tabContents.forEach(c => c.classList.remove('active'));
                
                tab.classList.add('active');
                document.getElementById(tab.dataset.target).classList.add('active');
            });
        });
    }

    _initBackButton() {
        this.els.backBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (document.referrer && document.referrer.includes(window.location.host)) {
                window.history.back();
            } else {
                window.location.href = 'characters.html';
            }
        });
    }

    showLoader() {
        this.els.loader.style.display = 'block';
        this.els.content.style.display = 'none';
    }

    hideLoader() {
        this.els.loader.style.display = 'none';
        this.els.content.style.display = 'block';
    }

    render(charData, charId) {
        document.title = `${charData.name} | Личное дело`;
        const basePath = `assets/characters/${charId}/`;

        this._renderImages(charData.assets, basePath);
        this._renderMeta(charData);
        this._renderWikiText(charData.wiki);
    }

    _renderImages(assets, basePath) {
        const avatar = assets?.avatar;
        const fullBody = assets?.full_body;

        const bgPhoto = avatar || fullBody;
        if (bgPhoto) {
            this.els.bg.style.backgroundImage = `url('${basePath}${bgPhoto}')`;
        }

        const mainPhoto = fullBody || avatar;
        if (mainPhoto) {
            this.els.img.onerror = () => {
                this.els.img.style.display = 'none';
                this.els.fallback.style.display = 'flex';
            };
            
            this.els.img.onload = () => {
                this.els.fallback.style.display = 'none';
                this.els.img.style.display = 'block';
            };

            this.els.img.src = `${basePath}${mainPhoto}`;
            
            if (mainPhoto.endsWith('.png')) {
                this.els.img.classList.add('is-render');
            } else {
                this.els.img.classList.remove('is-render');
            }
        } else {
            this.els.fallback.style.display = 'flex';
        }
    }

    _renderMeta(charData) {
        this.els.name.textContent = charData.name;

        if (charData.quote) {
            this.els.quote.textContent = charData.quote;
            this.els.quote.style.display = 'block';
        }

        let metaHtml = '';
        const addMeta = (label, value) => {
            if (value) metaHtml += `<div class="stat-row"><span class="stat-label">${label}:</span><span class="stat-value">${value}</span></div>`;
        };
        
        addMeta('Прозвища', charData.meta?.aliases?.join(', '));
        addMeta('Роль', charData.role);
        addMeta('Статус', charData.status);
        addMeta('Вид', charData.meta?.species);
        addMeta('Пол', charData.meta?.gender);
        addMeta('Профессия', charData.meta?.occupation);
        addMeta('Озвучка', charData.voice_actor);
        
        this.els.metaContainer.innerHTML = metaHtml || `<div class="stat-row"><span class="stat-value">Нет данных</span></div>`;
    }

    _renderWikiText(wiki) {
        if (!wiki) return;

        this.els.appearance.textContent = wiki.appearance || 'Данные отсутствуют.';
        this.els.personality.textContent = wiki.personality || 'Данные отсутствуют.';
        
        if (wiki.history && wiki.history.length > 0) {
            this.els.btnHistory.style.display = 'inline-block';
            wiki.history.forEach(chapter => {
                const block = document.createElement('div');
                block.className = 'history-block';
                block.innerHTML = `<h4 class="history-title">${chapter.title}</h4><p class="char-text">${chapter.text}</p>`;
                this.els.historyContainer.appendChild(block);
            });
        }

        if (wiki.trivia && wiki.trivia.length > 0) {
            this.els.btnTrivia.style.display = 'inline-block';
            wiki.trivia.forEach(fact => {
                const li = document.createElement('li');
                li.textContent = fact;
                this.els.triviaContainer.appendChild(li);
            });
        }
    }

    renderAppearancesLoading() {
        this.els.appearances.innerHTML = '<span style="color: var(--text-muted); font-size: 0.95rem; display: flex; align-items: center; gap: 8px;"><div class="spinner" style="width: 14px; height: 14px; border-width: 2px;"></div> Поиск в архивах...</span>';
    }

    // Изменено: теперь принимает projects и ссылается на project.html
    renderAppearances(projects) {
        this.els.appearances.innerHTML = ''; 

        if (projects.length > 0) {
            projects.forEach(project => {
                const a = document.createElement('a');
                a.href = `project.html?id=${project.id}`; // Было game.html
                a.className = 'app-tag interactive';
                a.textContent = project.title;
                this.els.appearances.appendChild(a);
            });
        } else {
            this.els.appearances.innerHTML = '<span style="color: var(--text-muted); font-size: 0.95rem;">Данные отсутствуют.</span>';
        }
    }

    renderAppearancesError() {
        this.els.appearances.innerHTML = '<span style="color: var(--error-color); font-size: 0.95rem;">Сбой базы данных.</span>';
    }

    renderErrorState(msg) {
        this.hideLoader();
        this.els.content.innerHTML = `
            <div class="error-card" style="margin: 4rem auto; max-width: 600px;">
                <p>${msg}</p>
                <a href="characters.html" style="color:var(--accent-color);">Вернуться в архив</a>
            </div>
        `;
    }
}