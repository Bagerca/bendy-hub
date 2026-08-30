export class SmartSearch {
    static layoutMapEnToRu = {
        'q':'й', 'w':'ц', 'e':'у', 'r':'к', 't':'е', 'y':'н', 'u':'г', 'i':'ш', 'o':'щ', 'p':'з', '[':'х', ']':'ъ',
        'a':'ф', 's':'ы', 'd':'в', 'f':'а', 'g':'п', 'h':'р', 'j':'о', 'k':'л', 'l':'д', ';':'ж', "'":'э',
        'z':'я', 'x':'ч', 'c':'с', 'v':'м', 'b':'и', 'n':'т', 'm':'ь', ',':'б', '.':'ю', '`':'ё'
    };
    
    static layoutMapRuToEn = Object.fromEntries(Object.entries(this.layoutMapEnToRu).map(([k, v]) => [v, k]));

    // Автоматическая смена раскладки введенного текста
    static switchLayout(str) {
        const isRu = /[а-яё]/i.test(str);
        const map = isRu ? this.layoutMapRuToEn : this.layoutMapEnToRu;
        return str.split('').map(c => {
            const lower = c.toLowerCase();
            const mapped = map[lower];
            if (!mapped) return c;
            return c === lower ? mapped : mapped.toUpperCase();
        }).join('');
    }

    // Оценка релевантности совпадения
    static getMatchScore(query, text) {
        query = query.toLowerCase();
        text = text.toLowerCase();
        
        if (text === query) return 100; // Точное совпадение
        if (text.startsWith(query)) return 90; // Начинается с запроса
        if (text.includes(query)) return 70; // Содержит подстроку
        
        // Умный поиск по отдельным словам (порядок не важен)
        const words = query.split(/\s+/).filter(w => w.length > 0);
        if (words.length > 1 && words.every(w => text.includes(w))) return 60;

        // ВАЖНО: Отключаем Fuzzy Search (разбросанные буквы) для длинных текстов.
        // Иначе в посте на 200+ символов всегда найдутся 4 любые буквы, и поиск выдаст весь мусор.
        if (query.length > 3 && text.length <= 80) {
            let textIdx = 0;
            let matches = 0;
            for (let i = 0; i < query.length; i++) {
                const foundIdx = text.indexOf(query[i], textIdx);
                if (foundIdx !== -1) {
                    matches++;
                    textIdx = foundIdx + 1;
                }
            }
            if (matches >= query.length - 1) return 40; 
        }

        return 0;
    }

    /**
     * @param {string} query Поисковой запрос
     * @param {Array} items Массив объектов для поиска
     * @param {Array} fields Массив строковых путей ключей (например: ['title', 'meta.aliases'])
     */
    static execute(query, items, fields = []) {
        if (!query || query.trim() === '') return items; // Возвращаем всё, если запрос пуст
        
        const cleanQuery = query.trim();
        const altQuery = this.switchLayout(cleanQuery);

        const scoredItems = items.map(item => {
            let maxScore = 0;
            
            fields.forEach(field => {
                const val = field.split('.').reduce((o, i) => o ? o[i] : null, item);
                
                const processValue = (v) => {
                    if (!v) return;
                    const strVal = String(v);
                    const score1 = this.getMatchScore(cleanQuery, strVal);
                    const score2 = this.getMatchScore(altQuery, strVal);
                    maxScore = Math.max(maxScore, score1, score2);
                };

                if (Array.isArray(val)) {
                    val.forEach(processValue);
                } else {
                    processValue(val);
                }
            });
            
            return { item, score: maxScore };
        });

        // Отсеиваем несовпадения и сортируем по релевантности
        return scoredItems
            .filter(res => res.score > 0)
            .sort((a, b) => b.score - a.score)
            .map(res => res.item);
    }
}