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
    }

    setPosts(posts) {
        this.allPosts = posts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        // Первичная фильтрация происходит из контроллера
    }

    applyFilters(searchTerm, authorIds, postTypes) {
        this.currentSearchTerm = searchTerm.toLowerCase().trim();
        this.currentAuthors = authorIds;
        this.currentPostTypes = postTypes;
        
        let result = SmartSearch.execute(this.currentSearchTerm, this.allPosts, ['content', 'referenceText']);

        // Если сброшены все чекбоксы в любом из фильтров - ничего не показываем
        if (this.currentAuthors.length === 0 || this.currentPostTypes.length === 0) {
            this.filteredPosts = [];
            this.currentIndex = 0;
            return;
        }

        // Фильтр по авторам (Показываем пост, если автор есть в массиве выбранных)
        result = result.filter(post => {
            // Нормализуем хэндлы для точного сравнения (в базе с '@', в фильтре тоже)
            return this.currentAuthors.some(authorId => 
                authorId.toLowerCase() === post.authorHandle.toLowerCase()
            );
        });

        // Фильтр по типу поста (Мульти-селект)
        result = result.filter(post => {
            const isRT = /^RT\s+(?:by\s+)?(@[\w_]+)[\s:]/i.test(post.content) || post.isRetweet;
            const isQuote = post.referenceType === 'quote';
            
            let isMatch = false;

            // Если не РТ и не Цитата, считаем это оригинальным
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