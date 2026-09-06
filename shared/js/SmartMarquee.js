export class SmartMarquee {
    /**
     * Применяет эффект бесконечной бегущей строки (ping-pong) при наведении.
     * @param {HTMLElement} card - Элемент-контейнер (карточка), на который наводим курсор
     * @param {string} textSelector - CSS селектор текстовых элементов внутри карточки
     */
    static apply(card, textSelector) {
        let activeAnimations = new Map();

        card.addEventListener('mouseenter', () => {
            const textElements = card.querySelectorAll(textSelector);
            
            textElements.forEach(el => {
                const wrapper = el.parentElement;
                if (!wrapper || !wrapper.classList.contains('smart-marquee-wrapper')) return;

                // Сбрасываем стили перед расчетом
                el.style.width = '100%';
                el.style.transform = 'translateX(0)';

                if (el.scrollWidth > el.clientWidth) {
                    wrapper.classList.add('is-scrolling');
                    
                    // + 12px чтобы текст полностью выехал из-под правого узкого градиента
                    const distance = el.scrollWidth - el.clientWidth + 12;
                    // Скорость: 30 пикселей в секунду
                    const duration = Math.max(distance / 30, 1.5) * 1000; 

                    el.style.width = 'max-content';

                    // Используем Web Animations API для плавной анимации туда-обратно
                    const animation = el.animate([
                        { transform: 'translateX(0)' },
                        { transform: `translateX(-${distance}px)` }
                    ], {
                        duration: duration,
                        delay: 400, // Небольшая пауза перед стартом
                        direction: 'alternate', // Едет туда и обратно
                        iterations: Infinity, // Бесконечно
                        easing: 'linear'
                    });

                    activeAnimations.set(el, animation);
                }
            });
        });

        card.addEventListener('mouseleave', () => {
            const textElements = card.querySelectorAll(textSelector);
            
            textElements.forEach(el => {
                const wrapper = el.parentElement;
                if (!wrapper || !wrapper.classList.contains('smart-marquee-wrapper')) return;

                wrapper.classList.remove('is-scrolling');
                
                if (activeAnimations.has(el)) {
                    const animation = activeAnimations.get(el);
                    animation.pause(); 
                    
                    // Высчитываем, где текст находился в момент отведения курсора
                    const computedStyle = window.getComputedStyle(el);
                    const matrix = new DOMMatrixReadOnly(computedStyle.transform);
                    const currentX = matrix.m41;

                    animation.cancel(); 
                    activeAnimations.delete(el);

                    // Плавно возвращаем текст на исходную позицию
                    if (currentX !== 0) {
                        const resetAnim = el.animate([
                            { transform: `translateX(${currentX}px)` },
                            { transform: 'translateX(0)' }
                        ], {
                            duration: 400,
                            easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
                        });
                        
                        resetAnim.onfinish = () => {
                            el.style.transform = 'translateX(0)';
                            el.style.width = '100%';
                        };
                    } else {
                        el.style.width = '100%';
                    }
                }
            });
        });
    }
}