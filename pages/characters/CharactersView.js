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
            const imgEl = clone.querySelector('.char-img');
            
            card.href = `character.html?id=${char.id}`;
            clone.querySelector('.char-card-name').textContent = char.name;

            const photo = char.assets?.avatar || char.assets?.full_body;
            if (photo) {
                imgEl.src = `assets/characters/${char.id}/${photo}`;
                imgEl.style.display = 'block';
            } else {
                imgEl.style.display = 'none'; 
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