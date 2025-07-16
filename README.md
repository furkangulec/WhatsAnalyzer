# WhatsAnalyzer

Bu proje, WhatsApp sohbet dosyalarını analiz etmek için hazırlanmış bir Express.js API'sidir.

## Kurulum

1. Gerekli bağımlılıkları yükleyin:

```
npm install
```

2. Sunucuyu başlatın:

```
npm start
```

## API Kullanımı

### /analyze Endpoint'i

- **Yöntem:** POST
- **Açıklama:** Sadece `.txt` uzantılı WhatsApp sohbet dosyalarını kabul eder.
- **Form Alanı:** `file` (tek bir dosya, .txt olmalı)

#### Örnek cURL isteği

```
curl -X POST -F "file=@sohbet.txt" http://localhost:3000/analyze
```

Şu anda endpoint sadece dosya yüklemesini kabul eder, analiz işlemi daha sonra eklenecektir.

