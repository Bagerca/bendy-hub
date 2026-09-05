import os
import json
import urllib.request
import logging
import time

logging.basicConfig(
    level=logging.INFO, 
    format='%(asctime)s [%(levelname)s] %(message)s'
)

OLD_FEED_FILE = os.path.join("data", "feed.json")
BACKUP_FEED_FILE = os.path.join("data", "feed_backup.json")
DEVS_DIR = os.path.join("assets", "developers")

# Фейковый юзер-агент, чтобы твиттер отдавал картинки
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept': '*/*'
}

def download_old_media(url: str, handle: str, post_id: str) -> str:
    """ Скачивает старые картинки/видео из твиттера локально """
    if not url or url == "null":
        return None
        
    safe_handle = handle.replace('@', '').lower()
    media_dir = os.path.join(DEVS_DIR, safe_handle, "media")
    os.makedirs(media_dir, exist_ok=True)

    # Пытаемся определить формат по URL
    url_lower = url.lower()
    ext = ".jpg"
    media_type = "image"
    
    if ".mp4" in url_lower or "/video/" in url_lower:
        ext = ".mp4"
        media_type = "video"
    elif "format=png" in url_lower or ".png" in url_lower:
        ext = ".png"
        
    filename = f"{post_id}{ext}"
    local_path = os.path.join(media_dir, filename)
    web_path = f"assets/developers/{safe_handle}/media/{filename}"

    # Если файл уже скачан
    if os.path.exists(local_path):
        return web_path, media_type

    logging.info(f"    📥 Загрузка старого медиа: {url}")
    try:
        req = urllib.request.Request(url, headers=HEADERS)
        with urllib.request.urlopen(req, timeout=15) as response:
            if response.status == 200:
                with open(local_path, 'wb') as f: 
                    f.write(response.read())
                return web_path, media_type
    except Exception as e:
        logging.warning(f"    ⚠️ Ошибка скачивания {url}: {e}")
        return None, "image"

    return None, "image"

def run_migration():
    print("\n" + "="*50)
    print("🚀 BENDY FEED MIGRATOR (Конвертация старой ленты)")
    print("="*50 + "\n")

    if not os.path.exists(OLD_FEED_FILE):
        logging.error(f"Файл {OLD_FEED_FILE} не найден. Миграция не требуется.")
        return

    try:
        with open(OLD_FEED_FILE, 'r', encoding='utf-8') as f:
            old_posts = json.load(f)
    except Exception as e:
        logging.error(f"Ошибка чтения старого feed.json: {e}")
        return

    logging.info(f"Найдено старых постов: {len(old_posts)}")
    
    # Группируем посты по авторам
    posts_by_author = {}
    for post in old_posts:
        handle = post.get('authorHandle', '').replace('@', '').lower()
        if not handle:
            continue
        if handle not in posts_by_author:
            posts_by_author[handle] = []
        posts_by_author[handle].append(post)

    # Обрабатываем каждого автора
    for handle, posts in posts_by_author.items():
        logging.info(f"🔄 Обработка автора: @{handle} ({len(posts)} постов)")
        
        dev_dir = os.path.join(DEVS_DIR, handle)
        os.makedirs(dev_dir, exist_ok=True)
        dev_feed_path = os.path.join(dev_dir, "feed.json")

        # Читаем уже существующие (новые) посты, если парсер их успел создать
        existing_posts = {}
        if os.path.exists(dev_feed_path):
            try:
                with open(dev_feed_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    existing_posts = {p['id']: p for p in data}
            except:
                pass

        # Конвертируем старые посты в новый формат
        for old_p in posts:
            post_id = old_p.get('id')
            
            # Если пост уже есть в новой базе и он в новом формате (имеет referenceType), пропускаем
            if post_id in existing_posts and 'referenceType' in existing_posts[post_id]:
                continue

            media_url = old_p.get('mediaUrl')
            media_type = "image"
            
            # Если медиа-ссылка ведет в интернет, скачиваем её!
            if media_url and media_url.startswith("http"):
                local_url, m_type = download_old_media(media_url, handle, post_id)
                media_url = local_url
                media_type = m_type
            elif media_url and media_url.startswith("assets/"):
                # Если уже скачано (вдруг миграция запускается второй раз)
                if ".mp4" in media_url: media_type = "video"

            # Создаем объект нового формата
            clean_post = {
                "id": post_id,
                "authorName": old_p.get("authorName", handle),
                "authorHandle": old_p.get("authorHandle", f"@{handle}"),
                "platform": old_p.get("platform", "twitter"),
                "content": old_p.get("content", ""),
                "timestamp": old_p.get("timestamp", ""),
                "mediaUrl": media_url,
                "mediaType": media_type,
                "localAvatarPath": old_p.get("localAvatarPath", f"assets/developers/{handle}/avatar.jpg"),
                "referenceType": "",    # В старом фиде этих данных не было
                "referenceUrl": "",
                "referenceAuthor": ""
            }

            # Обновляем или добавляем в словарь (перезапишет старый неполноценный пост)
            existing_posts[post_id] = clean_post
            
            # Небольшая пауза, чтобы не дудосить сервера твиттера картинками
            time.sleep(0.1)

        # Сортируем все посты (и старые и новые) по времени убывания
        final_list = list(existing_posts.values())
        final_list.sort(key=lambda x: x['timestamp'], reverse=True)

        # Сохраняем в индивидуальную папку разработчика
        with open(dev_feed_path, 'w', encoding='utf-8') as f:
            json.dump(final_list, f, ensure_ascii=False, indent=2)
            
        logging.info(f"✅ Успешно обновлена база для @{handle}. Итого постов: {len(final_list)}\n")

    # Переименовываем старый файл, чтобы фронтенд и парсер на него больше не смотрели
    os.rename(OLD_FEED_FILE, BACKUP_FEED_FILE)
    logging.info(f"🎉 Миграция завершена! Старый файл переименован в {BACKUP_FEED_FILE}.")

if __name__ == "__main__":
    run_migration()