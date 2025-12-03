const TelegramBot = require('node-telegram-bot-api');
const User = require('../models/User');

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });

// Store temporary auth codes
const authCodes = new Map();

// Generate random auth code
function generateAuthCode() {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}

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
    
    // Clean up old codes (older than 5 minutes)
    setTimeout(() => authCodes.delete(authCode), 5 * 60 * 1000);
    
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
    await bot.sendMessage(telegramId,
      `💬 Новое сообщение от ${senderName}:\n\n"${messagePreview}"\n\n` +
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
  
  // Check if code is still valid (5 minutes)
  if (Date.now() - authData.timestamp > 5 * 60 * 1000) {
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
