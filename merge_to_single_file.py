import os

# Имя выходного файла
OUTPUT_FILE = "entire_project_context.txt"

# Оставили только системные и мусорные папки.
# Папки 'data' и 'assets' УБРАНЫ ИЗ ИСКЛЮЧЕНИЙ, теперь скрипт зайдет в них.
EXCLUDE_DIRS = {
    ".git",
    ".idea",
    ".vscode",
    "node_modules",
    "venv",
    "__pycache__",
    "dist",
    "build",
}

# Файлы, которые собирать не нужно
EXCLUDE_FILES = {
    OUTPUT_FILE,  # сам файл результата пропускаем, чтобы он не прочитал сам себя
    "package-lock.json",
    "yarn.lock",
}

# Важно: собираем только код и текст. 
# Если убрать этот фильтр, скрипт попытается прочитать .webp картинки и сломается!
CODE_EXTENSIONS = {
    ".py",
    ".js",
    ".html",
    ".css",
    ".json",
    ".md",
    ".txt"
}

count = 0

print("🚀 Запуск сборщика файлов проекта...")

with open(OUTPUT_FILE, "w", encoding="utf-8") as outfile:
    for root, dirs, files in os.walk("."):
        
        # Фильтруем папки (убираем системные, но оставляем data и assets)
        dirs[:] = [d for d in dirs if d.lower() not in EXCLUDE_DIRS]

        for file in files:
            # Пропускаем исключенные файлы
            if file.lower() in EXCLUDE_FILES:
                continue

            _, ext = os.path.splitext(file)

            # Проверяем расширение (только текстовые форматы)
            if ext.lower() in CODE_EXTENSIONS:
                src_path = os.path.join(root, file)
                rel_path = os.path.relpath(src_path, ".")

                # Пишем заголовок с путем к файлу для нейронки
                outfile.write(f"\n\n{'='*60}\n")
                outfile.write(f"FILE: {rel_path}\n")
                outfile.write(f"{'='*60}\n\n")

                try:
                    with open(src_path, "r", encoding="utf-8") as infile:
                        outfile.write(infile.read())
                    print(f"✅ Добавлен: {rel_path}")
                    count += 1
                except UnicodeDecodeError:
                    print(f"⚠️ Пропущен (не текстовый файл): {rel_path}")
                except Exception as e:
                    print(f"❌ Ошибка чтения {rel_path}: {e}")

print(f"\n🎉 Готово! Успешно собрано файлов: {count}")
print(f"Итоговый файл для нейронки: {OUTPUT_FILE}")