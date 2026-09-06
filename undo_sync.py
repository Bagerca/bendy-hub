import os
import json

DEVS_DIR = os.path.join("assets", "developers")

# Папки, которые мы хотим откатить
TARGET_FOLDERS = ["bendyrun"]

def undo_sync():
    print("⏪ Откат синхронизации для BendyRun и Doberart...\n")

    for folder in TARGET_FOLDERS:
        feed_path = os.path.join(DEVS_DIR, folder, "feed.json")
        if not os.path.exists(feed_path):
            continue

        with open(feed_path, 'r', encoding='utf-8') as f:
            posts = json.load(f)

        changed = False
        for post in posts:
            content = post.get('content', '')
            
            # Если это те самые посты из лога, обнуляем их картинки
            if "Yikes" in content or "Uh oh. Run" in content or "We’re listening!" in content or "TOMORROW on YOUR phone" in content or "Get ready! Bendy’s Nightmare Run" in content:
                if post.get('mediaUrl') is not None:
                    post['mediaUrl'] = None
                    post['referenceType'] = ""
                    post['referenceUrl'] = ""
                    post['referenceAuthor'] = ""
                    changed = True

        if changed:
            with open(feed_path, 'w', encoding='utf-8') as f:
                json.dump(posts, f, ensure_ascii=False, indent=2)
            print(f"✅ @{folder} успешно откачен к исходному состоянию!")
        else:
            print(f"✔️ @{folder} не нуждается в откате.")

if __name__ == "__main__":
    undo_sync()