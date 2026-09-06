import os
import shutil

DEVS_DIR = os.path.join("assets", "developers")

def clean_developer_feeds():
    print("\n" + "="*60)
    print("🧹 BENDY FEED WIPER (Глубокая очистка лент и медиа)")
    print("="*60 + "\n")

    if not os.path.exists(DEVS_DIR):
        print("❌ Папка разработчиков не найдена.")
        return

    total_feeds_deleted = 0
    total_media_deleted = 0

    for folder in os.listdir(DEVS_DIR):
        dev_path = os.path.join(DEVS_DIR, folder)

        if not os.path.isdir(dev_path):
            continue

        print(f"🔄 Очистка профиля: @{folder}...")
        cleared_something = False

        # 1. Удаляем основной кэш постов
        feed_file = os.path.join(dev_path, "feed.json")
        if os.path.exists(feed_file):
            os.remove(feed_file)
            total_feeds_deleted += 1
            cleared_something = True
            print("   🗑️ Удален feed.json")

        # 2. Удаляем временный файл (если прошлый парсер упал с ошибкой)
        tmp_file = os.path.join(dev_path, "feed.json.tmp")
        if os.path.exists(tmp_file):
            os.remove(tmp_file)
            cleared_something = True
            print("   🗑️ Удален feed.json.tmp")

        # 3. Удаляем папку media со всеми картинками и видео
        media_dir = os.path.join(dev_path, "media")
        if os.path.exists(media_dir):
            files_count = len(os.listdir(media_dir))
            shutil.rmtree(media_dir)
            total_media_deleted += files_count
            cleared_something = True
            print(f"   🗑️ Удалена папка media (файлов: {files_count})")

        if cleared_something:
            print(f"   ✔️ Профиль @{folder} готов к новому парсингу (аватар сохранен).\n")
        else:
            print(f"   ✔️ Профиль @{folder} уже был пуст.\n")

    print("="*60)
    print(f"🎉 ОЧИСТКА ЗАВЕРШЕНА!")
    print(f"Удалено лент: {total_feeds_deleted}")
    print(f"Удалено медиафайлов: {total_media_deleted}")
    print("👉 Теперь запусти scraper.py для чистого сбора данных.")
    print("="*60 + "\n")

if __name__ == "__main__":
    # Защита от случайного запуска
    confirm = input("⚠️ ВНИМАНИЕ! Это удалит все скачанные посты и картинки твитов. Продолжить? (y/n): ")
    if confirm.lower() in ['y', 'yes', 'д', 'да']:
        clean_developer_feeds()
    else:
        print("🛑 Очистка отменена.")