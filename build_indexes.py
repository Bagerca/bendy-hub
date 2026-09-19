# FILE: build_indexes.py

import os
import json

def load_json(path):
    if not os.path.exists(path): return {}
    with open(path, 'r', encoding='utf-8') as f:
        try: return json.load(f)
        except: return {}

def build_catalog_list():
    print("🎬 Сборка сводного индекса Каталога...")
    catalog_dir = os.path.join("assets", "catalog")
    output_data = []
    
    if os.path.exists(catalog_dir):
        for folder in os.listdir(catalog_dir):
            json_path = os.path.join(catalog_dir, folder, "data.json")
            if not os.path.exists(json_path): continue
            data = load_json(json_path)
                
            output_data.append({
                "id": data.get("id"),
                "title": data.get("title", "Без названия"),
                "type": data.get("type", "game"),
                "status": data.get("status", "released"),
                "release_date": data.get("release_date", ""),
                "color": data.get("color", "210, 168, 80"),
                "assets": {
                    "cover": data.get("assets", {}).get("cover"),
                    "banner": data.get("assets", {}).get("banner")
                },
                "characters_included": data.get("wiki", {}).get("characters", [])
            })
            
    with open(os.path.join("data", "catalog_list.json"), "w", encoding="utf-8") as f:
        json.dump(output_data, f, ensure_ascii=False, indent=2)

def build_music_list():
    print("🎵 Сборка сводного индекса Музыки...")
    music_dir = os.path.join("assets", "music")
    output_data = []
    
    if os.path.exists(music_dir):
        for folder in os.listdir(music_dir):
            json_path = os.path.join(music_dir, folder, "data.json")
            if not os.path.exists(json_path): continue
            data = load_json(json_path)
                
            output_data.append({
                "id": data.get("id"),
                "title": data.get("title", "Неизвестный трек"),
                "artist": data.get("artist", "Неизвестно"),
                "authorId": data.get("authorId", "unknown"),
                "type": data.get("type", "fan_song"),
                "year": data.get("year", ""),
                "cover": data.get("cover"),
                "color": data.get("color", "210, 168, 80"),
                "youtubeUrl": data.get("youtubeUrl")
            })
            
    with open(os.path.join("data", "music_list.json"), "w", encoding="utf-8") as f:
        json.dump(output_data, f, ensure_ascii=False, indent=2)

def build_music_authors_list():
    print("👥 Сборка сводного индекса Авторов Музыки...")
    authors_dir = os.path.join("assets", "music_authors")
    output_data = []
    
    if os.path.exists(authors_dir):
        for folder in os.listdir(authors_dir):
            json_path = os.path.join(authors_dir, folder, "data.json")
            if not os.path.exists(json_path): continue
            data = load_json(json_path)
            output_data.append(data)
                
    with open(os.path.join("data", "music_authors_list.json"), "w", encoding="utf-8") as f:
        json.dump(output_data, f, ensure_ascii=False, indent=2)

def build_records_list():
    print("📜 Сборка сводного индекса Записей (Лор)...")
    records_dir = os.path.join("assets", "records")
    output_data = []
    
    if os.path.exists(records_dir):
        for folder in os.listdir(records_dir):
            json_path = os.path.join(records_dir, folder, "data.json")
            if not os.path.exists(json_path): continue
            rec_data = load_json(json_path)
            
            for item in rec_data.get("items", []):
                item_copy = item.copy()
                item_copy["categoryId"] = folder # Вшиваем ID папки, чтобы знать, откуда брать иконки/картинки
                output_data.append(item_copy)

    with open(os.path.join("data", "records_list.json"), "w", encoding="utf-8") as f:
        json.dump(output_data, f, ensure_ascii=False, indent=2)
        
    return output_data

def build_characters_list(all_records):
    print("👤 Сборка сводного индекса Персонажей...")
    
    # Группируем все записи по authorId в памяти
    records_db = {}
    for item in all_records:
        author_id = item.get("authorId")
        if author_id:
            if author_id not in records_db:
                records_db[author_id] = []
            records_db[author_id].append(item)

    char_dir = os.path.join("assets", "characters")
    output_data = []
    
    if os.path.exists(char_dir):
        for folder in os.listdir(char_dir):
            json_path = os.path.join(char_dir, folder, "data.json")
            if not os.path.exists(json_path): continue
            data = load_json(json_path)
            
            aliases = data.get("meta", {}).get("aliases", [])
            versions_data = []
            
            for v in data.get("versions", []):
                label = v.get("label", "")
                if label and label not in aliases:
                    aliases.append(label)
                versions_data.append({
                    "label": label,
                    "assets": v.get("assets", {})
                })
                
            output_data.append({
                "id": data.get("id"),
                "name": data.get("name", "Неизвестно"),
                "meta": {
                    "species": data.get("meta", {}).get("species", ""),
                    "aliases": aliases
                },
                "assets": data.get("assets", {}),
                "versions": versions_data,
                "records": records_db.get(data.get("id"), []) # Вшиваем записи
            })
            
    with open(os.path.join("data", "characters_list.json"), "w", encoding="utf-8") as f:
        json.dump(output_data, f, ensure_ascii=False, indent=2)

if __name__ == "__main__":
    print("🚀 Старт компиляции JSON индексов...")
    os.makedirs("data", exist_ok=True)
    
    build_catalog_list()
    build_music_list()
    build_music_authors_list()
    
    # Сначала собираем записи, потом передаем их в сборщик персонажей
    all_records = build_records_list()
    build_characters_list(all_records)
    
    print("✅ Все списки успешно сгенерированы в папку /data/")