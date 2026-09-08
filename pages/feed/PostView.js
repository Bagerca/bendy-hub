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
            this._setupCards(clone, post);
            this._setupActions(clone, rawText, post);

            return clone;
        } catch (error) { 
            Logger.error(`Ошибка сборки поста ${post.id}`, error);
            return null; 
        }
    }

    _extractText(post, clone) {
        const rtBadge = clone.querySelector('.rt-badge');
        let text = post.content;
        
        const cleanRtMatch = text.match(/^RT\s+@([\w_]+)[\s:]+([\s\S]*)$/i);
        const brokenRtMatch = text.match(/^RT\s+by\s+@([\w_]+)[\s:]+([\s\S]*)$/i);

        if (cleanRtMatch) {
            const originalAuthorHandle = cleanRtMatch[1]; 
            text = cleanRtMatch[2].trim();
            
            const retweeterClean = post.authorHandle.replace('@', '').toLowerCase();
            const retweeterName = this.authorNamesMap[`@${retweeterClean}`] || post.authorName;

            rtBadge.style.display = 'flex';
            rtBadge.innerHTML = `${Icons.action_repost} <span>${retweeterName} репостнул(а) <a href="https://twitter.com/${originalAuthorHandle}" target="_blank" rel="noopener noreferrer">@${originalAuthorHandle}</a></span>`;
            
            post.isRetweet = true;
            post.originalAuthorHandle = `@${originalAuthorHandle}`;

        } else if (brokenRtMatch) {
            text = brokenRtMatch[2].trim();
            const retweeterClean = post.authorHandle.replace('@', '').toLowerCase();
            const retweeterName = this.authorNamesMap[`@${retweeterClean}`] || post.authorName;

            rtBadge.style.display = 'flex';
            rtBadge.innerHTML = `${Icons.action_repost} <span>${retweeterName} репостнул(а) запись</span>`;

            post.isRetweet = true;
            post.originalAuthorHandle = null; 
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
            linkA.textContent = post.referenceAuthor || 'Пользователю';
            linkA.href = post.referenceUrl;
            linkA.title = 'Перейти к оригинальному твиту в X/Twitter';
        } 
        else if (post.referenceType === 'quote') {
            quoteCard.style.display = 'block';
            quoteCard.title = 'Перейти к цитируемому твиту в X/Twitter';
            
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

            const qMediaGrid = quoteCard.querySelector('.quote-media-grid');
            if (post.referenceMedia && post.referenceMedia.length > 0) {
                const limit = Math.min(post.referenceMedia.length, 4);
                qMediaGrid.dataset.count = limit;
                qMediaGrid.style.display = 'grid';
                
                post.referenceMedia.slice(0, 4).forEach(m => {
                    const el = this._createMediaElement(m);
                    qMediaGrid.appendChild(el);
                });
            } else {
                qMediaGrid.style.display = 'none';
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
        const handleToUse = (post.isRetweet && post.originalAuthorHandle) ? post.originalAuthorHandle : post.authorHandle;
        const handleClean = (handleToUse || '').replace('@', '').trim().toLowerCase();
        
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
        const grid = clone.querySelector('.post-media-grid');
        
        if (!post.media || post.media.length === 0) {
            grid.style.display = 'none';
            return;
        }

        const limit = Math.min(post.media.length, 4);
        grid.dataset.count = limit;
        grid.style.display = 'grid';

        post.media.slice(0, 4).forEach(m => {
            const el = this._createMediaElement(m);
            grid.appendChild(el);
        });
    }

    // НОВЫЙ МЕТОД: Отрисовка карточек ссылок
    _setupCards(clone, post) {
        const cardsContainer = clone.querySelector('.post-cards-container');
        if (!post.linkCards || post.linkCards.length === 0) {
            cardsContainer.style.display = 'none';
            return;
        }
        
        cardsContainer.style.display = 'flex';
        post.linkCards.forEach(card => {
            const a = document.createElement('a');
            a.className = 'link-card';
            a.href = card.url;
            a.target = '_blank';
            a.rel = 'noopener noreferrer';
            
            a.innerHTML = `
                ${card.image ? `<img src="${card.image}" class="lc-image" alt="Cover" loading="lazy">` : ''}
                <div class="lc-content">
                    ${card.domain ? `<div class="lc-domain">${card.domain}</div>` : ''}
                    <div class="lc-title">${card.title}</div>
                    ${card.description ? `<div class="lc-desc">${card.description}</div>` : ''}
                </div>
            `;
            cardsContainer.appendChild(a);
        });
    }

    _createMediaElement(m) {
        if (m.type === 'video' || m.type === 'gif' || m.url.endsWith('.mp4')) {
            const videoEl = document.createElement('video');
            videoEl.className = 'media-item video-media';
            videoEl.src = m.url;
            
            if (m.type === 'gif') {
                videoEl.autoplay = true;
                videoEl.loop = true;
                videoEl.muted = true;
                videoEl.playsInline = true;
            } else {
                videoEl.controls = true;
            }
            videoEl.preload = 'metadata';
            
            videoEl.addEventListener('click', (e) => e.stopPropagation()); 
            return videoEl;
        } else {
            const imgEl = document.createElement('img');
            imgEl.className = 'media-item img-media';
            imgEl.src = m.url;
            imgEl.loading = 'lazy';
            imgEl.title = 'Нажмите для увеличения';
            imgEl.addEventListener('click', (e) => {
                e.stopPropagation();
                this.lightbox.open(m.url);
            });
            imgEl.onerror = () => imgEl.style.display = 'none';
            return imgEl;
        }
    }

    _setupActions(clone, rawText, post) {
        const actionsBlock = clone.querySelector('.post-actions');
        
        const cleanHandle = (post.authorHandle || '').replace('@', '');
        const cleanId = post.id.split('#')[0]; 
        
        const twitterBtn = document.createElement('a');
        twitterBtn.className = 'action-btn twitter-btn';
        twitterBtn.href = `https://twitter.com/${cleanHandle}/status/${cleanId}`;
        twitterBtn.target = '_blank';
        twitterBtn.rel = 'noopener noreferrer';
        twitterBtn.title = 'Посмотреть оригинал в X / Twitter';
        twitterBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>`;
        actionsBlock.appendChild(twitterBtn);

        if (!rawText.trim()) {
            clone.querySelector('.copy-btn').style.display = 'none';
            clone.querySelector('.translate-btn').style.display = 'none';
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