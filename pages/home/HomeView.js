import { Icons } from '../../shared/js/icons.js';

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
        
        this.fallbackAvatar = Icons.avatar_fallback;

        this.icons = {
            gamepad: Icons.stat_gamepad,
            users: Icons.stat_users,
            music: Icons.stat_music,
            book: Icons.stat_book
        };

        const archivesHeader = document.getElementById('header-archives');
        const teamHeader = document.getElementById('header-team');
        if (archivesHeader && !archivesHeader.innerHTML.includes('<svg')) archivesHeader.insertAdjacentHTML('afterbegin', Icons.home_archives);
        if (teamHeader && !teamHeader.innerHTML.includes('<svg')) teamHeader.insertAdjacentHTML('afterbegin', Icons.home_team);
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
        this.els.statsGrid.innerHTML = ''; 

        if (!statsData || statsData.length === 0) return;
        
        const fragment = document.createDocumentFragment();
        
        statsData.forEach((stat, index) => {
            const clone = this.templates.statCard.content.cloneNode(true);
            const item = clone.querySelector('.stat-item');
            
            item.style.animationDelay = `${index * 0.1}s`;
            
            clone.querySelector('.stat-icon-wrap').innerHTML = this.icons[stat.icon] || this.icons.book;
            clone.querySelector('.stat-value').textContent = stat.value; 
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
                linkBtn.innerHTML = Icons.link_external; // Вставляем иконку
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
                ${Icons.join_team}
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