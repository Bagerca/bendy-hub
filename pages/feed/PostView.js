import { formatRichText } from '../../shared/js/utils.js';
import { Logger } from '../../shared/js/Logger.js';

/**
 * View: Отвечает только за создание DOM элемента одной карточки.
 * Никаких сетевых запросов. Зависимости передаются снаружи.
 */
export class PostView {
    constructor(templateId, lightboxManager, translationService) {
        this.template = document.getElementById(templateId);
        this.lightbox = lightboxManager;
        this.translator = translationService;
        this.fallbackAvatar = 'data:image/svg+xml;charset=UTF-8,%3Csvg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="%2365676B" stroke-width="2"%3E%3Cpath d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/%3E%3Ccircle cx="12" cy="7" r="4"/%3E%3C/svg%3E';
    }

    render(post, searchTerm = '') {
        try {
            const clone = this.template.content.cloneNode(true);
            const rawText = this._extractText(post, clone);
            
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
        
        // Обработка ретвитов
        const rtMatch = post.content.match(/^RT\s+(?:by\s+)?(@[\w_]+)[\s:]+([\s\S]*)$/i);
        if (rtMatch) {
            text = rtMatch[2].trim();
            rtAuthorLink.textContent = rtMatch[1];
            rtAuthorLink.href = `https://twitter.com/${rtMatch[1].replace('@', '')}`;
            rtBadge.style.display = 'flex';
        }

        // Удаление мусорных gif подписей
        if (text.trim().toLowerCase() === 'gif') text = '';
        return text;
    }

    _setupText(clone, text, searchTerm) {
        let richHtml = formatRichText(text);
        if (searchTerm) {
            // Подсветка поиска
            const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})(?![^<]*>)`, 'gi');
            richHtml = richHtml.replace(regex, '<mark class="search-highlight">$1</mark>');
        }
        clone.querySelector('.post-text').innerHTML = richHtml;
    }

    _setupMeta(clone, post) {
        clone.querySelector('.post-author-name').textContent = post.authorName;
        
        const badgeEl = clone.querySelector('.post-platform-badge');
        if (post.platform) badgeEl.textContent = post.platform;
        else badgeEl.style.display = 'none';

        const handleEl = clone.querySelector('.post-author-handle');
        handleEl.textContent = post.authorHandle;
        if (post.platform === 'twitter') {
            handleEl.href = `https://twitter.com/${post.authorHandle.replace('@', '')}`;
        }

        const avatarEl = clone.querySelector('.post-avatar');
        const predictedPath = `assets/avatars/${post.authorHandle.replace('@', '').toLowerCase()}.jpg`;
        const internetUrl = post.originalAvatarUrl || post.avatarUrl;

        avatarEl.onerror = () => {
            if (avatarEl.src.includes(predictedPath) && internetUrl) {
                avatarEl.src = internetUrl;
            } else if (!avatarEl.src.includes('data:image')) {
                avatarEl.src = this.fallbackAvatar;
            }
        };
        avatarEl.src = post.localAvatarPath || predictedPath;

        const dateEl = clone.querySelector('.post-date');
        if (post.timestamp) {
            dateEl.textContent = new Date(post.timestamp).toLocaleString('ru-RU', {
                day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
            });
            dateEl.setAttribute('datetime', post.timestamp);
        }
    }

    _setupMedia(clone, post) {
        if (!post.mediaUrl || post.mediaUrl === 'null') return;

        if (post.mediaUrl.match(/\.(mp4|m3u8|webm)/i) || post.mediaUrl.includes('/video/')) {
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
        const translationContainer = clone.querySelector('.post-translation');
        const translateTextEl = clone.querySelector('.post-translation-text');

        // Логика копирования
        copyBtn.addEventListener('click', async () => {
            try {
                await navigator.clipboard.writeText(rawText);
                copyBtn.classList.add('success');
                setTimeout(() => copyBtn.classList.remove('success'), 2000);
            } catch (err) {
                Logger.error('Ошибка буфера обмена', err);
            }
        });

        // Логика перевода через инжектированный сервис
        translateBtn.addEventListener('click', async () => {
            const isTranslated = translateBtn.classList.contains('active');
            
            if (isTranslated) {
                translationContainer.style.display = 'none';
                translateBtn.classList.remove('active');
                return;
            }

            // Если перевод уже лежит в DOM
            if (translateTextEl.innerHTML !== '') {
                translationContainer.style.display = 'block';
                translateBtn.classList.add('active');
                return;
            }

            // Запрашиваем новый перевод
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