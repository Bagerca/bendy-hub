import os
import json

def build_catalog_list():
    print("🎬 Сборка сводного индекса Каталога...")
    catalog_dir = os.path.join("assets", "catalog")
    output_data = []
    
    if os.path.exists(catalog_dir):
        for folder in os.listdir(catalog_dir):
            json_path = os.path.join(catalog_dir, folder, "data.json")
            if not os.path.exists(json_path): continue
            
            with open(json_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                
            # Берем только то, что нужно для карточек и поиска связей
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
            
            with open(json_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                
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
            
            with open(json_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                output_data.append(data) # Авторов грузим целиком, они легкие
                
    with open(os.path.join("data", "music_authors_list.json"), "w", encoding="utf-8") as f:
        json.dump(output_data, f, ensure_ascii=False, indent=2)

def build_characters_list():
    print("👤 Сборка сводного индекса Персонажей...")
    char_dir = os.path.join("assets", "characters")
    output_data = []
    
    if os.path.exists(char_dir):
        for folder in os.listdir(char_dir):
            json_path = os.path.join(char_dir, folder, "data.json")
            if not os.path.exists(json_path): continue
            
            with open(json_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                
            output_data.append({
                "id": data.get("id"),
                "name": data.get("name", "Неизвестно"),
                "meta": {
                    "species": data.get("meta", {}).get("species", ""),
                    "aliases": data.get("meta", {}).get("aliases", [])
                },
                "assets": data.get("assets", {}),
                "versions": [ {"assets": v.get("assets", {})} for v in data.get("versions", []) ]
            })
            
    with open(os.path.join("data", "characters_list.json"), "w", encoding="utf-8") as f:
        json.dump(output_data, f, ensure_ascii=False, indent=2)

if __name__ == "__main__":
    print("🚀 Старт компиляции JSON индексов...")
    os.makedirs("data", exist_ok=True)
    build_catalog_list()
    build_music_list()
    build_music_authors_list()
    build_characters_list()
    print("✅ Все списки успешно сгенерированы в папку /data/")