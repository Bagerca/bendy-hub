import time
import subprocess
import sys
import os
from datetime import datetime

LOGS_DIR = "logs"
LOG_FILE = os.path.join(LOGS_DIR, "scraper_session.log")

def log_msg(msg):
    """Выводит сообщение в консоль и надежно пишет в лог-файл со сбросом буфера"""
    print(msg)
    os.makedirs(LOGS_DIR, exist_ok=True)
    clean_msg = msg.strip().replace('\r', '')
    if not clean_msg:
        return
        
    ts = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    formatted_line = f"{ts} [LOOP] {clean_msg}\n"
    
    # Пытаемся записать сразу. Если файл заблокирован другой программой, не падаем
    try:
        with open(LOG_FILE, "a", encoding="utf-8") as f:
            f.write(formatted_line)
            f.flush()
            os.fsync(f.fileno()) # Жесткая запись на физический диск
    except Exception as e:
        sys.stderr.write(f"\n[ВНИМАНИЕ] Не удалось записать в лог-файл (возможно открыт в Блокноте): {e}\n")

def run_loop():
    log_msg("\n" + "★"*50)
    log_msg("🤖 BENDY AUTOPILOT (Бесконечный запуск парсера)")
    log_msg("Нажми Ctrl+C в любой момент, чтобы остановить.")
    log_msg("★"*50 + "\n")

    runs_count = 0

    while True:
        runs_count += 1
        log_msg(f"\n▶️ ЗАПУСК #{runs_count}...")
        
        try:
            # Запускаем scraper.py. Все логи scraper.py пишутся напрямую в этот же файл
            subprocess.run([sys.executable, "scraper.py"])
        except Exception as e:
            log_msg(f"\n❌ Произошла ошибка при запуске scraper.py: {e}")

        log_msg("\n✅ Работа скрапера завершена.")
        
        try:
            # Таймер на 60 секунд (отсчет только на консоли, чтобы не мусорить в файл)
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