import { formatRichText } from '../../shared/js/utils.js';
import { Logger } from '../../shared/js/Logger.js';
import { SmartSearch } from '../../shared/js/SmartSearch.js';
import { Icons } from '../../shared/js/icons.js';

export class PostView {
    constructor(templateId, lightboxManager, translationService, authorNamesMap = {}) {
        this.template = document.getElementById(templateId);
        this.lightbox = lightboxManager;
        this.translator = translationService;
        this.authorNamesMap = authorNamesMap; 
        this.fallbackAvatar = Icons.avatar_fallback;
    }

    render(post, searchTerm = '') {
        try {
            const clone = this.template.content.cloneNode(true);
            const rawText = this._extractText(post, clone);
            
            this._setupContext(clone, post);
            this._setupText(clone, rawText, searchTerm);
            this._setupMeta(clone, post);
            this._setupMedia(clone, post);
            this._setupActions(clone, rawText);

            return clone;
        } catch (error) { 
            Logger.error(`Ошибка сборки поста ${post.id}`, error);
            return null; 
        }
    }

    _extractText(post, clone) {
        const rtBadge = clone.querySelector('.rt-badge');
        let text = post.content;
        
        // Ищем паттерн ретвита (например: "RT @BendyRun:" или "RT by @Bendy:")
        const rtMatch = post.content.match(/^RT\s+(?:by\s+)?(@[\w_]+)[\s:]+([\s\S]*)$/i);
        if (rtMatch) {
            text = rtMatch[2].trim();
            const originalAuthorHandle = rtMatch[1]; // Кого ретвитнули
            
            // Кто сделал ретвит (берем из данных поста)
            const retweeterClean = post.authorHandle.replace('@', '').toLowerCase();
            const retweeterName = this.authorNamesMap[`@${retweeterClean}`] || post.authorName;

            rtBadge.style.display = 'flex';
            rtBadge.innerHTML = `${Icons.action_repost} <span>${retweeterName} репостнул(а)</span>`;

            // Флаг для _setupMeta, чтобы подменить аватарку и имя
            post.isRetweet = true;
            
            // Если это странный формат "RT by @Bendy", значит пост изначально чужой.
            // Но в основном мы будем использовать originalAuthorHandle.
            if (post.content.toLowerCase().startsWith('rt by')) {
                // Если Твиттер выдал "RT by", значит originalAuthorHandle - это тот, кто репостнул.
                // В этом случае автор поста уже правильный, просто плашка была кривой.
                post.isRetweet = false; 
                rtBadge.innerHTML = `${Icons.action_repost} <span>Репост от <a href="https://twitter.com/${originalAuthorHandle.replace('@', '')}" target="_blank" rel="noopener noreferrer">${originalAuthorHandle}</a></span>`;
            } else {
                post.originalAuthorHandle = originalAuthorHandle;
            }
        }

        if (text.trim().toLowerCase() === 'gif') text = '';
        return text;
    }

    _setupContext(clone, post) {
        const refBadge = clone.querySelector('.reference-badge');
        const quoteCard = clone.querySelector('.quote-card');

        if (!post.referenceType || !post.referenceUrl) return;

        if (post.referenceType === 'reply') {
            refBadge.style.display = 'inline-flex';
            const linkA = refBadge.querySelector('.ref-link');
            refBadge.querySelector('.ref-text').textContent = 'В ответ:';
            linkA.textContent = post.referenceAuthor || 'Оригинал';
            linkA.href = post.referenceUrl;
        } 
        else if (post.referenceType === 'quote') {
            quoteCard.style.display = 'block';
            
            quoteCard.querySelector('.quote-author-name').textContent = post.referenceAuthorName || post.referenceAuthor || 'Пользователь';
            quoteCard.querySelector('.quote-author-handle').textContent = post.referenceAuthor || '';

            const quoteAvatar = quoteCard.querySelector('.quote-avatar');
            if (post.referenceAvatarUrl) {
                quoteAvatar.src = post.referenceAvatarUrl.replace('_normal', '_200x200');
                quoteAvatar.style.display = 'block';
                quoteAvatar.onerror = () => { quoteAvatar.src = this.fallbackAvatar; };
            }

            if (post.referenceText) {
                quoteCard.querySelector('.quote-text').innerHTML = formatRichText(post.referenceText);
            } else {
                quoteCard.querySelector('.quote-text').style.display = 'none';
            }

            const qMedia = quoteCard.querySelector('.quote-media');
            if (post.referenceMediaUrl) {
                qMedia.src = post.referenceMediaUrl;
                qMedia.style.display = 'block';
                qMedia.onclick = (e) => {
                    e.stopPropagation(); 
                    this.lightbox.open(post.referenceMediaUrl);
                };
            } else {
                qMedia.style.display = 'none';
            }

            quoteCard.addEventListener('click', () => {
                window.open(post.referenceUrl, '_blank', 'noopener,noreferrer');
            });
        }
    }

