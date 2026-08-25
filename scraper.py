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

# Отключаем проверку SSL для локальных запусков через провайдеров РФ
ssl._create_default_https_context = ssl._create_unverified_context

logging.basicConfig(level=logging.INFO, format='%(asctime)s [%(levelname)s] %(message)s', datefmt='%H:%M:%S')

class BendyMatrixScraper:
    def __init__(self, handles: List[str]):
        self.handles = handles
        self.output_file = "feed.json"
        self.tmp_file = "feed.json.tmp"
        self.max_history = 1000
        
        self.avatars_dir = os.path.join("assets", "avatars")
        os.makedirs(self.avatars_dir, exist_ok=True)

        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            'Accept': 'application/json, text/html, application/xhtml+xml, application/xml;q=0.9, */*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Connection': 'keep-alive'
        }

    def load_existing_feed(self) -> List[Dict]:
        if not os.path.exists(self.output_file): return []
        try:
            with open(self.output_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception: return []

    def parse_date(self, date_val) -> str:
        if not date_val: return datetime.utcnow().isoformat() + "Z"
        
        # Sotwe формат (timestamp в миллисекундах)
        if isinstance(date_val, (int, float)):
            return datetime.utcfromtimestamp(date_val / 1000.0).isoformat() + "Z"
            
        date_str = str(date_val)
        if "T" in date_str and "Z" in date_str: return date_str
        
        # RSS формат
        try:
            dt = datetime.strptime(date_str, "%a, %d %b %Y %H:%M:%S %Z")
            return dt.isoformat() + "Z"
        except Exception: pass
            
        # Syndication формат
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
        
        if os.path.exists(local_path): return web_path

        avatar_url = avatar_url.replace('_normal', '_400x400')
        strategies = [
            avatar_url,
            f"https://corsproxy.io/?{urllib.parse.quote(avatar_url, safe='=&/?')}"
        ]

        for url in strategies:
            try:
                req = urllib.request.Request(url, headers=self.headers)
                with urllib.request.urlopen(req, timeout=10) as response:
                    if response.status == 200:
                        with open(local_path, 'wb') as f:
                            f.write(response.read())
                        return web_path
            except Exception: pass
        return ""

    def parse_sotwe(self, json_data: str, handle: str) -> Tuple[List[Dict], str]:
        posts = []
        avatar_url = ""
        try:
            data = json.loads(json_data)
            user_info = data.get('data', {}).get('profile', {})
            avatar_url = user_info.get('profile_image_url_https', '')
            actual_name = user_info.get('name', handle)
            
            tweets_data = data.get('data', {}).get('tweets', [])
            for tweet in tweets_data:
                t_user = tweet.get('user', {})
                t_handle = t_user.get('screen_name', handle)
                if t_handle.lower() != handle.lower(): continue
                    
                content = tweet.get('full_text') or tweet.get('text', '')
                
                media_url = None
                media_list = tweet.get('mediaEntities', []) or tweet.get('entities', {}).get('media', [])
                if media_list:
                    m = media_list[0]
                    if 'video_info' in m:
                        variants = m['video_info'].get('variants', [])
                        mp4_variants = [v for v in variants if v.get('content_type') == 'video/mp4']
                        if mp4_variants:
                            media_url = max(mp4_variants, key=lambda x: x.get('bitrate', 0)).get('url')
                    if not media_url: media_url = m.get('media_url_https') or m.get('url')

                posts.append({
                    "id": tweet.get('id_str', ''),
                    "authorName": actual_name,
                    "authorHandle": f"@{t_handle}",
                    "platform": "twitter",
                    "content": content,
                    "timestamp": self.parse_date(tweet.get('createdAt')),
                    "mediaUrl": media_url,
                    "originalAvatarUrl": avatar_url
                })
        except Exception: pass
        return posts, avatar_url

    def parse_syndication(self, html_data: str, handle: str) -> Tuple[List[Dict], str]:
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
                        if mp4_variants: media_url = max(mp4_variants, key=lambda x: x.get('bitrate', 0)).get('url')
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

    def get_proxy_url(self, target_url: str, proxy_type: str) -> str:
        safe_url = urllib.parse.quote(target_url, safe='=&/?')
        if proxy_type == "direct": return target_url
        if proxy_type == "codetabs": return f"https://api.codetabs.com/v1/proxy?quest={safe_url}"
        if proxy_type == "corsproxy": return f"https://corsproxy.io/?{safe_url}"
        if proxy_type == "allorigins": return f"https://api.allorigins.win/raw?url={urllib.parse.quote(target_url)}"
        return target_url

    def fetch_timeline(self, handle: str) -> Tuple[List[Dict], str]:
        # Целевые эндпоинты
        sotwe_url = f"https://api.sotwe.com/v3/user/{handle}"
        synd_url = f"https://syndication.twitter.com/srv/timeline-profile/screen-name/{handle}"
        
        # Матрица стратегий: (Имя, Тип парсера, Целевой URL, Прокси)
        # GitHub Actions (Azure) блокируется напрямую везде, поэтому прокси идут ПЕРВЫМИ.
        strategies = [
            ("Sotwe API via CodeTabs", "sotwe", sotwe_url, "codetabs"),
            ("Sotwe API via CorsProxy", "sotwe", sotwe_url, "corsproxy"),
            ("Syndication via CodeTabs", "syndication", synd_url, "codetabs"),
            ("Syndication via CorsProxy", "syndication", synd_url, "corsproxy"),
            ("Sotwe API via AllOrigins", "sotwe", sotwe_url, "allorigins"),
            ("Syndication via AllOrigins", "syndication", synd_url, "allorigins"),
            ("Sotwe API (Direct)", "sotwe", sotwe_url, "direct") # На случай если локально без блока
        ]

        for name, parser_type, target, proxy in strategies:
            logging.info(f"[{handle}] Пробуем маршрут: {name}...")
            url = self.get_proxy_url(target, proxy)
            
            try:
                req = urllib.request.Request(url, headers=self.headers)
                with urllib.request.urlopen(req, timeout=12) as response:
                    if response.status == 200:
                        raw_data = response.read().decode('utf-8')
                        
                        if parser_type == "sotwe":
                            posts, avatar = self.parse_sotwe(raw_data, handle)
                        else:
                            posts, avatar = self.parse_syndication(raw_data, handle)
                            
                        if posts:
                            logging.info(f"🟢 [{handle}] Успех! Найдено постов: {len(posts)}")
                            return posts, avatar
                        else:
                            logging.warning(f"[{handle}] Данные получены, но лента пуста (возможен shadowban).")
            
            except socket.timeout:
                pass 
            except urllib.error.HTTPError as e:
                # Если 404 - возможно аккаунт удален, но мы идем дальше
                logging.warning(f"[{handle}] HTTP {e.code} от прокси.")
            except Exception as e:
                pass
                
            time.sleep(1) # Защита от спама

        logging.error(f"❌ [{handle}] Все маршруты матрицы провалились.")
        return [], ""

    def run(self):
        existing_posts = self.load_existing_feed()
        logging.info(f"Загружено постов из кэша: {len(existing_posts)}")
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
            time.sleep(2) 
            
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
            logging.error(f"Ошибка сохранения файла: {e}")

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
    monitor = BendyMatrixScraper(devs)
    monitor.run()