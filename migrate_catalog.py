import os
import json

MAPPING = {
    "game_bendy_the_cage": ("game_bendy_the_cage", "game"),
    "game_bendy_and_the_ink_factory": ("game_bendy_and_the_ink_factory", "game"),
    "game_boris_and_the_dark_survival": ("game_boris_and_the_dark_survival", "game"),
    "game_bendy_secrets_of_the_machine": ("game_bendy_secrets_of_the_machine", "game"),
    "game_bendy_lone_wolf": ("game_bendy_lone_wolf", "game"),
    "game_bendy_and_the_ink_machine": ("game_bendy_and_the_ink_machine", "game"),
    "game_bendy_and_the_dark_revival": ("game_bendy_and_the_dark_revival", "game"),
    "bendy_silent_city": ("game_bendy_silent_city", "game"),
    "nightmare_run": ("game_nightmare_run", "game"),
    "bendy_in_nightmare_run": ("game_bendy_in_nightmare_run", "game"),
    
    "dreams_come_to_life": ("book_dreams_come_to_life", "book"),
    "the_lost_ones": ("book_the_lost_ones", "book"),
    "fade_to_black": ("book_fade_to_black", "book"),
    "crack_up_comics": ("book_crack_up_comics", "book"),
    "dctl_graphic_novel": ("book_dctl_graphic_novel", "book"),
    "sent_from_above": ("book_sent_from_above", "book"),
    "bendy_silver_screams": ("book_bendy_silver_screams", "book"),
    "joeydrew_updated_handbook": ("book_joeydrew_updated_handbook", "book"),
    "joeydrew_employee_handbook": ("book_joeydrew_employee_handbook", "book"),
    "illusion_of_living": ("book_illusion_of_living", "book"),

    "bendy_movie": ("movie_bendy", "movie"),
    "bendy_cartoons": ("movie_bendy_cartoons", "movie")
}

TEAMS_DATA = {
    "fanic": {
        "id": "fanic",
        "name": "«FaN&C» Family's",
        "description": "...",
        "assets": { "avatar": "avatar.jpg" },
        "links": { "vk": "..." },
        "translations": {
            "game_bendy_and_the_ink_machine": {
                "type": "Полная локализация",
                "url": "https://vk.ru/wall-137351764_3069"
            }
        }
    },
    "ybt": {
        "id": "ybt",
        "name": "YBT - Team",
        "description": "...",
        "assets": { "avatar": "avatar.jpg" },
        "links": { "vk": "..." },
        "translations": {
            "game_bendy_and_the_dark_revival": {
                "type": "Полная локализация",
                "url": "https://vk.ru/wall-219115234_81"
            }
        }
    },
    "bullfinch": {
        "id": "bullfinch",
        "name": "The Bullfinch Team",
        "description": "...",
        "assets": { "avatar": "avatar.jpg" },
        "links": { "vk": "..." },
        "translations": {
            "game_bendy_and_the_dark_revival": {
                "type": "Полная локализация",
                "url": "https://vk.ru/the_bullfinch_team?w=wall-155649218_3865"
            }
        }
    }
}

def clean_json_data(data, new_id, item_type):
    data["id"] = new_id
    data["type"] = item_type
    
    # Статус по умолчанию. Для невышедших поменяешь вручную на development, frozen или cancelled
    data["status"] = "released"
    
    if "description" in data and data["description"]: data["description"] = "..."
        
    if "specs" in data and isinstance(data["specs"], dict):
        if "minimum" in data["specs"] and data["specs"]["minimum"]: data["specs"]["minimum"] = "..."
        if "recommended" in data["specs"] and data["specs"]["recommended"]: data["specs"]["recommended"] = "..."
            
    if "wiki" in data and isinstance(data["wiki"], dict):
        if "story" in data["wiki"] and data["wiki"]["story"]: data["wiki"]["story"] = "..."
        if "gameplay" in data["wiki"] and data["wiki"]["gameplay"]: data["wiki"]["gameplay"] = ["..."]
        if "development" in data["wiki"] and isinstance(data["wiki"]["development"], list):
            for stage in data["wiki"]["development"]:
                if "text" in stage: stage["text"] = "..."
                    
    # Присвоение русификаторов по новой логике (только массив ID команд)
    if new_id == "game_bendy_and_the_ink_machine":
        data["russifiers"] = ["fanic"]
    elif new_id == "game_bendy_and_the_dark_revival":
        data["russifiers"] = ["ybt", "bullfinch"]
    else:
        data["russifiers"] = []
                
    return data

def run_migration():
    base_dir = os.path.join("assets", "catalog")
    teams_dir = os.path.join("assets", "teams")
    index_file = os.path.join("data", "catalog_index.json")
    
    new_index = []
    print("🚀 Начинаю миграцию каталога и создание команд...")
    
    # Создаем команды
    os.makedirs(teams_dir, exist_ok=True)
    for team_id, team_info in TEAMS_DATA.items():
        team_path = os.path.join(teams_dir, team_id)
        os.makedirs(team_path, exist_ok=True)
        with open(os.path.join(team_path, "data.json"), 'w', encoding='utf-8') as f:
            json.dump(team_info, f, ensure_ascii=False, indent=4)
        print(f"👥 Создана команда: {team_id}")

    # Миграция каталога
    for old_name, (new_name, item_type) in MAPPING.items():
        old_path = os.path.join(base_dir, old_name)
        new_path = os.path.join(base_dir, new_name)
        
        if os.path.exists(old_path):
            json_path_old = os.path.join(old_path, "data.json")
            with open(json_path_old, 'r', encoding='utf-8') as f:
                try: data = json.load(f)
                except: continue
            
            if old_path != new_path:
                os.rename(old_path, new_path)
            
            cleaned_data = clean_json_data(data, new_name, item_type)
            
            with open(os.path.join(new_path, "data.json"), 'w', encoding='utf-8') as f:
                json.dump(cleaned_data, f, ensure_ascii=False, indent=4)
            
            new_index.append(new_name)

    with open(index_file, 'w', encoding='utf-8') as f:
        json.dump(new_index, f, ensure_ascii=False, indent=4)
    
    print("\n🎉 Миграция успешно завершена!")

if __name__ == "__main__":
    run_migration()