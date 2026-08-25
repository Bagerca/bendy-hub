/**
 * Model: Отвечает ИСКЛЮЧИТЕЛЬНО за логику данных, фильтрацию и пагинацию.
 * Никакого DOM, никаких document.getElementById.
 */
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
        // Сортировка от новых к старым при инициализации
        this.allPosts = posts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        this.applyFilters('', 'all');
    }

    applyFilters(searchTerm, authorId) {
        this.currentSearchTerm = searchTerm.toLowerCase().trim();
        this.currentAuthor = authorId;
        
        this.filteredPosts = this.allPosts.filter(post => {
            const matchAuthor = this.currentAuthor === 'all' || post.authorHandle === this.currentAuthor;
            const matchSearch = this.currentSearchTerm === '' || 
                                post.content.toLowerCase().includes(this.currentSearchTerm) || 
                                post.authorName.toLowerCase().includes(this.currentSearchTerm);
            
            return matchAuthor && matchSearch;
        });

        this.currentIndex = 0; // Сбрасываем пагинацию при новом фильтре
    }

    getNextChunk() {
        const chunk = this.filteredPosts.slice(this.currentIndex, this.currentIndex + this.chunkSize);
        this.currentIndex += this.chunkSize;
        return chunk;
    }

    hasMore() {
        return this.currentIndex < this.filteredPosts.length;
    }

    getSearchTerm() {
        return this.currentSearchTerm;
    }

    isEmpty() {
        return this.filteredPosts.length === 0;
    }
}