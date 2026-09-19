import { Icons } from '../../shared/js/icons.js';

export class CommunityView {
    constructor(lightboxManager) {
        this.lightbox = lightboxManager;
        
        this.els = {
            loader: document.getElementById('sort-loader'),
            workspace: document.getElementById('sort-workspace'),
            actionsBar: document.getElementById('sort-actions-bar'),
            historySec: document.getElementById('history-section'),
            
            trackCard: document.getElementById('active-track-card'),
            categoryBtns: document.querySelectorAll('.cat-sort-btn'),
            
            progress: document.getElementById('sort-progress'),
            btnExport: document.getElementById('btn-export'),
            btnReset: document.getElementById('btn-reset-all'),
            historyList: document.getElementById('history-list')
        };
    }

    render(currentTrack, stats, history, onUndoCallback) {
        this.els.loader.style.display = 'none';
        this.els.workspace.style.display = 'grid';
        this.els.actionsBar.style.display = 'flex';
        this.els.historySec.style.display = 'block';

        this.els.progress.textContent = `Осталось распределить: ${stats.left} / ${stats.total}`;

        // 1. Рендер текущего трека
        if (currentTrack) {
            const coverPath = currentTrack.cover ? `assets/music/${currentTrack.id}/${currentTrack.cover}` : '';
            this.els.trackCard.innerHTML = `
                <div class="atc-cover-wrapper">
                    <img src="${coverPath}" class="atc-cover" onerror="this.style.display='none'">
                </div>
                <div class="atc-info">
                    <h3 class="atc-title">${currentTrack.title}</h3>
                    <p class="atc-artist">${currentTrack.artist}</p>
                    ${currentTrack.youtubeUrl ? `<button class="atc-play-btn" id="listen-btn">${Icons.player_play} Слушать в YouTube</button>` : ''}
                </div>
            `;

            const listenBtn = this.els.trackCard.querySelector('#listen-btn');
            if (listenBtn) {
                listenBtn.addEventListener('click', () => {
                    this.lightbox.open(currentTrack.youtubeUrl, true);
                });
            }
            
            this.els.categoryBtns.forEach(btn => btn.disabled = false);
            this.els.trackCard.style.opacity = '1';
        } else {
            this.els.trackCard.innerHTML = `
                <div class="atc-info" style="padding: 4rem 2rem;">
                    <h3 class="atc-title" style="color: #00BA7C;">Всё отсортировано! 🎉</h3>
                    <p class="atc-artist">Скачай JSON и отправь его разработчику.</p>
                </div>
            `;
            this.els.categoryBtns.forEach(btn => btn.disabled = true);
        }

        // 2. Рендер истории
        this.els.historyList.innerHTML = '';
        history.forEach(item => {
            const el = document.createElement('div');
            el.className = 'history-item';
            
            let catName = item.cat;
            if (item.cat === 'song') catName = 'Оригинальная песня';
            if (item.cat === 'animation') catName = 'Анимация';
            if (item.cat === 'remix') catName = 'Ремикс / Кавер';
            if (item.cat === 'instrumental') catName = 'Инструментал';
            if (item.cat === 'skipped') catName = 'Пропущено';

            el.innerHTML = `
                <div class="history-item-info">
                    <span class="history-item-title">${item.title}</span>
                    <span class="history-item-cat">${catName}</span>
                </div>
                <button class="history-item-undo">Вернуть</button>
            `;

            el.querySelector('.history-item-undo').addEventListener('click', () => {
                onUndoCallback(item.id);
            });

            this.els.historyList.appendChild(el);
        });
    }
}