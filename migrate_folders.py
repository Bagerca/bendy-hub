import os
import json
import shutil

CATALOG_DIR = os.path.join("assets", "catalog")
GLOBAL_ACH_DIR = os.path.join("assets", "achievements")

def move_file(src, dst):
    if os.path.exists(src):
        os.makedirs(os.path.dirname(dst), exist_ok=True)
        shutil.move(src, dst)
        return True
    return False

def copy_file(src, dst):
    if os.path.exists(src):
        os.makedirs(os.path.dirname(dst), exist_ok=True)
        shutil.copy2(src, dst)
        return True
    return False

def migrate_catalog():
    print("🚀 Старт миграции структуры папок каталога...\n")
    updated_count = 0

    if not os.path.exists(CATALOG_DIR):
        print(f"❌ Папка {CATALOG_DIR} не найдена.")
        return

    for folder in os.listdir(CATALOG_DIR):
        project_dir = os.path.join(CATALOG_DIR, folder)
        json_path = os.path.join(project_dir, "data.json")
        
        if not os.path.exists(json_path):
            continue

        try:
            with open(json_path, "r", encoding="utf-8") as f:
                data = json.load(f)

            changed = False

            # --- 1. МИГРАЦИЯ ASSETS (MEDIA) ---
            if "assets" in data:
                assets = data["assets"]
                
                # Одиночные картинки
                for key in ["logo", "cover", "banner", "hero_bg"]:
                    val = assets.get(key)
                    if val and val != "..." and not val.startswith("media/"):
                        old_path = os.path.join(project_dir, val)
                        new_val = f"media/images/{val}"
                        new_path = os.path.join(project_dir, new_val)
                        if move_file(old_path, new_path):
                            assets[key] = new_val
                            changed = True

                # Массив скриншотов
                if "screenshots" in assets:
                    new_screens = []
                    for val in assets["screenshots"]:
                        if val and val != "..." and not val.startswith("media/"):
                            old_path = os.path.join(project_dir, val)
                            new_val = f"media/images/{val}"
                            new_path = os.path.join(project_dir, new_val)
                            if move_file(old_path, new_path):
                                new_screens.append(new_val)
                                changed = True
                            else:
                                new_screens.append(val)
                        else:
                            new_screens.append(val)
                    assets["screenshots"] = new_screens

                # Массив видео
                if "videos" in assets:
                    new_videos = []
                    for val in assets["videos"]:
                        if val and val != "..." and not val.startswith("media/") and not val.startswith("http"):
                            old_path = os.path.join(project_dir, val)
                            new_val = f"media/videos/{val}"
                            new_path = os.path.join(project_dir, new_val)
                            
                            # Переносим само видео
                            move_file(old_path, new_path)
                            
                            # Переносим превью для локальных видео (.jpg / .png)
                            file_name = os.path.splitext(val)[0]
                            move_file(os.path.join(project_dir, f"{file_name}.jpg"), os.path.join(project_dir, f"media/videos/{file_name}.jpg"))
                            move_file(os.path.join(project_dir, f"{file_name}.png"), os.path.join(project_dir, f"media/videos/{file_name}.png"))

                            new_videos.append(new_val)
                            changed = True
                        else:
                            new_videos.append(val)
                    assets["videos"] = new_videos

            # --- 2. МИГРАЦИЯ ГЛАВ (CHAPTERS) ---
            if "wiki" in data and "chapters" in data["wiki"]:
                for chapter in data["wiki"]["chapters"]:
                    val = chapter.get("image")
                    if val and val != "..." and not val.startswith("chapters/"):
                        old_path = os.path.join(project_dir, val)
                        new_val = f"chapters/{val}"
                        new_path = os.path.join(project_dir, new_val)
                        if move_file(old_path, new_path):
                            chapter["image"] = new_val
                            changed = True

            # --- 3. МИГРАЦИЯ АЧИВОК (ACHIEVEMENTS) ---
            if "achievements" in data:
                for ach in data["achievements"]:
                    val = ach.get("icon")
                    if val and val != "..." and not val.startswith("achievements/"):
                        # Ищем ачивку в глобальной папке
                        global_path = os.path.join(GLOBAL_ACH_DIR, val)
                        new_val = f"achievements/{val}"
                        local_path = os.path.join(project_dir, new_val)
                        
                        # Копируем из глобальной в локальную (копируем, а не перемещаем, на случай если файл используется где-то еще)
                        if copy_file(global_path, local_path):
                            ach["icon"] = new_val
                            changed = True

            # Сохраняем, если были изменения
            if changed:
                with open(json_path, "w", encoding="utf-8") as f:
                    json.dump(data, f, ensure_ascii=False, indent=4)
                print(f"  ✅ Реструктуризован: {folder}")
                updated_count += 1
            else:
                print(f"  ✔️ Пропущен (уже в норме): {folder}")

        except Exception as e:
            print(f"  ⚠️ Ошибка обработки {folder}: {e}")

    print(f"\n🎉 Готово! Обновлено проектов: {updated_count}")
    print("ℹ️ После проверки работоспособности, старую папку assets/achievements можно удалить вручную.")

if __name__ == "__main__":
    migrate_catalog()