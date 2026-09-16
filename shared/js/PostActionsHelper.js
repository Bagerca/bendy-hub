import { formatRichText } from './utils.js';
import { Icons } from './icons.js';

/**
 * Универсальный класс, инкапсулирующий логику интерактивности постов.
 * Предотвращает дублирование кода в Feed, Board и Investigation Panel.
 */
export class PostActionsHelper {
    
    /**
     * Биндит все базовые экшены (копировать, перевести, свернуть) на HTML-узел поста
     */
    static bindActions(card, postData) {
        if (!card) return;
        const rawText = postData?.content || '';

        // 1. Свернуть / Развернуть текст
        const expandBtn = card.querySelector('.expand-text-btn');
        const textContainer = card.querySelector('.post-text');
        if (expandBtn && textContainer) {
            expandBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const isCollapsed = textContainer.classList.contains('collapsed');
                
                textContainer.classList.toggle('collapsed', !isCollapsed);
                textContainer.classList.toggle('expanded', isCollapsed);
                
                // Вставляем только иконку
                expandBtn.innerHTML = isCollapsed ? (Icons.chevron_up || '') : (Icons.chevron_down || '');
                // Управляем текстом при наведении для доступности
                expandBtn.title = isCollapsed ? 'Свернуть' : 'Показать полностью';
            });
        }

        // 2. Копировать
        const copyBtn = card.querySelector('.copy-btn');
        if (copyBtn && rawText) {
            copyBtn.addEventListener('click', async (e) => {
                e.stopPropagation();
                try {
                    await navigator.clipboard.writeText(rawText);
                    copyBtn.classList.add('success');
                    setTimeout(() => copyBtn.classList.remove('success'), 2000);
                } catch (err) {}
            });
        }

        // 3. Перевести (использует глобальный window.globalTranslator)
        const translateBtn = card.querySelector('.translate-btn');
        const translationContainer = card.querySelector('.post-translation');
        const translateTextEl = card.querySelector('.post-translation-text');
        if (translateBtn && window.globalTranslator && rawText) {
            translateBtn.addEventListener('click', async (e) => {
                e.stopPropagation();
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
                    const translatedText = await window.globalTranslator.translate(rawText);
                    translateTextEl.innerHTML = formatRichText(translatedText);
                    translateTextEl.style.color = "var(--text-main)";
                    translationContainer.style.display = 'block';
                    translateBtn.classList.replace('loading', 'active');
                } catch (err) {
                    translateBtn.classList.remove('loading');
                    translationContainer.style.display = 'block';
                    translateTextEl.innerHTML = `<em>Ошибка перевода.</em>`;
                    translateTextEl.style.color = "var(--error-color)";
                }
            });
        }
    }

    /**
     * Биндит логику свайпа карусели картинок.
     * Вынесена отдельно, так как нужна при восстановлении снапшотов.
     */
    static bindSliders(card) {
        if (!card) return;
        const sliders = card.querySelectorAll('.multi-media-slider');
        sliders.forEach(slider => {
            const track = slider.querySelector('.media-slider-track');
            const counter = slider.querySelector('.media-slider-counter');
            if (!track) return;

            const total = track.querySelectorAll('.media-slide').length;

            track.addEventListener('scroll', () => {
                const index = Math.round(track.scrollLeft / track.clientWidth) + 1;
                if (counter) counter.textContent = `${index} / ${total}`;
            });

            let isDown = false;
            let startX, scrollLeft, isDragged = false;

            track.addEventListener('mousedown', (e) => {
                e.stopPropagation(); 
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
                e.stopPropagation();
                const x = e.pageX - track.offsetLeft;
                const walk = (x - startX) * 1.5;
                if (Math.abs(walk) > 5) isDragged = true;
                track.scrollLeft = scrollLeft - walk;
            });

            track.addEventListener('click', (e) => {
                if (isDragged) { e.preventDefault(); e.stopPropagation(); }
            }, { capture: true });
        });
    }
}