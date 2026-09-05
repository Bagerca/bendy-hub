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

# Отключаем проверку SSL для прокси, чтобы избежать ошибок сертификатов
ssl._create_default_https_context = ssl._create_unverified_context

# Настраиваем подробный логгер
logging.basicConfig(
    level=logging.INFO, 
    format='%(asctime)s [%(levelname)s] %(message)s', 
    datefmt='%H:%M:%S'
)

class BendySniperScraper:
    def __init__(self, handles: List[str]):
        self.handles = handles
        self.devs_dir = os.path.join("assets", "developers")
        os.makedirs(self.devs_dir, exist_ok=True)
        self.max_history = 1000

        self.user_agents = [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Safari/605.1.15',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0',
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 Edg/122.0.0.0'
        ]

        self.nitter_instances = [
            "https://nitter.privacydev.net",
            "https://nitter.projectsegfau.lt",
            "https://nitter.poast.org",
            "https://nitter.cz",
            "https://nitter.net",
            "https://nitter.pussthecat.org",
            "https://nitter.tinfoil-hat.net",
            "https://nitter.domain.glass",
            "https://nitter.eu",
            "https://nitter.unixfox.eu",
            "https://rsshub.app/twitter/user"
        ]

    def get_headers(self):
        return {
            'User-Agent': random.choice(self.user_agents),
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1'
        }

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

    def download_media(self, url: str, handle: str, post_id: str, media_type: str) -> str:
        """ Скачивает медиа локально во избежание блокировок РКН """
        if not url: return None
        
        safe_handle = handle.replace('@', '').lower()
        media_dir = os.path.join(self.devs_dir, safe_handle, "media")
        os.makedirs(media_dir, exist_ok=True)

        ext = ".mp4" if media_type == "video" else ".jpg"
        if "format=png" in url or url.endswith(".png"): ext = ".png"
            
        filename = f"{post_id}{ext}"
        local_path = os.path.join(media_dir, filename)
        web_path = f"assets/developers/{safe_handle}/media/{filename}"

        if os.path.exists(local_path):
            return web_path

        try:
            req = urllib.request.Request(url, headers=self.get_headers())
            with urllib.request.urlopen(req, timeout=15) as response:
                if response.status == 200:
                    with open(local_path, 'wb') as f: 
                        f.write(response.read())
                    return web_path
        except Exception as e:
            logging.warning(f"    ⚠️ Ошибка скачивания медиа {url}: {e}")
            return None

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
            logging.info(f"  ↳ 📁 Создан профиль разработчика: {safe_handle}")
                
        if not avatar_url: return ""
        local_path = os.path.join(dev_dir, "avatar.jpg")
        web_path = f"assets/developers/{safe_handle}/avatar.jpg"
        
        if os.path.exists(local_path): return web_path
        
        avatar_url = avatar_url.replace('_normal', '_400x400')
        logging.info(f"  ↳ 🖼️ Скачивание аватара: {avatar_url}")
        
        try:
            req = urllib.request.Request(avatar_url, headers=self.get_headers())
            with urllib.request.urlopen(req, timeout=10) as response:
                if response.status == 200:
                    with open(local_path, 'wb') as f: f.write(response.read())
                    return web_path
        except Exception as e: 
            logging.warning(f"    ⚠️ Ошибка скачивания аватара: {e}")
        return ""

    def parse_sotwe(self, json_data: str, handle: str) -> Tuple[List[Dict], str, str]:
        posts, avatar_url, actual_name = [], "", handle
        try:
            data = json.loads(json_data)
            u_info = data.get('data', {}).get('profile', {})
            avatar_url = u_info.get('profile_image_url_https', '')
            actual_name = u_info.get('name', handle)
            
            raw_tweets = data.get('data', {}).get('tweets', [])
            logging.info(f"    🔍 [Parse Sotwe] Найдено узлов: {len(raw_tweets)}")
            
            for tweet in raw_tweets:
                t_handle = tweet.get('user', {}).get('screen_name', handle)
                if t_handle.lower() != handle.lower(): continue
                content = tweet.get('full_text') or tweet.get('text', '')
                post_id = tweet.get('id_str', '')
                
                # Медиа
                media_url, media_type = None, "image"
                ml = tweet.get('mediaEntities', []) or tweet.get('entities', {}).get('media', [])
                if ml:
                    m = ml[0]
                    if 'video_info' in m:
                        vs = [v for v in m['video_info'].get('variants', []) if v.get('content_type') == 'video/mp4']
                        if vs: 
                            media_url = max(vs, key=lambda x: x.get('bitrate', 0)).get('url')
                            media_type = "video"
                    if not media_url: 
                        media_url = m.get('media_url_https') or m.get('url')

                # Контекст (Цитаты и ответы)
                ref_url, ref_type, ref_author = "", "", ""
                if 'quoted_status' in tweet:
                    ref_type = "quote"
                    q_status = tweet['quoted_status']
                    ref_author = q_status.get('user', {}).get('screen_name', '')
                    if ref_author and q_status.get('id_str'):
                        ref_url = f"https://twitter.com/{ref_author}/status/{q_status['id_str']}"
                elif tweet.get('in_reply_to_status_id_str'):
                    ref_type = "reply"
                    ref_author = tweet.get('in_reply_to_screen_name', '')
                    if ref_author:
                        ref_url = f"https://twitter.com/{ref_author}/status/{tweet['in_reply_to_status_id_str']}"

                posts.append({
                    "id": post_id,
                    "authorName": actual_name,
                    "authorHandle": f"@{t_handle}",
                    "platform": "twitter",
                    "content": content,
                    "timestamp": self.parse_date(tweet.get('createdAt')),
                    "rawMediaUrl": media_url,
                    "mediaType": media_type,
                    "originalAvatarUrl": avatar_url,
                    "referenceType": ref_type,
                    "referenceUrl": ref_url,
                    "referenceAuthor": f"@{ref_author}" if ref_author else ""
                })
        except Exception as e: 
            logging.error(f"    ❌ [Parse Sotwe] Ошибка: {e}")
            
        return posts, avatar_url, actual_name

    def parse_syndication(self, html_data: str, handle: str) -> Tuple[List[Dict], str, str]:
        posts, avatar_url, actual_name = [], "", handle
        match = re.search(r'<script id="__NEXT_DATA__" type="application/json">({.*?})</script>', html_data)
        if not match: 
            logging.warning("    ⚠️ [Parse Syndication] Тег <script id=\"__NEXT_DATA__\"> не найден.")
            return posts, avatar_url, actual_name
            
        try:
            raw_json = json.loads(match.group(1))
            entries = raw_json.get('props', {}).get('pageProps', {}).get('timeline', {}).get('entries', [])
            logging.info(f"    🔍 [Parse Syndication] Найдено узлов: {len(entries)}")
            
            for entry in entries:
                if entry.get('type') != 'tweet': continue
                tweet = entry['content']['tweet']
                author = tweet.get('user', {})
                if author.get('screen_name', '').lower() != handle.lower(): continue
                if not avatar_url: avatar_url = author.get('profile_image_url_https', '')
                actual_name = author.get('name', handle)
                post_id = tweet.get('id_str', '')

                # Медиа
                media_url, media_type = None, "image"
                ml = tweet.get('entities', {}).get('media', [])
                if ml:
                    m = ml[0]
                    if 'video_info' in m:
                        vs = [v for v in m['video_info'].get('variants', []) if v.get('content_type') == 'video/mp4']
                        if vs: 
                            media_url = max(vs, key=lambda x: x.get('bitrate', 0)).get('url')
                            media_type = "video"
                    if not media_url: 
                        media_url = m.get('media_url_https')

                # Контекст
                ref_url, ref_type, ref_author = "", "", ""
                if 'quoted_tweet' in tweet:
                    ref_type = "quote"
                    q_status = tweet['quoted_tweet']
                    ref_author = q_status.get('user', {}).get('screen_name', '')
                    if ref_author and q_status.get('id_str'):
                        ref_url = f"https://twitter.com/{ref_author}/status/{q_status['id_str']}"
                elif tweet.get('in_reply_to_status_id_str'):
                    ref_type = "reply"
                    ref_author = tweet.get('in_reply_to_screen_name', '')
                    if ref_author:
                        ref_url = f"https://twitter.com/{ref_author}/status/{tweet['in_reply_to_status_id_str']}"

                posts.append({
                    "id": post_id,
                    "authorName": actual_name,
                    "authorHandle": f"@{author.get('screen_name', handle)}",
                    "platform": "twitter",
                    "content": tweet.get('text', ''),
                    "timestamp": self.parse_date(tweet.get('created_at', '')),
                    "rawMediaUrl": media_url,
                    "mediaType": media_type,
                    "originalAvatarUrl": avatar_url,
                    "referenceType": ref_type,
                    "referenceUrl": ref_url,
                    "referenceAuthor": f"@{ref_author}" if ref_author else ""
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
                    
            items = channel.findall("item")
            logging.info(f"    🔍 [Parse RSS] Найдено <item>: {len(items)}")
            
            for item in items:
                link = item.find("link")
                if link is None or not link.text: continue
                content = html.unescape(item.find("title").text.strip()) if item.find("title") is not None and item.find("title").text else ""
                post_id = link.text.rstrip('/').split('/')[-1]
                
                # RSS Nitter обычно не отдает нормально медиа/реплаи, ставим дефолтные значения
                posts.append({
                    "id": post_id,
                    "authorName": actual_name,
                    "authorHandle": f"@{handle}",
                    "platform": "twitter",
                    "content": content,
                    "timestamp": self.parse_date(item.find("pubDate").text if item.find("pubDate") is not None else ""),
                    "rawMediaUrl": None,
                    "mediaType": "image",
                    "originalAvatarUrl": "",
                    "referenceType": "",
                    "referenceUrl": "",
                    "referenceAuthor": ""
                })
        except Exception as e: 
            logging.error(f"    ❌ [Parse RSS] Ошибка: {e}")
            
        return posts, avatar_url, actual_name

    def get_proxy_urls(self, target_url: str) -> List[Tuple[str, str]]:
        encoded = urllib.parse.quote(target_url, safe='')
        return [
            (f"https://api.allorigins.win/raw?url={encoded}", "AllOrigins"),
            (f"https://api.codetabs.com/v1/proxy?quest={encoded}", "CodeTabs"),
            (f"https://corsproxy.io/?{encoded}", "CorsProxy"),
            (target_url, "Direct")
        ]

    def build_strategies(self, handle: str) -> List[Tuple[str, str, str]]:
        synd_url = f"https://syndication.twitter.com/srv/timeline-profile/screen-name/{handle}"
        sotwe_url = f"https://api.sotwe.com/v3/user/{handle}"
        
        strategies = []
        
        for url, proxy_name in self.get_proxy_urls(synd_url):
            strategies.append((f"Syndication via {proxy_name}", url, "syndication"))
            
        for url, proxy_name in self.get_proxy_urls(sotwe_url):
            strategies.append((f"Sotwe via {proxy_name}", url, "sotwe"))

        random.shuffle(self.nitter_instances)
        
        for instance in self.nitter_instances:
            if "rsshub" in instance:
                url = f"{instance}/{handle}"
            else:
                url = f"{instance}/{handle}/rss"
            name = instance.replace("https://", "").replace("http://", "").split("/")[0]
            strategies.append((f"RSS via {name}", url, "rss"))
            
        return strategies

    def fetch_timeline(self, handle: str) -> Tuple[List[Dict], str, str]:
        strategies = self.build_strategies(handle)
        logging.info(f"==== АНАЛИЗ ПРОФИЛЯ: {handle} ====")
        logging.info(f"Заряжено {len(strategies)} стратегий обхода. Начинаем обстрел...")

        for name, url, parser_type in strategies:
            max_attempts = 2
            for attempt in range(max_attempts):
                logging.info(f"🎯 Выстрел: {name} | Попытка {attempt+1}/{max_attempts}")
                
                start_t = time.time()
                try:
                    req = urllib.request.Request(url, headers=self.get_headers())
                    with urllib.request.urlopen(req, timeout=15) as response:
                        raw_data = response.read().decode('utf-8')
                        
                        if parser_type == "sotwe":
                            posts, avatar, actual_name = self.parse_sotwe(raw_data, handle)
                        elif parser_type == "syndication":
                            posts, avatar, actual_name = self.parse_syndication(raw_data, handle)
                        else:
                            posts, avatar, actual_name = self.parse_rss(raw_data, handle)
                            
                        if posts:
                            logging.info(f"🟢 БИНГО! Одобрено постов: {len(posts)}")
                            return posts, avatar, actual_name
                        else:
                            logging.warning(f"⚠️ Промах. Сервер ответил, но полезных данных нет.")
                            break 

                except urllib.error.HTTPError as e:
                    if e.code == 404: 
                        logging.warning("   ↳ Профиль не найден (404). Пропускаем.")
                        break 
                    logging.warning(f"❌ Ошибка HTTP {e.code}")
                except Exception as e:
                    logging.warning(f"🛑 Ошибка соединения: {e}")
                
                time.sleep(random.uniform(3.0, 6.0))

        logging.error(f"💀 Истрачены все патроны для {handle}. Данные не получены.")
        return [], "", handle

    def run(self):
        print("\n" + "="*50)
        print("🚀 BENDY ATOMIC FEED SCRAPER v4.0 (God-Mode + Local Media)")
        print("="*50 + "\n")
        
        for handle in self.handles:
            safe_handle = handle.lower()
            
            # 1. Достаем новые посты через гибридный движок
            combined, latest_avatar_url, actual_name = self.fetch_timeline(handle)
            
            if not combined:
                continue

            # 2. Обрабатываем аватарку разработчика
            local_avatar_path = self.process_developer_folder(handle, actual_name, latest_avatar_url)
            
            # 3. Скачиваем медиа файлы для новых постов
            final_posts = []
            for p in combined:
                local_media_path = None
                if p.get("rawMediaUrl"):
                    local_media_path = self.download_media(p["rawMediaUrl"], handle, p["id"], p["mediaType"])
                
                clean_post = {
                    "id": p["id"],
                    "authorName": p["authorName"],
                    "authorHandle": p["authorHandle"],
                    "platform": p["platform"],
                    "content": p["content"],
                    "timestamp": p["timestamp"],
                    "mediaUrl": local_media_path,
                    "mediaType": p["mediaType"],
                    "localAvatarPath": local_avatar_path,
                    "referenceType": p["referenceType"],
                    "referenceUrl": p["referenceUrl"],
                    "referenceAuthor": p["referenceAuthor"]
                }
                final_posts.append(clean_post)

            # 4. Атомарное обновление индивидуального файла разработчика
            dev_feed_path = os.path.join(self.devs_dir, safe_handle, "feed.json")
            tmp_file = os.path.join(self.devs_dir, safe_handle, "feed.json.tmp")
            
            existing_posts = []
            if os.path.exists(dev_feed_path):
                try:
                    with open(dev_feed_path, 'r', encoding='utf-8') as f:
                        existing_posts = json.load(f)
                except: pass

            merged_dict = {post['id']: post for post in existing_posts}
            for post in final_posts:
                merged_dict[post['id']] = post

            final_list = list(merged_dict.values())
            final_list.sort(key=lambda x: x['timestamp'], reverse=True)
            final_list = final_list[:self.max_history]

            try:
                with open(tmp_file, 'w', encoding='utf-8') as f:
                    json.dump(final_list, f, ensure_ascii=False, indent=2)
                os.replace(tmp_file, dev_feed_path)
                logging.info(f"💾 Успешно сохранено: {dev_feed_path} ({len(final_list)} постов)")
            except Exception as e:
                if os.path.exists(tmp_file): os.remove(tmp_file)
                logging.error(f"Ошибка сохранения файла для {handle}: {e}")
            
            time.sleep(random.uniform(4.0, 8.0))

if __name__ == "__main__":
    devs = ["Bendy", "themeatly", "m_ZeroLogics", "BLacroix30", "bookpast", "BendyRun", "GentCorporation", "Doberart"] 
    monitor = BendySniperScraper(devs)
    monitor.run()