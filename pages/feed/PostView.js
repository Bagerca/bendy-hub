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
        const handleLower = (post.authorHandle || '').toLowerCase();
        const displayName = this.authorNamesMap[handleLower] || post.authorName || post.authorHandle;

        clone.querySelector('.post-author-name').textContent = displayName;
        
        const badgeEl = clone.querySelector('.post-platform-badge');
        if (post.platform) badgeEl.textContent = post.platform;
        else badgeEl.style.display = 'none';

        const handleEl = clone.querySelector('.post-author-handle');
        handleEl.textContent = post.authorHandle;
        if (post.platform === 'twitter') {
            handleEl.href = `https://twitter.com/${post.authorHandle.replace('@', '')}`;
        }

        const avatarEl = clone.querySelector('.post-avatar');
        const handleClean = post.authorHandle.replace('@', '').toLowerCase();
        const internetUrl = post.originalAvatarUrl || post.avatarUrl;
        
        const newLocalPath = `assets/developers/${handleClean}/avatar.jpg`;

        avatarEl.onerror = () => {
            if (!avatarEl.dataset.triedInternet && internetUrl) {
                avatarEl.dataset.triedInternet = 'true';
                avatarEl.src = internetUrl;
            } else if (!avatarEl.src.includes('data:image')) {
                avatarEl.src = this.fallbackAvatar;
            }
        };
        
        avatarEl.src = newLocalPath;

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