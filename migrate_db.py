import os
import json
import shutil

CHAR_DIR = os.path.join("assets", "characters")
CATALOG_DIR = os.path.join("assets", "catalog")
RECORDS_DIR = os.path.join("assets", "records")

# 1. КОНФИГ СЛИЯНИЯ ПЕРСОНАЖЕЙ
MERGE_CONFIG = {
    "alice_angel": {
        "base_name": "Алиса Ангел",
        "sources": [
            {"id": "susie_campbell", "label": "Сьюзи Кэмпбелл (Актриса)"},
            {"id": "alice_angel", "label": "Искаженная Алиса"}
        ]
    },
    "allison_angel": {
        "base_name": "Ангел Эллисон",
        "sources": [
            {"id": "allison_angel", "label": "Ангел Эллисон (Мультяшка)"}
        ]
    },
    "boris_wolf": {
        "base_name": "Волк Борис",
        "sources": [
            {"id": "daniel_lewek", "label": "Бадди Левек (Человек)"},
            {"id": "boris_wolf", "label": "Волк Борис (Оригинал)"},
            {"id": "buddy_boris", "label": "Бадди Борис (BATDS)"},
            {"id": "boris_clones", "label": "Клоны Бориса"}
        ]
    },
    "thomas_connor": {
        "base_name": "Томас Коннор",
        "sources": [
            {"id": "thomas_connor", "label": "Томас Коннор (Инженер)"},
            {"id": "tom", "label": "Том (Искаженный)"}
        ]
    },
    "audrey_drew": {
        "base_name": "Одри Дрю",
        "sources": [
            {"id": "audrey_drew", "label": "Одри (Человек)"},
            # Виртуальный исходник (сделаем дубликат из самой Одри)
            {"id": "audrey_drew_toon", "label": "Одри (Мультяшка)"}
        ]
    }
}

# Маппинг для замены старых ID в каталоге
ID_REPLACEMENTS = {
    "susie_campbell": "alice_angel",
    "daniel_lewek": "boris_wolf",
    "buddy_boris": "boris_wolf",
    "boris_clones": "boris_wolf",
    "tom": "thomas_connor"
}

# 2. НОВЫЕ ПЕРСОНАЖИ (Кого не было в базе, но есть в лоре)
NEW_CHARACTERS = [
    {"id": "allison_pendle", "name": "Эллисон Пэндл"},
    {"id": "tessa_arch", "name": "Тесса Арч"},
    {"id": "milla_legna", "name": "Милла Легна"},
    {"id": "bill_danton", "name": "Билл Дантон"},
    {"id": "phil_clark", "name": "Фил Кларк"},
    {"id": "jane_todd", "name": "Джейн Тодд"},
    {"id": "lance_derby", "name": "Лэнс Дёрби"},
    {"id": "hank_scott", "name": "Хэнк Скотт"},
    {"id": "kitty_thompson", "name": "Китти Томпсон"},
    {"id": "steve_mcgregor", "name": "Стив МакГрегор"},
    {"id": "archie_carter", "name": "Арчи Картер"},
    {"id": "grace_conway", "name": "Грейс Конвей"},
    {"id": "kay_lee", "name": "Кей Ли"},
    {"id": "telly_wester", "name": "Телли Вестер"},
    {"id": "sally_newt", "name": "Салли Ньют"},
    {"id": "hudson_doyle", "name": "Хадсон Дойл"},
    {"id": "chef_buck", "name": "Шеф Бак"},
    {"id": "andre", "name": "Андре"},
    {"id": "munsey_dunn", "name": "Манси Данн"},
    {"id": "eugene_lloyd", "name": "Юджин Ллойд"},
    {"id": "karl", "name": "Карл"},
    {"id": "bud_lewis", "name": "Бад Льюис"},
    {"id": "pete", "name": "Пит"},
    {"id": "keepers", "name": "Хранители"},
    {"id": "king_widow", "name": "Король-Вдовец"},
    {"id": "ink_widows", "name": "Чернильные Вдовы"},
    {"id": "lord_amok", "name": "Лорд Амок"},
    {"id": "the_lurker", "name": "Скрытень / Стив"},
    {"id": "shipahoy_dudley", "name": "Шипахой Дадли"},
    {"id": "crackle_crab", "name": "Крабик Кракл"},
    {"id": "sinny", "name": "Синни"},
    {"id": "harold_fish", "name": "Гарольд"},
    {"id": "carley", "name": "Карли / Слайсер"}
]

