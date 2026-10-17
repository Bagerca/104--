import os
import re

SRC_DIR = 'src_icons'
OUT_FILE = 'js/utils/icons.js'

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
    if not os.path.exists(SRC_DIR):
        print(f"[-] Ошибка: Папка {SRC_DIR} не найдена. Создайте её и добавьте .svg файлы.")
        return

    icons_data = []
    
    # Перебираем все SVG файлы в папке
    for filename in sorted(os.listdir(SRC_DIR)):
        if filename.endswith('.svg'):
            name = filename[:-4] # Убираем .svg
            filepath = os.path.join(SRC_DIR, filename)
            
            with open(filepath, 'r', encoding='utf-8') as f:
                raw_svg = f.read()
                
            # Ищем всё, что находится ВНУТРИ тега <svg> ... </svg>
            match = re.search(r'<svg[^>]*>([\s\S]*?)</svg>', raw_svg, re.IGNORECASE)
            if match:
                inner_content = match.group(1)
                # Очищаем от переносов строк и лишних пробелов, чтобы была одна строка
                clean_content = re.sub(r'\s+', ' ', inner_content).strip()
                # Экранируем одинарные кавычки, если они есть
                clean_content = clean_content.replace("'", "\\'")
                
                icons_data.append(f"    '{name}': '{clean_content}'")
            else:
                print(f"[!] Предупреждение: Не удалось распарсить {filename}")

    if not icons_data:
        print("[-] Нет валидных иконок для сборки.")
        return

    # Собираем словарь
    icons_dict_str = ",\n".join(icons_data)
    final_js = JS_TEMPLATE.replace('{icons_dict}', icons_dict_str)

    # Записываем в файл
    os.makedirs(os.path.dirname(OUT_FILE), exist_ok=True)
    with open(OUT_FILE, 'w', encoding='utf-8') as f:
        f.write(final_js)

    print(f"[+] Сборка завершена! Упаковано {len(icons_data)} иконок в '{OUT_FILE}'")

if __name__ == '__main__':
    main()