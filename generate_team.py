import os
import json

# Список участников команды проекта (Bendy Hub)
TEAM = [
    {
        "id": "bagerca",
        "name": "BAGERca",
        "role": "Основатель",
        "roleClass": "leader",
        "status": "Главный работник",
        "assets": {
            "avatar": "avatar.jpg"
        },
        "link": "#",
        "isOnline": True
    },
    {
        "id": "volunteer_1",
        "name": "Имя Помощника",
        "role": "Редактор / Лор",
        "roleClass": "helper",
        "status": "Заполнение архивов и текстов",
        "assets": {
            "avatar": ""
        },
        "link": "#",
        "isOnline": False
    },
    {
        "id": "volunteer_2",
        "name": "Волонтер",
        "role": "Тестер",
        "roleClass": "volunteer",
        "status": "Поиск багов и обратная связь",
        "assets": {
            "avatar": ""
        },
        "link": "#",
        "isOnline": False
    }
]

BASE_TEAM_DIR = os.path.join("assets", "team")
INDEX_FILE = os.path.join("data", "team_index.json")

def create_team():
    print(f"🚀 Запуск генерации команды сайта... Всего: {len(TEAM)}\n")
    
    os.makedirs(BASE_TEAM_DIR, exist_ok=True)
    os.makedirs("data", exist_ok=True)

    created_count = 0
    index_ids = []

    for member in TEAM:
        member_id = member["id"]
        index_ids.append(member_id)
        
        member_dir = os.path.join(BASE_TEAM_DIR, member_id)
        os.makedirs(member_dir, exist_ok=True)
        
        json_path = os.path.join(member_dir, "data.json")
        
        # Записываем данные в индивидуальный JSON
        with open(json_path, "w", encoding="utf-8") as f:
            json.dump(member, f, ensure_ascii=False, indent=4)
            
        print(f"✅ Создано/Обновлено дело: {member['name']} ({member_id})")
        created_count += 1

    # Обновляем индексный файл
    with open(INDEX_FILE, "w", encoding="utf-8") as f:
        json.dump(index_ids, f, ensure_ascii=False, indent=4)
        
    print(f"\n🎉 Готово!")
    print(f"Обработано участников: {created_count}")
    print(f"Файл {INDEX_FILE} успешно обновлен.")
    print("Не забудьте закинуть картинки avatar.jpg в соответствующие папки!")

if __name__ == "__main__":
    create_team()