import os
import json

# Полный список треков
NEW_TRACKS = [
    # === DAGames ===
    {"id": "dagames_gospel_of_dismay", "title": "Gospel of Dismay", "artist": "DAGames", "game": "BATIM", "year": "2017"},
    {"id": "dagames_instruments_of_cyanide", "title": "Instruments of Cyanide", "artist": "DAGames", "game": "BATIM", "year": "2018"},
    {"id": "dagames_are_you_proud_of_me_now", "title": "Are You Proud Of Me Now?", "artist": "DAGames", "game": "BATDR", "year": "2022"},
    {"id": "dagames_build_our_machine_rock", "title": "Build Our Machine (Rock Version)", "artist": "DAGames", "game": "BATIM", "year": "2017"},
    {"id": "dagames_i_am_me", "title": "I Am Me", "artist": "DAGames", "game": "BATIM", "year": "2019"},
    {"id": "dagames_meet_thy_maker", "title": "Meet Thy Maker", "artist": "DAGames", "game": "BATIM", "year": "2018"},
    {"id": "dagames_build_our_mcqueen", "title": "BUILD OUR MCQUEEN (LIFE IS A HIGHWAY REMIX)", "artist": "DAGames", "game": "BATIM", "year": "2023"},

    # === CG5 ===
    {"id": "cg5_masterpiece", "title": "Masterpiece (ft. B-Slick)", "artist": "CG5", "game": "BATIM", "year": "2018"},
    {"id": "cg5_horror_show", "title": "Horror Show", "artist": "CG5", "game": "BATIM", "year": "2018"},
    {"id": "cg5_dagames_children_of_the_machine", "title": "Children of the Machine", "artist": "CG5 × DAGames", "game": "BATIM", "year": "2018"},
    {"id": "cg5_you_will_believe", "title": "You Will Believe [Remix/Cover] (ft. DAGames)", "artist": "CG5", "game": "BATIM", "year": ""},
    {"id": "cg5_projections", "title": "Projections (ft. Dawko)", "artist": "CG5", "game": "BATIM", "year": ""},
    {"id": "cg5_sepiatoned", "title": "Sepiatoned", "artist": "CG5", "game": "BATIM", "year": ""},
    {"id": "cg5_howd_you_hear_me", "title": "How'd You Hear Me (feat. The Stupendium)", "artist": "CG5", "game": "BATIM", "year": ""},
    {"id": "cg5_uncrowned", "title": "Uncrowned (ft. SquigglyDigg, Chi-Chi, DHeusta)", "artist": "CG5", "game": "BATIM", "year": ""},
    {"id": "cg5_clearer", "title": "Clearer", "artist": "CG5", "game": "BATIM", "year": ""},
    {"id": "cg5_can_i_get_an_amen", "title": "Can I Get An Amen", "artist": "CG5", "game": "BATIM", "year": ""},
    {"id": "cg5_absolutely_anything", "title": "Absolutely Anything (feat. OR3O)", "artist": "CG5", "game": "BATIM", "year": ""},
    {"id": "cg5_spotlight", "title": "Spotlight (ft. CK9C)", "artist": "CG5", "game": "BATIM", "year": ""},
    {"id": "cg5_bendy_in_snow_sillies", "title": "Bendy in Snow Sillies (Remix)", "artist": "CG5", "game": "BATIM", "year": ""},

    # === Alicia Michelle ===
    {"id": "alicia_michelle_miracle", "title": "Miracle ft. CG5", "artist": "Alicia Michelle", "game": "BATIM", "year": ""},

    # === JT Music ===
    {"id": "jt_music_cant_be_erased", "title": "Can't Be Erased", "artist": "JT Music", "game": "BATIM", "year": ""},
    {"id": "jt_music_the_details_in_the_devil", "title": "The Details in the Devil", "artist": "JT Music", "game": "BATIM", "year": ""},
    {"id": "jt_music_cant_be_erased_big_band", "title": "Can't Be Erased (Big Band Version)", "artist": "JT Music", "game": "BATIM", "year": ""},

    # === The Stupendium ===
    {"id": "stupendium_art_of_darkness", "title": "Art of Darkness", "artist": "The Stupendium", "game": "BATIM", "year": ""},
    {"id": "stupendium_find_the_keys_remaster", "title": "FIND THE KEYS REMASTER", "artist": "The Stupendium", "game": "BATIM", "year": ""},
    {"id": "stupendium_find_the_keys", "title": "FIND THE KEYS", "artist": "The Stupendium", "game": "BATIM", "year": ""},
    {"id": "stupendium_cells_no_more", "title": "CELLS NO MORE", "artist": "The Stupendium", "game": "BATIM", "year": ""},

    # === MiatriSs ===
    {"id": "miatriss_the_devils_swing", "title": "THE DEVIL'S SWING (ft. Triforcefilms)", "artist": "MiatriSs", "game": "BATIM", "year": ""},
    {"id": "miatriss_gospel_of_dismay", "title": "Gospel of Dismay (ft. Triforcefilms)", "artist": "MiatriSs", "game": "BATIM", "year": ""},
    {"id": "miatriss_build_our_machine", "title": "Build Our Machine (ft. Triforcefilms)", "artist": "MiatriSs", "game": "BATIM", "year": ""},

    # === Flint 4K ===
    {"id": "flint_4k_makeshift_creations", "title": "MAKESHIFT CREATIONS (ft. Swiblet & SquigglyDigg)", "artist": "Flint 4K", "game": "BATIM", "year": ""},

    # === Radiant Records ===
    {"id": "radiant_records_build_our_machine_ru", "title": "Build Our Machine (RU Cover)", "artist": "Radiant Records", "game": "BATIM", "year": ""},
    {"id": "radiant_records_bend_you_till_you_break_ru", "title": "Bend You Till You Break (RU Cover)", "artist": "Radiant Records", "game": "BATIM", "year": ""},
    {"id": "radiant_records_gospel_of_dismay_ru", "title": "Gospel of Dismay (RU Cover)", "artist": "Radiant Records", "game": "BATIM", "year": ""},
    {"id": "radiant_records_build_our_machine_remix_ru", "title": "Build Our Machine REMIX (RU Cover)", "artist": "Radiant Records", "game": "BATIM", "year": ""},
    {"id": "radiant_records_bend_you_till_you_break_remix_ru", "title": "Bend You Till You Break REMIX (RU Cover)", "artist": "Radiant Records", "game": "BATIM", "year": ""},
    {"id": "radiant_records_bend_you_till_you_break_remix", "title": "Bend You Till You Break REMIX", "artist": "Radiant Records", "game": "BATIM", "year": ""},

    # === The Living Tombstone ===
    {"id": "tlt_bendy_and_the_ink_machine", "title": "Bendy and the Ink Machine (feat. Dagames & Kyle Allen Music)", "artist": "The Living Tombstone", "game": "BATIM", "year": ""},

    # === Kyle Allen Music ===
    {"id": "kyle_allen_inkwell_dreams", "title": "Inkwell Dreams", "artist": "Kyle Allen Music", "game": "BATIM", "year": ""},
    {"id": "kyle_allen_bendy_beats", "title": "Bendy Beats", "artist": "Kyle Allen Music", "game": "BATIM", "year": ""},
    {"id": "kyle_allen_lost_in_the_studio", "title": "Lost in the Studio", "artist": "Kyle Allen Music", "game": "BATIM", "year": ""},
    {"id": "kyle_allen_art_of_darkness_remix", "title": "Art of Darkness Remix", "artist": "Kyle Allen Music", "game": "BATIM", "year": ""},
    {"id": "kyle_allen_final_bow", "title": "Final Bow", "artist": "Kyle Allen Music", "game": "BATIM", "year": ""},
    {"id": "kyle_allen_bendyland", "title": "Bendyland (feat. The Stupendium & Elsie Lovelock)", "artist": "Kyle Allen Music", "game": "BATIM", "year": ""},
    {"id": "kyle_allen_recording_town_remix", "title": "Recording Town Remix", "artist": "Kyle Allen Music", "game": "BATIM", "year": ""},
    {"id": "kyle_allen_escape_the_nightmare", "title": "Escape the Nightmare", "artist": "Kyle Allen Music", "game": "BATIM", "year": ""},
    {"id": "kyle_allen_happy_birthday_bendy", "title": "Happy Birthday Bendy", "artist": "Kyle Allen Music", "game": "BATIM", "year": ""},
    {"id": "kyle_allen_flow_the_ink", "title": "Flow The Ink", "artist": "Kyle Allen Music", "game": "BATIM", "year": ""},
    {"id": "kyle_allen_recording_town", "title": "Recording Town", "artist": "Kyle Allen Music", "game": "BATIM", "year": ""},

    # === OR3O ===
    {"id": "or3o_all_eyes_on_me", "title": "All Eyes On Me", "artist": "OR3O", "game": "BATIM", "year": ""},
    {"id": "or3o_build_our_machine_cover", "title": "Build Our Machine (Cover)", "artist": "OR3O", "game": "BATIM", "year": ""},
    {"id": "or3o_liar", "title": "Liar", "artist": "OR3O", "game": "BATIM", "year": ""},
    {"id": "or3o_bendys_tale", "title": "BENDY'S TALE (UNDERTALE X BATIM)", "artist": "OR3O", "game": "BATIM", "year": ""},
    {"id": "or3o_give_up_every_soul", "title": "Give up Every Soul (BATIM X UNDERTALE)", "artist": "OR3O", "game": "BATIM", "year": ""},
    {"id": "or3o_the_devils_swing_cover", "title": "THE DEVILS SWING (COVER ft. Musical Ghost)", "artist": "OR3O", "game": "BATIM", "year": ""},
    {"id": "or3o_can_i_get_an_amen_cover", "title": "Can I Get An Amen (COVER)", "artist": "OR3O", "game": "BATIM", "year": ""},
    {"id": "or3o_welcome_home_cover", "title": "Welcome Home (Electro Swing Cover)", "artist": "OR3O", "game": "BATIM", "year": ""}
]

