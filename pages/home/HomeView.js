export class HomeView {
    constructor() {
        this.els = {
            manifestoTitle: document.getElementById('manifesto-title'),
            manifestoBody: document.getElementById('manifesto-body'),
            manifestoNote: document.getElementById('manifesto-note'),
            
            statsGrid: document.getElementById('stats-grid'),
            
            teamList: document.getElementById('team-list'),
            teamCount: document.getElementById('team-count'),
            joinTeamWrapper: document.getElementById('join-team-wrapper')
        };
        
        this.templates = {
            teamMember: document.getElementById('team-member-template'),
            statCard: document.getElementById('stat-card-template')
        };
        
        this.fallbackAvatar = "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' fill='none' stroke='%238B949E' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2'/%3E%3Ccircle cx='12' cy='7' r='4'/%3E%3C/svg%3E";

        this.icons = {
            gamepad: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="20" height="12" rx="2" ry="2"></rect><line x1="6" y1="12" x2="10" y2="12"></line><line x1="8" y1="10" x2="8" y2="14"></line><line x1="15" y1="13" x2="15.01" y2="13"></line><line x1="18" y1="11" x2="18.01" y2="11"></line></svg>`,
            users: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>`,
            music: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle></svg>`,
            book: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>`
        };
    }

    renderManifesto(data) {
        if (!data) return;
        this.els.manifestoTitle.innerHTML = `${data.title} <span>${data.highlight}</span>`;
        
        this.els.manifestoBody.innerHTML = '';
        data.paragraphs.forEach(text => {
            const p = document.createElement('p');
            p.textContent = text;
            this.els.manifestoBody.appendChild(p);
        });

        if (data.note) {
            this.els.manifestoNote.textContent = data.note;
            this.els.manifestoNote.style.display = 'block';
        }
    }

    renderStats(statsData) {
        this.els.statsGrid.innerHTML = ''; // Очищаем скелетоны

        if (!statsData || statsData.length === 0) return;
        
        const fragment = document.createDocumentFragment();
        
        statsData.forEach((stat, index) => {
            const clone = this.templates.statCard.content.cloneNode(true);
            const item = clone.querySelector('.stat-item');
            
            item.style.animationDelay = `${index * 0.1}s`;
            
            clone.querySelector('.stat-icon-wrap').innerHTML = this.icons[stat.icon] || this.icons.book;
            clone.querySelector('.stat-value').textContent = stat.value; // Теперь здесь настоящее число
            clone.querySelector('.stat-label').textContent = stat.label;
            
            fragment.appendChild(clone);
        });

        this.els.statsGrid.appendChild(fragment);
    }

    renderTeam(teamData) {
        this.els.teamList.innerHTML = ''; 
        
        if (!teamData || teamData.length === 0) {
            this.els.teamCount.textContent = '0 участников';
            return;
        }

        this.els.teamCount.textContent = `${teamData.length} участник${this._getDeclension(teamData.length)}`;
        
        const fragment = document.createDocumentFragment();

        teamData.forEach(member => {
            const clone = this.templates.teamMember.content.cloneNode(true);
            
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
            const avatarSrc = member.assets?.avatar ? `assets/team/${member.id}/${member.assets.avatar}` : this.fallbackAvatar;
            
            avatarImg.src = avatarSrc;
            avatarImg.onerror = () => { avatarImg.src = this.fallbackAvatar; };

            if (member.isOnline) {
                clone.querySelector('.status-indicator').classList.add('online');
            }

            fragment.appendChild(clone);
        });

        this.els.teamList.appendChild(fragment);
    }

    renderJoinTeam(data) {
        if (!data || !data.link) return;
        
        this.els.joinTeamWrapper.innerHTML = `
            <a href="${data.link}" target="_blank" rel="noopener noreferrer" class="join-team-btn">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="20" y1="8" x2="20" y2="14"></line><line x1="23" y1="11" x2="17" y2="11"></line></svg>
                ${data.text}
            </a>
        `;
        this.els.joinTeamWrapper.style.display = 'block';
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