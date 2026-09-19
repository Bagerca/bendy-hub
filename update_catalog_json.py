import os
import json

CATALOG_DIR = os.path.join("assets", "catalog")

def update_catalog():
    print("🚀 Старт обновления JSON файлов каталога...")
    updated_count = 0

    if not os.path.exists(CATALOG_DIR):
        print(f"❌ Папка {CATALOG_DIR} не найдена.")
        return

    for folder in os.listdir(CATALOG_DIR):
        json_path = os.path.join(CATALOG_DIR, folder, "data.json")
        if not os.path.exists(json_path):
            continue

        try:
            with open(json_path, "r", encoding="utf-8") as f:
                data = json.load(f)

            changed = False

            # Добавляем новые корневые ключи
            if "achievements" not in data:
                data["achievements"] = []
                changed = True
            
            if "languages" not in data:
                data["languages"] = []
                changed = True

            # Обновляем блок wiki
            if "wiki" not in data:
                data["wiki"] = {}
                changed = True
            
            if "chapters" not in data["wiki"]:
                data["wiki"]["chapters"] = []
                changed = True
                
            if "trivia" not in data["wiki"]:
                data["wiki"]["trivia"] = []
                changed = True

            # Сохраняем, если были изменения
            if changed:
                with open(json_path, "w", encoding="utf-8") as f:
                    json.dump(data, f, ensure_ascii=False, indent=4)
                print(f"  ✅ Обновлен: {folder}")
                updated_count += 1
            else:
                print(f"  ✔️ Пропущен (уже обновлен): {folder}")

        except Exception as e:
            print(f"  ⚠️ Ошибка чтения {folder}: {e}")

    print(f"\n🎉 Готово! Обновлено проектов: {updated_count}")

if __name__ == "__main__":
    update_catalog()