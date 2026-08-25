export class HomeView {
    constructor() {
        this.els = {
            manifestoTitle: document.getElementById('manifesto-title'),
            manifestoBody: document.getElementById('manifesto-body'),
            manifestoNote: document.getElementById('manifesto-note'),
            teamList: document.getElementById('team-list'),
            teamCount: document.getElementById('team-count')
        };
        this.teamTemplate = document.getElementById('team-member-template');
        
        // Дефолтная SVG-заглушка для аватаров
        this.fallbackAvatar = "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' fill='none' stroke='%238B949E' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2'/%3E%3Ccircle cx='12' cy='7' r='4'/%3E%3C/svg%3E";
    }

    renderManifesto(manifestoData) {
        if (!manifestoData) return;

        // Рендер заголовка
        this.els.manifestoTitle.innerHTML = `${manifestoData.title} <span>${manifestoData.highlight}</span>`;

        // Рендер параграфов
        this.els.manifestoBody.innerHTML = '';
        manifestoData.paragraphs.forEach(text => {
            const p = document.createElement('p');
            p.textContent = text;
            this.els.manifestoBody.appendChild(p);
        });

        // Рендер примечания
        if (manifestoData.note) {
            this.els.manifestoNote.textContent = manifestoData.note;
            this.els.manifestoNote.style.display = 'block';
        }
    }

    renderTeam(teamData) {
        this.els.teamList.innerHTML = ''; // Убираем скелетоны
        
        if (!teamData || teamData.length === 0) {
            this.els.teamCount.textContent = '0 участников';
            return;
        }

        this.els.teamCount.textContent = `${teamData.length} участник${this._getDeclension(teamData.length)}`;
        
        const fragment = document.createDocumentFragment();

        teamData.forEach(member => {
            const clone = this.teamTemplate.content.cloneNode(true);
            
            clone.querySelector('.member-name').textContent = member.name;
            clone.querySelector('.member-status').textContent = member.status;
            
            const roleBadge = clone.querySelector('.role-badge');
            roleBadge.textContent = member.role;
            roleBadge.classList.add(member.roleClass || 'volunteer');

            const linkBtn = clone.querySelector('.member-link-btn');
            if (member.link && member.link !== '#') {
                linkBtn.href = member.link;
            } else {
                linkBtn.style.display = 'none';
            }

            const avatarImg = clone.querySelector('.member-avatar');
            const avatarSrc = member.avatar ? `assets/avatars/${member.avatar}` : this.fallbackAvatar;
            avatarImg.src = avatarSrc;
            avatarImg.onerror = () => { avatarImg.src = this.fallbackAvatar; };

            if (member.isOnline) {
                clone.querySelector('.status-indicator').classList.add('online');
            }

            fragment.appendChild(clone);
        });

        this.els.teamList.appendChild(fragment);
    }

    renderErrorState() {
        this.els.manifestoBody.innerHTML = '<p style="color: var(--error-color);">Не удалось загрузить манифест.</p>';
        this.els.teamList.innerHTML = '<div style="padding: 1rem; color: var(--error-color);">Ошибка загрузки команды.</div>';
    }

    _getDeclension(number) {
        const lastDigit = number % 10;
        const lastTwoDigits = number % 100;
        if (lastTwoDigits > 10 && lastTwoDigits < 20) return 'ов';
        if (lastDigit > 1 && lastDigit < 5) return 'а';
        if (lastDigit === 1) return '';
        return 'ов';
    }
}