BASE_MUSIC_DIR = os.path.join("assets", "music")
INDEX_FILE = os.path.join("data", "music_index.json")

def generate_music():
    print("🚀 Запуск генерации музыкальной библиотеки...\n")

    os.makedirs(BASE_MUSIC_DIR, exist_ok=True)
    os.makedirs("data", exist_ok=True)

    # 1. Загружаем существующий индекс
    existing_index = []
    if os.path.exists(INDEX_FILE):
        try:
            with open(INDEX_FILE, "r", encoding="utf-8") as f:
                existing_index = json.load(f)
        except json.JSONDecodeError:
            pass

    created_count = 0
    updated_count = 0

    # 2. Создаем папки и JSON'ы для новых треков
    for track in NEW_TRACKS:
        track_id = track["id"]
        track_dir = os.path.join(BASE_MUSIC_DIR, track_id)
        os.makedirs(track_dir, exist_ok=True)
        
        json_path = os.path.join(track_dir, "data.json")
        
        # Данные по умолчанию
        track_data = {
            "id": track_id,
            "title": track["title"],
            "artist": track["artist"],
            "type": "fan_song",
            "game": track["game"],
            "year": track["year"],
            "cover": "cover.jpg",
            "audio": "audio.mp3",
            "youtubeUrl": "",
            "lyrics": {
                "original": "Текст песни пока не добавлен...",
                "translation": "Перевод появится позже..."
            }
        }

        # Если файла нет — создаем
        if not os.path.exists(json_path):
            with open(json_path, "w", encoding="utf-8") as f:
                json.dump(track_data, f, ensure_ascii=False, indent=4)
            print(f"✅ Создан трек: {track['title']} ({track_id})")
            created_count += 1
        else:
            updated_count += 1

        # Добавляем в индекс (исключая дубликаты)
        if track_id not in existing_index:
            existing_index.append(track_id)

    # 3. Сохраняем обновленный индекс
    with open(INDEX_FILE, "w", encoding="utf-8") as f:
        json.dump(existing_index, f, ensure_ascii=False, indent=4)

    print(f"\n🎉 Готово!")
    print(f"Создано новых папок: {created_count}")
    print(f"Пропущено (уже существуют): {updated_count}")
    print(f"Всего треков в индексе: {len(existing_index)}")
    print(f"Файл {INDEX_FILE} успешно обновлен.")

if __name__ == "__main__":
    generate_music()