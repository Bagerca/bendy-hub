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
        
        // Иконка для ответов/цитат (используем изогнутую стрелку)
        this.replyIcon = `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"></path></svg>`;
    }

    render(post, searchTerm = '') {
        try {
            const clone = this.template.content.cloneNode(true);
            const rawText = this._extractText(post, clone);
            
            this._setupContext(clone, post); // Контекст (Цитаты/Ответы)
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
        const rtAuthorLink = clone.querySelector('.rt-author');
        let text = post.content;
        
        // Парсим ретвиты
        const rtMatch = post.content.match(/^RT\s+(?:by\s+)?(@[\w_]+)[\s:]+([\s\S]*)$/i);
        if (rtMatch) {
            text = rtMatch[2].trim();
            rtAuthorLink.textContent = rtMatch[1];
            rtAuthorLink.href = `https://twitter.com/${rtMatch[1].replace('@', '')}`;
            rtBadge.style.display = 'flex';
            rtBadge.insertAdjacentHTML('afterbegin', Icons.action_repost);
        }

        if (text.trim().toLowerCase() === 'gif') text = '';
        return text;
    }

    _setupContext(clone, post) {
        const refBadge = clone.querySelector('.reference-badge');
        
        // Если это не ответ и не цитата, ничего не делаем
        if (!post.referenceType || !post.referenceUrl) return;

        refBadge.style.display = 'inline-flex';
        refBadge.insertAdjacentHTML('afterbegin', this.replyIcon);
        
        const textSpan = refBadge.querySelector('.ref-text');
        const linkA = refBadge.querySelector('.ref-link');

        if (post.referenceType === 'reply') {
            textSpan.textContent = 'В ответ:';
        } else if (post.referenceType === 'quote') {
            textSpan.textContent = 'Цитата:';
        } else {
            textSpan.textContent = 'Ссылка:';
        }

        linkA.textContent = post.referenceAuthor || 'Оригинальный пост';
        linkA.href = post.referenceUrl;
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
        // Имя и хендл
        const handleClean = (post.authorHandle || '').replace('@', '').trim().toLowerCase();
        const displayName = this.authorNamesMap[`@${handleClean}`] || post.authorName || post.authorHandle;

        clone.querySelector('.post-author-name').textContent = displayName;
        
        const badgeEl = clone.querySelector('.post-platform-badge');
        if (post.platform) badgeEl.textContent = post.platform;
        else badgeEl.style.display = 'none';

        const handleEl = clone.querySelector('.post-author-handle');
        handleEl.textContent = post.authorHandle;
        if (post.platform === 'twitter') {
            handleEl.href = `https://twitter.com/${handleClean}`;
        }

        // АВАТАРКА: Жестко задаем путь, игнорируя то, что написано в JSON
        const avatarEl = clone.querySelector('.post-avatar');
        avatarEl.src = `assets/developers/${handleClean}/avatar.jpg`;
        avatarEl.onerror = () => { avatarEl.src = this.fallbackAvatar; };

        // Дата
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