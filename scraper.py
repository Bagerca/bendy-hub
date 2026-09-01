# FILE: scraper.py

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
import random
import xml.etree.ElementTree as ET
from datetime import datetime
from typing import List, Dict, Tuple

ssl._create_default_https_context = ssl._create_unverified_context
logging.basicConfig(level=logging.INFO, format='%(asctime)s [%(levelname)s] %(message)s', datefmt='%H:%M:%S')

class BendySniperScraper:
    def __init__(self, handles: List[str]):
        self.handles = handles
        
        os.makedirs("data", exist_ok=True)
        self.devs_dir = os.path.join("assets", "developers")
        os.makedirs(self.devs_dir, exist_ok=True)

        self.output_file = os.path.join("data", "feed.json")
        self.tmp_file = os.path.join("data", "feed.json.tmp")
        self.max_history = 1000

        self.user_agents = [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Safari/605.1.15',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0'
        ]

        # Очищенный список Nitter (только потенциально живые)
        self.nitter_instances = [
            "https://nitter.privacydev.net",
            "https://nitter.projectsegfau.lt",
            "https://nitter.cz",
            "https://nitter.soopy.moe"
        ]

        # Добавляем RSS-Bridge зеркала (они часто работают лучше Nitter)
        self.rssbridge_instances = [
            "https://rss-bridge.org/bridge01",
            "https://bridge.suumitsu.eu",
            "https://rss.it-kun.ru",
            "https://rss.snopyta.org"
        ]

    def get_headers(self):
        return {
            'User-Agent': random.choice(self.user_agents),
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1'
        }

    def load_existing_feed(self) -> List[Dict]:
        if not os.path.exists(self.output_file): return []
        try:
            with open(self.output_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
                logging.info(f"Загружено из кэша: {len(data)} постов.")
                return data
        except Exception as e: 
            logging.error(f"Ошибка чтения кэша: {e}")
            return []

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

    def process_developer_folder(self, handle: str, actual_name: str, avatar_url: str) -> str:
        safe_handle = handle.replace('@', '').lower()
        dev_dir = os.path.join(self.devs_dir, safe_handle)
        os.makedirs(dev_dir, exist_ok=True)
        
        json_path = os.path.join(dev_dir, "data.json")
        if not os.path.exists(json_path):
            dev_data = {
                "id": safe_handle,
                "name": actual_name or handle,
                "handle": f"@{safe_handle}",
                "role": "Разработчик",
                "bio": "...",
                "assets": {"avatar": "avatar.jpg"},
                "links": {"twitter": f"https://twitter.com/{safe_handle}"}
            }
            with open(json_path, "w", encoding="utf-8") as f:
                json.dump(dev_data, f, ensure_ascii=False, indent=4)
                
        if not avatar_url: return ""
        local_path = os.path.join(dev_dir, "avatar.jpg")
        web_path = f"assets/developers/{safe_handle}/avatar.jpg"
        
        if os.path.exists(local_path): return web_path
        
        avatar_url = avatar_url.replace('_normal', '_400x400')
        try:
            req = urllib.request.Request(avatar_url, headers=self.get_headers())
            with urllib.request.urlopen(req, timeout=10) as response:
                if response.status == 200:
                    with open(local_path, 'wb') as f: f.write(response.read())
                    return web_path
        except Exception: pass
        return ""

    def parse_syndication(self, html_data: str, handle: str) -> Tuple[List[Dict], str, str]:
        posts, avatar_url, actual_name = [], "", handle
        match = re.search(r'<script id="__NEXT_DATA__" type="application/json">({.*?})</script>', html_data)
        if not match: return posts, avatar_url, actual_name
            
        try:
            raw_json = json.loads(match.group(1))
            entries = raw_json.get('props', {}).get('pageProps', {}).get('timeline', {}).get('entries', [])
            
            for entry in entries:
                if entry.get('type') != 'tweet': continue
                tweet = entry['content']['tweet']
                author = tweet.get('user', {})
                if author.get('screen_name', '').lower() != handle.lower(): continue
                if not avatar_url: avatar_url = author.get('profile_image_url_https', '')
                actual_name = author.get('name', handle)

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
                    "authorName": actual_name,
                    "authorHandle": f"@{author.get('screen_name', handle)}",
                    "platform": "twitter",
                    "content": tweet.get('text', ''),
                    "timestamp": self.parse_date(tweet.get('created_at', '')),
                    "mediaUrl": media_url,
                    "originalAvatarUrl": avatar_url
                })
        except Exception as e: 
            logging.error(f"    ❌ [Parse Syndication] Ошибка: {e}")
            
        return posts, avatar_url, actual_name

    def parse_rss(self, xml_data: str, handle: str) -> Tuple[List[Dict], str, str]:
        posts, avatar_url, actual_name = [], "", handle
        try:
            root = ET.fromstring(xml_data)
            channel = root.find("channel")
            if channel is None: return posts, avatar_url, actual_name
            
            title_node = channel.find("title")
            if title_node is not None and title_node.text:
                ft = html.unescape(title_node.text)
                if " / " in ft: actual_name = ft.split(" / ")[0].strip()
                    
            for item in channel.findall("item"):
                link = item.find("link")
                if link is None or not link.text: continue
                
                content = html.unescape(item.find("title").text.strip()) if item.find("title") is not None and item.find("title").text else ""
                
                # Попытка вытащить медиа из описания RSS-Bridge
                media_url = None
                desc_node = item.find("description")
                if desc_node is not None and desc_node.text:
                    img_match = re.search(r'<img[^>]+src="([^">]+)"', desc_node.text)
                    if img_match: media_url = img_match.group(1)

                post_id = link.text.rstrip('/').split('/')[-1]
                if "=" in post_id: post_id = post_id.split("=")[-1] # для некоторых RSS

                posts.append({
                    "id": post_id,
                    "authorName": actual_name,
                    "authorHandle": f"@{handle}",
                    "platform": "twitter",
                    "content": content,
                    "timestamp": self.parse_date(item.find("pubDate").text if item.find("pubDate") is not None else ""),
                    "mediaUrl": media_url,
                    "originalAvatarUrl": ""
                })
        except Exception as e: 
            logging.error(f"    ❌ [Parse RSS] Ошибка: {e}")
            
        return posts, avatar_url, actual_name

    def build_strategies(self, handle: str) -> List[Tuple[str, str, str]]:
        synd_url = f"https://syndication.twitter.com/srv/timeline-profile/screen-name/{handle}"
        
        strategies = []
        
        # Syndication + AllOrigins (Таймаут увеличен до 20 сек в запросе)
        strategies.append(("Syndication via AllOrigins", f"https://api.allorigins.win/raw?url={urllib.parse.quote(synd_url, safe='')}", "syndication"))
        strategies.append(("Syndication via CodeTabs", f"https://api.codetabs.com/v1/proxy?quest={urllib.parse.quote(synd_url, safe='')}", "syndication"))

        # RSS-Bridge (Специализированные мосты для Twitter)
        random.shuffle(self.rssbridge_instances)
        for instance in self.rssbridge_instances:
            url = f"{instance}/?action=display&bridge=Twitter&context=By+username&u={handle}&format=Mrss"
            name = instance.split("//")[-1].split("/")[0]
            strategies.append((f"RSS-Bridge via {name}", url, "rss"))

        # Nitter 
        random.shuffle(self.nitter_instances)
        for instance in self.nitter_instances:
            url = f"{instance}/{handle}/rss"
            name = instance.split("//")[-1].split("/")[0]
            strategies.append((f"Nitter via {name}", url, "rss"))
            
        return strategies

    def fetch_timeline(self, handle: str) -> Tuple[List[Dict], str, str]:
        strategies = self.build_strategies(handle)
        logging.info(f"==== АНАЛИЗ ПРОФИЛЯ: {handle} ====")

        for name, url, parser_type in strategies:
            logging.info(f"🎯 Выстрел: {name}")
            start_t = time.time()
            try:
                req = urllib.request.Request(url, headers=self.get_headers())
                with urllib.request.urlopen(req, timeout=20) as response:
                    latency = time.time() - start_t
                    if response.status == 200:
                        raw_data = response.read().decode('utf-8')
                        logging.info(f"📥 Ответ 200 OK | Время: {latency:.2f}с")
                        
                        if parser_type == "syndication":
                            posts, avatar, actual_name = self.parse_syndication(raw_data, handle)
                        else:
                            posts, avatar, actual_name = self.parse_rss(raw_data, handle)
                            
                        if posts:
                            logging.info(f"🟢 БИНГО! Одобрено постов: {len(posts)}")
                            return posts, avatar, actual_name
                        else:
                            logging.warning(f"⚠️ Пустой ответ.")

            except urllib.error.HTTPError as e:
                logging.warning(f"❌ Ошибка {e.code}")
            except socket.timeout:
                logging.warning(f"⏳ Таймаут (>{time.time() - start_t:.1f}с)")
            except Exception as e:
                logging.warning(f"🛑 Ошибка: {type(e).__name__}")
            
            time.sleep(random.uniform(2.0, 4.0))

        logging.error(f"💀 Истрачены все патроны для {handle}.")
        return [], "", handle

    def run(self):
        existing_posts = self.load_existing_feed()
        all_fetched_posts = []
        
        for handle in self.handles:
            combined, latest_avatar_url, actual_name = self.fetch_timeline(handle)
            
            if not latest_avatar_url:
                for ep in existing_posts:
                    if ep.get('authorHandle', '').lower() == f"@{handle.lower()}":
                        latest_avatar_url = ep.get('originalAvatarUrl', '')
                        break

            local_avatar_path = self.process_developer_folder(handle, actual_name, latest_avatar_url)
            
            for p in combined: p['localAvatarPath'] = local_avatar_path
            for ep in existing_posts:
                if ep.get('authorHandle', '').lower() == f"@{handle.lower()}":
                    ep['localAvatarPath'] = local_avatar_path
                    if latest_avatar_url: ep['originalAvatarUrl'] = latest_avatar_url

            all_fetched_posts.extend(combined)
            time.sleep(random.uniform(3.0, 6.0))
            
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
            logging.info(f"🎉 База успешно обновлена! Всего постов: {len(final_posts)}")
        except Exception as e:
            if os.path.exists(self.tmp_file): os.remove(self.tmp_file)
            logging.error(f"ОШИБКА СОХРАНЕНИЯ ФАЙЛА: {e}")

if __name__ == "__main__":
    devs = ["Bendy", "themeatly", "m_ZeroLogics", "BLacroix30", "bookpast", "BendyRun", "GentCorporation", "Doberart"] 
    monitor = BendySniperScraper(devs)
    monitor.run()
