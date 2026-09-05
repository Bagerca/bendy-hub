import os
import json
import re

DEVS_DIR = os.path.join("assets", "developers")

def clean_database():
    print("\n" + "="*50)
    print("🧹 BENDY FEED CLEANER (Удаление мусора и дубликатов)")
    print("="*50 + "\n")

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
        
        # 1. Удаляем дубликаты по ID (например: 12345 и 12345#m)
        # Оставляем тот, у которого есть медиа, либо базовый.
        unique_posts = {}
        for post in posts:
            base_id = post["id"].split("#")[0]
            
            if base_id in unique_posts:
                existing = unique_posts[base_id]
                # Если в новом посте есть медиа, а в старом нет — заменяем
                if post.get("mediaUrl") and not existing.get("mediaUrl"):
                    unique_posts[base_id] = post
            else:
                unique_posts[base_id] = post

        cleaned_posts = list(unique_posts.values())

        # 2. Удаляем сломанные "RT by" репосты без медиа, если есть нормальный аналог
        final_posts = []
        for post in cleaned_posts:
            # Ищем битые посты типа "RT by @Bendy: текст"
            is_broken_rt = bool(re.match(r"^RT by @[\w_]+:", post.get("content", ""), re.IGNORECASE))
            has_media = bool(post.get("mediaUrl"))
            
            if is_broken_rt and not has_media:
                # Если это сломанный ретвит без картинки, удаляем его из базы
                pass
            else:
                final_posts.append(post)

        # 3. Сортируем по дате перед сохранением
        final_posts.sort(key=lambda x: x['timestamp'], reverse=True)

        removed_count = initial_count - len(final_posts)
        total_removed += removed_count

        if removed_count > 0:
            with open(feed_path, 'w', encoding='utf-8') as f:
                json.dump(final_posts, f, ensure_ascii=False, indent=2)
            print(f"✅ @{folder:<15} | Очищено мусора: {removed_count} постов")
        else:
            print(f"✔️ @{folder:<15} | Все чисто, дубликатов нет")

    print("\n🎉 Очистка завершена! Всего удалено дубликатов:", total_removed)

if __name__ == "__main__":
    clean_database()