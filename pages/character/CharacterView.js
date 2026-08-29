export class CharacterView {
    constructor() {
        this.els = {
            loader: document.getElementById('char-loader'),
            content: document.getElementById('char-content'),
            bg: document.getElementById('char-bg'),
            img: document.getElementById('char-image'),
            fallback: document.getElementById('char-fallback'),
            name: document.getElementById('char-name'),
            versionsContainer: document.getElementById('char-versions-container'),
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

        this.charData = null; 
        this.charId = null;

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
        this.charData = charData;
        this.charId = charId;

        document.title = `${charData.name} | Личное дело`;
        this.els.name.textContent = charData.name;

        if (charData.versions && charData.versions.length > 1) {
            this._renderVersionButtons(charData.versions);
            this._applyVersionData(charData.versions[0]);
        } else {
            this.els.versionsContainer.style.display = 'none';
            this._applyVersionData(charData);
        }

        this._renderWikiText(charData.wiki);
    }

    _renderVersionButtons(versions) {
        this.els.versionsContainer.innerHTML = '';
        this.els.versionsContainer.style.display = 'flex';

        versions.forEach((version, index) => {
            const btn = document.createElement('button');
            btn.className = `version-btn ${index === 0 ? 'active' : ''}`;
            btn.textContent = version.label || `Версия ${index + 1}`;
            
            btn.addEventListener('click', () => {
                this.els.versionsContainer.querySelectorAll('.version-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                this.els.img.style.opacity = '0';
                this.els.bg.style.opacity = '0'; // Плавно прячем фон
                
                setTimeout(() => {
                    this._applyVersionData(version);
                    this.els.img.style.opacity = '1';
                    this.els.bg.style.opacity = '1'; // Плавно возвращаем фон
                }, 200);
            });

            this.els.versionsContainer.appendChild(btn);
        });
    }

    _applyVersionData(dataBlock) {
        const basePath = `assets/characters/${this.charId}/`;
        
        const assets = dataBlock.assets || this.charData.assets || {};
        this._renderImages(assets, basePath);

        const quoteText = dataBlock.quote || this.charData.quote;
        if (quoteText && quoteText !== '...') {
            this.els.quote.textContent = quoteText;
            this.els.quote.style.display = 'block';
        } else {
            this.els.quote.style.display = 'none';
        }

        const role = dataBlock.role || this.charData.role;
        const status = dataBlock.status || this.charData.status;
        const actor = dataBlock.voice_actor || this.charData.voice_actor;
        
        const globalMeta = this.charData.meta || {};
        const localMeta = dataBlock.meta || {};
        
        const mergedMeta = {
            aliases: localMeta.aliases || globalMeta.aliases,
            species: localMeta.species || globalMeta.species,
            gender: localMeta.gender || globalMeta.gender,
            occupation: localMeta.occupation || globalMeta.occupation,
            affiliation: localMeta.affiliation || globalMeta.affiliation
        };

        let metaHtml = '';
        const addMeta = (label, value, isFullWidth = false) => {
            if (value && value !== '...' && value.length > 0) {
                const widthClass = isFullWidth ? 'full-width' : '';
                metaHtml += `<div class="stat-row ${widthClass}"><span class="stat-label">${label}:</span><span class="stat-value">${value}</span></div>`;
            }
        };
        
        addMeta('Прозвища', mergedMeta.aliases?.join(', '), true);
        addMeta('Роль', role);
        addMeta('Статус', status);
        addMeta('Вид', mergedMeta.species);
        addMeta('Фракция', mergedMeta.affiliation);
        addMeta('Пол', mergedMeta.gender);
        addMeta('Профессия', mergedMeta.occupation);
        addMeta('Озвучка', actor, true);
        
        this.els.metaContainer.innerHTML = metaHtml || `<div class="stat-row"><span class="stat-value">Секретно</span></div>`;
    }

    _renderImages(assets, basePath) {
        // Сбрасываем старые обработчики, чтобы они не конфликтовали
        this.els.img.onload = null;
        this.els.img.onerror = null;

        const avatar = (assets?.avatar && assets.avatar !== '...') ? assets.avatar : null;
        const fullBody = (assets?.full_body && assets.full_body !== '...') ? assets.full_body : null;

        const showFallback = () => {
            this.els.img.style.display = 'none';
            this.els.fallback.style.display = 'flex';
            this.els.bg.style.backgroundImage = 'none'; // Нет картинки = нет фона
        };

        // Функция вызывается ТОЛЬКО если картинка реально скачалась
        const showImage = (validSrc) => {
            this.els.fallback.style.display = 'none';
            this.els.img.style.display = 'block';
            this.els.bg.style.backgroundImage = `url('${validSrc}')`; // Синхронизируем фон
            
            if (validSrc.includes('.png')) {
                this.els.img.classList.add('is-render');
            } else {
                this.els.img.classList.remove('is-render');
            }
        };

        if (fullBody) {
            const fullBodySrc = `${basePath}${fullBody}`;
            
            this.els.img.onload = () => showImage(fullBodySrc);
            
            this.els.img.onerror = () => {
                if (avatar) {
                    const avatarSrc = `${basePath}${avatar}`;
                    this.els.img.onload = () => showImage(avatarSrc);
                    this.els.img.onerror = showFallback;
                    this.els.img.src = avatarSrc; // Грузим аватар, если full_body сломался
                } else {
                    showFallback();
                }
            };
            
            this.els.img.src = fullBodySrc; // Запускаем попытку скачать full_body
            
        } else if (avatar) {
            const avatarSrc = `${basePath}${avatar}`;
            this.els.img.onload = () => showImage(avatarSrc);
            this.els.img.onerror = showFallback;
            this.els.img.src = avatarSrc;
        } else {
            showFallback();
        }
    }

    _renderWikiText(wiki) {
        if (!wiki) return;

        this.els.appearance.textContent = wiki.appearance && wiki.appearance !== '...' ? wiki.appearance : 'Данные засекречены.';
        this.els.personality.textContent = wiki.personality && wiki.personality !== '...' ? wiki.personality : 'Данные засекречены.';
        
        if (wiki.history && wiki.history.length > 0 && wiki.history[0].title !== '...') {
            this.els.btnHistory.style.display = 'inline-block';
            this.els.historyContainer.innerHTML = '';
            wiki.history.forEach(chapter => {
                if(chapter.title === '...') return;
                const block = document.createElement('div');
                block.className = 'history-block';
                block.innerHTML = `<h4 class="history-title">${chapter.title}</h4><p class="char-text">${chapter.text}</p>`;
                this.els.historyContainer.appendChild(block);
            });
        } else {
            this.els.btnHistory.style.display = 'none';
        }

        if (wiki.trivia && wiki.trivia.length > 0) {
            this.els.btnTrivia.style.display = 'inline-block';
            this.els.triviaContainer.innerHTML = '';
            wiki.trivia.forEach(fact => {
                const li = document.createElement('li');
                li.textContent = fact;
                this.els.triviaContainer.appendChild(li);
            });
        } else {
            this.els.btnTrivia.style.display = 'none';
        }
    }

    renderAppearancesLoading() {
        this.els.appearances.innerHTML = '<span style="color: var(--text-muted); font-size: 0.95rem; display: flex; align-items: center; gap: 8px;"><div class="spinner" style="width: 14px; height: 14px; border-width: 2px;"></div> Поиск в архивах...</span>';
    }

    renderAppearances(projects) {
        this.els.appearances.innerHTML = ''; 

        if (projects.length > 0) {
            projects.forEach(project => {
                const a = document.createElement('a');
                a.href = `project.html?id=${project.id}`; 
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
        this.els.content.style.display = 'block';
    }
}