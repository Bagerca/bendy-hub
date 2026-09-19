import { Icons } from '../../shared/js/icons.js';
import { prefetchData } from '../../shared/js/api.js';
import { SmartMarquee } from '../../shared/js/SmartMarquee.js';

export class CharactersView {
    constructor() {
        this.els = {
            container: document.getElementById('chars-content'),
            loader: document.getElementById('chars-loader'),
            count: document.getElementById('results-count'),
            alphabetFilters: document.getElementById('alphabet-filters')
        };
        
        this.templates = {
            empty: document.getElementById('empty-state-template'),
            error: document.getElementById('error-state-template')
        };

        this.fallbackHtml = `<img src="${Icons.avatar_fallback}" alt="Нет фото" class="char-fallback" style="width: 100%; height: 100%; object-fit: cover; background: var(--bg-body); padding: 6px;">`;
    }

    renderGrid(characters) {
        this.els.container.innerHTML = '';
        this.els.loader.style.display = 'none';
        this.els.count.textContent = `Найдено личных дел: ${characters.length}`;

        if (characters.length === 0) {
            this._renderEmptyState();
            return;
        }

        const fragment = document.createDocumentFragment();

        characters.forEach(char => {
            const card = document.createElement('a');
            const targetUrl = `character.html?id=${char.id}`;
            card.href = targetUrl;
            card.className = 'char-card';

            let hoverTimeout;
            card.addEventListener('pointerenter', () => {
                hoverTimeout = setTimeout(() => { prefetchData(`assets/characters/${char.id}/data.json`); }, 100);
            });
            card.addEventListener('pointerleave', () => clearTimeout(hoverTimeout));

            card.addEventListener('click', (e) => {
                if (!e.target.closest('.stack-img-link')) {
                    e.preventDefault();
                    if (window.router) window.router.navigate(targetUrl);
                    else window.location.href = targetUrl;
                }
            });

            // 1. Формируем аватары
            const avatarWrapper = document.createElement('div');
            avatarWrapper.className = 'char-avatar-wrapper';

            if (char.versions && char.versions.length > 1) {
                const versionsToRender = char.versions.slice(0, 4);
                avatarWrapper.classList.add('is-stack');
                avatarWrapper.style.setProperty('--stack-count', versionsToRender.length);
                
                versionsToRender.forEach((v, index) => {
                    const photo = v.assets?.avatar;
                    const hasRealPhoto = photo && photo !== '...';

                    const link = document.createElement('a');
                    link.className = 'stack-img-link';
                    link.href = `${targetUrl}&v=${index}`;
                    link.title = v.label || `Версия ${index + 1}`; 
                    
                    link.addEventListener('click', (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (window.router) window.router.navigate(link.href);
                        else window.location.href = link.href;
                    });

                    if (hasRealPhoto) {
                        const img = document.createElement('img');
                        img.loading = 'lazy';
                        img.src = `assets/characters/${char.id}/${photo}`;
                        img.onerror = () => { 
                            link.innerHTML = this.fallbackHtml;
                            link.querySelector('img').style.borderRadius = '50%';
                        };
                        link.appendChild(img);
                    } else {
                        link.innerHTML = this.fallbackHtml;
                        link.querySelector('img').style.borderRadius = '50%';
                    }
                    
                    avatarWrapper.appendChild(link);
                });
            } else {
                avatarWrapper.style.setProperty('--stack-count', 1);
                const photo = char.assets?.avatar || char.assets?.full_body;
                
                if (photo && photo !== '...') {
                    const img = document.createElement('img');
                    img.className = 'char-img single-img';
                    img.loading = 'lazy';
                    img.src = `assets/characters/${char.id}/${photo}`;
                    img.onerror = () => { avatarWrapper.innerHTML = this.fallbackHtml; };
                    avatarWrapper.appendChild(img);
                } else {
                    avatarWrapper.innerHTML = this.fallbackHtml;
                }
            }

            // 2. Формируем инфо-блок (Имя + Подзаголовок в Smart Marquee)
            const infoCol = document.createElement('div');
            infoCol.className = 'char-info-col';
            
            // Обертка имени
            const nameWrapper = document.createElement('div');
            nameWrapper.className = 'smart-marquee-wrapper';
            const nameEl = document.createElement('span');
            nameEl.className = 'char-card-name smart-marquee-text';
            nameEl.textContent = char.name;
            nameWrapper.appendChild(nameEl);
            infoCol.appendChild(nameWrapper);

            // Обертка подзаголовка
            const subWrapper = document.createElement('div');
            subWrapper.className = 'smart-marquee-wrapper';
            const subtitleEl = document.createElement('span');
            subtitleEl.className = 'char-card-subtitle smart-marquee-text';

            if (char.versions && char.versions.length > 1) {
                const labels = char.versions.map(v => v.label.split('(')[0].trim() || v.label);
                
                if (labels.length > 3) {
                    subtitleEl.innerHTML = `${labels.slice(0, 2).join(' &bull; ')} &bull; <span>+${labels.length - 2}</span>`;
                } else {
                    subtitleEl.innerHTML = labels.join(' &bull; ');
                }
            } else {
                const species = char.meta?.species;
                const role = char.role;
                if (species && species !== '...') {
                    subtitleEl.textContent = species;
                } else if (role && role !== '...') {
                    subtitleEl.textContent = role;
                } else {
                    subtitleEl.textContent = "Засекречено";
                }
            }

            subWrapper.appendChild(subtitleEl);
            infoCol.appendChild(subWrapper);

            // 3. Стрелочка вправо
            const arrow = document.createElement('div');
            arrow.className = 'char-arrow';
            arrow.innerHTML = Icons.chevron_right;

            // Собираем карточку
            card.appendChild(avatarWrapper);
            card.appendChild(infoCol);
            card.appendChild(arrow);
            
            SmartMarquee.apply(card, '.smart-marquee-text');

            fragment.appendChild(card);
        });

        this.els.container.appendChild(fragment);
        this.els.container.style.display = 'grid';
    }

    renderAlphabet(letters, currentLetter, onLetterClick) {
        this.els.alphabetFilters.innerHTML = ''; 

        const allBtn = document.createElement('button');
        allBtn.className = `alphabet-chip ${currentLetter === 'all' ? 'active' : ''}`;
        allBtn.textContent = 'Все';
        allBtn.addEventListener('click', () => onLetterClick('all', allBtn));
        this.els.alphabetFilters.appendChild(allBtn);

        letters.forEach(letter => {
            const btn = document.createElement('button');
            btn.className = `alphabet-chip ${currentLetter === letter ? 'active' : ''}`;
            btn.textContent = letter.toUpperCase();
            btn.addEventListener('click', () => onLetterClick(letter, btn));
            this.els.alphabetFilters.appendChild(btn);
        });
    }

    updateAlphabetUI(activeButton) {
        this.els.alphabetFilters.querySelectorAll('.alphabet-chip').forEach(btn => {
            btn.classList.remove('active');
        });
        if (activeButton) activeButton.classList.add('active');
    }

    _renderEmptyState() {
        this.els.container.style.display = 'block';
        const clone = this.templates.empty.content.cloneNode(true);
        clone.querySelector('.empty-state-silent').innerHTML = Icons.error_404;
        this.els.container.appendChild(clone);
    }

    renderErrorState(message) {
        this.els.loader.style.display = 'none';
        this.els.container.innerHTML = '';
        this.els.container.style.display = 'block';
        
        const clone = this.templates.error.content.cloneNode(true);
        clone.querySelector('.error-message').textContent = message;
        this.els.container.appendChild(clone);
    }
}