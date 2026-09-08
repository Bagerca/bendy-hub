import urllib.request
import json
import ssl

ssl._create_default_https_context = ssl._create_unverified_context

# ID твита theMeatly "JUST missed it! lol" из твоей базы
TWEET_ID = "2096313644334121110" 

url = f"https://cdn.syndication.twimg.com/tweet-result?id={TWEET_ID}"

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
}

print(f"Поиск данных для твита: {TWEET_ID}...\n")

try:
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req, timeout=10) as response:
        data = json.loads(response.read().decode('utf-8'))
        
        # Красиво выводим структуру
        print("Текст:", data.get('text'))
        
        if 'quoted_tweet' in data:
            print("\n✅ ЦИТАТА НАЙДЕНА:")
            print("  Автор:", data['quoted_tweet']['user']['screen_name'])
            print("  Текст:", data['quoted_tweet']['text'])
        else:
            print("\n❌ Цитата НЕ найдена в JSON.")
            
except Exception as e:
    print(f"Ошибка запроса: {e}")