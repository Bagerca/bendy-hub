import { Icons } from '../../shared/js/icons.js';

export class CharactersView {
    constructor() {
        this.els = {
            container: document.getElementById('chars-content'),
            loader: document.getElementById('chars-loader'),
            count: document.getElementById('results-count'),
            alphabetFilters: document.getElementById('alphabet-filters')
        };
        
        this.templates = {
            card: document.getElementById('char-card-template'),
            empty: document.getElementById('empty-state-template'),
            error: document.getElementById('error-state-template')
        };

        this.fallbackSvg = `
            <div class="char-fallback">
                ${Icons.char_fallback}
            </div>
        `;
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
            const clone = this.templates.card.content.cloneNode(true);
            const card = clone.querySelector('.char-card');
            const avatarWrapper = clone.querySelector('.char-avatar-wrapper');
            
            const targetUrl = `character.html?id=${char.id}`;
            card.href = targetUrl;
            card.addEventListener('click', (e) => {
                e.preventDefault();
                if (window.router) {
                    window.router.navigate(targetUrl);
                } else {
                    window.location.href = targetUrl;
                }
            });

            clone.querySelector('.char-card-name').textContent = char.name;

            let avatarsToRender = [];
            
            if (char.versions && char.versions.length > 1) {
                avatarsToRender = char.versions
                    .map(v => v.assets?.avatar)
                    .filter(a => a && a !== '...')
                    .slice(0, 3);
            } else {
                const photo = char.assets?.avatar || char.assets?.full_body;
                if (photo && photo !== '...') avatarsToRender.push(photo);
            }

            if (avatarsToRender.length === 0) {
                avatarWrapper.classList.remove('is-stack');
                avatarWrapper.innerHTML = this.fallbackSvg;

            } else if (avatarsToRender.length === 1) {
                avatarWrapper.classList.remove('is-stack');
                
                const img = document.createElement('img');
                img.className = 'char-img single-img';
                img.loading = 'lazy';
                img.src = `assets/characters/${char.id}/${avatarsToRender[0]}`;
                
                img.onerror = function() { 
                    this.onerror = null; 
                    avatarWrapper.innerHTML = this.fallbackSvg; 
                }.bind(this);
                
                avatarWrapper.appendChild(img);

            } else {
                avatarWrapper.classList.add('is-stack');
                
                avatarsToRender.forEach((photo, index) => {
                    const img = document.createElement('img');
                    img.className = 'char-img stack-img';
                    img.loading = 'lazy';
                    img.src = `assets/characters/${char.id}/${photo}`;
                    
                    img.style.zIndex = 10 - index;
                    
                    img.onerror = function() { 
                        this.onerror = null; 
                        this.style.display = 'none'; 
                    };
                    
                    avatarWrapper.appendChild(img);
                });
            }

            fragment.appendChild(clone);
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
        this.els.container.appendChild(this.templates.empty.content.cloneNode(true));
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