# 3. МАППИНГ ИМЕН ИЗ АРХИВОВ К ID ПЕРСОНАЖЕЙ
AUTHOR_MAP = {
    "Нэйтан Арч": "nathan_arch",
    "Уилсон": "wilson_arch",
    "Хранители": "keepers",
    "Шон Флинн": "shawn_flynn",
    "Грант Коэн": "grant_cohen",
    "Джек Фейн": "jack_fain",
    "Джек": "jack_fain",
    "Уолли Фрэнкс": "wally_franks",
    "Уолли": "wally_franks",
    "Ангус Ньюмен": "angus_newman",
    "Дейл Литтл": "dale_little",
    "Кей Ли": "kay_lee",
    "Билл Дантон": "bill_danton",
    "Фил Кларк": "phil_clark",
    "Джейн Тодд": "jane_todd",
    "Лэнс Дёрби": "lance_derby",
    "Хэнк Скотт": "hank_scott",
    "Китти Томпсон": "kitty_thompson",
    "Стив МакГрегор": "steve_mcgregor",
    "Арчи Картер": "archie_carter",
    "Грейс Конвей": "grace_conway",
    "Сэмми Лоуренс": "sammy_lawrence",
    "Томас Коннор": "thomas_connor",
    "Томас": "thomas_connor",
    "Джоуи Дрю": "joey_drew",
    "Элис Энджел": "alice_angel",
    "Сьюзи Кэмпбелл": "alice_angel", 
    "Друг (Эллисон)": "allison_angel",
    "Алан Грей": "alan_gray",
    "Телли Вестер": "telly_wester",
    "Салли Ньют": "sally_newt",
    "Хадсон Дойл": "hudson_doyle",
    "Шеф Бак": "chef_buck",
    "Манси Данн": "munsey_dunn",
    "Юджин Ллойд": "eugene_lloyd",
    "Норман": "norman_polk",
    "Милла Легна": "milla_legna",
    "Эмма Ламонт": "emma_lamont",
    "Неизвестный (Уилсон)": "wilson_arch",
    "Покровитель (Потерянный)": "lost_ones",
    "Бертрум Пьидмонт": "bertram_piedmont",
    "Потерянные": "lost_ones"
}

def load_json(path):
    if not os.path.exists(path): return {}
    with open(path, 'r', encoding='utf-8') as f:
        try: return json.load(f)
        except: return {}

def save_json(path, data):
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=4)

def delete_unwanted():
    print("🗑️ Удаление мусорных персонажей...")
    path = os.path.join(CHAR_DIR, "bendy_animatronic")
    if os.path.exists(path):
        shutil.rmtree(path)
        print("  ❌ Аниматроник Бенди удален.")

