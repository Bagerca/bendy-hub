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
from datetime import datetime
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

file_handler = AutoFlushFileHandler(LOG_FILE, mode='a', encoding='utf-8')
file_handler.setFormatter(logging.Formatter('%(asctime)s [%(levelname)s] %(message)s', datefmt='%Y-%m-%d %H:%M:%S'))

console_handler = logging.StreamHandler(sys.stdout)
console_handler.setFormatter(logging.Formatter('%(asctime)s [%(levelname)s] %(message)s', datefmt='%H:%M:%S'))

logger = logging.getLogger()
logger.setLevel(logging.INFO)
logger.handlers.clear()
logger.addHandler(file_handler)
logger.addHandler(console_handler)


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
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36'
        ]

        # Очищенный список Nitter (без мертвых вроде nitter.eu)
        self.nitter_instances = [
            "http://nitter.jaydenha.uk",
            "https://nitter.cz",
            "https://nitter.poast.org",
            "https://nitter.privacydev.net",
            "https://nitter.projectsegfau.lt"
        ]

    def get_headers(self):
        return {
            'User-Agent': random.choice(self.user_agents),
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1'
        }

    def cleanup_old_dumps(self, max_dumps=50):
        """Удаляет старые сырые дампы, чтобы папка logs не разрасталась бесконечно"""
        try:
            files = [os.path.join(DUMPS_DIR, f) for f in os.listdir(DUMPS_DIR) if f.endswith('.txt')]
            if len(files) > max_dumps:
                files.sort(key=os.path.getmtime)
                for f in files[:-max_dumps]:
                    os.remove(f)
        except Exception: pass

    def dump_raw_data(self, handle: str, strategy: str, data: str):
        if "Attention Required! | Cloudflare" in data or "This domain may be for sale" in data or "ng-app=\"trouble\"" in data:
            return

        self.cleanup_old_dumps()
        safe_strategy = re.sub(r'[^a-zA-Z0-9_]', '_', strategy)
        ts = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"{handle}_{ts}_{safe_strategy}.txt"
        filepath = os.path.join(DUMPS_DIR, filename)
        try:
            with open(filepath, "w", encoding="utf-8") as f:
                f.write(data)
        except Exception: pass

    def clean_twitter_media_url(self, url: str) -> str:
        if not url: return None
        url = urllib.parse.unquote(url)

        tw_match = re.search(r'(https?://(?:pbs|video)\.twimg\.com/[^\s"\'<>]+)', url)
        if tw_match: return tw_match.group(1)

        media_match = re.search(r'media(?:/|%2F)([a-zA-Z0-9_-]+\.(?:jpg|png|jpeg|webp))', url)
        if media_match: return f"https://pbs.twimg.com/media/{media_match.group(1)}"

        video_match = re.search(r'(?:video\.twimg\.com)(?:/|%2F)(.+?\.mp4)', url)
        if video_match: return f"https://video.twimg.com/{video_match.group(1)}"

        thumb_match = re.search(r'(?:amplify_video_thumb|tweet_video_thumb|ext_tw_video_thumb)(?:/|%2F)(.+?\.(?:jpg|png))', url)
        if thumb_match: return f"https://pbs.twimg.com/ext_tw_video_thumb/{thumb_match.group(1)}"

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
                
        if not avatar_url: return f"assets/developers/{safe_handle}/avatar.jpg"
        local_path = os.path.join(dev_dir, "avatar.jpg")
        web_path = f"assets/developers/{safe_handle}/avatar.jpg"
        
        if os.path.exists(local_path): return web_path
        
        avatar_url = self.clean_twitter_media_url(avatar_url)
        avatar_url = avatar_url.replace('_normal', '_400x400')
        try:
            req = urllib.request.Request(avatar_url, headers=self.get_headers())
            with urllib.request.urlopen(req, timeout=10) as response:
                if response.status == 200:
                    with open(local_path, 'wb') as f: f.write(response.read())
                    return web_path
        except Exception: pass
            
        return web_path

    # ==========================================
    # ПАРСЕРЫ
    # ==========================================

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
            logging.info(f"    🔍 [Parse RSS] Найдено постов в ленте: {len(items)}")
            
            # Регулярка для вырезания карточек (Twitter Link Preview)
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
                    status_idx = parts.index("status")
                    orig_author = parts[status_idx - 1]

                title_el = item.find("title")
                content = html.unescape(title_el.text.strip()) if title_el is not None and title_el.text else ""

                # Распознаем ответы (Replies)
                ref_type, ref_url, ref_author_q, ref_text = "", "", "", ""
                ref_author_name = ""
                
                reply_match = re.search(r'^R to (@[\w_]+):?\s*', content, flags=re.IGNORECASE)
                if reply_match:
                    ref_type = "reply"
                    ref_author_q = reply_match.group(1).replace('@', '')
                    ref_url = f"https://twitter.com/{ref_author_q}"
                    content = re.sub(r'^R to @[\w_]+:?\s*', '', content, flags=re.IGNORECASE).strip()

                if content.lower().startswith(f"rt by @{handle.lower()}"):
                    content = re.sub(r'^rt\s+by\s+@[\w_]+:\s*', '', content, flags=re.IGNORECASE).strip()
                    content = f"RT @{orig_author}: {content}"
                elif orig_author.lower() != handle.lower():
                    if not content.startswith(f"RT @{orig_author}"):
                        content = f"RT @{orig_author}: {content}"

                extracted_media = []
                extracted_ref_media = []
                extracted_cards = []

                desc_el = item.find("description")
                if desc_el is not None and desc_el.text:
                    desc_html = html.unescape(desc_el.text)

                    # 0. ВЫРЕЗАЕМ КАРТОЧКИ ССЫЛОК
                    for cm in card_pattern.finditer(desc_html):
                        extracted_cards.append({
                            "url": cm.group(1).strip(),
                            "imageUrl": html.unescape(cm.group(2).replace('&amp;', '&').strip()),
                            "title": html.unescape(cm.group(3).strip()),
                            "description": html.unescape(cm.group(4).strip()) if cm.group(4) else "",
                            "domain": html.unescape(cm.group(5).strip()) if cm.group(5) else ""
                        })
                        desc_html = desc_html.replace(cm.group(0), '')

                    # 1. ВЫРЕЗАЕМ И ИЗОЛИРУЕМ ЦИТАТУ
                    quote_match = re.search(r'(?:<hr/?>\s*)?<blockquote>(.*?)</blockquote>', desc_html, re.DOTALL | re.IGNORECASE)
                    if not quote_match:
                        quote_match = re.search(r'<div class="quote[^>]*>(.*?)</div>', desc_html, re.DOTALL | re.IGNORECASE)

                    main_desc_html = desc_html

                    if quote_match:
                        quote_full_block = quote_match.group(0)
                        quote_body = quote_match.group(1)
                        
                        main_desc_html = desc_html.replace(quote_full_block, '')
                        ref_type = "quote"

                        author_header_m = re.search(r'<b>(.*?) \(@([a-zA-Z0-9_]+)\)</b>', quote_body)
                        if author_header_m:
                            ref_author_name = author_header_m.group(1).strip()
                            ref_author_q = author_header_m.group(2).strip()
                        else:
                            author_m = re.search(r'href="[^"]*/([a-zA-Z0-9_]+)/status/\d+', quote_body)
                            if author_m: ref_author_q = author_m.group(1)

                        status_m = re.search(r'href="[^"]*/([a-zA-Z0-9_]+)/status/(\d+)', quote_body)
                        if status_m:
                            ref_url = f"https://twitter.com/{status_m.group(1)}/status/{status_m.group(2)}"
                        elif ref_author_q:
                            ref_url = f"https://twitter.com/{ref_author_q}"

                        clean_quote_text = re.sub(r'<b>.*?</b>', '', quote_body, flags=re.DOTALL)
                        clean_quote_text = re.sub(r'<footer>.*?</footer>', '', clean_quote_text, flags=re.DOTALL)
                        clean_quote_text = re.sub(r'<a[^>]*>.*?</a>', '', clean_quote_text, flags=re.DOTALL)
                        clean_quote_text = re.sub(r'<[^>]+>', ' ', clean_quote_text).strip()
                        ref_text = " ".join(clean_quote_text.split())

                        if "<video" in quote_body:
                            video_sources = re.findall(r'<source[^>]+src="([^">]+)"', quote_body)
                            for v_src in video_sources:
                                extracted_ref_media.append({"url": self.clean_twitter_media_url(v_src), "type": "video"})
                        else:
                            q_imgs = re.findall(r'<img[^>]+src="([^">]+)"', quote_body)
                            for q_src in q_imgs:
                                if "profile_images" not in q_src and "avatar" not in q_src:
                                    m_type = "gif" if ".mp4" in q_src or ".gif" in q_src else "image"
                                    extracted_ref_media.append({"url": self.clean_twitter_media_url(q_src), "type": m_type})

                    # 2. ИЩЕМ МЕДИА САМОГО РАЗРАБОТЧИКА (БЕЗ ЦИТАТЫ)
                    if "<video" in main_desc_html:
                        video_sources = re.findall(r'<source[^>]+src="([^">]+)"', main_desc_html)
                        for v_src in video_sources:
                            extracted_media.append({"url": self.clean_twitter_media_url(v_src), "type": "video"})
                    else:
                        main_imgs = re.findall(r'<img[^>]+src="([^">]+)"', main_desc_html)
                        for m_src in main_imgs:
                            if "profile_images" not in m_src and "avatar" not in m_src:
                                m_type = "gif" if ".mp4" in m_src or ".gif" in m_src else "image"
                                extracted_media.append({"url": self.clean_twitter_media_url(m_src), "type": m_type})

                # Логирование того, что мы нашли в посте
                content_preview = (content[:30] + '...') if len(content) > 30 else content
                logging.info(f"      📝 Пост [{post_id}]: {content_preview}")
                
                if ref_type:
                    logging.info(f"        ↳ Тип ссылки: {ref_type.upper()} | Автор: @{ref_author_q}")
                if extracted_media:
                    logging.info(f"        ↳ Найдено медиа: {len(extracted_media)} шт.")
                if extracted_ref_media:
                    logging.info(f"        ↳ Найдено медиа (цитата): {len(extracted_ref_media)} шт.")
                if extracted_cards:
                    logging.info(f"        ↳ Найдена карточка (Link Preview): {extracted_cards[0]['domain']}")

                posts.append({
                    "id": post_id,
                    "authorName": actual_name,
                    "authorHandle": f"@{handle}",
                    "platform": "twitter",
                    "content": content,
                    "timestamp": self.parse_date(item.find("pubDate").text if item.find("pubDate") is not None else ""),
                    "rawMedia": extracted_media,
                    "originalAvatarUrl": avatar_url,
                    "referenceType": ref_type,
                    "referenceUrl": ref_url,
                    "referenceAuthor": f"@{ref_author_q}" if ref_author_q else "",
                    "referenceAuthorName": ref_author_name, 
                    "referenceAvatarUrl": "", 
                    "referenceText": ref_text,
                    "rawRefMedia": extracted_ref_media,
                    "rawCards": extracted_cards
                })
        except Exception as e: 
            logging.error(f"    ❌ [Parse RSS] Ошибка: {e}")
            
        return posts, avatar_url, actual_name

    def build_strategies(self, handle: str) -> List[Tuple[str, str, str]]:
        strategies = []
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
        logging.info(f"\n==== АНАЛИЗ ПРОФИЛЯ: {handle} ====")

        for name, url, parser_type in strategies:
            max_attempts = 2
            for attempt in range(max_attempts):
                try:
                    req = urllib.request.Request(url, headers=self.get_headers())
                    with urllib.request.urlopen(req, timeout=15) as response:
                        raw_data = response.read().decode('utf-8', errors='ignore')
                        self.dump_raw_data(handle, name, raw_data)
                        posts, avatar, actual_name = self.parse_rss(raw_data, handle)
                            
                        if posts:
                            unique_scraped = {}
                            dupes_found = 0
                            for p in posts:
                                c_id = p["id"].split('#')[0]
                                p["id"] = c_id
                                if c_id not in unique_scraped:
                                    unique_scraped[c_id] = p
                                else:
                                    dupes_found += 1
                                    
                            posts = list(unique_scraped.values())
                            
                            logging.info(f"🟢 УСПЕХ! Источник [{name}]. Собрано постов: {len(posts)}")
                            if dupes_found > 0:
                                logging.info(f"    🗑️ Удалено дубликатов (закрепы): {dupes_found}")

                            return posts, avatar, actual_name
                        else:
                            break 

                except urllib.error.HTTPError as e:
                    if e.code == 404: break 
                except socket.timeout: pass
                except Exception: pass
                
                time.sleep(random.uniform(3.0, 6.0))

        logging.error(f"💀 Все попытки исчерпаны. Данные для {handle} не получены.")
        return [], "", handle

    def run(self):
        logging.info("==================================================")
        logging.info("🚀 BENDY SNIPER FEED SCRAPER (Clean Start Mode)")
        logging.info("==================================================")
        
        for handle in self.handles:
            safe_handle = handle.lower()
            combined, latest_avatar_url, actual_name = self.fetch_timeline(handle)
            
            if not combined:
                continue

            local_avatar_path = self.process_developer_folder(handle, actual_name, latest_avatar_url)
            
            final_posts = []
            for p in combined:
                clean_post_id = p["id"]

                final_media = []
                for idx, m in enumerate(p.get("rawMedia", [])):
                    l_path = self.download_media(m["url"], handle, clean_post_id, m["type"], idx)
                    if l_path:
                        final_media.append({"url": l_path, "type": m["type"]})
                
                final_ref_media = []
                for idx, m in enumerate(p.get("rawRefMedia", [])):
                    l_path = self.download_media(m["url"], handle, f"quote_{clean_post_id}", m["type"], idx)
                    if l_path:
                        final_ref_media.append({"url": l_path, "type": m["type"]})

                final_cards = []
                for idx, c in enumerate(p.get("rawCards", [])):
                    local_card_img = self.download_media(c["imageUrl"], handle, f"card_{clean_post_id}", "image", idx)
                    final_cards.append({
                        "url": c["url"],
                        "image": local_card_img,
                        "title": c["title"],
                        "description": c["description"],
                        "domain": c["domain"]
                    })

                clean_post = {
                    "id": clean_post_id,
                    "authorName": p["authorName"],
                    "authorHandle": p["authorHandle"],
                    "platform": p["platform"],
                    "content": p["content"],
                    "timestamp": p["timestamp"],
                    "media": final_media,
                    "localAvatarPath": local_avatar_path,
                    "referenceType": p["referenceType"],
                    "referenceUrl": p["referenceUrl"],
                    "referenceAuthor": p["referenceAuthor"],
                    "referenceAuthorName": p.get("referenceAuthorName", ""),
                    "referenceAvatarUrl": p.get("referenceAvatarUrl", ""),
                    "referenceText": p.get("referenceText", ""),
                    "referenceMedia": final_ref_media,
                    "linkCards": final_cards
                }
                final_posts.append(clean_post)

            dev_feed_path = os.path.join(self.devs_dir, safe_handle, "feed.json")
            tmp_file = dev_feed_path + ".tmp"
            
            # Поскольку мы запускаем с нуля, старых постов нет, но код универсальный
            existing_posts = []
            if os.path.exists(dev_feed_path):
                try:
                    with open(dev_feed_path, 'r', encoding='utf-8') as f:
                        existing_posts = json.load(f)
                except Exception: pass

            merged_dict = {post['id']: post for post in existing_posts}

            for post in final_posts:
                c_id = post['id']
                if c_id not in merged_dict:
                    merged_dict[c_id] = post
                else:
                    merged_dict[c_id] = post

            final_list = list(merged_dict.values())
            final_list.sort(key=lambda x: x['timestamp'], reverse=True)
            final_list = final_list[:self.max_history]

            try:
                with open(tmp_file, 'w', encoding='utf-8') as f:
                    json.dump(final_list, f, ensure_ascii=False, indent=2)
                os.replace(tmp_file, dev_feed_path)
                logging.info(f"📊 ИТОГ ({handle}): База обновлена. Всего постов: {len(final_list)}")
            except Exception as e:
                if os.path.exists(tmp_file): os.remove(tmp_file)
                logging.error(f"❌ Ошибка сохранения {handle}: {e}")

if __name__ == "__main__":
    devs = [
        "Doberart", 
        "themeatly", 
        "m_ZeroLogics", 
        "BLacroix30", 
        "bookpast", 
        "BendyRun", 
        "GentCorporation",
        "Bendy"
    ] 
    monitor = BendySniperScraper(devs)
    monitor.run()