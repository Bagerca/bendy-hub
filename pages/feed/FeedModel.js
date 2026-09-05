import { SmartSearch } from '../../shared/js/SmartSearch.js';

export class FeedModel {
    constructor(chunkSize = 20) {
        this.allPosts = [];
        this.filteredPosts = [];
        this.chunkSize = chunkSize;
        this.currentIndex = 0;
        
        this.currentSearchTerm = '';
        this.currentAuthor = 'all';
        this.currentPostType = 'all';
    }

    setPosts(posts) {
        this.allPosts = posts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        this.applyFilters('', 'all', 'all');
    }

    applyFilters(searchTerm, authorId, postType = 'all') {
        this.currentSearchTerm = searchTerm.toLowerCase().trim();
        this.currentAuthor = authorId;
        this.currentPostType = postType;
        
        let result = SmartSearch.execute(this.currentSearchTerm, this.allPosts, ['content', 'referenceText']);

        if (this.currentAuthor !== 'all') {
            result = result.filter(post => post.authorHandle.toLowerCase() === this.currentAuthor.toLowerCase());
        }

        if (this.currentPostType !== 'all') {
            result = result.filter(post => {
                const isRT = /^RT\s+(?:by\s+)?(@[\w_]+)[\s:]/i.test(post.content);
                const isReply = post.referenceType === 'reply';
                const isQuote = post.referenceType === 'quote';
                
                // "Чистые" - это просто личный твит (не РТ, не Ответ фанату, не Цитата)
                if (this.currentPostType === 'clean') return !isRT && !isReply && !isQuote;
                if (this.currentPostType === 'quotes') return isQuote;
                if (this.currentPostType === 'retweets') return isRT;
                
                return true;
            });
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