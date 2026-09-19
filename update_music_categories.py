import os
import json

UPDATE_FILE = "music_categories_update.json"
MUSIC_DIR = os.path.join("assets", "music")

def update_categories():
    print(f"🚀 Запуск обновления категорий музыки из файла {UPDATE_FILE}...\n")
    
    if not os.path.exists(UPDATE_FILE):
        print(f"❌ Ошибка: Файл {UPDATE_FILE} не найден в корне проекта.")
        return

    try:
        with open(UPDATE_FILE, 'r', encoding='utf-8') as f:
            categories_map = json.load(f)
    except Exception as e:
        print(f"❌ Ошибка чтения JSON файла: {e}")
        return

    updated_count = 0
    skipped_count = 0
    not_found_count = 0

    for track_id, new_type in categories_map.items():
        # Если при сортировке нажали "Пропустить", в JSON может быть 'skipped', 
        # на всякий случай пропускаем такие
        if new_type == "skipped":
            continue

        track_json_path = os.path.join(MUSIC_DIR, track_id, "data.json")
        
        if os.path.exists(track_json_path):
            try:
                with open(track_json_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                
                old_type = data.get("type")
                if old_type != new_type:
                    data["type"] = new_type
                    
                    with open(track_json_path, 'w', encoding='utf-8') as f:
                        json.dump(data, f, ensure_ascii=False, indent=4)
                        
                    print(f"✅ ОБНОВЛЕН: {track_id} | {old_type} -> {new_type}")
                    updated_count += 1
                else:
                    skipped_count += 1
            except Exception as e:
                print(f"⚠️ Ошибка при обработке {track_id}: {e}")
        else:
            print(f"❌ НЕ НАЙДЕН: Папка трека {track_id} отсутствует.")
            not_found_count += 1
            
    print("\n" + "="*50)
    print("🎉 ОБНОВЛЕНИЕ БАЗЫ ЗАВЕРШЕНО")
    print("="*50)
    print(f"Успешно обновлено: {updated_count}")
    print(f"Без изменений (уже стоял этот тип): {skipped_count}")
    print(f"Не найдено папок: {not_found_count}")
    
    print("\n⚠️ ВНИМАНИЕ: Обязательно запустите 'python build_indexes.py', чтобы изменения применились к сайту!")

if __name__ == "__main__":
    update_categories()