def merge_characters():
    print("\n🧬 Слияние персонажей (Entity Dossiers)...")
    for target_id, conf in MERGE_CONFIG.items():
        target_dir = os.path.join(CHAR_DIR, target_id)
        os.makedirs(target_dir, exist_ok=True)
        target_json = os.path.join(target_dir, "data.json")
        
        main_data = load_json(target_json)
        if not main_data:
            main_data = {"id": target_id, "name": conf["base_name"], "meta": {}, "wiki": {}, "versions": []}
            
        main_data["name"] = conf["base_name"]
        
        # Если versions уже созданы, очистим их для чистой перезаписи
        main_data["versions"] = []

        for source in conf["sources"]:
            src_id = source["id"]
            
            # Хак для виртуальных версий (Одри мультяшка, Эллисон человек)
            if src_id == "audrey_drew_toon":
                src_data = main_data.copy()
            else:
                src_dir = os.path.join(CHAR_DIR, src_id)
                src_data = load_json(os.path.join(src_dir, "data.json"))
            
            if src_data:
                version_obj = {
                    "label": source["label"],
                    "assets": src_data.get("assets", {}),
                    "meta": src_data.get("meta", {}),
                    "quote": src_data.get("quote", "...")
                }
                main_data["versions"].append(version_obj)
                print(f"  ✔️ Версия '{source['label']}' добавлена в {target_id}")

            # Удаляем старую папку-донор
            if src_id != target_id and src_id not in ["audrey_drew_toon", "allison_pendle"] and os.path.exists(src_dir):
                shutil.rmtree(src_dir)
                print(f"  ❌ Старая папка {src_id} удалена.")

        save_json(target_json, main_data)

def create_missing_characters():
    print("\n📝 Создание новых персонажей из лора...")
    for char in NEW_CHARACTERS:
        char_dir = os.path.join(CHAR_DIR, char["id"])
        if not os.path.exists(char_dir):
            os.makedirs(char_dir, exist_ok=True)
            data = {
                "id": char["id"],
                "name": char["name"],
                "role": "...",
                "status": "Неизвестно",
                "quote": "...",
                "voice_actor": "...",
                "meta": { "aliases": [], "species": "...", "gender": "...", "occupation": "...", "affiliation": "..." },
                "versions": [],
                "wiki": { "appearance": "...", "personality": "...", "history": [], "trivia": [] },
                "assets": { "avatar": "avatar.jpg", "full_body": "full_body.png" }
            }
            save_json(os.path.join(char_dir, "data.json"), data)
            print(f"  ➕ Создан: {char['name']}")

def update_catalog():
    print("\n🔄 Обновление зависимостей в каталоге игр...")
    for folder in os.listdir(CATALOG_DIR):
        json_path = os.path.join(CATALOG_DIR, folder, "data.json")
        if not os.path.exists(json_path): continue
        
        data = load_json(json_path)
        if "wiki" in data and "characters" in data["wiki"]:
            old_list = data["wiki"]["characters"]
            new_list = []
            for char_id in old_list:
                # Меняем старый ID на новый, если он есть в словаре
                mapped_id = ID_REPLACEMENTS.get(char_id, char_id)
                new_list.append(mapped_id)
            
            # Убираем дубликаты (например, если в игре были и Бадди, и Клоны, они оба станут boris_wolf)
            data["wiki"]["characters"] = list(set(new_list))
            save_json(json_path, data)
    print("  ✔️ Все проекты обновлены.")

def update_records():
    print("\n🔗 Привязка авторов к аудио и запискам...")
    for folder in os.listdir(RECORDS_DIR):
        json_path = os.path.join(RECORDS_DIR, folder, "data.json")
        if not os.path.exists(json_path): continue
        
        data = load_json(json_path)
        if "items" in data:
            linked_count = 0
            for item in data["items"]:
                author_name = item.get("author", "")
                # Находим ID по имени
                author_id = AUTHOR_MAP.get(author_name, None)
                item["authorId"] = author_id
                if author_id: linked_count += 1
                
            save_json(json_path, data)
            print(f"  ✔️ {folder}: привязано {linked_count}/{len(data['items'])} записей.")

if __name__ == "__main__":
    print("🚀 СТАРТ МИГРАЦИИ БАЗЫ ДАННЫХ BENDY HUB\n" + "="*50)
    
    delete_unwanted()
    create_missing_characters()
    merge_characters()
    update_catalog()
    update_records()
    
    print("\n" + "="*50 + "\n✅ МИГРАЦИЯ УСПЕШНО ЗАВЕРШЕНА!")
    print("Обязательно запустите 'python build_indexes.py' для пересборки кэша.")