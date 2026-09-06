import os
import base64

ICONS_DIR = os.path.join("assets", "icons")
OUTPUT_FILE = os.path.join("shared", "js", "icons.js")

def generate_icons():
    print("🚀 Сборка SVG-иконок в оптимизированный JS-модуль...")
    
    if not os.path.exists(ICONS_DIR):
        print(f"❌ Директория с исходниками {ICONS_DIR} не найдена.")
        return

    icons_data = []
    
    for filename in sorted(os.listdir(ICONS_DIR)):
        if filename.endswith(".svg"):
            icon_name = os.path.splitext(filename)[0]
            filepath = os.path.join(ICONS_DIR, filename)
            
            with open(filepath, 'r', encoding='utf-8') as f:
                svg_content = f.read().replace('\n', '').replace('\r', '').strip()
                svg_content = svg_content.replace('`', '\\`')
                
                # Надежное Base64 кодирование для заглушек (чтобы кавычки не ломали HTML атрибуты)
                if icon_name == "avatar_fallback":
                    encoded_svg = base64.b64encode(svg_content.encode('utf-8')).decode('utf-8')
                    svg_content = f"data:image/svg+xml;base64,{encoded_svg}"
                    print(f"  📦 Скомпилирован Base64 data-URI для: {icon_name}")
                
                icons_data.append(f"    {icon_name}: `{svg_content}`")

    js_content = "export const Icons = {\n" + ",\n".join(icons_data) + "\n};\n"
    
    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        f.write(js_content)
        
    print(f"✅ Готово! Собрано иконок: {len(icons_data)} в файл {OUTPUT_FILE}")

if __name__ == "__main__":
    generate_icons()