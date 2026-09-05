import os
import json
import urllib.request
import urllib.parse
import urllib.error
import re
import time

# ==========================================
# 🎵 ИСТОЧНИКИ ДЛЯ ПАРСИНГА
# ==========================================

# Ссылки на отдельные видео
YT_LINKS = [
    "https://youtu.be/ZstsPUKT5CI?si=1m2ukP4XgjmfNq0L",
    "https://youtu.be/2Jco30RGuHo?si=jpWjlpfiZKTqckkX",
    "https://youtu.be/346m3ByAXyw?si=gPN20r_lSB8cSpJS",
    "https://youtu.be/3BMxoqsZox0?si=ktKljt2KJCe28hkg",
    "https://youtu.be/vxmgIDSOrbI?si=5OhJXAADmg4zK1Lj",
    "https://youtu.be/SoxFjaV9_ss?si=KFlN7zmKnftro1ud",
    "https://youtu.be/igAyr8YmdXY?si=VxbaRGPzFOxIDbOy",
    "https://youtu.be/7aSrvHyvj3I?si=keDB8-tHBe635g4Q"
]

# Ссылки на плейлисты (Замени на нужные)
YT_PLAYLISTS = [
    "https://youtube.com/playlist?list=PLRp0gf9ki7cqXRyLgeblyL_vio5Bbfl1Q&si=sf6jpJr4s5dgSisq"
]

# ==========================================

BASE_MUSIC_DIR = os.path.join("assets", "music")
BASE_AUTHORS_DIR = os.path.join("assets", "music_authors")
INDEX_MUSIC_FILE = os.path.join("data", "music_index.json")
INDEX_AUTHORS_FILE = os.path.join("data", "music_authors_index.json")

def get_headers():
    return {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9'
    }

def get_yt_video_id(url):
    match = re.search(r"(?:v=|\/)([0-9A-Za-z_-]{11})", url)
    return match.group(1) if match else None

def safe_request(url, data=None, headers=None):
    if not headers: headers = get_headers()
    try:
        req = urllib.request.Request(url, data=data, headers=headers)
        with urllib.request.urlopen(req, timeout=15) as response:
            return response.read().decode('utf-8')
    except Exception as e:
        print(f"  ⚠️ Ошибка HTTP запроса: {e}")
        return None

def get_playlist_videos(playlist_url):
    """
    Парсит плейлист. Если видео больше 100, использует внутреннее API YouTube (continuation),
    чтобы собрать ВСЕ треки из плейлиста.
    """
    print(f"📥 Анализ плейлиста: {playlist_url}")
    html = safe_request(playlist_url)
    if not html: return []

    video_ids = []
    
    # 1. Извлекаем первые 100 видео из изначального HTML
    matches = re.findall(r'"videoId":"([a-zA-Z0-9_-]{11})"', html)
    seen = set()
    for vid in matches:
        if vid not in seen:
            seen.add(vid)
            video_ids.append(vid)

    # 2. Ищем данные для обхода лимита (API Key и Continuation Token)
    api_key_match = re.search(r'"INNERTUBE_API_KEY":"(.*?)"', html)
    client_ver_match = re.search(r'"clientVersion":"(.*?)"', html)
    token_match = re.search(r'"continuationCommand":{"token":"(.*?)"', html)

    if api_key_match and client_ver_match and token_match:
        api_key = api_key_match.group(1)
        client_ver = client_ver_match.group(1)
        token = token_match.group(1)
        
        print("  ↳ Найден токен продолжения. Подгружаем остальные видео...")
        
        # 3. Эмулируем фоновые запросы браузера, пока не закончатся треки
        while token:
            api_url = f"https://www.youtube.com/youtubei/v1/browse?key={api_key}"
            payload = json.dumps({
                "context": {
                    "client": {
                        "clientName": "WEB",
                        "clientVersion": client_ver
                    }
                },
                "continuation": token
            }).encode('utf-8')
            
            api_headers = get_headers()
            api_headers['Content-Type'] = 'application/json'
            
            response_json = safe_request(api_url, data=payload, headers=api_headers)
            if not response_json: break
            
            # Добавляем новые видео
            new_matches = re.findall(r'"videoId":"([a-zA-Z0-9_-]{11})"', response_json)
            added_count = 0
            for vid in new_matches:
                if vid not in seen:
                    seen.add(vid)
                    video_ids.append(vid)
                    added_count += 1
                    
            # Ищем следующий токен
            next_token_match = re.search(r'"continuationCommand":{"token":"(.*?)"', response_json)
            if next_token_match and added_count > 0:
                token = next_token_match.group(1)
                time.sleep(0.5) # Небольшая пауза, чтобы не забанили
            else:
                token = None
                
    print(f"  ↳ Собрано уникальных треков из плейлиста: {len(video_ids)}")
    return [f"https://youtu.be/{vid}" for vid in video_ids]

