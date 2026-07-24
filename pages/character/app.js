import { SiteHeader } from '../../shared/js/components/SiteHeader.js';
import { fetchData } from '../../shared/js/api.js';

customElements.define('site-header', SiteHeader);

document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const charId = urlParams.get('id');

    const els = {
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
        btnTrivia: document.getElementById('btn-tab-trivia')
    };

    if (!charId) {
        showError('Персонаж не найден.');
        return;
    }

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

    try {
        const char = await fetchData(`assets/characters/${charId}/data.json`);
        document.title = `${char.name} | Личное дело`;

        const basePath = `assets/characters/${charId}/`;
        
        const avatar = char.assets?.avatar;
        const fullBody = char.assets?.full_body;

        const bgPhoto = avatar || fullBody;
        if (bgPhoto) {
            els.bg.style.backgroundImage = `url('${basePath}${bgPhoto}')`;
        }

        const mainPhoto = fullBody || avatar;
        if (mainPhoto) {
            // Вешаем обработчик ошибки до установки src
            els.img.onerror = () => {
                els.img.style.display = 'none';
                els.fallback.style.display = 'flex';
            };
            
            // Если картинка загрузилась успешно
            els.img.onload = () => {
                els.fallback.style.display = 'none';
                els.img.style.display = 'block';
            };

            els.img.src = `${basePath}${mainPhoto}`;
            
            if (mainPhoto.endsWith('.png')) {
                els.img.classList.add('is-render');
            } else {
                els.img.classList.remove('is-render');
            }
        } else {
            // Если в JSON вообще не указаны картинки
            els.fallback.style.display = 'flex';
        }

        els.name.textContent = char.name;

        if (char.quote) {
            els.quote.textContent = char.quote;
            els.quote.style.display = 'block';
        }

        let metaHtml = '';
        const addMeta = (label, value) => {
            if (value) metaHtml += `<div class="stat-row"><span class="stat-label">${label}:</span><span class="stat-value">${value}</span></div>`;
        };
        
        addMeta('Прозвища', char.meta?.aliases?.join(', '));
        addMeta('Роль', char.role);
        addMeta('Статус', char.status);
        addMeta('Вид', char.meta?.species);
        addMeta('Пол', char.meta?.gender);
        addMeta('Профессия', char.meta?.occupation);
        addMeta('Озвучка', char.voice_actor);
        
        els.metaContainer.innerHTML = metaHtml || `<div class="stat-row"><span class="stat-value">Нет данных</span></div>`;

        if (char.wiki) {
            els.appearance.textContent = char.wiki.appearance || 'Данные отсутствуют.';
            els.personality.textContent = char.wiki.personality || 'Данные отсутствуют.';
            
            if (char.wiki.history && char.wiki.history.length > 0) {
                els.btnHistory.style.display = 'inline-block';
                char.wiki.history.forEach(chapter => {
                    const block = document.createElement('div');
                    block.className = 'history-block';
                    block.innerHTML = `<h4 class="history-title">${chapter.title}</h4><p class="char-text">${chapter.text}</p>`;
                    els.historyContainer.appendChild(block);
                });
            }

            if (char.wiki.trivia && char.wiki.trivia.length > 0) {
                els.btnTrivia.style.display = 'inline-block';
                char.wiki.trivia.forEach(fact => {
                    const li = document.createElement('li');
                    li.textContent = fact;
                    els.triviaContainer.appendChild(li);
                });
            }
        }

        els.appearances.innerHTML = '<span style="color: var(--text-muted); font-size: 0.95rem; display: flex; align-items: center; gap: 8px;"><div class="spinner" style="width: 14px; height: 14px; border-width: 2px;"></div> Поиск в архивах...</span>';
        
        try {
            const gamesIndex = await fetchData('data/games_index.json');
            const gamePromises = gamesIndex.map(gId => fetchData(`assets/games/${gId}/data.json`).catch(() => null));
            const allGames = await Promise.all(gamePromises);

            const appearedIn = allGames.filter(game => game?.wiki?.characters?.includes(charId));
            els.appearances.innerHTML = ''; 

            if (appearedIn.length > 0) {
                appearedIn.forEach(game => {
                    const a = document.createElement('a');
                    a.href = `game.html?id=${game.id}`;
                    a.className = 'app-tag interactive';
                    a.textContent = game.title;
                    els.appearances.appendChild(a);
                });
            } else {
                els.appearances.innerHTML = '<span style="color: var(--text-muted); font-size: 0.95rem;">Данные отсутствуют.</span>';
            }
        } catch (e) {
            els.appearances.innerHTML = '<span style="color: var(--error-color); font-size: 0.95rem;">Сбой базы данных.</span>';
        }

        els.loader.style.display = 'none';
        els.content.style.display = 'block';

    } catch (error) {
        showError('Личное дело засекречено или файл поврежден.');
    }

    function showError(msg) {
        els.loader.style.display = 'none';
        els.content.style.display = 'block';
        els.content.innerHTML = `<div class="error-card" style="margin: 4rem auto; max-width: 600px;"><p>${msg}</p><a href="javascript:history.back()" style="color:var(--accent-color);">Вернуться</a></div>`;
    }
});