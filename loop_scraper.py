import time
import subprocess
import sys

def run_loop():
    print("\n" + "★"*50)
    print("🤖 BENDY AUTOPILOT (Бесконечный запуск парсера)")
    print("Нажми Ctrl+C в любой момент, чтобы остановить.")
    print("★"*50 + "\n")

    runs_count = 0

    while True:
        runs_count += 1
        print(f"\n▶️ ЗАПУСК #{runs_count}...")
        
        try:
            # Запускаем scraper.py используя тот же Python-интерпретатор
            subprocess.run([sys.executable, "scraper.py"])
        except Exception as e:
            print(f"\n❌ Произошла ошибка при запуске scraper.py: {e}")

        print("\n✅ Работа скрапера завершена.")
        
        try:
            # Таймер на 60 секунд (с визуальным отсчетом на одной строке)
            for i in range(60, 0, -1):
                sys.stdout.write(f"\r⏳ Ожидание... Следующий запуск через {i:02d} сек.  ")
                sys.stdout.flush()
                time.sleep(1)
            
            # Очищаем строку перед новым запуском
            sys.stdout.write("\r" + " "*50 + "\r")
            sys.stdout.flush()

        except KeyboardInterrupt:
            print("\n\n🛑 Бесконечный цикл остановлен пользователем. До связи!")
            break

if __name__ == "__main__":
    try:
        run_loop()
    except KeyboardInterrupt:
        print("\n\n🛑 Бесконечный цикл остановлен пользователем. До связи!")