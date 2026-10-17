import os
import re

JS_FILE = 'js/utils/icons.js'
OUT_DIR = 'src_icons'

def main():
    if not os.path.exists(JS_FILE):
        print(f"[-] Ошибка: Файл {JS_FILE} не найден.")
        return

    with open(JS_FILE, 'r', encoding='utf-8') as f:
        content = f.read()

    # Ищем блок const ICONS = { ... };
    icons_match = re.search(r'const\s+ICONS\s*=\s*\{([\s\S]*?)\};', content)
    if not icons_match:
        print("[-] Не удалось найти словарь ICONS в файле.")
        return

    icons_block = icons_match.group(1)

    # Ищем все пары 'имя': 'свг-контент'
    # Регулярка захватывает имя иконки и ее внутренности
    pattern = r"['\"]([\w-]+)['\"]\s*:\s*['\"](.*?)['\"]"
    icons = re.findall(pattern, icons_block)

    if not icons:
        print("[-] Иконки не найдены.")
        return

    # Создаем папку, если ее нет
    os.makedirs(OUT_DIR, exist_ok=True)

    count = 0
    for name, svg_inner in icons:
        # Оборачиваем внутренности в стандартный тег SVG для удобного редактирования
        svg_content = f'<svg viewBox="0 0 24 24">\n    {svg_inner}\n</svg>'
        
        file_path = os.path.join(OUT_DIR, f"{name}.svg")
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(svg_content)
        count += 1

    print(f"[+] Успешно извлечено {count} иконок в папку '{OUT_DIR}/'")

if __name__ == '__main__':
    main()