const express = require('express');
const multer = require('multer');
const path = require('path');
const { createResponse } = require('./utils/response');
const { analyzeWhatsappChat } = require('./services/whatsappAnalyzer');

const app = express();
const port = 3000;

// Sadece .txt dosyalarını kabul eden multer storage ve filter
const storage = multer.memoryStorage();
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ext === '.txt') {
    cb(null, true);
  } else {
    cb(new Error('Sadece .txt dosyaları kabul edilir!'), false);
  }
};
const upload = multer({ storage, fileFilter });

// Ana dizine GET ile erişildiğinde mesaj dönen endpoint
app.get('/', (req, res) => {
  res.json(createResponse({ message: 'Hello World! API çalışıyor.' }));
});

// /analyze endpoint'i
app.post('/analyze', upload.single('file'), (req, res) => {
  // Dosya yoksa veya boşsa hata döndür
  if (!req.file || !req.file.buffer || req.file.size === 0) {
    return res.status(400).json(
      createResponse({
        success: false,
        message: 'Boş dosya yüklenemez!',
        data: null
      })
    );
  }

  const chatText = req.file.buffer.toString('utf-8');
  const analysis = analyzeWhatsappChat(chatText);

  // Dosya boyutunu ve analiz sonuçlarını data olarak döndür
  res.status(200).json(
    createResponse({
      message: 'Dosya başarıyla analiz edildi.',
      data: {
        size: req.file.size,
        ...analysis
      }
    })
  );
});

app.listen(port, () => {
  console.log(`Sunucu http://localhost:${port} adresinde çalışıyor.`);
}); 