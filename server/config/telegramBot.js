const TelegramBot = require('node-telegram-bot-api');
const User = require('../models/User');
const { AUTH_CODE_EXPIRATION } = require('./constants');

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });

// Store temporary auth codes
const authCodes = new Map();

// Generate random auth code
function generateAuthCode() {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}

// Clean up expired auth codes periodically
setInterval(() => {
  const now = Date.now();
  
  for (const [code, data] of authCodes.entries()) {
    if (now - data.timestamp > AUTH_CODE_EXPIRATION) {
      authCodes.delete(code);
    }
  }
}, 60 * 1000); // Run cleanup every minute

// Bot commands
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const telegramId = msg.from.id.toString();
  
  try {
    // Check if user exists
    let user = await User.findOne({ telegramId });
    
    if (!user) {
      // Create new user
      user = new User({
        telegramId,
        username: msg.from.username || `user_${telegramId}`,
        firstName: msg.from.first_name || '',
        lastName: msg.from.last_name || '',
        authDate: new Date()
      });
      await user.save();
    }
    
    // Generate auth code
    const authCode = generateAuthCode();
    authCodes.set(authCode, {
      telegramId,
      timestamp: Date.now()
    });
    
    const authUrl = `${process.env.APP_URL}/auth?code=${authCode}`;
    
    bot.sendMessage(chatId, 
      `Добро пожаловать в платформу поиска команды для хакатона! 🚀\n\n` +
      `Для входа на платформу используйте этот код: ${authCode}\n\n` +
      `Или перейдите по ссылке: ${authUrl}\n\n` +
      `Код действителен 5 минут.`,
      {
        reply_markup: {
          inline_keyboard: [[
            { text: 'Войти на платформу', url: authUrl }
          ]]
        }
      }
    );
  } catch (error) {
    console.error('Error in /start command:', error);
    bot.sendMessage(chatId, 'Произошла ошибка. Попробуйте еще раз.');
  }
});

bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId,
    `Доступные команды:\n` +
    `/start - Получить код для входа на платформу\n` +
    `/help - Показать это сообщение\n\n` +
    `Вы будете получать уведомления о новых сообщениях на платформе.`
  );
});

// Function to send notification about new message
async function sendMessageNotification(telegramId, senderName, messagePreview) {
  try {
    // Remove potentially dangerous characters that could be interpreted by Telegram
    const sanitizedName = String(senderName)
      .replace(/[<>&"']/g, '')
      .substring(0, 50);
    const sanitizedPreview = String(messagePreview)
      .replace(/[<>&"']/g, '')
      .substring(0, 100);
    
    await bot.sendMessage(telegramId,
      `💬 Новое сообщение от ${sanitizedName}:\n\n"${sanitizedPreview}"\n\n` +
      `Перейдите на платформу, чтобы ответить: ${process.env.APP_URL}/messages`
    );
  } catch (error) {
    console.error('Error sending notification:', error);
  }
}

// Function to verify auth code
function verifyAuthCode(code) {
  const authData = authCodes.get(code);
  if (!authData) {
    return null;
  }
  
  // Check if code is still valid
  if (Date.now() - authData.timestamp > AUTH_CODE_EXPIRATION) {
    authCodes.delete(code);
    return null;
  }
  
  // Delete code after use
  authCodes.delete(code);
  return authData.telegramId;
}

module.exports = {
  bot,
  sendMessageNotification,
  verifyAuthCode
};
