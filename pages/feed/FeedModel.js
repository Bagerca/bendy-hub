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

    applyFilters(searchTerm, authorId) {
        this.currentSearchTerm = searchTerm.toLowerCase().trim();
        this.currentAuthor = authorId;
        
        // Умный поиск по тексту поста (имена исключили из поиска, так как есть отдельный фильтр)
        let result = SmartSearch.execute(this.currentSearchTerm, this.allPosts, ['content']);

        // Строгий фильтр по автору из селекта (фильтруем по тегу)
        if (this.currentAuthor !== 'all') {
            result = result.filter(post => post.authorHandle.toLowerCase() === this.currentAuthor.toLowerCase());
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