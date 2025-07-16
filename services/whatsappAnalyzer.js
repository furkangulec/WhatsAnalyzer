function isSystemMessage(line) {
  // Sistem mesajı veya medya/çıkartma/konum gibi otomatik mesajlar
  const systemKeywords = [
    '‎Çıkartma dahil edilmedi',
    '‎Konum:',
    '‎Mesajlar ve aramalar uçtan uca şifrelidir',
    '‎Bu mesaj silindi',
    '‎Görsel dahil edilmedi',
    '‎Sesli mesaj dahil edilmedi',
    '‎Video dahil edilmedi',
    '‎Belge dahil edilmedi',
    '‎Kişi kartviziti dahil edilmedi',
    '‎Grup oluşturuldu',
    '‎Grup adı değiştirildi',
    '‎Grup resmi değiştirildi',
    '‎Gruba eklendi',
    '‎Grup daveti',
    '‎Sohbetinize katıldı',
    '‎Sohbetten ayrıldı',
    '‎Sohbetten çıkarıldı',
    '‎Gizli numara',
    '‎Numara değiştirildi',
    '‎Arama',
    '‎Mesaj iletildi',
    '‎Mesaj sabitlendi',
    '‎Mesaj sabitlemesi kaldırıldı',
    '‎Mesajlar ve aramalar uçtan uca şifrelidir',
    '‎', // Bazı sistem mesajları sadece gizli karakterle başlar
  ];
  return systemKeywords.some(keyword => line.includes(keyword));
}

function parseUserFromLine(line) {
  // Sadece satırda tarih ve saatten sonra gelen ilk ':' karakterine kadar olan kısmı kullanıcı adı olarak al
  const match = line.match(/^\[\d{1,2}\.\d{1,2}\.\d{4} \d{2}:\d{2}:\d{2}\] ([^:]+):/);
  if (match && match[1]) {
    const user = match[1].trim();
    if (!user || user.length < 1) return null;
    return user;
  }
  return null;
}

function getTotalMessageCount(parsedChat) {
  let total = 0;
  for (const user in parsedChat) {
    total += Object.keys(parsedChat[user]).length;
  }
  return total;
}

function getMessageCountByUser(parsedChat) {
  const userCounts = {};
  for (const user in parsedChat) {
    userCounts[user] = Object.keys(parsedChat[user]).length;
  }
  return userCounts;
}

function getMostActiveHours(parsedChat) {
  const hourCounts = {};

  for (const user in parsedChat) {
    for (const timestamp in parsedChat[user]) {
      // ISO tarih formatında saat kısmını alıyoruz: "2025-07-16T12:00:00" -> "12"
      const hour = timestamp.slice(11, 13);

      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    }
  }

  // En çok mesaj atılan saatleri bul
  let max = 0;
  let mostActive = [];

  for (const [hour, count] of Object.entries(hourCounts)) {
    if (count > max) {
      max = count;
      mostActive = [hour];
    } else if (count === max) {
      mostActive.push(hour);
    }
  }

  return {
    hourCounts,
    mostActiveHours: mostActive,
    maxMessageCount: max
  };
}


function getTopWords(parsedChat, topN = 20) {
  let allText = '';

  // Tüm kullanıcıların tüm mesajlarını birleştir
  for (const user in parsedChat) {
    for (const timestamp in parsedChat[user]) {
      allText += ' ' + parsedChat[user][timestamp];
    }
  }

  // Noktalama işaretlerini ve sayıları temizle, küçük harfe çevir
  allText = allText.toLowerCase().replace(/[^a-zçğıöşü0-9\s]/g, ' ');

  // Kelimelere ayır, 3 karakterden kısa kelimeleri filtrele
  const words = allText.split(/\s+/).filter(w => w.length > 2);

  const freq = {};
  for (const word of words) {
    freq[word] = (freq[word] || 0) + 1;
  }

  // En çok geçen topN kelimeyi sırala
  const sorted = Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN);

  return sorted.map(([word, count]) => ({ word, count }));
}