def fetch_yt_metadata(url):
    oembed_url = f"https://www.youtube.com/oembed?url={url}&format=json"
    html = safe_request(oembed_url)
    if html:
        try:
            return json.loads(html)
        except:
            pass
    return None

def fetch_yt_year(url):
    html = safe_request(url)
    if html:
        match = re.search(r'<meta itemprop="datePublished" content="(\d{4})', html)
        if match: return match.group(1)
        match = re.search(r'"publishDate":"(\d{4})', html)
        if match: return match.group(1)
    return ""

def fetch_channel_avatar(channel_url):
    """ Парсит HTML страницы канала и вытягивает HD-аватарку """
    html = safe_request(channel_url)
    if html:
        match = re.search(r'<meta property="og:image" content="(.*?)"', html)
        if match:
            # Заменяем размер на более качественный (по умолчанию ютуб отдает 900x900)
            url = match.group(1).replace('=s900-', '=s400-')
            return url
    return None

def download_image(url, save_path):
    try:
        req = urllib.request.Request(url, headers=get_headers())
        with urllib.request.urlopen(req, timeout=10) as response:
            if response.status == 200:
                with open(save_path, 'wb') as f:
                    f.write(response.read())
                return True
    except:
        pass
    return False

def generate_music():
    print("🚀 Запуск глубокого парсинга музыки и авторов с YouTube...\n")
    
    os.makedirs(BASE_MUSIC_DIR, exist_ok=True)
    os.makedirs(BASE_AUTHORS_DIR, exist_ok=True)
    os.makedirs("data", exist_ok=True)

    # 1. Собираем все ссылки
    all_urls = list(YT_LINKS)
    for p_url in YT_PLAYLISTS:
        if p_url.strip():
            all_urls.extend(get_playlist_videos(p_url.strip()))

    # 2. Удаляем дубликаты
    unique_vids = set()
    final_urls = []
    for url in all_urls:
        vid = get_yt_video_id(url)
        if vid and vid not in unique_vids:
            unique_vids.add(vid)
            final_urls.append(url)

    print(f"\nВсего треков в очереди на обработку: {len(final_urls)}\n")
    
    music_index_ids = []
    authors_db = {} # Словарь: { author_id: { data } }

    # 3. Обрабатываем каждое видео
    for yt_url in final_urls:
        vid_id = get_yt_video_id(yt_url)
        track_id = f"yt_{vid_id}"
        
        track_dir = os.path.join(BASE_MUSIC_DIR, track_id)
        os.makedirs(track_dir, exist_ok=True)
        
        # Получаем данные видео
        meta = fetch_yt_metadata(yt_url)
        title = meta.get("title", "Неизвестный трек") if meta else "Неизвестный трек"
        artist_name = meta.get("author_name", "Неизвестно") if meta else "Неизвестно"
        author_url = meta.get("author_url", "") if meta else ""
        
        title = re.sub(r'\(.*?\)|\[.*?\]', '', title).strip()
        artist_name = artist_name.replace(" - Topic", "").strip()

        # Вычисляем красивый ID для автора на основе его URL
        if "@" in author_url:
            author_id = author_url.split("@")[-1].lower()
        else:
            author_id = author_url.strip('/').split('/')[-1].lower()
            
        author_id = re.sub(r'[^a-z0-9_]', '_', author_id)
        if not author_id or author_id == "unknown":
            author_id = "unknown_artist"

        # --- ОБНОВЛЕНИЕ БАЗЫ АВТОРОВ В ПАМЯТИ ---
        if author_id not in authors_db:
            authors_db[author_id] = {
                "id": author_id,
                "name": artist_name,
                "channel_url": author_url,
                "avatar_url": None, # Соберем позже
                "tracks": []
            }
        authors_db[author_id]["tracks"].append(track_id)

        # Вытягиваем год публикации
        year = fetch_yt_year(yt_url)

        # Скачиваем обложку трека (maxres или hq)
        cover_filename = "cover.jpg"
        cover_path = os.path.join(track_dir, cover_filename)
        if not os.path.exists(cover_path):
            if not download_image(f"https://img.youtube.com/vi/{vid_id}/maxresdefault.jpg", cover_path):
                if not download_image(f"https://img.youtube.com/vi/{vid_id}/hqdefault.jpg", cover_path):
                    cover_filename = ""

        # Собираем data.json для трека
        json_path = os.path.join(track_dir, "data.json")
        track_data = {
            "id": track_id,
            "title": title,
            "artist": artist_name,
            "authorId": author_id,
            "type": "fan_song",
            "game": "Bendy",
            "year": year, 
            "cover": cover_filename,
            "audio": "",
            "youtubeUrl": yt_url,
            "lyrics": {
                "original": "Текст песни пока не добавлен...",
                "translation": "Перевод появится позже..."
            }
        }

        with open(json_path, "w", encoding="utf-8") as f:
            json.dump(track_data, f, ensure_ascii=False, indent=4)
        
        print(f"✅ Трек сохранен: {title} | {artist_name}")
        music_index_ids.append(track_id)

    # 4. Обрабатываем собранных авторов
    print(f"\n👥 Начинаем создание базы авторов ({len(authors_db)} чел.)...")
    author_index_ids = []

    for author_id, author_data in authors_db.items():
        author_dir = os.path.join(BASE_AUTHORS_DIR, author_id)
        os.makedirs(author_dir, exist_ok=True)
        
        avatar_filename = "avatar.jpg"
        avatar_path = os.path.join(author_dir, avatar_filename)
        
        # Если аватарки еще нет локально, парсим канал и скачиваем
        if not os.path.exists(avatar_path) and author_data["channel_url"]:
            print(f"  🔍 Поиск аватарки для: {author_data['name']}")
            avatar_web_url = fetch_channel_avatar(author_data["channel_url"])
            if avatar_web_url:
                if download_image(avatar_web_url, avatar_path):
                    print(f"    🖼️ Аватарка скачана!")
                else:
                    avatar_filename = ""
            else:
                avatar_filename = ""
        elif not os.path.exists(avatar_path):
            avatar_filename = ""

        # Формируем JSON автора
        author_json_path = os.path.join(author_dir, "data.json")
        final_author_data = {
            "id": author_id,
            "name": author_data["name"],
            "channelUrl": author_data["channel_url"],
            "assets": {
                "avatar": avatar_filename
            },
            "tracks": author_data["tracks"]
        }
        
        with open(author_json_path, "w", encoding="utf-8") as f:
            json.dump(final_author_data, f, ensure_ascii=False, indent=4)
            
        author_index_ids.append(author_id)

    # 5. Сохраняем обновленные индексы
    with open(INDEX_MUSIC_FILE, "w", encoding="utf-8") as f:
        json.dump(music_index_ids, f, ensure_ascii=False, indent=4)
        
    with open(INDEX_AUTHORS_FILE, "w", encoding="utf-8") as f:
        json.dump(author_index_ids, f, ensure_ascii=False, indent=4)

    print(f"\n🎉 Готово!")
    print(f"Собрано треков: {len(music_index_ids)}")
    print(f"Собрано авторов: {len(author_index_ids)}")
    print(f"Индексы {INDEX_MUSIC_FILE} и {INDEX_AUTHORS_FILE} успешно обновлены.")

if __name__ == "__main__":
    generate_music()