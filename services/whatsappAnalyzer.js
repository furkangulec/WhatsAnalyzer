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

function getTotalMessageCount(chatText) {
  // Boş satırlar hariç tüm satırları say
  const lines = chatText.split('\n').filter(line => line.trim() !== '');
  return lines.length;
}

function getMessageCountByUser(chatText) {
  const lines = chatText.split('\n').filter(line => line.trim() !== '');
  const userCounts = {};
  for (const line of lines) {
    const user = parseUserFromLine(line);
    if (user) {
      userCounts[user] = (userCounts[user] || 0) + 1;
    }
  }
  return userCounts;
}

function getMostActiveHours(chatText) {
  // Saatlere göre mesaj sayısını tut
  const lines = chatText.split('\n').filter(line => line.trim() !== '');
  const hourCounts = {};
  const hourRegex = /^\[\d{1,2}\.\d{1,2}\.\d{4} (\d{2}):\d{2}:\d{2}\]/;

  for (const line of lines) {
    const match = line.match(hourRegex);
    if (match && match[1]) {
      const hour = match[1];
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

function analyzeWhatsappChat(chatText) {
  const totalMessages = getTotalMessageCount(chatText);
  const messageCountByUser = getMessageCountByUser(chatText);
  const mostActiveHours = getMostActiveHours(chatText);
  return {
    totalMessages,
    messageCountByUser,
    mostActiveHours,
  };
}

module.exports = {
  analyzeWhatsappChat,
  getTotalMessageCount,
  getMessageCountByUser,
  getMostActiveHours,
}; 