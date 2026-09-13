import os
import json

try:
    from PIL import Image
except ImportError:
    print("❌ Ошибка: Библиотека Pillow не установлена. Введи в консоль: pip install Pillow")
    exit(1)

DEFAULT_COLOR = "210, 168, 80"

def get_average_color(image_path):
    """Вычисляет средний цвет картинки, сжимая ее до 1x1 пикселя"""
    try:
        with Image.open(image_path) as img:
            img = img.convert('RGB')
            # Сжимаем до 1х1 с высококачественным фильтром усреднения
            img = img.resize((1, 1), resample=Image.Resampling.LANCZOS)
            r, g, b = img.getpixel((0, 0))
            
            # Добавляем яркость +20 (как было в JS), не превышая 255
            r = min(255, r + 20)
            g = min(255, g + 20)
            b = min(255, b + 20)
            
            return f"{r}, {g}, {b}"
    except Exception as e:
        print(f"    ⚠️ Ошибка чтения цвета {image_path}: {e}")
        return DEFAULT_COLOR

def update_music_colors():
    print("\n🎵 ОБНОВЛЕНИЕ ЦВЕТОВ МУЗЫКИ...")
    music_dir = os.path.join("assets", "music")
    if not os.path.exists(music_dir): 
        print("Папка с музыкой не найдена.")
        return
    
    count = 0
    for folder in os.listdir(music_dir):
        json_path = os.path.join(music_dir, folder, "data.json")
        if not os.path.exists(json_path): continue
        
        with open(json_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            
        cover_filename = data.get("cover", "")
        cover_path = os.path.join(music_dir, folder, cover_filename) if cover_filename else ""
        
        color = DEFAULT_COLOR
        if cover_path and os.path.exists(cover_path):
            color = get_average_color(cover_path)
        else:
            print(f"  ⚠️ [Music] {folder} -> Картинка не найдена, ставлю дефолт.")
            
        # Обновляем, если цвета не было или он изменился
        if data.get("color") != color:
            data["color"] = color
            with open(json_path, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=4)
            print(f"  ✅ [Music] {folder} -> Цвет: {color}")
            count += 1
            
    print(f"Итого обновлено треков: {count}")

def update_catalog_colors():
    print("\n🎬 ОБНОВЛЕНИЕ ЦВЕТОВ КАТАЛОГА...")
    catalog_dir = os.path.join("assets", "catalog")
    if not os.path.exists(catalog_dir): 
        print("Папка каталога не найдена.")
        return
    
    count = 0
    for folder in os.listdir(catalog_dir):
        json_path = os.path.join(catalog_dir, folder, "data.json")
        if not os.path.exists(json_path): continue
        
        with open(json_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            
        assets = data.get("assets", {})
        
        # Ищем любую доступную картинку по приоритету
        image_path = None
        for key in ["cover", "banner", "hero_bg", "logo"]:
            filename = assets.get(key)
            if filename and filename != "...":
                potential_path = os.path.join(catalog_dir, folder, filename)
                if os.path.exists(potential_path):
                    image_path = potential_path
                    break
                    
        color = DEFAULT_COLOR
        if image_path:
            color = get_average_color(image_path)
        else:
            print(f"  ⚠️ [Catalog] {folder} -> Картинки нет на диске, ставлю дефолт.")
            
        if data.get("color") != color:
            data["color"] = color
            with open(json_path, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=4)
            print(f"  ✅ [Catalog] {folder} -> Цвет: {color}")
            count += 1
            
    print(f"Итого обновлено проектов: {count}")

if __name__ == "__main__":
    print("🚀 Старт умной генерации цветов...")
    update_music_colors()
    update_catalog_colors()
    print("\n🎉 Готово!")