const skinToneModifiers = [
  '\u{1F3FB}', // 🏻
  '\u{1F3FC}', // 🏼
  '\u{1F3FD}', // 🏽
  '\u{1F3FE}', // 🏾
  '\u{1F3FF}', // 🏿
];

function getTopEmojis(parsedChat, topN = 20) {
  const emojiRegex = /(\p{Emoji_Presentation}|\p{Emoji}\uFE0F)/gu;
  const emojiCounts = {};

  for (const user in parsedChat) {
    for (const timestamp in parsedChat[user]) {
      const message = parsedChat[user][timestamp];
      const emojis = message.match(emojiRegex);
      if (emojis) {
        for (let emoji of emojis) {
          // Eğer emoji bir skin tone modifier ise atla
          if (skinToneModifiers.includes(emoji)) continue;
          emojiCounts[emoji] = (emojiCounts[emoji] || 0) + 1;
        }
      }
    }
  }

  const sorted = Object.entries(emojiCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN);

  return sorted.map(([emoji, count]) => ({ emoji, count }));
}


function getTopPhrases(parsedChat, minN = 2, maxN = 7, topN = 20) {
  let allText = '';

  // Tüm kullanıcıların tüm mesajlarını birleştir
  for (const user in parsedChat) {
    for (const timestamp in parsedChat[user]) {
      allText += ' ' + parsedChat[user][timestamp];
    }
  }

  // Noktalama işaretlerini ve sayıları temizle, küçük harfe çevir
  allText = allText.toLowerCase().replace(/[^a-zçğıöşü0-9\s]/g, ' ');

  const words = allText.split(/\s+/).filter(w => w.length > 2);

  const phraseCounts = {};

  for (let n = minN; n <= maxN; n++) {
    for (let i = 0; i <= words.length - n; i++) {
      const phrase = words.slice(i, i + n).join(' ');
      phraseCounts[phrase] = (phraseCounts[phrase] || 0) + 1;
    }
  }

  // Sadece 2'den fazla tekrar edenleri al
  const filtered = Object.entries(phraseCounts).filter(([_, count]) => count > 2);

  // En çok tekrar edenleri sırala ve ilk topN tanesini al
  const sorted = filtered.sort((a, b) => b[1] - a[1]).slice(0, topN);

  return sorted.map(([phrase, count]) => ({ phrase, count }));
}


function cleanText(text) {
  // U+200E'yi ve diğer benzer görünmez karakterleri temizle
  //return text.replace(/[\u200E\u200F\u202A-\u202E]/g, '');
  return text;
}

function parseChatToUserMap(chatText) {

  const cleanedText = cleanText(chatText);
  const lines = cleanedText.split('\n');
  const userMap = {};

  const regex = /^\[(\d{2})\.(\d{2})\.(\d{4}) (\d{2}):(\d{2}):(\d{2})\] (.*?): (.+)$/;

  for (const line of lines) {
    const match = regex.exec(line.trim());

    if (match) {
      const [, day, month, year, hour, minute, second, user, message] = match;
      const timestamp = `${year}-${month}-${day}T${hour}:${minute}:${second}`;

      if (!userMap[user]) {
        userMap[user] = {};
      }

      userMap[user][timestamp] = message;
    }
  }

  return userMap;
}

function analyzeWhatsappChat(chatText) {

  const parsedChat = parseChatToUserMap(chatText);
  
  const totalMessages = getTotalMessageCount(parsedChat);
  const messageCountByUser = getMessageCountByUser(parsedChat);
  const mostActiveHours = getMostActiveHours(parsedChat);
  const topWords = getTopWords(parsedChat, 20);
  const topPhrases = getTopPhrases(parsedChat, 2, 7, 20);
  const topEmojis = getTopEmojis(parsedChat, 10);
  return {
    totalMessages,
    messageCountByUser,
    mostActiveHours,
    topWords,
    topPhrases,
    topEmojis,
  };
}

module.exports = {
  analyzeWhatsappChat,
  getTotalMessageCount,
  getMessageCountByUser,
  getMostActiveHours,
  getTopWords,
  getTopPhrases,
}; 