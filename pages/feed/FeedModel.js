import { SmartSearch } from '../../shared/js/SmartSearch.js';

export class FeedModel {
    constructor(chunkSize = 20) {
        this.allPosts = [];
        this.filteredPosts = [];
        this.chunkSize = chunkSize;
        this.currentIndex = 0;
        
        this.currentSearchTerm = '';
        this.currentAuthor = 'all';
    }

    setPosts(posts) {
        this.allPosts = posts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        this.applyFilters('', 'all');
    }

    getSuggestions(query) {
        // Подсказываем только имена авторов
        const results = SmartSearch.execute(query, this.allPosts, ['authorName', 'authorHandle']);
        const uniqueAuthors = [...new Set(results.map(p => p.authorName))];
        
        return uniqueAuthors.slice(0, 5).map(name => ({ 
            label: `Твиты автора: <span style="color: var(--accent-color);">${name}</span>`, 
            value: name 
        }));
    }

    applyFilters(searchTerm, authorId) {
        this.currentSearchTerm = searchTerm.toLowerCase().trim();
        this.currentAuthor = authorId;
        
        // Умный поиск по тексту поста и имени
        let result = SmartSearch.execute(this.currentSearchTerm, this.allPosts, ['content', 'authorName']);

        // Строгий фильтр по автору из селекта
        if (this.currentAuthor !== 'all') {
            result = result.filter(post => post.authorHandle === this.currentAuthor);
        }

        this.filteredPosts = result;
        this.currentIndex = 0; 
    }

    getNextChunk() {
        const chunk = this.filteredPosts.slice(this.currentIndex, this.currentIndex + this.chunkSize);
        this.currentIndex += this.chunkSize;
        return chunk;
    }

    hasMore() { return this.currentIndex < this.filteredPosts.length; }
    getSearchTerm() { return this.currentSearchTerm; }
    isEmpty() { return this.filteredPosts.length === 0; }
}