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

        // Заглушка, если нет фото
        this.fallbackSvg = `
            <div class="char-fallback">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
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
            
            card.href = `character.html?id=${char.id}`;
            clone.querySelector('.char-card-name').textContent = char.name;

            // Логика извлечения аватарок (из версий или основной)
            let avatarsToRender = [];
            
            if (char.versions && char.versions.length > 1) {
                // Если есть версии, берем аватарки из них (максимум 3)
                avatarsToRender = char.versions
                    .map(v => v.assets?.avatar)
                    .filter(a => a && a !== '...')
                    .slice(0, 3);
            } else {
                // Если версий нет, берем основную
                const photo = char.assets?.avatar || char.assets?.full_body;
                if (photo && photo !== '...') avatarsToRender.push(photo);
            }

            // Глубокий контроль DOM (Сборка аватарки)
            if (avatarsToRender.length === 0) {
                // СОСТОЯНИЕ 1: Нет картинок (Заглушка)
                avatarWrapper.classList.remove('is-stack');
                avatarWrapper.innerHTML = this.fallbackSvg;

            } else if (avatarsToRender.length === 1) {
                // СОСТОЯНИЕ 2: Одна картинка
                avatarWrapper.classList.remove('is-stack');
                
                const img = document.createElement('img');
                img.className = 'char-img single-img';
                img.loading = 'lazy';
                img.src = `assets/characters/${char.id}/${avatarsToRender[0]}`;
                
                // Если картинка не грузится, заменяем её на fallback
                img.onerror = () => { 
                    avatarWrapper.innerHTML = this.fallbackSvg; 
                };
                
                avatarWrapper.appendChild(img);

            } else {
                // СОСТОЯНИЕ 3: Стопка (Stack) из 2-3 картинок
                avatarWrapper.classList.add('is-stack');
                
                avatarsToRender.forEach((photo, index) => {
                    const img = document.createElement('img');
                    img.className = 'char-img stack-img';
                    img.loading = 'lazy';
                    img.src = `assets/characters/${char.id}/${photo}`;
                    
                    // Жестко задаем z-index через JS: первый элемент выше всех (10, 9, 8...)
                    img.style.zIndex = 10 - index;
                    
                    // Если картинка из стопки не загрузилась, просто скрываем её (не ломая остальную стопку)
                    img.onerror = () => { img.style.display = 'none'; };
                    
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

        // Кнопка "Все"
        const allBtn = document.createElement('button');
        allBtn.className = `alphabet-chip ${currentLetter === 'all' ? 'active' : ''}`;
        allBtn.textContent = 'Все';
        allBtn.addEventListener('click', () => onLetterClick('all', allBtn));
        this.els.alphabetFilters.appendChild(allBtn);

        // Буквы
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