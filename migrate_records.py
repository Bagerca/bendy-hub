import os
import json
import shutil

OLD_DATA_DIR = os.path.join("data", "records")
NEW_ASSETS_DIR = os.path.join("assets", "records")
INDEX_FILE = os.path.join("data", "records_index.json")

def migrate():
    print("🚀 Запуск миграции Архивов к Атомарному Дизайну...\n")

    # 1. Проверяем, существует ли индекс
    if not os.path.exists(INDEX_FILE):
        print(f"❌ Ошибка: Не найден файл {INDEX_FILE}")
        return

    with open(INDEX_FILE, 'r', encoding='utf-8') as f:
        categories = json.load(f)

    success_count = 0

    # 2. Проходимся по каждой категории из индекса
    for cat_id in categories:
        old_json_path = os.path.join(OLD_DATA_DIR, f"{cat_id}.json")
        new_cat_dir = os.path.join(NEW_ASSETS_DIR, cat_id)
        new_json_path = os.path.join(new_cat_dir, "data.json")

        if not os.path.exists(old_json_path):
            print(f"⚠️ Пропущен: {cat_id}.json (файл не найден в data/records/)")
            continue

        # Создаем новую папку в assets/records/<cat_id>
        os.makedirs(new_cat_dir, exist_ok=True)

        # Читаем старые данные
        with open(old_json_path, 'r', encoding='utf-8') as f:
            data = json.load(f)

        # 3. Перенос картинок
        # Если картинки лежали просто в assets/records/, переносим их в папку категории
        for item in data.get('items', []):
            img_filename = item.get('image')
            if img_filename:
                old_img_path = os.path.join(NEW_ASSETS_DIR, img_filename)
                new_img_path = os.path.join(new_cat_dir, img_filename)
                
                # Если картинка реально лежит в корне assets/records/, перемещаем её
                if os.path.exists(old_img_path) and not os.path.isdir(old_img_path):
                    shutil.move(old_img_path, new_img_path)
                    print(f"  🖼️ Перемещено фото: {img_filename} -> {cat_id}/")

        # 4. Сохраняем data.json в новой папке
        with open(new_json_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=4)
        
        # 5. Удаляем старый JSON файл из data/records/
        os.remove(old_json_path)
        print(f"✅ Успешно мигрирован: {cat_id}")
        success_count += 1

    # 6. Пытаемся удалить старую папку data/records/ (если она пуста)
    if os.path.exists(OLD_DATA_DIR):
        try:
            os.rmdir(OLD_DATA_DIR)
            print(f"\n🗑️ Папка {OLD_DATA_DIR} успешно удалена.")
        except OSError:
            print(f"\n⚠️ Папка {OLD_DATA_DIR} не удалена, так как в ней остались какие-то файлы.")

    print(f"\n🎉 Миграция завершена! Обработано категорий: {success_count}")

if __name__ == "__main__":
    migrate()