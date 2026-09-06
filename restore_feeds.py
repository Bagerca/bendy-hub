import os
import shutil

SOURCE_DIR = os.path.join("assets", "developers")
BACKUP_DIR = os.path.join("assets", "developers_backup")

def restore():
    print("\n" + "="*50)
    print("⏪ BENDY RESTORE (Откат к точке восстановления)")
    print("="*50 + "\n")

    if not os.path.exists(BACKUP_DIR):
        print("❌ Ошибка: Папка бэкапа не найдена! Нечего восстанавливать.")
        return
        
    print("🗑️ Удаление текущей поломанной/пустой базы...")
    if os.path.exists(SOURCE_DIR):
        shutil.rmtree(SOURCE_DIR)
        
    print("📦 Восстановление из бэкапа...")
    shutil.copytree(BACKUP_DIR, SOURCE_DIR)
    
    print("\n🎉 Успех! Все посты, медиа и профили возвращены к состоянию до зачистки!")

if __name__ == "__main__":
    restore()