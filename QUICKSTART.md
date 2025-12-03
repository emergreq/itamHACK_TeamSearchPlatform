# Quick Start Guide

Get the platform running in 5 minutes! ⚡

## Prerequisites

- Node.js installed
- MongoDB running (or MongoDB Atlas account)
- Telegram account

## 1. Clone and Install (1 min)

```bash
git clone https://github.com/emergreq/itamHACK_TeamSearchPlatform.git
cd itamHACK_TeamSearchPlatform
npm install
```

## 2. Create Telegram Bot (2 min)

1. Open Telegram, search for **@BotFather**
2. Send `/newbot` and follow the prompts
3. Save the **token** (looks like `1234567890:ABC...`)

## 3. Configure Environment (1 min)

```bash
cp .env.example .env
```

Edit `.env` and set:
- `TELEGRAM_BOT_TOKEN` - Your bot token from step 2
- `TELEGRAM_BOT_USERNAME` - Your bot username (without @)
- `MONGODB_URI` - Keep default for local MongoDB or use Atlas connection string

## 4. Start the App (1 min)

```bash
# Make sure MongoDB is running (if using local)
mongod  # In a separate terminal

# Start the app
npm start
```

## 5. Test It! (30 seconds)

1. Open **http://localhost:3000** in your browser
2. Open **Telegram**, find your bot
3. Send `/start` to your bot
4. Copy the code and paste it on the website
5. You're in! 🎉

## Next Steps

- Fill out your profile in "О себе" (About Me)
- Search for teammates in "Поиск команды" (Find Team)
- Send messages and test Telegram notifications!

## Need Help?

- Full setup guide: [SETUP.md](SETUP.md)
- Security info: [SECURITY.md](SECURITY.md)
- API documentation: [README.md](README.md)

---

**Having issues?** Check [SETUP.md](SETUP.md) for detailed troubleshooting!
