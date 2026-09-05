import os
import json

def get_old_posts():
    # Ищем старый файл ленты (проверяем оба варианта названия)
    old_paths = [os.path.join("data", "feed_backup.json"), os.path.join("data", "feed.json")]
    
    for path in old_paths:
        if os.path.exists(path):
            try:
                with open(path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    return data, path
            except Exception as e:
                print(f"❌ Ошибка чтения {path}: {e}")
                
    return [], None

def check_counts():
    print("\n" + "="*50)
    print("📊 BENDY FEED CHECKER (Сверка базы данных)")
    print("="*50 + "\n")

    # 1. Анализируем старую базу
    old_posts, old_file_path = get_old_posts()
    old_total = len(old_posts)
    
    old_by_author = {}
    for post in old_posts:
        handle = post.get('authorHandle', '').replace('@', '').lower()
        if handle:
            old_by_author[handle] = old_by_author.get(handle, 0) + 1

    if old_file_path:
        print(f"📁 Старый файл найден: {old_file_path}")
        print(f"📉 Всего постов в старой базе: {old_total}\n")
    else:
        print("⚠️ Старый файл (feed_backup.json) не найден. Не с чем сравнивать!\n")

    # 2. Анализируем новую базу
    new_dir = os.path.join("assets", "developers")
    new_total = 0
    new_by_author = {}

    if os.path.exists(new_dir):
        for folder in os.listdir(new_dir):
            feed_path = os.path.join(new_dir, folder, "feed.json")
            if os.path.exists(feed_path):
                try:
                    with open(feed_path, 'r', encoding='utf-8') as f:
                        data = json.load(f)
                        count = len(data)
                        new_total += count
                        new_by_author[folder.lower()] = count
                except Exception as e:
                    print(f"❌ Ошибка чтения {feed_path}: {e}")

    print(f"📁 Новая система папок: {new_dir}")
    print(f"📈 Всего постов в новой базе: {new_total}\n")

    # 3. Детальное сравнение
    print("-" * 50)
    print(f"{'РАЗРАБОТЧИК':<20} | {'СТАРОЕ':<10} | {'НОВОЕ':<10} | {'СТАТУС'}")
    print("-" * 50)

    # Собираем всех уникальных авторов из обеих баз
    all_authors = set(old_by_author.keys()).union(set(new_by_author.keys()))

    for author in sorted(all_authors):
        o_count = old_by_author.get(author, 0)
        n_count = new_by_author.get(author, 0)
        
        # Определяем статус
        if n_count > o_count:
            status = "✅ Прирост (Новые твиты)"
        elif n_count == o_count:
            status = "✅ Совпадает"
        else:
            status = f"⚠️ Нехватка (-{o_count - n_count})"

        print(f"@{author:<19} | {o_count:<10} | {n_count:<10} | {status}")

    print("-" * 50)
    
    # 4. Итог
    if new_total >= old_total and old_total > 0:
        print("\n🎉 ИТОГ: Ни один пост не потерян! Миграция прошла успешно.")
        if new_total > old_total:
            print(f"💡 Более того, скраппер нашел {new_total - old_total} новых постов!")
    elif old_total > 0:
        print("\n⚠️ ИТОГ: В новой базе меньше постов, чем в старой. Посмотри таблицу выше, чтобы узнать, у кого пропали твиты.")

if __name__ == "__main__":
    check_counts()