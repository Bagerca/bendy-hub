import urllib.request
import urllib.parse
import urllib.error
import json
import re
import os
import logging
import time
import socket
import sys
import html
import ssl
import random
import xml.etree.ElementTree as ET
from datetime import datetime, timedelta
from typing import List, Dict, Tuple

# Отключаем проверку SSL
ssl._create_default_https_context = ssl._create_unverified_context

# ==============================================================================
# НАДЕЖНЫЙ ОБРАБОТЧИК ЛОГОВ
# ==============================================================================
LOGS_DIR = "logs"
DUMPS_DIR = os.path.join(LOGS_DIR, "dumps")
LOG_FILE = os.path.join(LOGS_DIR, "scraper_session.log")

os.makedirs(LOGS_DIR, exist_ok=True)
os.makedirs(DUMPS_DIR, exist_ok=True)

class AutoFlushFileHandler(logging.FileHandler):
    def emit(self, record):
        try:
            super().emit(record)
            self.flush()
        except Exception:
            self.handleError(record)

file_formatter = logging.Formatter('%(asctime)s [%(levelname)s] %(message)s', datefmt='%Y-%m-%d %H:%M:%S')
console_formatter = logging.Formatter('%(asctime)s [%(levelname)s] %(message)s', datefmt='%H:%M:%S')

file_handler = AutoFlushFileHandler(LOG_FILE, mode='a', encoding='utf-8')
file_handler.setFormatter(file_formatter)

console_handler = logging.StreamHandler(sys.stdout)
console_handler.setFormatter(console_formatter)

logger = logging.getLogger()
logger.setLevel(logging.DEBUG)
logger.handlers.clear()
logger.addHandler(file_handler)
logger.addHandler(console_handler)


