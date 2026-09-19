# FILE: fix_json_schema.py

import os
import json

CATALOG_DIR = os.path.join("assets", "catalog")

def fix_catalog_jsons():
    print("🚀 Старт нормализации JSON файлов каталога...")
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

            # 1. Исправляем specs (превращаем кривой объект в правильный массив)
            if "specs" in data and isinstance(data["specs"], dict):
                data["specs"] = [
                    {
                        "os": "Windows",
                        "minimum": ["..."],
                        "recommended": ["..."]
                    }
                ]
                changed = True

            # 2. Убеждаемся, что массивы, где лежат заглушки "...", действительно массивы
            if "achievements" not in data:
                data["achievements"] = []
                changed = True

            # Сохраняем, если были изменения
            if changed:
                with open(json_path, "w", encoding="utf-8") as f:
                    json.dump(data, f, ensure_ascii=False, indent=4)
                print(f"  ✅ Исправлена схема: {folder}")
                updated_count += 1
            else:
                print(f"  ✔️ В норме: {folder}")

        except Exception as e:
            print(f"  ⚠️ Ошибка чтения {folder}: {e}")

    print(f"\n🎉 Готово! Исправлено проектов: {updated_count}")

if __name__ == "__main__":
    fix_catalog_jsons()