import os
import json
import urllib.request
import urllib.parse
import urllib.error
import re
import time

# ==========================================
# 🎵 ФАЙЛ-ИСТОЧНИК ССЫЛОК
# ==========================================
LINKS_FILE = "youtube_links.txt"

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
    match = re.search(r"(?:v=|\/|vi\/|youtu\.be\/|\/v\/|embed\/)([0-9A-Za-z_-]{11})", url)
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
    print(f"📥 Анализ плейлиста: {playlist_url}")
    html = safe_request(playlist_url)
    if not html: return []

    video_ids = []
    matches = re.findall(r'"videoId":"([a-zA-Z0-9_-]{11})"', html)
    seen = set()
    for vid in matches:
        if vid not in seen:
            seen.add(vid)
            video_ids.append(vid)

    api_key_match = re.search(r'"INNERTUBE_API_KEY":"(.*?)"', html)
    client_ver_match = re.search(r'"clientVersion":"(.*?)"', html)
    token_match = re.search(r'"continuationCommand":{"token":"(.*?)"', html)

    if api_key_match and client_ver_match and token_match:
        api_key = api_key_match.group(1)
        client_ver = client_ver_match.group(1)
        token = token_match.group(1)
        
        print("  ↳ Найден токен продолжения. Подгружаем остальные видео...")
        while token:
            api_url = f"https://www.youtube.com/youtubei/v1/browse?key={api_key}"
            payload = json.dumps({
                "context": {
                    "client": { "clientName": "WEB", "clientVersion": client_ver }
                },
                "continuation": token
            }).encode('utf-8')
            
            api_headers = get_headers()
            api_headers['Content-Type'] = 'application/json'
            
            response_json = safe_request(api_url, data=payload, headers=api_headers)
            if not response_json: break
            
            new_matches = re.findall(r'"videoId":"([a-zA-Z0-9_-]{11})"', response_json)
            added_count = 0
            for vid in new_matches:
                if vid not in seen:
                    seen.add(vid)
                    video_ids.append(vid)
                    added_count += 1
                    
            next_token_match = re.search(r'"continuationCommand":{"token":"(.*?)"', response_json)
            if next_token_match and added_count > 0:
                token = next_token_match.group(1)
                time.sleep(0.5) 
            else:
                token = None
                
    print(f"  ↳ Собрано треков из плейлиста: {len(video_ids)}")
    return [f"https://youtu.be/{vid}" for vid in video_ids]

def fetch_yt_metadata(url):
    oembed_url = f"https://www.youtube.com/oembed?url={url}&format=json"
    html = safe_request(oembed_url)
    if html:
        try: return json.loads(html)
        except: pass
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
    html = safe_request(channel_url)
    if html:
        match = re.search(r'<meta property="og:image" content="(.*?)"', html)
        if match: return match.group(1).replace('=s900-', '=s400-')
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

def manage_links_file():
    """
    Читает youtube_links.txt. Разворачивает плейлисты.
    Удаляет дубликаты. Перезаписывает файл только чистыми ссылками на видео.
    """
    if not os.path.exists(LINKS_FILE):
        with open(LINKS_FILE, "w", encoding="utf-8") as f:
            f.write("# Добавляй сюда ссылки на YouTube видео или плейлисты (каждая с новой строки)\n")
            f.write("# При следующем запуске скрипт автоматически раскроет плейлисты и удалит дубликаты.\n\n")
        print(f"ℹ️ Создан файл {LINKS_FILE}. Добавьте в него ссылки и запустите скрипт снова.")
        return []

    with open(LINKS_FILE, "r", encoding="utf-8") as f:
        lines = [line.strip() for line in f if line.strip() and not line.startswith("#")]

    if not lines:
        print(f"ℹ️ Файл {LINKS_FILE} пуст. Добавьте ссылки.")
        return []

    video_urls = []
    playlists = []

    for line in lines:
        if "playlist?list=" in line or "&list=" in line:
            playlists.append(line)
        else:
            video_urls.append(line)

    # Обрабатываем плейлисты
    for p_url in playlists:
        video_urls.extend(get_playlist_videos(p_url))

    # Удаляем дубликаты (используя YouTube ID как ключ)
    unique_vids = {}
    for url in video_urls:
        vid = get_yt_video_id(url)
        if vid and vid not in unique_vids:
            unique_vids[vid] = f"https://youtu.be/{vid}"

    final_urls = list(unique_vids.values())

    # Перезаписываем файл красиво и чисто
    with open(LINKS_FILE, "w", encoding="utf-8") as f:
        f.write("# Добавляй сюда ссылки на YouTube видео или плейлисты (каждая с новой строки)\n")
        f.write("# Скрипт автоматически раскрывает плейлисты и удаляет дубликаты.\n\n")
        for url in final_urls:
            f.write(url + "\n")

    return final_urls

