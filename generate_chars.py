import os
import json

# Словарь персонажей: "id_папки": "Отображаемое Имя"
# Я собрал базу с твоих скриншотов. Можешь добавлять сюда кого угодно.
CHARACTERS = {
    "henry_stein": "Генри Штейн",
    "joey_drew": "Джоуи Дрю",
    "audrey_drew": "Одри Дрю",
    "bendy_ink_demon": "Чернильный Демон",
    "bendy_toon": "Мультяшный Бенди",
    "alice_angel": "Искаженная Алиса",
    "allison_angel": "Ангел Эллисон",
    "boris_wolf": "Волк Борис (Чернильный)",
    "buddy_boris": "Бадди Борис",
    "sammy_lawrence": "Сэмми Лоуренс",
    "tom": "Том",
    "wally_franks": "Уолли Фрэнкс",
    "norman_polk": "Норман Полк",
    "bertram_piedmont": "Бертрам Пидмонт",
    "wilson_arch": "Уилсон Арч",
    "alan_gray": "Алан Грей",
    "angus_newman": "Ангус Ньюман",
    "angela": "Анджела",
    "bendy_animatronic": "Аниматроник Бенди",
    "betty": "Бетти",
    "gladys": "Глэдис",
    "grant_cohen": "Грант Коэн",
    "dale_little": "Дейл Литтл",
    "jacob": "Джейкоб",
    "jack_fain": "Джек Фейн",
    "donaldson": "Дональдсон",
    "dot": "Дот",
    "dave": "Дэйв",
    "daniel_lewek": "Дэниэл Левек",
    "irene_lewek": "Ирена Левек",
    "boris_clones": "Клоны Бориса",
    "constance_gray": "Констанс Грей",
    "lacey_benton": "Лейси Бентон",
    "lenny": "Ленни",
    "linda_stein": "Линда Штейн",
    "lotty": "Лотти",
    "miss_rodriguez": "Мисс Родригес",
    "mrs_panek": "Миссис Панек",
    "mr_anger": "Мистер Ангер",
    "mr_monroe": "Мистер Монро",
    "mr_schwartz": "Мистер Шварц",
    "nathan_arch": "Нэйтан Арч",
    "omally": "О'Мэлли",
    "porter": "Портер",
    "riley_wells": "Райли Уэллс",
    "richie": "Ричи",
    "fish": "Рыба",
    "simmons": "Симмонс",
    "scott": "Скотт",
    "susie_campbell": "Сьюзи Кэмпбелл",
    "sandy_pommela": "Сэнди Поммела",
    "tilly": "Тилли",
    "thomas_connor": "Томас Коннор",
    "wilfred_briar": "Уилфред Брайар",
    "william_chambers": "Уильям Чемберс",
    "frank": "Фрэнк",
    "heidi": "Хайди",
    "shawn_flynn": "Шон Флинн",
    "abby_lambert": "Эбби Ламберт",
    "eckhardt": "Экхарт",
    "emma_lamont": "Эмма Ламонт",
    "andrew": "Эндрю"
}

# Пути к папкам
BASE_CHAR_DIR = os.path.join("assets", "characters")
INDEX_FILE = os.path.join("data", "characters_index.json")

def create_characters():
    print(f"🚀 Запуск генерации персонажей... Всего: {len(CHARACTERS)}\n")
    
    # Убеждаемся, что базовые папки существуют
    os.makedirs(BASE_CHAR_DIR, exist_ok=True)
    os.makedirs("data", exist_ok=True)

    created_count = 0
    updated_count = 0

    for char_id, char_name in CHARACTERS.items():
        char_dir = os.path.join(BASE_CHAR_DIR, char_id)
        os.makedirs(char_dir, exist_ok=True)
        
        json_path = os.path.join(char_dir, "data.json")
        
        # Если файла нет — создаем пустышку
        if not os.path.exists(json_path):
            stub_data = {
                "id": char_id,
                "name": char_name,
                "role": "",
                "status": "Неизвестно",
                "voice_actor": "",
                "meta": {
                    "gender": "",
                    "species": "",
                    "aliases": [],
                    "occupation": ""
                },
                "wiki": {},
                "assets": {}
            }
            
            with open(json_path, "w", encoding="utf-8") as f:
                json.dump(stub_data, f, ensure_ascii=False, indent=4)
            print(f"✅ Создан: {char_name} ({char_id})")
            created_count += 1
        else:
            updated_count += 1

    # Обновляем индексный файл
    all_ids = list(CHARACTERS.keys())
    with open(INDEX_FILE, "w", encoding="utf-8") as f:
        json.dump(all_ids, f, ensure_ascii=False, indent=4)
        
    print(f"\n🎉 Готово!")
    print(f"Создано новых папок: {created_count}")
    print(f"Пропущено (уже существуют): {updated_count}")
    print(f"Файл {INDEX_FILE} успешно обновлен.")

if __name__ == "__main__":
    create_characters()