import urllib.request
import urllib.parse
import urllib.error
import json
import re
import os
import logging
import time
import socket
import html
import ssl
import xml.etree.ElementTree as ET
from datetime import datetime
from typing import List, Dict, Tuple

# === МАГИЯ ДЛЯ ЛОКАЛЬНОГО ЗАПУСКА ===
# Отключаем проверку SSL. Это решает ошибку "_ssl.c:1015: The handshake operation timed out",
# которую вызывают системы глубокого анализа трафика (DPI) у провайдеров или антивирусы.
ssl._create_default_https_context = ssl._create_unverified_context

logging.basicConfig(level=logging.INFO, format='%(asctime)s [%(levelname)s] %(message)s', datefmt='%H:%M:%S')

class BendyGhostScraper:
    def __init__(self, handles: List[str]):
        self.handles = handles
        self.output_file = "feed.json"
        self.tmp_file = "feed.json.tmp"
        self.max_history = 1000
        
        self.avatars_dir = os.path.join("assets", "avatars")
        os.makedirs(self.avatars_dir, exist_ok=True)

        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Connection': 'keep-alive'
        }
        
        # Определяем, где мы запущены: на ПК или на серверах GitHub
        self.is_github = os.environ.get('GITHUB_ACTIONS') == 'true'

    def load_existing_feed(self) -> List[Dict]:
        if not os.path.exists(self.output_file):
            return []
        try:
            with open(self.output_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception:
            return []

    def parse_date(self, date_str: str) -> str:
        if not date_str: return datetime.utcnow().isoformat() + "Z"
        if "T" in date_str and "Z" in date_str: return date_str
        
        # Формат RSS (Wed, 24 Jul 2024 15:22:00 GMT)
        try:
            dt = datetime.strptime(date_str, "%a, %d %b %Y %H:%M:%S %Z")
            return dt.isoformat() + "Z"
        except Exception: pass
            
        # Формат Syndication (Mon Jul 24 15:22:00 +0000 2023)
        try:
            parts = date_str.split()
            if len(parts) == 6: 
                cd = f"{parts[1]} {parts[2]} {parts[3]} {parts[5]}" 
                dt = datetime.strptime(cd, "%b %d %H:%M:%S %Y")
                return dt.isoformat() + "Z"
        except Exception: pass
            
        return date_str

    def download_avatar(self, handle: str, avatar_url: str) -> str:
        if not avatar_url: return ""
        local_filename = f"{handle.lower()}.jpg"
        local_path = os.path.join(self.avatars_dir, local_filename)
        web_path = f"assets/avatars/{local_filename}"
        
        if os.path.exists(local_path): 
            return web_path # Если аватарка уже есть, не качаем заново, бережем лимиты

        avatar_url = avatar_url.replace('_normal', '_400x400')
        try:
            req = urllib.request.Request(avatar_url, headers=self.headers)
            with urllib.request.urlopen(req, timeout=10) as response:
                if response.status == 200:
                    with open(local_path, 'wb') as f:
                        f.write(response.read())
                    return web_path
        except Exception:
            pass
        return ""

    def parse_rss_xml(self, xml_data: str, handle: str) -> Tuple[List[Dict], str]:
        """Универсальный парсер для RSSHub и Nitter"""
        posts = []
        avatar_url = ""
        
        try:
            root = ET.fromstring(xml_data)
            channel = root.find("channel")
            if channel is None: return posts, avatar_url
                
            author_name = handle
            title_node = channel.find("title")
            if title_node is not None and title_node.text:
                full_title = html.unescape(title_node.text)
                if " / " in full_title: author_name = full_title.split(" / ")[0].strip()
                elif "'s Twitter" in full_title: author_name = full_title.split("'s Twitter")[0].strip()
                    
            image_node = channel.find("image")
            if image_node is not None:
                url_node = image_node.find("url")
                if url_node is not None and url_node.text:
                    raw_url = urllib.parse.unquote(url_node.text)
                    if 'pbs.twimg.com' in raw_url:
                        avatar_url = "https://pbs.twimg.com" + raw_url.split('pbs.twimg.com')[-1]
                        
            for item in channel.findall("item"):
                link_node = item.find("link")
                if link_node is None or not link_node.text: continue
                post_id = link_node.text.rstrip('/').split('/')[-1]
                
                pub_node = item.find("pubDate")
                iso_date = self.parse_date(pub_node.text if pub_node is not None else "")
                
                title_item_node = item.find("title")
                content = html.unescape(title_item_node.text.strip()) if title_item_node is not None and title_item_node.text else ""
                
                # Чистим контент от артефактов RSSHub (например, ссылок на видео в конце текста)
                content = re.sub(r'<video[^>]*>.*?</video>', '', content, flags=re.IGNORECASE | re.DOTALL)
                
                media_url = None
                desc_node = item.find("description")
                if desc_node is not None and desc_node.text:
                    img_match = re.search(r'<img[^>]+src="([^"]+)"', desc_node.text, re.IGNORECASE)
                    if img_match:
                        raw_src = urllib.parse.unquote(img_match.group(1))
                        match = re.search(r'media/([^/]+\.(?:jpg|png|mp4|webp))', raw_src, re.IGNORECASE)
                        media_url = f"https://pbs.twimg.com/media/{match.group(1)}" if match else raw_src
                            
                posts.append({
                    "id": post_id,
                    "authorName": author_name,
                    "authorHandle": f"@{handle}",
                    "platform": "twitter",
                    "content": content,
                    "timestamp": iso_date,
                    "mediaUrl": media_url,
                    "originalAvatarUrl": avatar_url
                })
                
        except ET.ParseError:
            pass # Не XML (Cloudflare блок)
            
        return posts, avatar_url

    def parse_syndication(self, html_data: str, handle: str) -> Tuple[List[Dict], str]:
        """Парсер виджетов (Официальный канал)"""
        posts = []
        avatar_url = ""
        match = re.search(r'<script id="__NEXT_DATA__" type="application/json">({.*?})</script>', html_data)
        if not match: return posts, avatar_url
            
        try:
            data = json.loads(match.group(1))
            entries = data.get('props', {}).get('pageProps', {}).get('timeline', {}).get('entries', [])
            for entry in entries:
                if entry.get('type') != 'tweet': continue
                tweet = entry['content']['tweet']
                author = tweet.get('user', {})
                if author.get('screen_name', '').lower() != handle.lower(): continue
                if not avatar_url: avatar_url = author.get('profile_image_url_https', '')

                media_url = None
                media_list = tweet.get('entities', {}).get('media', [])
                if media_list:
                    m = media_list[0]
                    if 'video_info' in m:
                        variants = m['video_info'].get('variants', [])
                        mp4_variants = [v for v in variants if v.get('content_type') == 'video/mp4']
                        if mp4_variants:
                            media_url = max(mp4_variants, key=lambda x: x.get('bitrate', 0)).get('url')
                    if not media_url: media_url = m.get('media_url_https')

                posts.append({
                    "id": tweet.get('id_str', ''),
                    "authorName": author.get('name', handle),
                    "authorHandle": f"@{author.get('screen_name', handle)}",
                    "platform": "twitter",
                    "content": tweet.get('text', ''),
                    "timestamp": self.parse_date(tweet.get('created_at', '')),
                    "mediaUrl": media_url,
                    "originalAvatarUrl": avatar_url
                })
        except Exception: pass
        return posts, avatar_url

    def fetch_timeline(self, handle: str) -> Tuple[List[Dict], str]:
        strategies = []
        
        # Если мы на GitHub Actions (США) — бьем напрямую в Твиттер, это 100% сработает
        if self.is_github:
            strategies.append(("Syndication (Direct)", f"https://syndication.twitter.com/srv/timeline-profile/screen-name/{handle}", "syndication"))
            
        # Если мы локально в РФ — используем RSSHub. Это приватные сервера с ключами Твиттера.
        strategies.extend([
            ("RSSHub (rssforever)", f"https://rsshub.rssforever.com/twitter/user/{handle}", "rss"),
            ("RSSHub (pseudoyu)", f"https://rsshub.pseudoyu.com/twitter/user/{handle}", "rss"),
            ("Nitter (projectsegfau)", f"https://nitter.projectsegfau.lt/{handle}/rss", "rss")
        ])

        # Фоллбэк, если RSSHub упадет
        if not self.is_github:
            synd_url = urllib.parse.quote(f"https://syndication.twitter.com/srv/timeline-profile/screen-name/{handle}")
            strategies.append(("Syndication (AllOrigins)", f"https://api.allorigins.win/raw?url={synd_url}", "syndication"))

        for name, url, engine in strategies:
            logging.info(f"[{handle}] Попытка: {name}...")
            try:
                req = urllib.request.Request(url, headers=self.headers)
                with urllib.request.urlopen(req, timeout=12) as response:
                    if response.status == 200:
                        raw_data = response.read().decode('utf-8')
                        
                        if engine == "rss":
                            posts, avatar = self.parse_rss_xml(raw_data, handle)
                        else:
                            posts, avatar = self.parse_syndication(raw_data, handle)
                            
                        if posts:
                            logging.info(f"🟢 [{handle}] Успех через {name}! Постов: {len(posts)}")
                            return posts, avatar
                        else:
                            logging.warning(f"[{handle}] Пустой ответ или блок Cloudflare.")
            except socket.timeout:
                pass # Игнорируем спам логов про таймауты
            except Exception:
                pass 
                
            time.sleep(1)

        logging.error(f"❌ [{handle}] Все зеркала недоступны.")
        return [], ""

    def run(self):
        existing_posts = self.load_existing_feed()
        logging.info(f"Загружено постов из кэша: {len(existing_posts)}")
        if self.is_github:
            logging.info("🌍 Запущено на серверах GitHub. Используем прямые маршруты.")
        else:
            logging.info("💻 Запущено локально. SSL отключен. Используем скрытые маршруты RSS.")

        all_fetched_posts = []
        
        for handle in self.handles:
            combined, latest_avatar_url = self.fetch_timeline(handle)
            
            if not latest_avatar_url:
                for ep in existing_posts:
                    if ep.get('authorHandle', '').lower() == f"@{handle.lower()}":
                        latest_avatar_url = ep.get('originalAvatarUrl', '')
                        break

            local_avatar_path = self.download_avatar(handle, latest_avatar_url)
            
            for p in combined: p['localAvatarPath'] = local_avatar_path
            for ep in existing_posts:
                if ep.get('authorHandle', '').lower() == f"@{handle.lower()}":
                    ep['localAvatarPath'] = local_avatar_path
                    if latest_avatar_url: ep['originalAvatarUrl'] = latest_avatar_url

            all_fetched_posts.extend(combined)
            time.sleep(1.5) 
            
        merged_dict = {post['id']: post for post in existing_posts}
        for post in all_fetched_posts:
            if post['id']:
                merged_dict[post['id']] = post

        final_posts = list(merged_dict.values())
        final_posts.sort(key=lambda x: x['timestamp'], reverse=True)
        final_posts = final_posts[:self.max_history]
        
        try:
            with open(self.tmp_file, 'w', encoding='utf-8') as f:
                json.dump(final_posts, f, ensure_ascii=False, indent=2)
            os.replace(self.tmp_file, self.output_file)
            logging.info(f"🎉 База успешно обновлена! Уникальных постов: {len(final_posts)}")
        except Exception as e:
            if os.path.exists(self.tmp_file): os.remove(self.tmp_file)
            logging.error(f"Ошибка сохранения: {e}")

if __name__ == "__main__":
    devs = [
        "Bendy", 
        "themeatly", 
        "m_ZeroLogics", 
        "BLacroix30", 
        "bookpast", 
        "BendyRun", 
        "GentCorporation", 
        "Doberart"
    ] 
    monitor = BendyGhostScraper(devs)
    monitor.run()