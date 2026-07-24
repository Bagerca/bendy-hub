import { SiteHeader } from '../../shared/js/components/SiteHeader.js';
import { fetchData } from '../../shared/js/api.js';

customElements.define('site-header', SiteHeader);

document.addEventListener('DOMContentLoaded', async () => {
    const els = {
        nav: document.getElementById('category-nav'),
        loader: document.getElementById('records-loader'),
        grid: document.getElementById('records-grid'),
        title: document.getElementById('current-category-title'),
        count: document.getElementById('current-category-count'),
        
        modal: document.getElementById('record-modal'),
        closeBtn: document.querySelector('.modal-close'),
        mImage: document.getElementById('reader-image'),
        mTitle: document.getElementById('reader-title'),
        mAuthor: document.getElementById('reader-author'),
        mText: document.getElementById('reader-text')
    };

    let archivesData = [];

    // SVG Иконки для бейджей (Убраны лишние обертки, чистый SVG)
    const icons = {
        audio: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"></rect><circle cx="8" cy="12" r="2"></circle><circle cx="16" cy="12" r="2"></circle><path d="M10 12h4"></path></svg>`,
        document: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>`
    };

    try {
        // 1. Читаем индексный файл
        const indexFiles = await fetchData('data/records_index.json');
        
        // 2. Скачиваем все файлы из папки records параллельно
        const promises = indexFiles.map(filename => 
            fetchData(`data/records/${filename}.json`).catch(err => {
                console.warn(`Не удалось загрузить архив: ${filename}`);
                return null; // Игнорируем битые файлы
            })
        );
        
        const results = await Promise.all(promises);
        archivesData = results.filter(cat => cat !== null);
        
        if (archivesData.length === 0) throw new Error("Архив пуст");

        // 3. Создаем навигацию слева
        archivesData.forEach((category, index) => {
            const btn = document.createElement('button');
            btn.className = 'cat-btn';
            btn.textContent = category.title;
            // Устанавливаем title атрибут для наведения, так как текст обрезан
            btn.title = category.title; 
            btn.addEventListener('click', () => loadCategory(category, btn));
            els.nav.appendChild(btn);

            // Автоклик по первой категории
            if (index === 0) loadCategory(category, btn);
        });

    } catch (error) {
        els.loader.style.display = 'none';
        els.title.textContent = 'Архив недоступен';
        els.grid.innerHTML = '<div class="error-card"><p>Не удалось подключиться к главному терминалу Архивариуса.</p></div>';
        els.grid.style.display = 'block';
    }

    function loadCategory(category, activeBtn) {
        // Меняем активную кнопку
        document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
        activeBtn.classList.add('active');

        // Обновляем метаданные хедера
        els.title.textContent = category.title;
        els.count.textContent = `Записей найдено: ${category.items.length}`;
        
        // Очищаем и готовим сетку
        els.grid.innerHTML = '';
        els.loader.style.display = 'none';
        els.grid.style.display = 'grid';

        // Рендерим карточки с каскадной анимацией
        category.items.forEach((item, index) => {
            const card = document.createElement('article');
            card.className = 'record-card';
            // Каскадная задержка анимации (максимум до 0.5s чтобы не ждать вечно)
            card.style.animationDelay = `${Math.min(index * 0.05, 0.5)}s`;
            
            const badgeText = category.type === 'audio' ? 'Аудиозапись' : 'Документ';
            const iconSvg = category.type === 'audio' ? icons.audio : icons.document;
            
            // Если есть картинка - показываем ее, иначе красивую заглушку-иконку
            const imageHtml = item.image 
                ? `<img src="assets/records/${item.image}" class="card-image" loading="lazy" alt="Обложка">` 
                : `<div class="card-fallback-icon">${iconSvg}</div>`;

            card.innerHTML = `
                <div class="card-image-wrapper">
                    ${imageHtml}
                </div>
                <div class="card-content">
                    <span class="card-type-badge">${badgeText}</span>
                    <h3 class="card-title">${item.title}</h3>
                    <span class="card-author">${item.author || 'Неизвестный'}</span>
                </div>
            `;

            // Клик открывает модалку (читалку)
            card.addEventListener('click', () => openReader(item, category.type));
            els.grid.appendChild(card);
        });
    }

    // Логика модального окна
    function openReader(item, type) {
        els.mTitle.textContent = item.title;
        els.mAuthor.textContent = item.author || 'Неизвестный автор';
        els.mText.textContent = item.text;

        if (item.image) {
            els.mImage.src = `assets/records/${item.image}`;
            els.mImage.style.display = 'block';
        } else {
            els.mImage.style.display = 'none';
        }

        els.modal.showModal();
        requestAnimationFrame(() => els.modal.classList.add('active'));
    }

    const closeModal = () => {
        els.modal.classList.remove('active');
        setTimeout(() => els.modal.close(), 300);
    };

    els.closeBtn.addEventListener('click', closeModal);
    els.modal.addEventListener('click', (e) => {
        const rect = els.modal.getBoundingClientRect();
        const isInDialog = (
            rect.top <= e.clientY && 
            e.clientY <= rect.top + rect.height && 
            rect.left <= e.clientX && 
            e.clientX <= rect.left + rect.width
        );
        if (!isInDialog) closeModal();
    });
});