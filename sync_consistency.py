import os
import json
import re

DEVS_DIR = os.path.join("assets", "developers")

def get_text_signature(text):
    """
    Создает уникальный отпечаток текста:
    Удаляет RT-плашки, ссылки, знаки препинания и пробелы.
    """
    if not text:
        return ""
    
    # 1. Удаляем "RT @Name:" или "RT by @Name:"
    clean_text = re.sub(r'^RT\s+(?:by\s+)?@[\w_]+:\s*', '', text, flags=re.IGNORECASE)
    
    # 2. Удаляем все http/https ссылки
    clean_text = re.sub(r'https?://\S+', '', clean_text)
    
    # 3. Оставляем только буквы и цифры, переводим в нижний регистр
    signature = re.sub(r'\W+', '', clean_text).lower()
    
    return signature

def sync_database():
    print("\n" + "="*65)
    print("🔄 BENDY FEED SYNC (Умная синхронизация по ID и Тексту)")
    print("="*65 + "\n")

    if not os.path.exists(DEVS_DIR):
        print("❌ Папка разработчиков не найдена.")
        return

    # Словари для хранения "богатых" постов (с картинками или цитатами)
    rich_by_id = {}
    rich_by_signature = {}
    
    # Храним все файлы в памяти, чтобы не читать их дважды
    dev_feeds = {}

    # --- ШАГ 1: СБОР ДАННЫХ И СОЗДАНИЕ ИНДЕКСА ---
    for folder in os.listdir(DEVS_DIR):
        feed_path = os.path.join(DEVS_DIR, folder, "feed.json")
        if not os.path.exists(feed_path):
            continue

        try:
            with open(feed_path, 'r', encoding='utf-8') as f:
                posts = json.load(f)
                dev_feeds[folder] = posts
                
                for post in posts:
                    base_id = post['id'].split('#')[0]
                    signature = get_text_signature(post.get('content', ''))
                    
                    has_media = bool(post.get('mediaUrl'))
                    has_quote = post.get('referenceType') == 'quote'
                    
                    if has_media or has_quote:
                        # Сохраняем по ID
                        if base_id not in rich_by_id or (has_media and not rich_by_id[base_id].get('mediaUrl')):
                            rich_by_id[base_id] = post
                            
                        # Сохраняем по Текстовой Сигнатуре (если текст длиннее 15 символов, чтобы избежать ложных совпадений на коротких фразах вроде "Soon!")
                        if len(signature) > 15:
                            if signature not in rich_by_signature or (has_media and not rich_by_signature[signature].get('mediaUrl')):
                                rich_by_signature[signature] = post
                                
        except Exception as e:
            print(f"❌ Ошибка чтения {folder}: {e}")

    print(f"📥 Собрано 'богатых' постов в индекс: {len(rich_by_id)} (по ID) / {len(rich_by_signature)} (по Тексту)\n")

    # --- ШАГ 2: ПОИСК СОВПАДЕНИЙ И РАЗДАЧА МЕДИА ---
    total_updates = 0

    for folder, posts in dev_feeds.items():
        feed_path = os.path.join(DEVS_DIR, folder, "feed.json")
        changed = False
        
        for post in posts:
            base_id = post['id'].split('#')[0]
            signature = get_text_signature(post.get('content', ''))
            
            # Пытаемся найти донора сначала по ID, затем по Тексту
            donor_post = rich_by_id.get(base_id)
            match_type = "ID"
            
            if not donor_post and len(signature) > 15:
                donor_post = rich_by_signature.get(signature)
                match_type = "ТЕКСТУ"

            if donor_post:
                post_was_updated = False
                
                # 1. Восстанавливаем потерянное медиа
                if donor_post.get('mediaUrl') and not post.get('mediaUrl'):
                    post['mediaUrl'] = donor_post['mediaUrl']
                    post['mediaType'] = donor_post.get('mediaType', 'image')
                    post_was_updated = True
                
                # 2. Восстанавливаем потерянную цитату (Quote Tweet)
                if donor_post.get('referenceType') == 'quote' and not post.get('referenceType'):
                    post['referenceType'] = donor_post['referenceType']
                    post['referenceUrl'] = donor_post.get('referenceUrl', '')
                    post['referenceAuthor'] = donor_post.get('referenceAuthor', '')
                    post['referenceAuthorName'] = donor_post.get('referenceAuthorName', '')
                    post['referenceAvatarUrl'] = donor_post.get('referenceAvatarUrl', '')
                    post['referenceText'] = donor_post.get('referenceText', '')
                    post['referenceMediaUrl'] = donor_post.get('referenceMediaUrl', None)
                    post_was_updated = True

                if post_was_updated:
                    changed = True
                    total_updates += 1
                    snippet = post['content'].replace('\n', ' ')[:40]
                    print(f"  ✨ [@{folder}] Восстановлено по {match_type}: {snippet}...")

        # --- ШАГ 3: СОХРАНЕНИЕ ---
        if changed:
            try:
                # Сортируем перед сохранением для порядка
                posts.sort(key=lambda x: x['timestamp'], reverse=True)
                
                tmp_path = feed_path + ".tmp"
                with open(tmp_path, 'w', encoding='utf-8') as f:
                    json.dump(posts, f, ensure_ascii=False, indent=2)
                os.replace(tmp_path, feed_path)
                print(f"✅ @{folder:<15} | Файл успешно обновлен и сохранен.\n")
            except Exception as e:
                print(f"❌ Ошибка записи {folder}: {e}")
        else:
            print(f"✔️ @{folder:<15} | Без изменений")

    print(f"\n🎉 ИТОГ: Восстановлено данных для {total_updates} постов!")
    print("Теперь все картинки из ретвитов привязаны к их оригинальным постам.")

if __name__ == "__main__":
    sync_database()