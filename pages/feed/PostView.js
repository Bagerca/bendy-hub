import { formatRichText } from '../../shared/js/utils.js';
import { Logger } from '../../shared/js/Logger.js';
import { SmartSearch } from '../../shared/js/SmartSearch.js';
import { Icons } from '../../shared/js/icons.js';
import { PostMediaFactory } from './services/PostMediaFactory.js';
import { PostActionsHelper } from '../../shared/js/PostActionsHelper.js';

export class PostView {
    constructor(templateId, lightboxManager, translationService, authorNamesMap = {}, callbacks = {}) {
        this.template = document.getElementById(templateId);
        this.translator = translationService;
        this.authorNamesMap = authorNamesMap; 
        this.fallbackAvatar = Icons.avatar_fallback;
        
        this.mediaFactory = new PostMediaFactory(lightboxManager);
        this.onEvidenceCollect = callbacks.onEvidenceCollect || null;
    }

    render(post, searchTerm = '') {
        try {
            const clone = this.template.content.cloneNode(true);
            const cardEl = clone.querySelector('.post-card');
            
            cardEl.dataset.id = post.id;

            if (!cardEl.querySelector('.investigation-overlay')) {
                const overlay = document.createElement('div');
                overlay.className = 'investigation-overlay';
                
                const isCollected = window.globalInvestigation && window.globalInvestigation.storage.exists('post', post.id);
                if (isCollected) {
                    cardEl.classList.add('is-collected');
                }

                overlay.innerHTML = `
                    <div class="inv-overlay-icon icon-add">${Icons.inv_add || ''}</div>
                    <div class="inv-overlay-icon icon-check">${Icons.inv_check || ''}</div>
                    <div class="inv-overlay-icon icon-remove">${Icons.inv_remove || ''}</div>
                `;
                cardEl.prepend(overlay);
            }

            const rawText = this._extractText(post, clone);
            
            this._setupContext(clone, post);
            this._setupText(clone, rawText, searchTerm);
            this._setupMeta(clone, post);
            
            const hasYouTube = this.mediaFactory.setupYouTubeEmbed(clone, post, rawText);
            if (!hasYouTube) {
                this.mediaFactory.setupMedia(clone, post);
                this.mediaFactory.setupCards(clone, post);
            }
            
            const copyBtn = clone.querySelector('.copy-btn');
            const translateBtn = clone.querySelector('.translate-btn');
            if(translateBtn) translateBtn.insertAdjacentHTML('afterbegin', Icons.action_translate);
            if(copyBtn) copyBtn.insertAdjacentHTML('afterbegin', Icons.action_copy);

            if (!rawText.trim()) {
                if(copyBtn) copyBtn.style.display = 'none';
                if(translateBtn) translateBtn.style.display = 'none';
            }

            PostActionsHelper.bindActions(cardEl, post);

            cardEl.addEventListener('click', (e) => {
                if (document.body.classList.contains('investigation-mode-active')) {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    if (this.onEvidenceCollect) {
                        const handleClean = (post.authorHandle || '').replace('@', '').toLowerCase();
                        post.resolvedAuthorName = this.authorNamesMap[`@${handleClean}`] || post.authorName;
                        this.onEvidenceCollect(post, cardEl);
                    }
                }
            }, { capture: true });

            cardEl.addEventListener('contextmenu', (e) => {
                if (document.body.classList.contains('investigation-mode-active')) {
                    e.preventDefault();
                    e.stopPropagation();

                    if (cardEl.classList.contains('is-collected')) {
                        if (window.globalInvestigation) {
                            window.globalInvestigation.removeEvidence('post', post.id);
                        }
                        cardEl.classList.add('is-removing');
                        setTimeout(() => {
                            cardEl.classList.remove('is-removing');
                        }, 1000);
                    }
                }
            });

            return clone;
        } catch (error) { 
            Logger.error(`Ошибка сборки поста ${post.id}`, error);
            return null; 
        }
    }

    _extractText(post, clone) {
        const rtBadge = clone.querySelector('.rt-badge');
        let text = post.content || '';

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
            } else if (post.referenceText) {
                refBadge.style.display = 'inline-flex';
                refBadge.innerHTML = `${Icons.reply} <span class="ref-text">В ответ:</span>`;
                this._fillQuoteCard(quoteCard, post);
            } else {
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
            // СОБИРАЕМ ГАЛЕРЕЮ КАРТИНОК ДЛЯ ЦИТАТЫ
            const quoteGalleryUrls = post.referenceMedia
                .filter(m => m.type === 'image' || (!m.type && !m.url.endsWith('.mp4') && !m.url.includes('youtube')))
                .map(m => m.url);

            qMediaContainer.style.display = 'block';
            qMediaContainer.innerHTML = ''; 
            qMediaContainer.style.backgroundImage = 'none';

            if (post.referenceMedia.length === 1) {
                qMediaContainer.className = 'quote-media-container single-media';
                if (post.referenceMedia[0].url) {
                    qMediaContainer.style.backgroundImage = `url('${post.referenceMedia[0].url}')`;
                }
                qMediaContainer.appendChild(this.mediaFactory._createMediaElement(post.referenceMedia[0], post, quoteGalleryUrls));
            } else {
                qMediaContainer.className = 'quote-media-container multi-media-slider';
                this.mediaFactory._buildSlider(qMediaContainer, post.referenceMedia, post, quoteGalleryUrls);
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
            
            expandBtn.innerHTML = Icons.chevron_down || '';
            expandBtn.title = 'Показать полностью';
            
            expandWrapper.appendChild(expandBtn);
            textContainer.parentNode.insertBefore(expandWrapper, textContainer.nextSibling);
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
}