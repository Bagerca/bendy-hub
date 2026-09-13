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
            
            // Сначала пробуем извлечь YouTube видео из текста/карточек
            const hasYouTube = this._setupYouTubeEmbed(clone, post, rawText);
            
            // Если YouTube видео успешно отрендерено, пропускаем обычные медиа и карточки,
            // чтобы не дублировать контент.
            if (!hasYouTube) {
                this._setupMedia(clone, post);
                this._setupCards(clone, post);
            }
            
            this._setupActions(clone, rawText, post);

            return clone;
        } catch (error) { 
            Logger.error(`Ошибка сборки поста ${post.id}`, error);
            return null; 
        }
    }

    _extractText(post, clone) {
        const rtBadge = clone.querySelector('.rt-badge');
        let text = post.content || '';

        // ОЧИСТКА: Убираем системные заглушки Twitter/Nitter, если твит состоит только из них
        const lowerText = text.trim().toLowerCase();
        if (['gif', '[gif]', 'image', '[image]', 'video', '[video]', 'image video'].includes(lowerText)) {
            text = '';
        }
        
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
        }

        return text;
    }

    _setupContext(clone, post) {
        const refBadge = clone.querySelector('.reference-badge');
        const quoteCard = clone.querySelector('.quote-card');

        if (!post.referenceType || !post.referenceUrl) return;

        if (post.referenceType === 'reply') {
            const cleanAuthor = (post.authorHandle || '').replace('@', '').toLowerCase();
            const cleanRefAuthor = (post.referenceAuthor || '').replace('@', '').toLowerCase();

            if (cleanAuthor === cleanRefAuthor) {
                refBadge.style.display = 'inline-flex';
                refBadge.classList.add('is-thread');
                refBadge.innerHTML = `${Icons.thread} <span class="ref-text">Продолжение ветки</span>`;
            } 
            else if (post.referenceText) {
                refBadge.style.display = 'inline-flex';
                refBadge.innerHTML = `${Icons.reply} <span class="ref-text">В ответ:</span>`;
                this._fillQuoteCard(quoteCard, post);
            } 
            else {
                refBadge.style.display = 'inline-flex';
                refBadge.innerHTML = `${Icons.reply} <span class="ref-text">В ответ:</span> <a class="ref-link" href="${post.referenceUrl}" target="_blank" rel="noopener noreferrer">${post.referenceAuthor || 'Пользователю'}</a>`;
            }
        } 
        else if (post.referenceType === 'quote') {
            this._fillQuoteCard(quoteCard, post);
        }
    }

    _fillQuoteCard(quoteCard, post) {
        quoteCard.style.display = 'block';
        quoteCard.title = 'Перейти к оригинальному твиту в X/Twitter';
        
        quoteCard.querySelector('.quote-author-name').textContent = post.referenceAuthorName || post.referenceAuthor || 'Пользователь';
        quoteCard.querySelector('.quote-author-handle').textContent = post.referenceAuthor || '';

        const quoteAvatar = quoteCard.querySelector('.quote-avatar');
        if (post.referenceAvatarUrl) {
            quoteAvatar.src = post.referenceAvatarUrl;
            quoteAvatar.style.display = 'block';
            quoteAvatar.onerror = () => { quoteAvatar.src = this.fallbackAvatar; };
        }

        if (post.referenceText) {
            quoteCard.querySelector('.quote-text').innerHTML = formatRichText(post.referenceText);
        } else {
            quoteCard.querySelector('.quote-text').style.display = 'none';
        }

        const qMediaContainer = quoteCard.querySelector('.quote-media-grid'); 
        
        if (post.referenceMedia && post.referenceMedia.length > 0) {
            qMediaContainer.style.display = 'block';
            qMediaContainer.innerHTML = ''; 
            qMediaContainer.style.backgroundImage = 'none';

            if (post.referenceMedia.length === 1) {
                qMediaContainer.className = 'quote-media-container single-media';
                if (post.referenceMedia[0].url) {
                    qMediaContainer.style.backgroundImage = `url('${post.referenceMedia[0].url}')`;
                }
                qMediaContainer.appendChild(this._createMediaElement(post.referenceMedia[0], post));
            } else {
                qMediaContainer.className = 'quote-media-container multi-media-slider';
                this._buildSlider(qMediaContainer, post.referenceMedia, post);
            }
        } else {
            qMediaContainer.style.display = 'none';
        }

        quoteCard.addEventListener('click', () => {
            window.open(post.referenceUrl, '_blank', 'noopener,noreferrer');
        });
    }

    _setupText(clone, text, searchTerm) {
        const textContainer = clone.querySelector('.post-text');
        if (!text) {
            textContainer.style.display = 'none';
            return;
        }

        let richHtml = formatRichText(text);
        if (searchTerm) {
            const escapedTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const altTerm = SmartSearch.switchLayout(searchTerm).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(`(${escapedTerm}|${altTerm})(?![^<]*>)`, 'gi');
            richHtml = richHtml.replace(regex, '<mark class="search-highlight">$1</mark>');
        }
        textContainer.innerHTML = richHtml;

        const lines = text.split('\n').length;
        if (text.length > 400 || lines > 7) {
            textContainer.classList.add('collapsed');
            const expandWrapper = document.createElement('div');
            expandWrapper.className = 'post-text-collapse-wrapper';
            const expandBtn = document.createElement('button');
            expandBtn.className = 'expand-text-btn';
            expandBtn.innerHTML = `Показать полностью ${Icons.chevron_down}`;
            expandWrapper.appendChild(expandBtn);
            
            textContainer.parentNode.insertBefore(expandWrapper, textContainer.nextSibling);

            expandBtn.addEventListener('click', () => {
                const isCollapsed = textContainer.classList.contains('collapsed');
                textContainer.classList.toggle('collapsed', !isCollapsed);
                textContainer.classList.toggle('expanded', isCollapsed);
                expandBtn.innerHTML = isCollapsed ? `Свернуть ${Icons.chevron_up}` : `Показать полностью ${Icons.chevron_down}`;
            });
        }
    }

    _setupMeta(clone, post) {
        const handleToUse = (post.isRetweet && post.originalAuthorHandle) ? post.originalAuthorHandle : post.authorHandle;
        const handleClean = (handleToUse || '').replace('@', '').trim().toLowerCase();
        
        clone.querySelector('.post-author-name').textContent = this.authorNamesMap[`@${handleClean}`] || handleToUse;
        
        const handleEl = clone.querySelector('.post-author-handle');
        handleEl.textContent = handleToUse;
        if (post.platform === 'twitter') handleEl.href = `https://twitter.com/${handleClean}`;

        const avatarEl = clone.querySelector('.post-avatar');
        avatarEl.src = `assets/developers/${handleClean}/avatar.jpg`;
        avatarEl.onerror = () => { avatarEl.src = this.fallbackAvatar; };

        const actionEl = clone.querySelector('.post-header-action');
        const cleanId = post.id.split('#')[0]; 
        actionEl.href = `https://twitter.com/${handleClean}/status/${cleanId}`;
        actionEl.innerHTML = Icons.plat_x;

        const dateEl = clone.querySelector('.post-date');
        if (post.timestamp) {
            dateEl.textContent = new Date(post.timestamp).toLocaleString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
        }
    }

    _setupYouTubeEmbed(clone, post, rawText) {
        let ytId = null;
        const textMatch = rawText.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
        if (textMatch) ytId = textMatch[1];
        
        if (!ytId && post.linkCards && post.linkCards.length > 0) {
            const card = post.linkCards.find(c => c.url.includes('youtu'));
            if (card) {
                const cardMatch = card.url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
                if (cardMatch) ytId = cardMatch[1];
            }
        }

        if (ytId) {
            const container = clone.querySelector('.post-media-grid');
            container.style.display = 'block';
            container.className = 'post-media-container single-media';
            container.innerHTML = '';
            
            container.style.backgroundImage = `url('https://img.youtube.com/vi/${ytId}/hqdefault.jpg')`;

            const wrapper = document.createElement('div');
            wrapper.className = 'media-item video-thumb-wrapper';
            
            wrapper.innerHTML = `
                <img class="media-item img-media" src="https://img.youtube.com/vi/${ytId}/maxresdefault.jpg" onerror="this.src='https://img.youtube.com/vi/${ytId}/hqdefault.jpg'" loading="lazy" draggable="false">
                <div class="video-thumb-overlay"><div class="video-play-btn">${Icons.play_overlay}</div></div>
            `;
            wrapper.title = 'Смотреть видео';
            
            wrapper.addEventListener('click', (e) => {
                e.stopPropagation();
                this.lightbox.open(`https://youtu.be/${ytId}`, true); 
            });

            container.appendChild(wrapper);
            
            const cardsContainer = clone.querySelector('.post-cards-container');
            if (cardsContainer) cardsContainer.style.display = 'none';

            return true;
        }
        
        return false;
    }

    _setupMedia(clone, post) {
        const container = clone.querySelector('.post-media-grid');
        
        if (!post.media || post.media.length === 0) {
            container.style.display = 'none';
            return;
        }

        container.style.display = 'block';
        container.innerHTML = ''; 
        container.style.backgroundImage = 'none'; 

        if (post.media.length === 1) {
            container.className = 'post-media-container single-media';
            if (post.media[0].url) {
                container.style.backgroundImage = `url('${post.media[0].url}')`;
            }
            container.appendChild(this._createMediaElement(post.media[0], post));
        } else {
            container.className = 'post-media-container multi-media-slider';
            this._buildSlider(container, post.media, post);
        }
    }

    _buildSlider(container, mediaArray, post) {
        const total = mediaArray.length;

        const counter = document.createElement('div');
        counter.className = 'media-slider-counter';
        counter.textContent = `1 / ${total}`;
        container.appendChild(counter);

        const track = document.createElement('div');
        track.className = 'media-slider-track';

        mediaArray.forEach(m => {
            const slide = document.createElement('div');
            slide.className = 'media-slide';
            if (m.url) slide.style.backgroundImage = `url('${m.url}')`;
            
            slide.appendChild(this._createMediaElement(m, post));
            track.appendChild(slide);
        });

        container.appendChild(track);

        track.addEventListener('scroll', () => {
            const index = Math.round(track.scrollLeft / track.clientWidth) + 1;
            counter.textContent = `${index} / ${total}`;
        });

        let isDown = false;
        let startX, scrollLeft;
        let isDragged = false; 

        track.addEventListener('mousedown', (e) => {
            isDown = true;
            isDragged = false;
            track.classList.add('is-dragging');
            startX = e.pageX - track.offsetLeft;
            scrollLeft = track.scrollLeft;
        });

        const stopDrag = () => {
            isDown = false;
            track.classList.remove('is-dragging');
        };
        track.addEventListener('mouseleave', stopDrag);
        track.addEventListener('mouseup', stopDrag);

        track.addEventListener('mousemove', (e) => {
            if (!isDown) return;
            e.preventDefault();
            const x = e.pageX - track.offsetLeft;
            const walk = (x - startX) * 1.5; 
            if (Math.abs(walk) > 5) {
                isDragged = true; 
            }
            track.scrollLeft = scrollLeft - walk;
        });

        track.addEventListener('click', (e) => {
            if (isDragged) {
                e.preventDefault();
                e.stopPropagation();
            }
        }, { capture: true });
    }

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

    _createMediaElement(m, post) {
        if (m.type === 'video_thumb') {
            const wrapper = document.createElement('div');
            wrapper.className = 'media-item video-thumb-wrapper';
            
            const imgEl = document.createElement('img');
            imgEl.className = 'media-item img-media';
            imgEl.src = m.url;
            imgEl.loading = 'lazy';
            imgEl.draggable = false; 
            
            const overlay = document.createElement('div');
            overlay.className = 'video-thumb-overlay';
            overlay.innerHTML = `<div class="video-play-btn">${Icons.play_overlay}</div>`;
            
            wrapper.appendChild(imgEl);
            wrapper.appendChild(overlay);
            
            wrapper.title = 'Смотреть оригинальное видео в X (Twitter)';
            wrapper.addEventListener('click', (e) => {
                e.stopPropagation();
                const cleanHandle = (post.authorHandle || '').replace('@', '');
                const cleanId = post.id.split('#')[0]; 
                window.open(`https://twitter.com/${cleanHandle}/status/${cleanId}`, '_blank', 'noopener,noreferrer');
            });
            return wrapper;
        } 
        else if (m.type === 'video' || m.type === 'gif' || m.url.endsWith('.mp4')) {
            const videoEl = document.createElement('video');
            videoEl.className = 'media-item video-media';
            videoEl.src = m.url;
            if (m.type === 'gif') {
                videoEl.autoplay = true; videoEl.loop = true; videoEl.muted = true; videoEl.playsInline = true;
            } else {
                videoEl.controls = true;
            }
            videoEl.preload = 'metadata';
            videoEl.addEventListener('click', (e) => e.stopPropagation()); 
            return videoEl;
        } 
        else {
            const imgEl = document.createElement('img');
            imgEl.className = 'media-item img-media';
            imgEl.src = m.url;
            imgEl.loading = 'lazy';
            imgEl.title = 'Нажмите для увеличения';
            imgEl.draggable = false; 
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
            } catch (err) { Logger.error('Ошибка буфера обмена', err); }
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
                translateTextEl.innerHTML = err.message === 'RATE_LIMIT' ? `<em>Слишком много запросов.</em>` : `<em>Ошибка перевода.</em>`;
                translateTextEl.style.color = "var(--error-color)";
            }
        });
    }
}