class BendySniperScraper:
    def __init__(self, handles: List[str]):
        self.handles = handles
        self.devs_dir = os.path.join("assets", "developers")
        os.makedirs(self.devs_dir, exist_ok=True)
        
        # === НАСТРОЙКИ СКРАПЕРА ===
        self.max_history = 50000 
        self.history_depth = 3 # Кол-во запросов в прошлое за один запуск
        self.oldest_allowed_year = 2014 # Глубже этого года искать нет смысла
        
        # 🟢 ФЛАГ РЕТВИТОВ: True - пропускаем, False - собираем
        self.skip_retweets = True 
        
        self.session_stats = {
            "profiles_processed": 0,
            "posts_found": 0,
            "media_downloaded": 0,
            "errors": 0
        }

        self.user_agents = [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Safari/605.1.15',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0',
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36'
        ]

        # УБРАЛИ БИТЫЙ xcancel.com И ДОБАВИЛИ РАБОЧИЙ privacydev.net
        self.nitter_instances = [
            "https://nitter.ktachibana.party",
            "http://nitter.jaydenha.uk",
            "https://nitter.catsarch.com",
            "https://nitter.privacydev.net"
        ]

    def get_headers(self):
        return {
            'User-Agent': random.choice(self.user_agents),
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1'
        }

    def cleanup_old_dumps(self, max_dumps=100):
        try:
            files = [os.path.join(DUMPS_DIR, f) for f in os.listdir(DUMPS_DIR) if f.endswith('.txt')]
            if len(files) > max_dumps:
                files.sort(key=os.path.getmtime)
                for f in files[:-max_dumps]:
                    os.remove(f)
        except: pass

    def dump_raw_data(self, handle: str, strategy: str, data: str):
        self.cleanup_old_dumps()
        safe_strategy = re.sub(r'[^a-zA-Z0-9_]', '_', strategy)
        ts = datetime.now().strftime("%Y%m%d_%H%M%S")
        filepath = os.path.join(DUMPS_DIR, f"{handle}_{ts}_{safe_strategy}.txt")
        try:
            with open(filepath, "w", encoding="utf-8") as f: f.write(data)
        except: pass

    def clean_twitter_media_url(self, url: str) -> str:
        if not url: return None
        url = urllib.parse.unquote(url)

        tw_match = re.search(r'(https?://(?:pbs|video)\.twimg\.com/[^\s"\'<>]+)', url)
        if tw_match: return tw_match.group(1)

        media_match = re.search(r'media(?:/|%2F)([a-zA-Z0-9_-]+\.(?:jpg|png|jpeg|webp))', url)
        if media_match: return f"https://pbs.twimg.com/media/{media_match.group(1)}"

        video_match = re.search(r'(?:video\.twimg\.com)(?:/|%2F)(.+?\.mp4)', url)
        if video_match: return f"https://video.twimg.com/{video_match.group(1)}"

        thumb_match = re.search(r'(amplify_video_thumb|tweet_video_thumb|ext_tw_video_thumb)(?:/|%2F)(.+?\.(?:jpg|png))', url)
        if thumb_match: 
            return f"https://pbs.twimg.com/{thumb_match.group(1)}/{thumb_match.group(2)}"

        return url

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

    def download_media(self, url: str, handle: str, filename_prefix: str, media_type: str, index: int = 0) -> str:
        if not url: return None
        safe_handle = handle.replace('@', '').lower()
        media_dir = os.path.join(self.devs_dir, safe_handle, "media")
        os.makedirs(media_dir, exist_ok=True)

        ext = ".mp4" if media_type == "video" else ".jpg"
        if "format=png" in url or url.endswith(".png"): ext = ".png"
        elif "format=gif" in url or url.endswith(".gif"): ext = ".gif"
            
        filename = f"{filename_prefix}_{index}{ext}"
        local_path = os.path.join(media_dir, filename)
        web_path = f"assets/developers/{safe_handle}/media/{filename}"

        if os.path.exists(local_path): return web_path

        try:
            req = urllib.request.Request(url, headers=self.get_headers())
            with urllib.request.urlopen(req, timeout=15) as response:
                if response.status == 200:
                    with open(local_path, 'wb') as f: f.write(response.read())
                    self.session_stats["media_downloaded"] += 1
                    return web_path
        except: pass
        return None

    def process_developer_folder(self, handle: str, actual_name: str, avatar_url: str) -> str:
        safe_handle = handle.replace('@', '').lower()
        dev_dir = os.path.join(self.devs_dir, safe_handle)
        os.makedirs(dev_dir, exist_ok=True)
        
        json_path = os.path.join(dev_dir, "data.json")
        if not os.path.exists(json_path):
            dev_data = {
                "id": safe_handle, "name": actual_name or handle, "handle": f"@{safe_handle}",
                "role": "Разработчик", "bio": "...", "assets": {"avatar": "avatar.jpg"},
                "links": {"twitter": f"https://twitter.com/{safe_handle}"}
            }
            with open(json_path, "w", encoding="utf-8") as f: json.dump(dev_data, f, ensure_ascii=False, indent=4)
                
        if not avatar_url: return f"assets/developers/{safe_handle}/avatar.jpg"
            
        local_path = os.path.join(dev_dir, "avatar.jpg")
        web_path = f"assets/developers/{safe_handle}/avatar.jpg"
        
        if os.path.exists(local_path): return web_path
        
        avatar_url = self.clean_twitter_media_url(avatar_url).replace('_normal', '_400x400')
        try:
            req = urllib.request.Request(avatar_url, headers=self.get_headers())
            with urllib.request.urlopen(req, timeout=10) as response:
                if response.status == 200:
                    with open(local_path, 'wb') as f: f.write(response.read())
                    return web_path
        except: pass
        return web_path

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

            image_node = channel.find("image")
            if image_node is not None:
                img_url_node = image_node.find("url")
                if img_url_node is not None and img_url_node.text:
                    avatar_url = self.clean_twitter_media_url(img_url_node.text)
                    
            items = channel.findall("item")
            
            card_pattern = re.compile(
                r'<a href="([^"]+)">\s*<img[^>]+src="([^">]+(?:card_img|card_img%2F)[^">]+)"[^>]*>\s*<br>\s*<b>(.*?)</b>\s*</a>(?:\s*<p>(.*?)</p>)?(?:\s*<small><a[^>]*>(.*?)</a></small>)?',
                re.IGNORECASE | re.DOTALL
            )
            
            for item in items:
                link = item.find("link")
                if link is None or not link.text: continue
                link_text = link.text

                raw_id = link_text.rstrip('/').split('/')[-1]
                post_id = raw_id.split('#')[0]

                orig_author = handle
                parts = link_text.rstrip('/').split('/')
                if "status" in parts:
                    orig_author = parts[parts.index("status") - 1]

                title_el = item.find("title")
                content = html.unescape(title_el.text.strip()) if title_el is not None and title_el.text else ""

                if content.strip().lower() in ["image", "video", "[image]", "[video]", "image video"]:
                    content = ""

                is_rt = content.lower().startswith(f"rt by @{handle.lower()}") or orig_author.lower() != handle.lower()
                if self.skip_retweets and is_rt:
                    continue 
                
                ref_type, ref_url, ref_author_q, ref_text, ref_author_name, ref_avatar_url = "", "", "", "", "", ""
                
                reply_match = re.search(r'^R to (@[\w_]+):?\s*', content, flags=re.IGNORECASE)
                if reply_match:
                    ref_type = "reply"
                    ref_author_q = reply_match.group(1).replace('@', '')
                    ref_url = f"https://twitter.com/{ref_author_q}"
                    content = re.sub(r'^R to @[\w_]+:?\s*', '', content, flags=re.IGNORECASE).strip()

                    try:
                        api_url = f"https://cdn.syndication.twimg.com/tweet-result?id={post_id}"
                        req = urllib.request.Request(api_url, headers={'User-Agent': random.choice(self.user_agents)})
                        with urllib.request.urlopen(req, timeout=5) as response:
                            api_data = json.loads(response.read().decode('utf-8'))
                            if 'parent' in api_data:
                                parent = api_data['parent']
                                ref_author_q = parent.get('user', {}).get('screen_name', ref_author_q)
                                ref_author_name = parent.get('user', {}).get('name', '')
                                ref_text = re.sub(r'https://t\.co/\w+', '', parent.get('text', '')).strip()
                                avatar_raw = parent.get('user', {}).get('profile_image_url_https', '')
                                if avatar_raw: ref_avatar_url = avatar_raw.replace('_normal', '_400x400')
                    except: pass

                if content.lower().startswith(f"rt by @{handle.lower()}"):
                    content = re.sub(r'^rt\s+by\s+@[\w_]+:\s*', '', content, flags=re.IGNORECASE).strip()
                    content = f"RT @{orig_author}: {content}"
                elif orig_author.lower() != handle.lower() and not content.startswith(f"RT @{orig_author}"):
                    content = f"RT @{orig_author}: {content}"

                extracted_media, extracted_ref_media, extracted_cards = [], [], []
                desc_el = item.find("description")
                
                if desc_el is not None and desc_el.text:
                    desc_html = html.unescape(desc_el.text)
                    desc_html = re.sub(r'<hr/?>\s*<b>Link</b>\s*<br/?>', '', desc_html, flags=re.IGNORECASE)
                    desc_html = re.sub(r'<br/?>\s*Video\s*<br/?>', '', desc_html, flags=re.IGNORECASE)

                    for cm in card_pattern.finditer(desc_html):
                        extracted_cards.append({
                            "url": cm.group(1).strip(),
                            "imageUrl": html.unescape(cm.group(2).replace('&amp;', '&').strip()),
                            "title": html.unescape(cm.group(3).strip()),
                            "description": html.unescape(cm.group(4).strip()) if cm.group(4) else "",
                            "domain": html.unescape(cm.group(5).strip()) if cm.group(5) else ""
                        })
                        desc_html = desc_html.replace(cm.group(0), '')

                    quote_match = re.search(r'(?:<hr/?>\s*)?<blockquote>(.*?)</blockquote>', desc_html, re.DOTALL | re.IGNORECASE)
                    if not quote_match: quote_match = re.search(r'<div class="quote[^>]*>(.*?)</div>', desc_html, re.DOTALL | re.IGNORECASE)
                    main_desc_html = desc_html

                    if quote_match:
                        quote_body = quote_match.group(1)
                        main_desc_html = desc_html.replace(quote_match.group(0), '')
                        
                        if not ref_type:
                            ref_type = "quote"
                            author_header_m = re.search(r'<b>(.*?) \(@([a-zA-Z0-9_]+)\)</b>', quote_body)
                            if author_header_m:
                                ref_author_name, ref_author_q = author_header_m.group(1).strip(), author_header_m.group(2).strip()
                            else:
                                author_m = re.search(r'href="[^"]*/([a-zA-Z0-9_]+)/status/\d+', quote_body)
                                if author_m: ref_author_q = author_m.group(1)

                            status_m = re.search(r'href="[^"]*/([a-zA-Z0-9_]+)/status/(\d+)', quote_body)
                            if status_m: ref_url = f"https://twitter.com/{status_m.group(1)}/status/{status_m.group(2)}"
                            elif ref_author_q: ref_url = f"https://twitter.com/{ref_author_q}"

                            clean_quote_text = re.sub(r'<[^>]+>', ' ', re.sub(r'<b>.*?</b>|<footer>.*?</footer>|<a[^>]*>.*?</a>', '', quote_body, flags=re.DOTALL)).strip()
                            ref_text = " ".join(clean_quote_text.split())

                        for v_src in re.findall(r'<source[^>]+src="([^">]+)"', quote_body):
                            extracted_ref_media.append({"url": self.clean_twitter_media_url(v_src), "type": "video"})
                        for q_src in re.findall(r'<img[^>]+src="([^">]+)"', quote_body):
                            if "profile_images" not in q_src and "avatar" not in q_src:
                                m_type = "video_thumb" if "video_thumb" in q_src else ("gif" if ".mp4" in q_src or ".gif" in q_src else "image")
                                extracted_ref_media.append({"url": self.clean_twitter_media_url(q_src), "type": m_type})

                    for v_src in re.findall(r'<source[^>]+src="([^">]+)"', main_desc_html):
                        extracted_media.append({"url": self.clean_twitter_media_url(v_src), "type": "video"})
                    for m_src in re.findall(r'<img[^>]+src="([^">]+)"', main_desc_html):
                        if "profile_images" not in m_src and "avatar" not in m_src:
                            m_type = "video_thumb" if "video_thumb" in m_src else ("gif" if ".mp4" in m_src or ".gif" in m_src else "image")
                            extracted_media.append({"url": self.clean_twitter_media_url(m_src), "type": m_type})

                posts.append({
                    "id": post_id, "authorName": actual_name, "authorHandle": f"@{handle}", "platform": "twitter",
                    "content": content, "timestamp": self.parse_date(item.find("pubDate").text if item.find("pubDate") is not None else ""),
                    "rawMedia": extracted_media, "originalAvatarUrl": avatar_url, "referenceType": ref_type,
                    "referenceUrl": ref_url, "referenceAuthor": f"@{ref_author_q}" if ref_author_q else "",
                    "referenceAuthorName": ref_author_name, "referenceAvatarUrl": ref_avatar_url, "referenceText": ref_text,
                    "rawRefMedia": extracted_ref_media, "rawCards": extracted_cards
                })
        except: pass
        return posts, avatar_url, actual_name

    def build_strategies(self, handle: str) -> List[Tuple[str, str, str]]:
        strategies = []
        random.shuffle(self.nitter_instances)
        for instance in self.nitter_instances:
            url = f"{instance}/{handle}" if "rsshub" in instance else f"{instance}/{handle}/rss"
            name = instance.replace("https://", "").replace("http://", "").split("/")[0]
            strategies.append((f"RSS via {name}", url, "rss"))
        return strategies

    def build_historical_strategies(self, handle: str, until_date: str) -> List[Tuple[str, str, str]]:
        strategies = []
        random.shuffle(self.nitter_instances)
        query = urllib.parse.quote(f"from:{handle} until:{until_date}")
        for instance in self.nitter_instances:
            url = f"{instance}/search/rss?f=tweets&q={query}"
            name = instance.replace("https://", "").replace("http://", "").split("/")[0]
            strategies.append((f"Search RSS via {name}", url, "rss"))
        return strategies

    def _execute_network_request(self, name: str, url: str, handle: str) -> Tuple[List[Dict], str, str]:
        max_attempts = 2
        for attempt in range(max_attempts):
            try:
                req = urllib.request.Request(url, headers=self.get_headers())
                with urllib.request.urlopen(req, timeout=15) as response:
                    raw_data = response.read().decode('utf-8', errors='ignore')
                    if "authentik-config" in raw_data or "Making sure you're not a bot" in raw_data or raw_data.strip().lower().startswith("<!doctype html"):
                        break 
                    self.dump_raw_data(handle, name, raw_data)
                    posts, avatar, actual_name = self.parse_rss(raw_data, handle)
                    if posts:
                        unique_scraped = {}
                        for p in posts: unique_scraped[p["id"]] = p
                        return list(unique_scraped.values()), avatar, actual_name
                    else: break 
            except urllib.error.HTTPError as e:
                if e.code == 404: break 
            except: pass
            time.sleep(random.uniform(3.0, 6.0))
        return [], "", handle

    def fetch_timeline(self, handle: str) -> Tuple[List[Dict], str, str]:
        for name, url, parser_type in self.build_strategies(handle):
            posts, avatar, actual_name = self._execute_network_request(name, url, handle)
            if posts: return posts, avatar, actual_name
        self.session_stats["errors"] += 1
        return [], "", handle

    def fetch_historical(self, handle: str, until_date: str) -> Tuple[List[Dict], str, str]:
        for name, url, parser_type in self.build_historical_strategies(handle, until_date):
            posts, avatar, actual_name = self._execute_network_request(name, url, handle)
            if posts: return posts, avatar, actual_name
        return [], "", handle

    def run(self):
        logging.info("\n" + "★"*60)
        logging.info("🚀 ЗАПУСК BENDY SNIPER FEED SCRAPER (Машина Времени Активна)")
        logging.info("★"*60 + "\n")
        start_time = time.time()
        
        for handle in self.handles:
            self.session_stats["profiles_processed"] += 1
            safe_handle = handle.lower()
            
            logging.info(f"\n" + "="*60)
            logging.info(f"🔎 АНАЛИЗ ПРОФИЛЯ: @{handle}")
            logging.info("="*60)

            dev_feed_path = os.path.join(self.devs_dir, safe_handle, "feed.json")
            existing_posts = []
            if os.path.exists(dev_feed_path):
                try:
                    with open(dev_feed_path, 'r', encoding='utf-8') as f: existing_posts = json.load(f)
                except: pass

            logging.info("  📌 Сбор актуальной ленты...")
            combined, latest_avatar_url, actual_name = self.fetch_timeline(handle)

            base_source = existing_posts if existing_posts else combined
            
            if base_source:
                try:
                    oldest_post = min(base_source, key=lambda x: x['timestamp'])
                    oldest_dt = datetime.strptime(oldest_post['timestamp'][:10], "%Y-%m-%d")
                    
                    if oldest_dt.year >= self.oldest_allowed_year:
                        for _ in range(self.history_depth):
                            query_date = (oldest_dt + timedelta(days=2)).strftime("%Y-%m-%d")
                            logging.info(f"\n  🕰️ [МАШИНА ВРЕМЕНИ] Поиск до {query_date}...")
                            
                            hist_posts, hist_avatar, hist_name = self.fetch_historical(handle, query_date)

                            if not hist_posts:
                                logging.info("      Пусто. Делаем прыжок на 6 месяцев назад...")
                                oldest_dt -= timedelta(days=180) 
                                if oldest_dt.year < self.oldest_allowed_year: break
                                continue

                            combined.extend(hist_posts)
                            if not latest_avatar_url and hist_avatar: latest_avatar_url = hist_avatar
                            if actual_name == handle and hist_name != handle: actual_name = hist_name

                            new_oldest = min(hist_posts, key=lambda x: x['timestamp'])
                            new_oldest_dt = datetime.strptime(new_oldest['timestamp'][:10], "%Y-%m-%d")

                            if new_oldest_dt >= oldest_dt:
                                oldest_dt -= timedelta(days=180)
                            else:
                                oldest_dt = new_oldest_dt
                                
                            if oldest_dt.year < self.oldest_allowed_year: break
                            time.sleep(random.uniform(2.0, 4.0))
                except Exception as e: logging.error(f"  ❌ Ошибка Машины Времени: {e}")

            if not combined and not existing_posts: continue

            unique_combined_dict = {p['id']: p for p in combined}
            clean_combined_list = list(unique_combined_dict.values())

            local_avatar_path = self.process_developer_folder(handle, actual_name, latest_avatar_url)
            
            final_posts = []
            for p in clean_combined_list:
                clean_post_id = p["id"]
                final_media, final_ref_media, final_cards = [], [], []
                
                for idx, m in enumerate(p.get("rawMedia", [])):
                    l_path = self.download_media(m["url"], handle, clean_post_id, m["type"], idx)
                    if l_path: final_media.append({"url": l_path, "type": m["type"]})
                
                for idx, m in enumerate(p.get("rawRefMedia", [])):
                    l_path = self.download_media(m["url"], handle, f"quote_{clean_post_id}", m["type"], idx)
                    if l_path: final_ref_media.append({"url": l_path, "type": m["type"]})

                for idx, c in enumerate(p.get("rawCards", [])):
                    local_card_img = self.download_media(c["imageUrl"], handle, f"card_{clean_post_id}", "image", idx)
                    final_cards.append({"url": c["url"], "image": local_card_img, "title": c["title"], "description": c["description"], "domain": c["domain"]})
                    
                local_ref_avatar = p.get("referenceAvatarUrl", "")
                if local_ref_avatar and local_ref_avatar.startswith("http"):
                    l_path = self.download_media(local_ref_avatar, handle, f"quote_avatar_{clean_post_id}", "image", 0)
                    if l_path: local_ref_avatar = l_path

                final_posts.append({
                    "id": clean_post_id, "authorName": p["authorName"], "authorHandle": p["authorHandle"], "platform": p["platform"],
                    "content": p["content"], "timestamp": p["timestamp"], "media": final_media, "localAvatarPath": local_avatar_path,
                    "referenceType": p["referenceType"], "referenceUrl": p["referenceUrl"], "referenceAuthor": p["referenceAuthor"],
                    "referenceAuthorName": p.get("referenceAuthorName", ""), "referenceAvatarUrl": local_ref_avatar,
                    "referenceText": p.get("referenceText", ""), "referenceMedia": final_ref_media, "linkCards": final_cards
                })

            tmp_file = dev_feed_path + ".tmp"
            merged_dict = {post['id']: post for post in existing_posts}

            new_additions = 0
            for post in final_posts:
                if post['id'] not in merged_dict: new_additions += 1
                merged_dict[post['id']] = post

            final_list = sorted(list(merged_dict.values()), key=lambda x: x['timestamp'], reverse=True)[:self.max_history]

            try:
                with open(tmp_file, 'w', encoding='utf-8') as f: json.dump(final_list, f, ensure_ascii=False, indent=2)
                os.replace(tmp_file, dev_feed_path)
                logging.info(f"  ✅ ИТОГ (@{handle}): Успешно. Всего постов: {len(final_list)} (Новых: {new_additions})")
                self.session_stats["posts_found"] += new_additions
            except Exception as e:
                if os.path.exists(tmp_file): os.remove(tmp_file)
                self.session_stats["errors"] += 1

        logging.info(f"\n🏁 ПАРСИНГ ЗАВЕРШЕН за {round(time.time() - start_time, 2)} сек.\n")

if __name__ == "__main__":
    default_devs = [
        "Doberart", "themeatly", "m_ZeroLogics", "BLacroix30", 
        "bookpast", "BendyRun", "GentCorporation", "Bendy"
    ] 
    
    # ЧИТАЕМ АРГУМЕНТЫ ИЗ КОМАНДНОЙ СТРОКИ
    if len(sys.argv) > 1:
        devs = sys.argv[1:]
    else:
        devs = default_devs
        
    monitor = BendySniperScraper(devs)
    monitor.run()