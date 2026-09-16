import os
import re
import json
import urllib.request
import urllib.error
import sys

def get_headers():
    return {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        # Куки обхода проверки возраста (Age Gate) 18+
        'Cookie': 'birthtime=283785601; mature_content=1; wants_mature_content=1; lastagecheckage=1-0-1990'
    }

def download_file_stream(url, save_path, desc="Файл"):
    """Скачивает файл частями с красивой индикацией прогресса в консоли"""
    try:
        # Steam часто отдает http:// для видео — принудительно меняем на https://
        if url.startswith("http://"):
            url = "https://" + url[7:]

        req = urllib.request.Request(url, headers=get_headers())
        with urllib.request.urlopen(req, timeout=30) as response:
            total_size = response.getheader('Content-Length')
            total_size = int(total_size) if total_size else None
            downloaded = 0
            chunk_size = 1024 * 512 # 512 KB

            with open(save_path, 'wb') as out_file:
                while True:
                    chunk = response.read(chunk_size)
                    if not chunk:
                        break
                    out_file.write(chunk)
                    downloaded += len(chunk)
                    if total_size:
                        percent = (downloaded / total_size) * 100
                        mb_done = downloaded / (1024 * 1024)
                        mb_total = total_size / (1024 * 1024)
                        sys.stdout.write(f"\r  ⏳ {desc}: {percent:.1f}% ({mb_done:.1f}/{mb_total:.1f} МБ)")
                    else:
                        mb_done = downloaded / (1024 * 1024)
                        sys.stdout.write(f"\r  ⏳ {desc}: {mb_done:.1f} МБ скачано")
                    sys.stdout.flush()
            print() # перенос строки
            return True
    except Exception as e:
        print(f"\n  ⚠️ Ошибка скачивания {url}: {e}")
        return False

def scrape_videos_from_html(app_id):
    """Резервный способ: достает прямые ссылки на mp4 прямо из HTML магазина"""
    store_url = f"https://store.steampowered.com/app/{app_id}/"
    req = urllib.request.Request(store_url, headers=get_headers())
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            html = resp.read().decode('utf-8', errors='ignore')
            # Ищем ссылки на HD MP4 трейлеры в разметке плеера
            hd_matches = re.findall(r'data-mp4-hd-source="([^"]+)"', html)
            sd_matches = re.findall(r'data-mp4-source="([^"]+)"', html)
            
            videos = []
            seen = set()
            for v in (hd_matches + sd_matches):
                clean_v = v.split("?")[0]
                if clean_v not in seen:
                    seen.add(clean_v)
                    videos.append(v)
            return videos
    except Exception as e:
        print(f"  ⚠️ Не удалось спарсить HTML: {e}")
        return []

def download_steam_media(steam_input, output_dir="steam_media"):
    # Достаем ID игры
    match = re.search(r'/app/(\d+)', str(steam_input))
    app_id = match.group(1) if match else str(steam_input).strip()

    print(f"\n🔍 Подключение к Steam для AppID: {app_id}...")

    # 1. Запрос к официальному API
    api_url = f"https://store.steampowered.com/api/appdetails?appids={app_id}&l=russian"
    req = urllib.request.Request(api_url, headers=get_headers())
    
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = json.loads(resp.read().decode('utf-8'))
    except Exception as e:
        print(f"❌ Ошибка сетевого запроса: {e}")
        return

    if not data.get(app_id, {}).get("success"):
        print("❌ Не удалось найти данные игры (возможно неверный ID).")
        return

    game_data = data[app_id]["data"]
    game_title = game_data.get("name", f"app_{app_id}")
    clean_folder_name = f"{app_id}_{re.sub(r'[^a-zA-Z0-9А-Яа-я_\- ]', '', game_title).strip()}"
    save_folder = os.path.join(output_dir, clean_folder_name)
    
    screens_folder = os.path.join(save_folder, "screenshots")
    videos_folder = os.path.join(save_folder, "videos")
    os.makedirs(screens_folder, exist_ok=True)
    os.makedirs(videos_folder, exist_ok=True)

    print(f"🎮 Проект: {game_title}")
    print(f"📁 Папка сохранения: {save_folder}\n")

    # 2. СКРИНШОТЫ
    screenshots = game_data.get("screenshots", [])
    print(f"📸 Найдено скриншотов: {len(screenshots)}")
    for idx, sc in enumerate(screenshots, 1):
        img_url = sc.get("path_full")
        if img_url:
            # Убираем параметры обрезки, чтобы забрать оригинал без сжатия
            clean_url = img_url.split("?")[0]
            ext = clean_url.split(".")[-1]
            filename = os.path.join(screens_folder, f"screenshot_{idx:02d}.{ext}")
            
            if not os.path.exists(filename):
                download_file_stream(img_url, filename, desc=f"Скриншот {idx}/{len(screenshots)}")
            else:
                print(f"  ✔️ Скриншот {idx} уже существует")

    # 3. ВИДЕО / ТРЕЙЛЕРЫ
    print(f"\n🎬 Поиск видеороликов...")
    video_urls = []

    # Пробуем достать из API
    movies = game_data.get("movies", [])
    for idx, mv in enumerate(movies, 1):
        # Приоритет: mp4 max -> mp4 480 -> webm max
        v_url = mv.get("mp4", {}).get("max") or mv.get("mp4", {}).get("480") or mv.get("webm", {}).get("max")
        title = mv.get("name", f"trailer_{idx}")
        if v_url:
            video_urls.append((title, v_url))

    # Если через API ролики не отдались (из-за защиты) — берем из HTML
    if not video_urls:
        print("  ↳ Поиск через HTML страницу...")
        scraped = scrape_videos_from_html(app_id)
        for idx, v_url in enumerate(scraped, 1):
            video_urls.append((f"trailer_{idx}", v_url))

    print(f"🎥 Найдено видео: {len(video_urls)}")
    for idx, (title, v_url) in enumerate(video_urls, 1):
        clean_title = re.sub(r'[^a-zA-Z0-9А-Яа-я_\- ]', '', title).strip()
        ext = "mp4" if ".mp4" in v_url else "webm"
        filename = os.path.join(videos_folder, f"{idx:02d}_{clean_title}.{ext}")

        if not os.path.exists(filename):
            download_file_stream(v_url, filename, desc=f"Видео: {clean_title}")
        else:
            print(f"  ✔️ Ролик «{clean_title}» уже скачан")

    print(f"\n🎉 Готово! Все медиафайлы сохранены в:\n{os.path.abspath(save_folder)}")

if __name__ == "__main__":
    user_val = input("Вставь ссылку на игру в Steam или AppID: ").strip()
    if user_val:
        download_steam_media(user_val)