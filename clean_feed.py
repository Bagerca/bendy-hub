# FILE: clean_feed.py
import os
import json
import re

DEVS_DIR = os.path.join("assets", "developers")

def clean_database():
    print("\n" + "="*60)
    print("🧹 BENDY FEED CLEANER (Удаление шизо-репостов и дубликатов)")
    print("="*60 + "\n")

    if not os.path.exists(DEVS_DIR):
        print("❌ Папка разработчиков не найдена.")
        return

    total_removed = 0

    for folder in os.listdir(DEVS_DIR):
        feed_path = os.path.join(DEVS_DIR, folder, "feed.json")
        if not os.path.exists(feed_path):
            continue

        try:
            with open(feed_path, 'r', encoding='utf-8') as f:
                posts = json.load(f)
        except Exception as e:
            print(f"Ошибка чтения {feed_path}: {e}")
            continue

        initial_count = len(posts)
        folder_handle = folder.lower()
        
        # 1. Удаляем дубликаты по базовому ID
        unique_posts = {}
        for post in posts:
            base_id = post["id"].split("#")[0]
            if base_id in unique_posts:
                existing = unique_posts[base_id]
                if post.get("mediaUrl") and not existing.get("mediaUrl"):
                    unique_posts[base_id] = post
            else:
                unique_posts[base_id] = post

        cleaned_posts = list(unique_posts.values())

        # 2. Умное удаление сломанных репостов
        final_posts = []
        for post in cleaned_posts:
            content = post.get("content", "")
            
            # Ищем паттерн ретвита, точно так же, как это делает фронтенд:
            # Ловит и "RT @name:" и "RT by @name:"
            rt_match = re.match(r"^RT\s+(?:by\s+)?@([\w_]+)[\s:]", content, re.IGNORECASE)
            
            if rt_match:
                rt_handle = rt_match.group(1).lower()
                
                # ПРАВИЛО 1: Пользователь репостнул сам себя (баг Твиттера/парсера)
                if rt_handle == folder_handle:
                    continue  # Пропускаем этот пост, он не попадет в финал
                
                # ПРАВИЛО 2: Сломанный "RT by" без картинки (абсолютный мусор)
                if content.lower().startswith("rt by") and not post.get("mediaUrl"):
                    continue  # Пропускаем
                    
            final_posts.append(post)

        # 3. Сортируем по дате перед сохранением
        final_posts.sort(key=lambda x: x['timestamp'], reverse=True)

        removed_count = initial_count - len(final_posts)
        total_removed += removed_count

        if removed_count > 0:
            with open(feed_path, 'w', encoding='utf-8') as f:
                json.dump(final_posts, f, ensure_ascii=False, indent=2)
            print(f"✅ @{folder:<15} | Удалено багнутых постов: {removed_count}")
        else:
            print(f"✔️ @{folder:<15} | Всё чисто")

    print(f"\n🎉 Очистка завершена! Всего удалено мусорных постов: {total_removed}")

if __name__ == "__main__":
    clean_database()