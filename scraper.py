import urllib.request
import urllib.parse
import urllib.error
import json
import re
import os
import logging
import time
import html
import ssl
import xml.etree.ElementTree as ET
import concurrent.futures
from datetime import datetime
from typing import List, Dict, Tuple

# Отключаем проверку SSL для локальных запусков (решает проблемы с антивирусами и провайдерами)
ssl._create_default_https_context = ssl._create_unverified_context

logging.basicConfig(level=logging.INFO, format='%(asctime)s [%(levelname)s] %(message)s', datefmt='%H:%M:%S')

class BendyBlasterScraper:
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

        # Арсенал зеркал для параллельной атаки
        self.mirrors = [
            ("Nitter (poast)", "https://nitter.poast.org/{}/rss", "rss"),
            ("Nitter (xcancel)", "https://xcancel.com/{}/rss", "rss"),
            ("Nitter (privacydev)", "https://nitter.privacydev.net/{}/rss", "rss"),
            ("Nitter (lucabased)", "https://nitter.lucabased.xyz/{}/rss", "rss"),
            ("Nitter (catsarch)", "https://nitter.catsarch.com/{}/rss", "rss"),
            ("Nitter (projectsegfau)", "https://nitter.projectsegfau.lt/{}/rss", "rss"),
            
            ("RSSHub (rssforever)", "https://rsshub.rssforever.com/twitter/user/{}", "rss"),
            ("RSSHub (pseudoyu)", "https://rsshub.pseudoyu.com/twitter/user/{}", "rss"),
            
            ("Sotwe (Direct)", "https://api.sotwe.com/v3/user/{}", "sotwe"),
            ("Sotwe (CorsProxy)", "https://corsproxy.io/?https%3A%2F%2Fapi.sotwe.com%2Fv3%2Fuser%2F{}", "sotwe"),
            
            ("Syndication (Direct)", "https://syndication.twitter.com/srv/timeline-profile/screen-name/{}", "syndication"),
            ("Syndication (Cors)", "https://corsproxy.io/?https%3A%2F%2Fsyndication.twitter.com%2Fsrv%2Ftimeline-profile%2Fscreen-name%2F{}", "syndication"),
        ]

    def load_existing_feed(self) -> List[Dict]:
        if not os.path.exists(self.output_file): return []
        try:
            with open(self.output_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception: return []

    def parse_date(self, date_val) -> str:
        if not date_val: return datetime.utcnow().isoformat() + "Z"
        if isinstance(date_val, (int, float)):
            return datetime.utcfromtimestamp(date_val / 1000.0).isoformat() + "Z"
        date_str = str(date_val)
        if "T" in date_str and "Z" in date_str: return date_str
        try: return datetime.strptime(date_str, "%a, %d %b %Y %H:%M:%S %Z").isoformat() + "Z"
        except: pass
        try:
            parts = date_str.split()
            if len(parts) == 6: 
                return datetime.strptime(f"{parts[1]} {parts[2]} {parts[3]} {parts[5]}", "%b %d %H:%M:%S %Y").isoformat() + "Z"
        except: pass
        return date_str

    def download_avatar(self, handle: str, avatar_url: str) -> str:
        if not avatar_url: return ""
        local_filename = f"{handle.lower()}.jpg"
        local_path = os.path.join(self.avatars_dir, local_filename)
        web_path = f"assets/avatars/{local_filename}"
        if os.path.exists(local_path): return web_path
        try:
            req = urllib.request.Request(avatar_url.replace('_normal', '_400x400'), headers=self.headers)
            with urllib.request.urlopen(req, timeout=8) as response:
                if response.status == 200:
                    with open(local_path, 'wb') as f:
                        f.write(response.read())
                    return web_path
        except: pass
        return ""

    # === ПАРСЕРЫ ===

    def parse_rss(self, xml_data: str, handle: str) -> Tuple[List[Dict], str]:
        posts, avatar_url = [], ""
        try:
            root = ET.fromstring(xml_data)
            channel = root.find("channel")
            if channel is None: return posts, avatar_url
            
            author_name = handle
            title_node = channel.find("title")
            if title_node is not None and title_node.text:
                ft = html.unescape(title_node.text)
                if " / " in ft: author_name = ft.split(" / ")[0].strip()
                elif "'s Twitter" in ft: author_name = ft.split("'s Twitter")[0].strip()
                    
            img_node = channel.find("image")
            if img_node is not None:
                u_node = img_node.find("url")
                if u_node is not None and u_node.text:
                    raw_url = urllib.parse.unquote(u_node.text)
                    if 'pbs.twimg.com' in raw_url:
                        avatar_url = "https://pbs.twimg.com" + raw_url.split('pbs.twimg.com')[-1]
                        
            for item in channel.findall("item"):
                link = item.find("link")
                if link is None or not link.text: continue
                
                content = html.unescape(item.find("title").text.strip()) if item.find("title") is not None and item.find("title").text else ""
                content = re.sub(r'<video[^>]*>.*?</video>', '', content, flags=re.IGNORECASE | re.DOTALL)
                
                media_url = None
                desc = item.find("description")
                if desc is not None and desc.text:
                    img_match = re.search(r'<img[^>]+src="([^"]+)"', desc.text, re.IGNORECASE)
                    if img_match:
                        r_src = urllib.parse.unquote(img_match.group(1))
                        match = re.search(r'media/([^/]+\.(?:jpg|png|mp4|webp))', r_src, re.IGNORECASE)
                        media_url = f"https://pbs.twimg.com/media/{match.group(1)}" if match else r_src
                            
                posts.append({
                    "id": link.text.rstrip('/').split('/')[-1],
                    "authorName": author_name,
                    "authorHandle": f"@{handle}",
                    "platform": "twitter",
                    "content": content,
                    "timestamp": self.parse_date(item.find("pubDate").text if item.find("pubDate") is not None else ""),
                    "mediaUrl": media_url,
                    "originalAvatarUrl": avatar_url
                })
        except: pass
        return posts, avatar_url

    def parse_sotwe(self, json_data: str, handle: str) -> Tuple[List[Dict], str]:
        posts, avatar_url = [], ""
        try:
            data = json.loads(json_data)
            u_info = data.get('data', {}).get('profile', {})
            avatar_url = u_info.get('profile_image_url_https', '')
            
            for tweet in data.get('data', {}).get('tweets', []):
                t_handle = tweet.get('user', {}).get('screen_name', handle)
                if t_handle.lower() != handle.lower(): continue
                
                media_url = None
                ml = tweet.get('mediaEntities', []) or tweet.get('entities', {}).get('media', [])
                if ml:
                    m = ml[0]
                    if 'video_info' in m:
                        vs = [v for v in m['video_info'].get('variants', []) if v.get('content_type') == 'video/mp4']
                        if vs: media_url = max(vs, key=lambda x: x.get('bitrate', 0)).get('url')
                    if not media_url: media_url = m.get('media_url_https') or m.get('url')

                posts.append({
                    "id": tweet.get('id_str', ''),
                    "authorName": u_info.get('name', handle),
                    "authorHandle": f"@{t_handle}",
                    "platform": "twitter",
                    "content": tweet.get('full_text') or tweet.get('text', ''),
                    "timestamp": self.parse_date(tweet.get('createdAt')),
                    "mediaUrl": media_url,
                    "originalAvatarUrl": avatar_url
                })
        except: pass
        return posts, avatar_url

    def parse_syndication(self, html_data: str, handle: str) -> Tuple[List[Dict], str]:
        posts, avatar_url = [], ""
        match = re.search(r'<script id="__NEXT_DATA__" type="application/json">({.*?})</script>', html_data)
        if not match: return posts, avatar_url
        try:
            for entry in json.loads(match.group(1)).get('props', {}).get('pageProps', {}).get('timeline', {}).get('entries', []):
                if entry.get('type') != 'tweet': continue
                tweet = entry['content']['tweet']
                author = tweet.get('user', {})
                if author.get('screen_name', '').lower() != handle.lower(): continue
                if not avatar_url: avatar_url = author.get('profile_image_url_https', '')

                media_url = None
                ml = tweet.get('entities', {}).get('media', [])
                if ml:
                    m = ml[0]
                    if 'video_info' in m:
                        vs = [v for v in m['video_info'].get('variants', []) if v.get('content_type') == 'video/mp4']
                        if vs: media_url = max(vs, key=lambda x: x.get('bitrate', 0)).get('url')
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
        except: pass
        return posts, avatar_url

    # === ЯДРО БЛАСТЕРА (Многопоточность) ===

    def fetch_single_mirror(self, name: str, url_template: str, parser_type: str, handle: str):
        """Функция, которую выполняет каждый отдельный поток"""
        url = url_template.format(handle)
        try:
            req = urllib.request.Request(url, headers=self.headers)
            with urllib.request.urlopen(req, timeout=12) as response:
                if response.status == 200:
                    raw_data = response.read().decode('utf-8')
                    
                    if parser_type == "rss":
                        posts, avatar = self.parse_rss(raw_data, handle)
                    elif parser_type == "sotwe":
                        posts, avatar = self.parse_sotwe(raw_data, handle)
                    else:
                        posts, avatar = self.parse_syndication(raw_data, handle)
                        
                    if posts: # Возвращаем результат ТОЛЬКО если лента не пустая!
                        return posts, avatar, name
        except Exception:
            pass # Игнорируем любые ошибки внутри потока
        return None

    def fetch_timeline_concurrently(self, handle: str) -> Tuple[List[Dict], str]:
        """Отправляет 12 запросов одновременно. Кто первый вернет твиты — тот и победил."""
        logging.info(f"[{handle}] 🚀 Запуск зеркального бластера (12 потоков)...")
        
        # Запускаем пул потоков (max_workers равно количеству наших зеркал)
        with concurrent.futures.ThreadPoolExecutor(max_workers=len(self.mirrors)) as executor:
            # Отправляем задачи в пул
            futures = [
                executor.submit(self.fetch_single_mirror, name, url, ptype, handle) 
                for name, url, ptype in self.mirrors
            ]
            
            # as_completed возвращает результаты по мере их готовности (кто быстрее)
            for future in concurrent.futures.as_completed(futures):
                result = future.result()
                if result:
                    posts, avatar, winner_name = result
                    logging.info(f"🟢 [{handle}] ПРОБИТИЕ! Победитель: {winner_name} (Найдено {len(posts)} постов)")
                    return posts, avatar
                    
        logging.error(f"❌ [{handle}] Абсолютно все 12 зеркал заблокировали запрос или вернули пустоту.")
        return [], ""

    def run(self):
        existing_posts = self.load_existing_feed()
        logging.info(f"Загружено постов из кэша: {len(existing_posts)}")
        all_fetched_posts = []
        
        for handle in self.handles:
            combined, latest_avatar_url = self.fetch_timeline_concurrently(handle)
            
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
            time.sleep(1) # Небольшая пауза между разными разработчиками
            
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
    monitor = BendyBlasterScraper(devs)
    monitor.run()