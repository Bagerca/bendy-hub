import time
import subprocess
import sys
import os
from datetime import datetime

LOGS_DIR = "logs"
LOG_FILE = os.path.join(LOGS_DIR, "scraper_session.log")

# Список разработчиков по умолчанию
DEFAULT_DEVS = [
    "Doberart", "themeatly", "m_ZeroLogics", "BLacroix30", 
    "bookpast", "BendyRun", "GentCorporation", "Bendy"
]

def log_msg(msg):
    """Выводит сообщение в консоль и надежно пишет в лог-файл со сбросом буфера"""
    print(msg)
    os.makedirs(LOGS_DIR, exist_ok=True)
    clean_msg = msg.strip().replace('\r', '')
    if not clean_msg:
        return
        
    ts = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    formatted_line = f"{ts} [LOOP] {clean_msg}\n"
    
    try:
        with open(LOG_FILE, "a", encoding="utf-8") as f:
            f.write(formatted_line)
            f.flush()
            os.fsync(f.fileno())
    except Exception as e:
        sys.stderr.write(f"\n[ВНИМАНИЕ] Не удалось записать в лог-файл: {e}\n")

def get_user_choice():
    print("\n" + "="*50)
    print("🛠️ НАСТРОЙКА БЕСКОНЕЧНОГО ПАРСИНГА")
    print("="*50)
    print("0. 🌐 Парсить ВСЕХ разработчиков по очереди (Медленно, но для всех)")
    for i, dev in enumerate(DEFAULT_DEVS, 1):
        print(f"{i}. 🎯 Парсить ТОЛЬКО: @{dev} (Идеально для Машины Времени)")
    
    while True:
        choice = input("\n👉 Выбери номер (0-8) и нажми Enter: ").strip()
        if choice == "" or choice == "0":
            return [] # Пустой массив означает "Парсить всех"
        if choice.isdigit() and 1 <= int(choice) <= len(DEFAULT_DEVS):
            return [DEFAULT_DEVS[int(choice)-1]]
        print("❌ Неверный ввод, попробуй еще раз.")

def run_loop():
    # Запрашиваем у пользователя, кого парсить
    target_devs = get_user_choice()
    
    log_msg("\n" + "★"*50)
    log_msg("🤖 BENDY AUTOPILOT (Бесконечный запуск парсера)")
    if target_devs:
        log_msg(f"🎯 СФОКУСИРОВАННАЯ ЦЕЛЬ: @{target_devs[0]}")
    else:
        log_msg("🌐 ЦЕЛЬ: Базовый режим (Все разработчики)")
    log_msg("Нажми Ctrl+C в любой момент, чтобы остановить.")
    log_msg("★"*50 + "\n")

    runs_count = 0

    while True:
        runs_count += 1
        log_msg(f"\n▶️ ЗАПУСК #{runs_count}...")
        
        try:
            # Если выбран конкретный дев, передаем его как аргумент в скрапер
            cmd = [sys.executable, "scraper.py"] + target_devs
            subprocess.run(cmd)
        except Exception as e:
            log_msg(f"\n❌ Произошла ошибка при запуске scraper.py: {e}")

        log_msg("\n✅ Работа скрапера завершена.")
        
        try:
            # Таймер на 60 секунд
            for i in range(60, 0, -1):
                sys.stdout.write(f"\r⏳ Ожидание... Следующий запуск через {i:02d} сек.  ")
                sys.stdout.flush()
                time.sleep(1)
            
            sys.stdout.write("\r" + " "*50 + "\r")
            sys.stdout.flush()

        except KeyboardInterrupt:
            log_msg("\n🛑 Бесконечный цикл остановлен пользователем. До связи!")
            break

if __name__ == "__main__":
    try:
        run_loop()
    except KeyboardInterrupt:
        log_msg("\n🛑 Бесконечный цикл остановлен пользователем. До связи!")