    _setupText(clone, text, searchTerm) {
        let richHtml = formatRichText(text);
        if (searchTerm) {
            const escapedTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const altTerm = SmartSearch.switchLayout(searchTerm).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(`(${escapedTerm}|${altTerm})(?![^<]*>)`, 'gi');
            richHtml = richHtml.replace(regex, '<mark class="search-highlight">$1</mark>');
        }
        clone.querySelector('.post-text').innerHTML = richHtml;
    }

    _setupMeta(clone, post) {
        // МАГИЯ: Если это ретвит, подменяем данные на того, кого ретвитнули
        const handleToUse = post.isRetweet ? post.originalAuthorHandle : post.authorHandle;
        const handleClean = (handleToUse || '').replace('@', '').trim().toLowerCase();
        
        // Пытаемся найти красивое имя в базе, если нет - оставляем @ник
        const displayName = this.authorNamesMap[`@${handleClean}`] || handleToUse;

        clone.querySelector('.post-author-name').textContent = displayName;
        
        const badgeEl = clone.querySelector('.post-platform-badge');
        if (post.platform) badgeEl.textContent = post.platform;
        else badgeEl.style.display = 'none';

        const handleEl = clone.querySelector('.post-author-handle');
        handleEl.textContent = handleToUse;
        if (post.platform === 'twitter') {
            handleEl.href = `https://twitter.com/${handleClean}`;
        }

        // Аватарка. Если автор чужой (не из нашей папки assets), сработает onerror и поставится заглушка
        const avatarEl = clone.querySelector('.post-avatar');
        avatarEl.src = `assets/developers/${handleClean}/avatar.jpg`;
        avatarEl.onerror = () => { avatarEl.src = this.fallbackAvatar; };

        const dateEl = clone.querySelector('.post-date');
        if (post.timestamp) {
            dateEl.textContent = new Date(post.timestamp).toLocaleString('ru-RU', {
                day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
            });
            dateEl.setAttribute('datetime', post.timestamp);
        }
    }

    _setupMedia(clone, post) {
        if (!post.mediaUrl) return;

        if (post.mediaType === 'video' || post.mediaUrl.endsWith('.mp4')) {
            const videoEl = clone.querySelector('.video-media');
            videoEl.src = post.mediaUrl;
            videoEl.style.display = 'block';
        } else {
            const imgEl = clone.querySelector('.img-media');
            imgEl.src = post.mediaUrl;
            imgEl.style.display = 'block';
            imgEl.addEventListener('click', () => this.lightbox.open(post.mediaUrl));
            imgEl.onerror = () => imgEl.style.display = 'none';
        }
    }

    _setupActions(clone, rawText) {
        const actionsBlock = clone.querySelector('.post-actions');
        if (!rawText.trim()) {
            actionsBlock.style.display = 'none';
            return;
        }

        const copyBtn = clone.querySelector('.copy-btn');
        const translateBtn = clone.querySelector('.translate-btn');
        
        translateBtn.insertAdjacentHTML('afterbegin', Icons.action_translate);
        copyBtn.insertAdjacentHTML('afterbegin', Icons.action_copy);

        const translationContainer = clone.querySelector('.post-translation');
        const translateTextEl = clone.querySelector('.post-translation-text');

        copyBtn.addEventListener('click', async () => {
            try {
                await navigator.clipboard.writeText(rawText);
                copyBtn.classList.add('success');
                setTimeout(() => copyBtn.classList.remove('success'), 2000);
            } catch (err) {
                Logger.error('Ошибка буфера обмена', err);
            }
        });

        translateBtn.addEventListener('click', async () => {
            const isTranslated = translateBtn.classList.contains('active');
            
            if (isTranslated) {
                translationContainer.style.display = 'none';
                translateBtn.classList.remove('active');
                return;
            }

            if (translateTextEl.innerHTML !== '') {
                translationContainer.style.display = 'block';
                translateBtn.classList.add('active');
                return;
            }

            try {
                translateBtn.classList.add('loading');
                const translatedText = await this.translator.translate(rawText);
                
                translateTextEl.innerHTML = formatRichText(translatedText);
                translateTextEl.style.color = "var(--text-main)";
                translationContainer.style.display = 'block';
                translateBtn.classList.replace('loading', 'active');
            } catch (err) {
                translateBtn.classList.remove('loading');
                translationContainer.style.display = 'block';
                translateTextEl.innerHTML = err.message === 'RATE_LIMIT' 
                    ? `<em>Слишком много запросов. Попробуйте позже.</em>` 
                    : `<em>Ошибка перевода: сервис недоступен.</em>`;
                translateTextEl.style.color = "var(--error-color)";
            }
        });
    }
}