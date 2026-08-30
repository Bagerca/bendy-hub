import { Icons } from '../../shared/js/icons.js';

export class HeroView {
    constructor() {
        this.els = {
            bg: document.getElementById('hero-bg'),
            contentWrapper: document.getElementById('hero-content'),
            posterContainer: document.getElementById('hero-poster-container'),
            posterImg: document.getElementById('project-poster'),
            logo: document.getElementById('project-logo'),
            title: document.getElementById('project-title'),
            date: document.getElementById('project-date'),
            status: document.getElementById('project-status'),
            author: document.getElementById('project-author'),
            storeLink: document.getElementById('store-link-container')
        };
        this.baseAssetPath = 'assets/catalog/';
        this.platformIcons = this._getPlatformIcons();
        
        this.statusMap = {
            released: { text: 'Вышел', class: 'status-released' },
            development: { text: 'В разработке', class: 'status-dev' },
            frozen: { text: 'Заморожен', class: 'status-frozen' },
            cancelled: { text: 'Отменен', class: 'status-cancelled' }
        };
    }

    render(data, projectId) {
        document.title = `${data.title === '...' ? 'Без названия' : data.title} | Bendy Wiki`;
        const assets = data.assets || {};
        const type = data.type || 'game';
        const isSplitLayout = type === 'book' || type === 'movie';

        if (isSplitLayout) {
            this.els.contentWrapper.classList.add('hero-split-layout');
            this.els.bg.classList.add('heavy-blur');

            let mainImage = null;
            if (type === 'movie') {
                mainImage = (assets.banner !== '...') ? assets.banner : assets.cover;
                this.els.posterContainer.classList.add('movie-poster');
            } else {
                mainImage = (assets.cover !== '...') ? assets.cover : assets.banner;
                this.els.posterContainer.classList.remove('movie-poster');
            }

            if (mainImage && mainImage !== '...') {
                this.els.posterImg.src = `${this.baseAssetPath}${projectId}/${mainImage}`;
                this.els.posterContainer.style.display = 'block';
                this.els.bg.style.backgroundImage = `url('${this.baseAssetPath}${projectId}/${mainImage}')`;
            } else {
                this.els.posterContainer.style.display = 'none';
            }

            this.els.logo.style.display = 'none';
            this.els.title.textContent = data.title === '...' ? 'Без названия' : data.title;
            this.els.title.style.display = 'block';
        } else {
            this.els.contentWrapper.classList.remove('hero-split-layout');
            this.els.bg.classList.remove('heavy-blur');
            this.els.posterContainer.style.display = 'none';

            let bgImage = (assets.hero_bg !== '...') ? assets.hero_bg : null;
            if (!bgImage) bgImage = (assets.banner !== '...') ? assets.banner : null;
            if (!bgImage) bgImage = (assets.cover !== '...') ? assets.cover : null;
            
            if (bgImage) this.els.bg.style.backgroundImage = `url('${this.baseAssetPath}${projectId}/${bgImage}')`;

            if (assets.logo && assets.logo !== '...') {
                this.els.logo.src = `${this.baseAssetPath}${projectId}/${assets.logo}`;
                this.els.logo.style.display = 'block';
                this.els.title.style.display = 'none';
            } else {
                this.els.logo.style.display = 'none';
                this.els.title.textContent = data.title === '...' ? 'Без названия' : data.title;
                this.els.title.style.display = 'block';
            }
        }

        this.els.date.textContent = `Релиз: ${data.release_date === '...' ? 'TBA' : data.release_date}`;
        
        const statusKey = data.status || 'released';
        const statusConfig = this.statusMap[statusKey] || this.statusMap.released;
        this.els.status.textContent = statusConfig.text;
        this.els.status.className = `meta-badge status-badge ${statusConfig.class}`;

        let authorText = data.developer === '...' ? 'Неизвестно' : data.developer;
        if (type === 'book') {
            this.els.author.textContent = `Автор: ${authorText}`;
        } else if (type === 'movie') {
            this.els.author.textContent = `Режиссер: ${data.publisher !== '...' && data.publisher ? data.publisher : authorText}`;
        } else {
            this.els.author.textContent = `Разработчик: ${authorText}`;
        }

        this.els.storeLink.innerHTML = '';
        if (data.platforms && Object.keys(data.platforms).length > 0 && data.platforms[Object.keys(data.platforms)[0]] !== '...') {
            Object.entries(data.platforms).forEach(([key, url]) => {
                if (url === '...') return;
                const keyLower = key.toLowerCase();
                const pData = this.platformIcons[keyLower] || { name: key.charAt(0).toUpperCase() + key.slice(1), icon: this.platformIcons.default.icon };
                this.els.storeLink.innerHTML += `<a href="${url}" target="_blank" class="store-btn">${pData.icon} <span>${pData.name}</span></a>`;
            });
        }
    }

    _getPlatformIcons() {
        return {
            youtube: { name: 'Смотреть', icon: Icons.plat_youtube },
            gamejolt: { name: 'Game Jolt', icon: Icons.plat_gamejolt },
            pdf: { name: 'Читать', icon: Icons.plat_pdf },
            amazon: { name: 'Amazon', icon: Icons.plat_amazon },
            steam: { name: 'Steam', icon: Icons.plat_steam },
            xbox: { name: 'Xbox', icon: Icons.plat_xbox },
            playstation: { name: 'PlayStation', icon: Icons.plat_playstation },
            nintendo: { name: 'Nintendo', icon: Icons.plat_nintendo },
            epic: { name: 'Epic Games', icon: Icons.plat_epic },
            ios: { name: 'App Store', icon: Icons.plat_ios },
            android: { name: 'Google Play', icon: Icons.plat_android },
            default: { name: 'Смотреть / Читать', icon: Icons.plat_default }
        };
    }
}