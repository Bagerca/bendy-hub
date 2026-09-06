import os
import json

def get_old_posts():
    # 1. Сначала ищем единый старый файл ленты
    old_paths = [os.path.join("data", "feed_backup.json"), os.path.join("data", "feed.json")]
    for path in old_paths:
        if os.path.exists(path):
            try:
                with open(path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    return data, path, "file"
            except Exception as e:
                print(f"❌ Ошибка чтения {path}: {e}")
                
    # 2. Если единого файла нет, проверяем папку developers_backup
    backup_dir = os.path.join("assets", "developers_backup")
    if os.path.exists(backup_dir):
        all_backup_posts = []
        for folder in os.listdir(backup_dir):
            feed_file = os.path.join(backup_dir, folder, "feed.json")
            if os.path.exists(feed_file):
                try:
                    with open(feed_file, 'r', encoding='utf-8') as f:
                        all_backup_posts.extend(json.load(f))
                except:
                    pass
        if all_backup_posts:
            return all_backup_posts, backup_dir, "dir"

    return [], None, None

def check_counts():
    print("\n" + "="*65)
    print("📊 BENDY FEED CHECKER (Сверка старой и новой базы)")
    print("="*65 + "\n")

    # 1. Анализируем старую базу
    old_posts, old_source, source_type = get_old_posts()
    old_total = len(old_posts)
    
    old_by_author = {}
    for post in old_posts:
        handle = post.get('authorHandle', '').replace('@', '').lower()
        if handle:
            old_by_author[handle] = old_by_author.get(handle, 0) + 1

    if old_source:
        print(f"📁 Источник старых данных: {old_source}")
        print(f"📉 Всего постов в старой базе: {old_total}\n")
    else:
        print("⚠️ Старая база не найдена (не с чем сравнивать).\n")

    # 2. Анализируем новую базу и медиафайлы
    new_dir = os.path.join("assets", "developers")
    new_total = 0
    new_by_author = {}
    media_by_author = {}

    if os.path.exists(new_dir):
        for folder in os.listdir(new_dir):
            dev_path = os.path.join(new_dir, folder)
            if not os.path.isdir(dev_path):
                continue
                
            handle_key = folder.lower()
            
            # Считаем посты
            feed_path = os.path.join(dev_path, "feed.json")
            if os.path.exists(feed_path):
                try:
                    with open(feed_path, 'r', encoding='utf-8') as f:
                        data = json.load(f)
                        count = len(data)
                        new_total += count
                        new_by_author[handle_key] = count
                except Exception as e:
                    print(f"❌ Ошибка чтения {feed_path}: {e}")
            else:
                new_by_author[handle_key] = 0

            # Считаем скачанные медиафайлы
            media_path = os.path.join(dev_path, "media")
            if os.path.exists(media_path):
                media_by_author[handle_key] = len([f for f in os.listdir(media_path) if os.path.isfile(os.path.join(media_path, f))])
            else:
                media_by_author[handle_key] = 0

    print(f"📁 Новая система папок: {new_dir}")
    print(f"📈 Всего постов в новой базе: {new_total}\n")

    # 3. Детальная таблица сравнения
    print("-" * 65)
    print(f"{'РАЗРАБОТЧИК':<18} | {'СТАРОЕ':<8} | {'НОВОЕ':<8} | {'МЕДИА':<7} | {'СТАТУС'}")
    print("-" * 65)

    all_authors = set(old_by_author.keys()).union(set(new_by_author.keys()))

    for author in sorted(all_authors):
        o_count = old_by_author.get(author, 0)
        n_count = new_by_author.get(author, 0)
        m_count = media_by_author.get(author, 0)
        
        if n_count > o_count:
            status = "✅ Прирост"
        elif n_count == o_count and n_count > 0:
            status = "✅ Совпадает"
        elif n_count == 0 and o_count == 0:
            status = "⚪ Пусто"
        else:
            status = f"⚠️ Нехватка (-{o_count - n_count})"

        print(f"@{author:<17} | {o_count:<8} | {n_count:<8} | {m_count:<7} | {status}")

    print("-" * 65)
    
    # 4. Итоги
    if new_total >= old_total and old_total > 0:
        print("\n🎉 ИТОГ: Все данные на месте, потерь нет!")
        if new_total > old_total:
            print(f"💡 База пополнилась на {new_total - old_total} новых постов.")
    elif old_total > 0:
        print(f"\n⚠️ ИТОГ: В новой базе не хватает {old_total - new_total} постов.")

if __name__ == "__main__":
    check_counts()