import os
import re

SRC_DIR = "src_icons"
OUT_FILE = "js/utils/icons.js"

# Шаблон будущего JS файла
JS_TEMPLATE = """/* =====================================================================
   FILE: js/utils/icons.js
   АВТОГЕНЕРАЦИЯ: Файл собран скриптом build_icons.py
   Не редактируйте этот файл вручную! Меняйте .svg в папке src_icons/
===================================================================== */

const ICONS = {
{icons_dict}
};

export const getIcon = (name, options = {}) => {
    const iconContent = ICONS[name] || ICONS['nav-schedule'];
    const size = options.size || 24;
    const className = options.className ? `class="${options.className}"` : '';
    const color = options.color || 'currentColor';
    const strokeWidth = options.strokeWidth || 2;

    return `
        <svg ${className} width="${size}" height="${size}" viewBox="0 0 24 24" 
             fill="none" stroke="${color}" stroke-width="${strokeWidth}" 
             stroke-linecap="round" stroke-linejoin="round">
            ${iconContent}
        </svg>
    `.trim();
};
"""

def main():
    # Этап 1: Авто-распаковка (если папки нет)
    if not os.path.exists(SRC_DIR):
        os.makedirs(SRC_DIR)
        print(f"📁 Создана папка {SRC_DIR}/.")
        
        if os.path.exists(OUT_FILE):
            print("🔄 Извлекаю иконки из старого icons.js...")
            with open(OUT_FILE, 'r', encoding='utf-8') as f:
                content = f.read()
                # Ищем ключи и содержимое SVG путей
                matches = re.findall(r"'([^']+)':\s*'(<[^>]+>.*?)',?", content)
                for name, svg_inner in matches:
                    with open(os.path.join(SRC_DIR, f"{name}.svg"), 'w', encoding='utf-8') as svg_file:
                        svg_file.write(f'<svg viewBox="0 0 24 24">\n    {svg_inner}\n</svg>')
            print("✅ Иконки успешно извлечены! Теперь вы можете редактировать их в папке src_icons/.")
            print("Запустите скрипт еще раз, чтобы собрать новый icons.js")
        return

    # Этап 2: Сборка из папки в icons.js
    icons = []
    for filename in os.listdir(SRC_DIR):
        if filename.endswith(".svg"):
            name = filename[:-4]
            with open(os.path.join(SRC_DIR, filename), 'r', encoding='utf-8') as f:
                svg_content = f.read()
            
            # Вырезаем всё, что внутри <svg> ... </svg>
            match = re.search(r'<svg[^>]*>(.*?)</svg>', svg_content, re.IGNORECASE | re.DOTALL)
            if match:
                inner_content = match.group(1).strip()
            else:
                inner_content = svg_content.strip() # Если тега нет, берем как есть
            
            # Убираем лишние пробелы и переносы строк для минификации
            inner_content = re.sub(r'\s+', ' ', inner_content)
            icons.append(f"    '{name}': '{inner_content}'")

    if not icons:
        print(f"⚠️ Папка {SRC_DIR} пуста. Добавьте туда .svg файлы.")
        return

    icons_dict_str = ",\n".join(icons)
    final_js = JS_TEMPLATE.replace("{icons_dict}", icons_dict_str)

    with open(OUT_FILE, 'w', encoding='utf-8') as f:
        f.write(final_js)

    print(f"🚀 Сборка завершена! Собрано {len(icons)} иконок в {OUT_FILE}")

if __name__ == "__main__":
    main()