def generate_music():
    print("🚀 Запуск умного парсинга музыки с YouTube...\n")
    
    os.makedirs(BASE_MUSIC_DIR, exist_ok=True)
    os.makedirs(BASE_AUTHORS_DIR, exist_ok=True)
    os.makedirs("data", exist_ok=True)

    # 1. Загружаем и обрабатываем ссылки из текстового файла
    final_urls = manage_links_file()
    if not final_urls:
        return

    print(f"\nВсего треков в базе (уникальных): {len(final_urls)}\n")
    
    music_index_ids = []
    authors_db = {} # Для обновления базы авторов в памяти

    # 2. Обрабатываем каждое видео
    for yt_url in final_urls:
        vid_id = get_yt_video_id(yt_url)
        track_id = f"yt_{vid_id}"
        
        track_dir = os.path.join(BASE_MUSIC_DIR, track_id)
        os.makedirs(track_dir, exist_ok=True)
        
        json_path = os.path.join(track_dir, "data.json")
        
        # Читаем старые данные, если они есть
        existing_data = {}
        if os.path.exists(json_path):
            try:
                with open(json_path, "r", encoding="utf-8") as f:
                    existing_data = json.load(f)
            except: pass

        # Флаги для определения, нужно ли нам делать запросы к API ютуба
        needs_meta = not existing_data or existing_data.get("title") in ["Неизвестный трек", ""] or existing_data.get("artist") in ["Неизвестно", ""]
        needs_year = not existing_data or not existing_data.get("year")
        
        # Скачиваем метаданные только если чего-то не хватает
        title = existing_data.get("title", "Неизвестный трек")
        artist_name = existing_data.get("artist", "Неизвестно")
        author_id = existing_data.get("authorId", "unknown_artist")
        author_url = ""

        if needs_meta:
            meta = fetch_yt_metadata(yt_url)
            if meta:
                title = meta.get("title", title)
                artist_name = meta.get("author_name", artist_name)
                author_url = meta.get("author_url", "")
                
                title = re.sub(r'\(.*?\)|\[.*?\]', '', title).strip()
                artist_name = artist_name.replace(" - Topic", "").strip()

                if "@" in author_url:
                    author_id = author_url.split("@")[-1].lower()
                else:
                    author_id = author_url.strip('/').split('/')[-1].lower()
                author_id = re.sub(r'[^a-z0-9_]', '_', author_id)
                if not author_id or author_id == "unknown":
                    author_id = "unknown_artist"

        # Добавляем трек автору в память
        if author_id not in authors_db:
            authors_db[author_id] = {
                "id": author_id,
                "name": artist_name,
                "channel_url": author_url,
                "avatar_url": None,
                "tracks": []
            }
        authors_db[author_id]["tracks"].append(track_id)

        # Вытягиваем год только если его нет
        year = existing_data.get("year", "")
        if needs_year:
            year = fetch_yt_year(yt_url)

        # Скачиваем обложку, если её нет физически ИЛИ в json она не прописана
        cover_filename = existing_data.get("cover", "cover.jpg")
        if not cover_filename: cover_filename = "cover.jpg"
        
        cover_path = os.path.join(track_dir, cover_filename)
        if not os.path.exists(cover_path):
            if not download_image(f"https://img.youtube.com/vi/{vid_id}/maxresdefault.jpg", cover_path):
                if not download_image(f"https://img.youtube.com/vi/{vid_id}/hqdefault.jpg", cover_path):
                    cover_filename = "" # Если не удалось скачать

        # Сборка финального JSON с УМНЫМ СЛИЯНИЕМ (Smart Merge)
        track_data = {
            "id": track_id,
            "title": title,
            "artist": artist_name,
            "authorId": author_id,
            "type": existing_data.get("type", "fan_song"),
            "game": existing_data.get("game", "Bendy"),
            "year": year, 
            "cover": cover_filename,
            "audio": existing_data.get("audio", ""),
            "youtubeUrl": yt_url,
            "lyrics": existing_data.get("lyrics", {
                "original": "Текст песни пока не добавлен...",
                "translation": "Перевод появится позже..."
            })
        }

        # Сохраняем, только если данные изменились (экономим ресурсы диска)
        if track_data != existing_data:
            with open(json_path, "w", encoding="utf-8") as f:
                json.dump(track_data, f, ensure_ascii=False, indent=4)
            if not existing_data:
                print(f"✅ СОЗДАН: {title} | {artist_name}")
            else:
                print(f"🔄 ОБНОВЛЕН: {title} | {artist_name}")
        else:
            print(f"✔️ Пропущен (Всё актуально): {title}")

        music_index_ids.append(track_id)

    # 3. Обрабатываем собранных авторов
    print(f"\n👥 Синхронизация базы авторов ({len(authors_db)} чел.)...")
    author_index_ids = []

    for author_id, author_data in authors_db.items():
        author_dir = os.path.join(BASE_AUTHORS_DIR, author_id)
        os.makedirs(author_dir, exist_ok=True)
        
        author_json_path = os.path.join(author_dir, "data.json")
        existing_author = {}
        if os.path.exists(author_json_path):
            try:
                with open(author_json_path, "r", encoding="utf-8") as f:
                    existing_author = json.load(f)
            except: pass

        avatar_filename = existing_author.get("assets", {}).get("avatar", "avatar.jpg")
        if not avatar_filename: avatar_filename = "avatar.jpg"
        
        avatar_path = os.path.join(author_dir, avatar_filename)
        
        # Скачиваем аватарку только если её нет
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

        # Умное слияние треков (чтобы не потерять треки, которых нет на ютубе, но есть в базе)
        merged_tracks = set(existing_author.get("tracks", []))
        for t in author_data["tracks"]:
            merged_tracks.add(t)

        final_author_data = {
            "id": author_id,
            "name": existing_author.get("name", author_data["name"]),
            "channelUrl": existing_author.get("channelUrl", author_data["channel_url"]),
            "assets": {
                "avatar": avatar_filename
            },
            "tracks": list(merged_tracks)
        }
        
        if final_author_data != existing_author:
            with open(author_json_path, "w", encoding="utf-8") as f:
                json.dump(final_author_data, f, ensure_ascii=False, indent=4)
            
        author_index_ids.append(author_id)

    # 4. Сохраняем обновленные индексы
    with open(INDEX_MUSIC_FILE, "w", encoding="utf-8") as f:
        json.dump(music_index_ids, f, ensure_ascii=False, indent=4)
        
    # Объединяем индекс авторов со старым индексом, чтобы не потерять старых не-ютуб авторов
    existing_author_index = []
    if os.path.exists(INDEX_AUTHORS_FILE):
        try:
            with open(INDEX_AUTHORS_FILE, "r", encoding="utf-8") as f:
                existing_author_index = json.load(f)
        except: pass

    final_author_index = list(set(existing_author_index + author_index_ids))

    with open(INDEX_AUTHORS_FILE, "w", encoding="utf-8") as f:
        json.dump(final_author_index, f, ensure_ascii=False, indent=4)

    print(f"\n🎉 Готово!")
    print(f"Файл {LINKS_FILE} очищен от дубликатов.")
    print(f"Индексы {INDEX_MUSIC_FILE} и {INDEX_AUTHORS_FILE} успешно обновлены.")

if __name__ == "__main__":
    generate_music()