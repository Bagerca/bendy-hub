import os

# Имя выходного файла
OUTPUT_FILE = "entire_project_context.txt"

# Папки, которые полностью пропускаем (включая data и assets)
EXCLUDE_DIRS = {
    "data",
    "assets",
    ".git",
    ".idea",
    ".vscode",
    "node_modules",
    "venv",
    "__pycache__",
    "dist",
    "build",
}

# Конкретные файлы, которые нужно пропустить
EXCLUDE_FILES = {
    "feed.json",
    OUTPUT_FILE,  # сам файл результата тоже пропускаем
    "package-lock.json",
    "yarn.lock",
}

# Расширения файлов, которые собираем
CODE_EXTENSIONS = {
    ".py",
    ".js",
    ".ts",
    ".jsx",
    ".tsx",
    ".html",
    ".css",
    ".scss",
    ".json",
    ".sql",
    ".cpp",
    ".c",
    ".h",
    ".cs",
    ".java",
    ".go",
    ".rs",
    ".php",
    ".sh",
    ".yaml",
    ".yml",
    ".md",
}

count = 0

with open(OUTPUT_FILE, "w", encoding="utf-8") as outfile:
    for root, dirs, files in os.walk("."):
        # Фильтруем папки (убираем data, assets и технические)
        dirs[:] = [d for d in dirs if d.lower() not in EXCLUDE_DIRS]

        for file in files:
            # Пропускаем feed.json и другие исключенные файлы
            if file.lower() in EXCLUDE_FILES:
                continue

            _, ext = os.path.splitext(file)

            # Проверяем расширение
            if ext.lower() in CODE_EXTENSIONS:
                src_path = os.path.join(root, file)
                rel_path = os.path.relpath(src_path, ".")

                # Пишем красивый заголовок с путем к файлу для нейронки
                outfile.write(f"\n\n{'='*60}\n")
                outfile.write(f"FILE: {rel_path}\n")
                outfile.write(f"{'='*60}\n\n")

                try:
                    with open(src_path, "r", encoding="utf-8") as infile:
                        outfile.write(infile.read())
                    print(f" Добавлен: {rel_path}")
                    count += 1
                except UnicodeDecodeError:
                    print(f" Пропущен (не текстовый): {rel_path}")
                except Exception as e:
                    print(f" Ошибка чтения {rel_path}: {e}")

print(f"\nГотово! Собрано файлов: {count}")
print(f"Итоговый файл для нейронки: {OUTPUT_FILE}")