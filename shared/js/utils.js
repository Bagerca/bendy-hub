import { Logger } from './Logger.js';

export function formatRichText(text) {
    if (!text) return '';

    let decodedText = text;
    const parser = new DOMParser();
    // Декодируем возможные HTML-сущности (&amp; и т.д.)
    for (let i = 0; i < 3; i++) {
        const doc = parser.parseFromString(decodedText, "text/html");
        decodedText = doc.documentElement.textContent;
    }

    // 1. Ищем все ссылки и ВРЕМЕННО заменяем их на безопасные маркеры
    const urlRegex = /(https?:\/\/[^\s<]+)/g;
    const linksMap = [];
    
    let safeText = decodedText.replace(urlRegex, (match) => {
        linksMap.push(match);
        return `__URL_${linksMap.length - 1}__`;
    });

    // 2. Безопасно обрабатываем хэштеги и упоминания (они не сломают ссылки, т.к. ссылок пока нет)
    const hashtagRegex = /#(\w+)/g;
    safeText = safeText.replace(hashtagRegex, '<a href="https://twitter.com/hashtag/$1" class="rich-link" target="_blank" rel="noopener noreferrer">#$1</a>');

    const mentionRegex = /@(\w+)/g;
    safeText = safeText.replace(mentionRegex, '<a href="https://twitter.com/$1" class="rich-link" target="_blank" rel="noopener noreferrer">@$1</a>');

    // 3. Возвращаем ссылки на место, оборачивая их в HTML-теги
    linksMap.forEach((url, index) => {
        const aTag = `<a href="${url}" class="rich-link" target="_blank" rel="noopener noreferrer">${url}</a>`;
        safeText = safeText.replace(`__URL_${index}__`, aTag);
    });

    return safeText;
}

export function debounce(func, wait) {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}