import os
import json

BASE_CHAR_DIR = os.path.join("assets", "characters")
INDEX_FILE = os.path.join("data", "characters_index.json")

# Эталонная схема, к которой мы приводим всех персонажей
DEFAULT_DATA = {
    "role": "...",
    "status": "...",
    "quote": "...",
    "voice_actor": "...",
    "meta": {
        "aliases": [],
        "species": "...",
        "gender": "...",
        "occupation": "...",
        "affiliation": "..."
    },
    "versions": [],
    "wiki": {
        "appearance": "...",
        "personality": "...",
        "history": [],
        "trivia": []
    }
}

def migrate_characters():
    print("🚀 Запуск миграции и стандартизации персонажей...\n")

    # 1. Переименование bendy_ink_demon -> ink_demon, если папка существует
    old_demon_path = os.path.join(BASE_CHAR_DIR, "bendy_ink_demon")
    new_demon_path = os.path.join(BASE_CHAR_DIR, "ink_demon")
    
    if os.path.exists(old_demon_path):
        os.rename(old_demon_path, new_demon_path)
        print("✅ Папка 'bendy_ink_demon' переименована в 'ink_demon'")

    # 2. Проходим по всем папкам персонажей
    all_current_dirs = [d for d in os.listdir(BASE_CHAR_DIR) if os.path.isdir(os.path.join(BASE_CHAR_DIR, d))]
    
    updated_count = 0
    skipped_count = 0

    for char_id in all_current_dirs:
        # ИСКЛЮЧЕНИЕ: Не трогаем Генри Штейна
        if char_id == "henry_stein":
            print(f"⏭️  Пропущен: {char_id} (Сохраняем оригинал)")
            skipped_count += 1
            continue

        char_dir = os.path.join(BASE_CHAR_DIR, char_id)
        json_path = os.path.join(char_dir, "data.json")

        old_data = {}
        if os.path.exists(json_path):
            with open(json_path, "r", encoding="utf-8") as f:
                try:
                    old_data = json.load(f)
                except json.JSONDecodeError:
                    print(f"⚠️ Ошибка чтения JSON: {char_id}. Файл будет перезаписан.")

        # ОБНУЛЕНИЕ ИНК ДЕМОНА: если это он, стираем старые данные, чтобы начать с чистого листа
        if char_id == "ink_demon":
            print(f"🧹 Обнуление данных для: {char_id} (Сброс до заводских настроек)")
            old_data = {}

        # Собираем новую структуру
        new_data = {
            "id": char_id, 
            "name": old_data.get("name", char_id.replace("_", " ").title())
        }

        # Добавляем все поля из эталона (если в old_data что-то было — сохраняем, иначе берем пустоту из эталона)
        for key, default_value in DEFAULT_DATA.items():
            if isinstance(default_value, dict):
                new_data[key] = {}
                for sub_key, sub_val in default_value.items():
                    old_sub_val = old_data.get(key, {}).get(sub_key, "") if isinstance(old_data.get(key), dict) else ""
                    new_data[key][sub_key] = old_sub_val if old_sub_val else sub_val
            else:
                old_val = old_data.get(key, "")
                if isinstance(default_value, list):
                    new_data[key] = old_val if old_val else []
                else:
                    new_data[key] = old_val if old_val else default_value

        # ЖЕСТКАЯ СТАНДАРТИЗАЦИЯ КАРТИНОК: Проставляем всем одинаковые имена файлов
        new_data["assets"] = {
            "avatar": "avatar.jpg",
            "full_body": "full_body.png"
        }

        # Перезаписываем JSON
        with open(json_path, "w", encoding="utf-8") as f:
            json.dump(new_data, f, ensure_ascii=False, indent=4)
        
        updated_count += 1

    # 3. Обновляем и сохраняем индексный файл (сортируя и удаляя дубликаты)
    # Загружаем старый индекс, чтобы попытаться сохранить порядок (если он важен), 
    # но обязательно заменяем bendy_ink_demon на ink_demon.
    index_list = []
    if os.path.exists(INDEX_FILE):
        with open(INDEX_FILE, "r", encoding="utf-8") as f:
            try:
                index_list = json.load(f)
            except:
                pass

    # Обновляем старые имена в памяти
    index_list = ["ink_demon" if x == "bendy_ink_demon" else x for x in index_list]
    
    # Сливаем текущие папки с индексом (вдруг кто-то удалил папку ручками)
    final_index = []
    for item in index_list:
        if item in all_current_dirs and item not in final_index:
            final_index.append(item)
            
    # Добавляем новые папки, которых не было в индексе
    for folder in all_current_dirs:
        if folder not in final_index:
            final_index.append(folder)

    with open(INDEX_FILE, "w", encoding="utf-8") as f:
        json.dump(final_index, f, ensure_ascii=False, indent=4)

    print(f"\n🎉 Готово!")
    print(f"Обновлено персонажей: {updated_count}")
    print(f"Пропущено: {skipped_count}")
    print(f"Файл {INDEX_FILE} пересобран.")

if __name__ == "__main__":
    migrate_characters()