import { SmartSearch } from '../../shared/js/SmartSearch.js';

export class FeedModel {
    constructor(chunkSize = 20) {
        this.allPosts = [];
        this.filteredPosts = [];
        this.chunkSize = chunkSize;
        this.currentIndex = 0;
        
        this.currentSearchTerm = '';
        this.currentAuthors = [];
        this.currentPostTypes = [];
        this.currentSortDir = 'desc'; // По умолчанию сначала новые
    }

    setPosts(posts) {
        // Загружаем посты как есть, сортировка будет применяться в applyFilters
        this.allPosts = posts;
    }

    applyFilters(searchTerm, authorIds, postTypes, sortDir = 'desc') {
        this.currentSearchTerm = searchTerm.toLowerCase().trim();
        this.currentAuthors = authorIds;
        this.currentPostTypes = postTypes;
        this.currentSortDir = sortDir;
        
        let result = SmartSearch.execute(this.currentSearchTerm, this.allPosts, ['content', 'referenceText']);

        if (this.currentAuthors.length === 0 || this.currentPostTypes.length === 0) {
            this.filteredPosts = [];
            this.currentIndex = 0;
            return;
        }

        result = result.filter(post => {
            return this.currentAuthors.some(authorId => 
                authorId.toLowerCase() === post.authorHandle.toLowerCase()
            );
        });

        result = result.filter(post => {
            const isRT = /^RT\s+(?:by\s+)?(@[\w_]+)[\s:]/i.test(post.content) || post.isRetweet;
            const isQuote = post.referenceType === 'quote';
            
            let isMatch = false;

            if (this.currentPostTypes.includes('clean') && !isRT && !isQuote) isMatch = true;
            if (this.currentPostTypes.includes('quotes') && isQuote) isMatch = true;
            if (this.currentPostTypes.includes('retweets') && isRT) isMatch = true;
            
            if (this.currentPostTypes.includes('images')) {
                const hasImage = (post.media && post.media.some(m => m.type === 'image')) || 
                                 (post.referenceMedia && post.referenceMedia.some(m => m.type === 'image'));
                if (hasImage) isMatch = true;
            }
            
            if (this.currentPostTypes.includes('videos')) {
                const hasVideo = (post.media && post.media.some(m => m.type === 'video' || m.type === 'gif')) || 
                                 (post.referenceMedia && post.referenceMedia.some(m => m.type === 'video' || m.type === 'gif'));
                if (hasVideo) isMatch = true;
            }
            
            if (this.currentPostTypes.includes('links')) {
                if (post.linkCards && post.linkCards.length > 0) isMatch = true;
            }
            
            return isMatch;
        });

        // >>> ПРИМЕНЯЕМ СОРТИРОВКУ ПО ДАТЕ <<<
        result.sort((a, b) => {
            const dateA = new Date(a.timestamp).getTime();
            const dateB = new Date(b.timestamp).getTime();
            return this.currentSortDir === 'asc' ? dateA - dateB : dateB - dateA;
        });

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