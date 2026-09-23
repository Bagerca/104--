import os
import time
from datetime import datetime

# Настройки сборщика
OUTPUT_FILE = "PROJECT_CODE.txt"
ALLOWED_EXTENSIONS = {".html", ".css", ".js", ".json", ".svg"}
IGNORED_DIRS = {".git", "node_modules", ".idea", ".vscode", "__pycache__"}
IGNORED_FILES = {OUTPUT_FILE, "pack.py", "pack.js"}

def bundle_project():
    print("🚀 Начинаю сборку всех файлов проекта на Python...\n")
    start_time = time.time()

    root_dir = os.path.dirname(os.path.abspath(__file__))
    output_path = os.path.join(root_dir, OUTPUT_FILE)

    file_count = 0
    total_lines = 0

    with open(output_path, "w", encoding="utf-8") as out:
        # Шапка итогового файла
        out.write("=" * 80 + "\n")
        out.write("  ПОЛНЫЙ СБОРНИК КОДА ПРОЕКТА: STUDENT HUB (104к)\n")
        out.write(f"  Дата сборки: {datetime.now().strftime('%d.%m.%Y %H:%M:%S')}\n")
        out.write("=" * 80 + "\n\n")

        # Рекурсивный обход всех папок
        for dirpath, dirnames, filenames in os.walk(root_dir):
            # Пропускаем служебные папки
            dirnames[:] = [d for d in dirnames if d not in IGNORED_DIRS]

            for filename in filenames:
                if filename in IGNORED_FILES:
                    continue

                _, ext = os.path.splitext(filename)
                if ext.lower() in ALLOWED_EXTENSIONS:
                    full_path = os.path.join(dirpath, filename)
                    rel_path = os.path.relpath(full_path, root_dir).replace("\\", "/")

                    try:
                        with open(full_path, "r", encoding="utf-8", errors="replace") as f:
                            content = f.read()
                            lines = content.count("\n") + (1 if content else 0)

                        # Запись разделителя файла
                        out.write("\n")
                        out.write("/* " + "=" * 69 + "\n")
                        out.write(f"   FILE: {rel_path}\n")
                        out.write(f"   LINES: {lines}\n")
                        out.write("=" * 69 + " */\n\n")
                        out.write(content)
                        out.write("\n")

                        print(f"  ✓ Добавлен: {rel_path} ({lines} строк)")
                        file_count += 1
                        total_lines += lines
                    except Exception as e:
                        print(f"  ✗ Ошибка чтения {rel_path}: {e}")

    duration = int((time.time() - start_time) * 1000)
    print("\n" + "=" * 54)
    print(f"🎉 Готово за {duration} мс!")
    print(f"📦 Упаковано файлов: {file_count}")
    print(f"📝 Всего строк кода: {total_lines}")
    print(f"📄 Результат сохранен в: {OUTPUT_FILE}")
    print("=" * 54)

if __name__ == "__main__":
    bundle_project()