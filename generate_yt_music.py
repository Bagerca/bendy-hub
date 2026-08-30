import os
import json
import urllib.request
import re

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

# Ссылки на плейлисты (Вставь сюда ссылку на плейлист)
YT_PLAYLISTS = [
    "https://youtube.com/playlist?list=PLRp0gf9ki7cqXRyLgeblyL_vio5Bbfl1Q&si=sf6jpJr4s5dgSisq"
]

# ==========================================

BASE_MUSIC_DIR = os.path.join("assets", "music")
INDEX_FILE = os.path.join("data", "music_index.json")

def get_yt_video_id(url):
    match = re.search(r"(?:v=|\/)([0-9A-Za-z_-]{11})", url)
    return match.group(1) if match else None

def get_playlist_videos(playlist_url):
    """ Парсит HTML плейлиста и вытаскивает все ID видео (до 100 шт за раз) """
    print(f"📥 Анализ плейлиста: {playlist_url}")
    video_ids = []
    try:
        req = urllib.request.Request(playlist_url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=15) as response:
            html = response.read().decode('utf-8')
            # Ищем все videoId в скрытом JSON объекта ytInitialData
            matches = re.findall(r'"videoId":"([a-zA-Z0-9_-]{11})"', html)
            
            # Удаляем дубликаты, сохраняя порядок
            seen = set()
            for vid in matches:
                if vid not in seen:
                    seen.add(vid)
                    video_ids.append(vid)
                    
        print(f"  ↳ Найдено уникальных треков: {len(video_ids)}")
    except Exception as e:
        print(f"⚠️ Ошибка при чтении плейлиста: {e}")
        
    return [f"https://youtu.be/{vid}" for vid in video_ids]

def fetch_yt_metadata(url):
    oembed_url = f"https://www.youtube.com/oembed?url={url}&format=json"
    try:
        req = urllib.request.Request(oembed_url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=10) as response:
            return json.loads(response.read().decode('utf-8'))
    except Exception as e:
        print(f"⚠️ Не удалось получить метаданные (название/автор) для {url}: {e}")
        return None

def fetch_yt_year(url):
    """ Парсит HTML страницы ютуба, чтобы вытащить год публикации """
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=10) as response:
            html = response.read().decode('utf-8')
            match = re.search(r'<meta itemprop="datePublished" content="(\d{4})', html)
            if match:
                return match.group(1)
            match = re.search(r'"publishDate":"(\d{4})', html)
            if match:
                return match.group(1)
    except Exception as e:
        pass
    return ""

def download_thumbnail(video_id, save_path):
    # Пытаемся скачать в максимальном качестве 16:9, если нет — берем высокое
    urls = [
        f"https://img.youtube.com/vi/{video_id}/maxresdefault.jpg",
        f"https://img.youtube.com/vi/{video_id}/hqdefault.jpg"
    ]
    
    for url in urls:
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req, timeout=10) as response:
                if response.status == 200:
                    with open(save_path, 'wb') as f:
                        f.write(response.read())
                    return True
        except:
            continue
    return False

def generate_music():
    print("🚀 Запуск автоматической генерации музыки с YouTube...\n")
    os.makedirs(BASE_MUSIC_DIR, exist_ok=True)
    os.makedirs("data", exist_ok=True)

    # 1. Собираем все ссылки (одиночные + из плейлистов)
    all_urls = list(YT_LINKS)
    for p_url in YT_PLAYLISTS:
        if p_url.strip():
            all_urls.extend(get_playlist_videos(p_url.strip()))

    # 2. Удаляем дубликаты (по ID видео)
    unique_vids = set()
    final_urls = []
    for url in all_urls:
        vid = get_yt_video_id(url)
        if vid and vid not in unique_vids:
            unique_vids.add(vid)
            final_urls.append(url)

    print(f"\nВсего треков в очереди на обработку: {len(final_urls)}\n")
    
    index_ids = []

    # 3. Обрабатываем каждое видео
    for yt_url in final_urls:
        vid_id = get_yt_video_id(yt_url)
        track_id = f"yt_{vid_id}"
        
        track_dir = os.path.join(BASE_MUSIC_DIR, track_id)
        os.makedirs(track_dir, exist_ok=True)
        
        # Получаем данные видео с ютуба
        meta = fetch_yt_metadata(yt_url)
        title = meta.get("title", "Неизвестный трек") if meta else "Неизвестный трек"
        artist = meta.get("author_name", "Неизвестно") if meta else "Неизвестно"
        
        # Очищаем название от лишних скобок типа (Official Music Video)
        title = re.sub(r'\(.*?\)|\[.*?\]', '', title).strip()
        artist = artist.replace(" - Topic", "").strip()

        # Вытягиваем год публикации
        year = fetch_yt_year(yt_url)

        # Скачиваем обложку
        cover_filename = "cover.jpg"
        cover_path = os.path.join(track_dir, cover_filename)
        if not os.path.exists(cover_path):
            if not download_thumbnail(vid_id, cover_path):
                cover_filename = ""
                print(f"⚠️ Не удалось скачать обложку: {track_id}")

        # Собираем data.json
        json_path = os.path.join(track_dir, "data.json")
        track_data = {
            "id": track_id,
            "title": title,
            "artist": artist,
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
        
        print(f"✅ Успешно: {title} | {artist} ({year})")
        index_ids.append(track_id)

    # Обновляем индексный файл
    with open(INDEX_FILE, "w", encoding="utf-8") as f:
        json.dump(index_ids, f, ensure_ascii=False, indent=4)

    print(f"\n🎉 Все треки успешно сгенерированы! База данных {INDEX_FILE} перезаписана.")

if __name__ == "__main__":
    generate_music()