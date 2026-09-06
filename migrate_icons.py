import os
import re
import urllib.parse

INPUT_FILE = os.path.join("shared", "js", "icons.js")
OUTPUT_DIR = os.path.join("assets", "icons")

def migrate():
    print("🔮 Запуск миграции иконок из JS в физические SVG...")
    
    if not os.path.exists(INPUT_FILE):
        print(f"❌ Исходный файл {INPUT_FILE} не найден. Убедитесь, что запускаете из корня.")
        return

    os.makedirs(OUTPUT_DIR, exist_ok=True)

    with open(INPUT_FILE, 'r', encoding='utf-8') as f:
        content = f.read()

    # ИСПРАВЛЕННАЯ РЕГУЛЯРКА:
    # Группа 1: имя (ключ)
    # Группа 2: тип открывающей кавычки (` или ' или ")
    # Группа 3: сам контент
    # \2 : строго та же кавычка, что и в Группе 2
    pattern = re.compile(r'([a-zA-Z0-9_-]+)\s*:\s*([`\'"])([\s\S]*?)\2')
    matches = pattern.findall(content)

    migrated_count = 0
    for match in matches:
        key = match[0]
        val = match[2].strip() # Берем контент из 3-й группы
        
        # Декодируем data-URI обратно в чистый SVG
        if "data:image/svg+xml" in val:
            try:
                svg_part = val.split(",", 1)[1]
                val = urllib.parse.unquote(svg_part)
                print(f"  ✨ Декодирован data-URI для: {key}")
            except Exception as e:
                print(f"  ⚠️ Не удалось декодировать data-URI для {key}: {e}")

        out_path = os.path.join(OUTPUT_DIR, f"{key}.svg")
        with open(out_path, 'w', encoding='utf-8') as out_f:
            out_f.write(val)
        
        print(f"  📥 Сохранен: {key}.svg")
        migrated_count += 1

    print(f"\n🎉 Миграция успешно завершена! Экспортировано файлов: {migrated_count}")
    print(f"Все исходники теперь лежат в папке: {OUTPUT_DIR}")

if __name__ == "__main__":
    migrate()