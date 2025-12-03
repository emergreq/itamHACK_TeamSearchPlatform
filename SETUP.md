# Setup Guide

Complete step-by-step guide to set up and run the Hackathon Team Search Platform.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v14 or higher) - [Download](https://nodejs.org/)
- **MongoDB** (v4.4 or higher) - [Download](https://www.mongodb.com/try/download/community)
- **Git** - [Download](https://git-scm.com/downloads)
- **Telegram Account** - To create and test the bot

## Step 1: Clone the Repository

```bash
git clone https://github.com/emergreq/itamHACK_TeamSearchPlatform.git
cd itamHACK_TeamSearchPlatform
```

## Step 2: Install Dependencies

```bash
npm install
```

This will install all required packages including:
- Express (web framework)
- Mongoose (MongoDB ODM)
- Telegram Bot API
- Security packages (rate limiting, CSRF protection)

## Step 3: Set Up MongoDB

### Option A: Local MongoDB

1. Start MongoDB service:
   
   **Windows:**
   ```bash
   mongod
   ```
   
   **macOS/Linux:**
   ```bash
   sudo systemctl start mongod
   # or
   sudo service mongod start
   ```

2. Verify MongoDB is running:
   ```bash
   mongo --eval "db.version()"
   ```

### Option B: MongoDB Atlas (Cloud - Recommended for Production)

1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster (free tier available)
3. Click "Connect" → "Connect your application"
4. Copy the connection string (it looks like: `mongodb+srv://username:password@cluster.mongodb.net/database`)

## Step 4: Create and Configure Telegram Bot

1. **Open Telegram** and search for [@BotFather](https://t.me/botfather)

2. **Create a new bot:**
   - Send `/newbot` to BotFather
   - Follow the prompts:
     - Enter a name for your bot (e.g., "Hackathon Team Search")
     - Enter a username (must end in 'bot', e.g., "hackteamsearch_bot")

3. **Save the bot token:**
   - BotFather will give you a token like: `1234567890:ABCdefGHIjklMNOpqrsTUVwxyz`
   - **Keep this token secure!** It's like a password for your bot

4. **Get your bot username:**
   - This is the username you just created (e.g., "@hackteamsearch_bot")

## Step 5: Configure Environment Variables

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit the `.env` file with your settings:

   ```env
   # Telegram Bot Configuration
   TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
   TELEGRAM_BOT_USERNAME=hackteamsearch_bot

   # MongoDB Configuration
   # For local MongoDB:
   MONGODB_URI=mongodb://localhost:27017/hackathon_platform
   # For MongoDB Atlas:
   # MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/hackathon_platform

   # Server Configuration
   PORT=3000
   SESSION_SECRET=your_random_secret_here_change_this_in_production

   # Application URL
   APP_URL=http://localhost:3000
   ```

   **Important:**
   - Replace `TELEGRAM_BOT_TOKEN` with your actual bot token
   - Replace `TELEGRAM_BOT_USERNAME` with your bot username (without @)
   - For production, change `SESSION_SECRET` to a long random string
   - For production, update `APP_URL` to your actual domain

3. **Generate a secure session secret** (recommended):
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
   Use the output as your `SESSION_SECRET`

## Step 6: Start the Application

### Development Mode (with auto-reload):
```bash
npm run dev
```

### Production Mode:
```bash
npm start
```

You should see:
```
MongoDB connected successfully
Server running on port 3000
App URL: http://localhost:3000
```

## Step 7: Test the Application

1. **Open your browser** and go to `http://localhost:3000`

2. **Open Telegram** and find your bot (search for the username you created)

3. **Send `/start` to your bot** in Telegram
   - The bot will respond with an authentication code
   - The code is valid for 5 minutes

4. **Enter the code** on the website or click the provided link

5. **Fill out your profile:**
   - Go to "О себе" (About Me)
   - Enter your name, role, skills, etc.
   - Save your profile

6. **Test messaging:**
   - Go to "Поиск команды" (Find Team)
   - Click "Написать сообщение" (Send Message) on a user
   - Send a message
   - You should receive a Telegram notification!

## Troubleshooting

### MongoDB Connection Issues

**Error: `MongoNetworkError: connect ECONNREFUSED`**
- Make sure MongoDB is running: `mongod`
- Check if MongoDB is listening on the correct port (default: 27017)
- Verify your `MONGODB_URI` in `.env`

### Telegram Bot Issues

**Bot not responding:**
- Verify your bot token is correct in `.env`
- Make sure the application is running
- Check the console for errors

**Not receiving notifications:**
- Ensure you've started a conversation with the bot (`/start`)
- Check that the user has a `telegramId` in the database
- Look for errors in the server console

### Port Already in Use

**Error: `EADDRINUSE: address already in use :::3000`**
- Another application is using port 3000
- Change the `PORT` in `.env` to a different number (e.g., 3001)
- Or stop the other application

### Session Issues

**Getting logged out frequently:**
- Make sure cookies are enabled in your browser
- Check that `SESSION_SECRET` is set in `.env`
- For HTTPS, set `secure: true` in session config

## Production Deployment

### Environment Setup

1. **Set secure environment variables:**
   - Generate a strong `SESSION_SECRET`
   - Use MongoDB Atlas or a managed MongoDB service
   - Set `NODE_ENV=production`
   - Update `APP_URL` to your production domain

2. **Enable HTTPS:**
   - Use a reverse proxy (nginx, Apache)
   - Or deploy to a platform that provides HTTPS (Heroku, Vercel, etc.)

3. **Security checklist:**
   - ✅ Never commit `.env` file to git
   - ✅ Use strong session secrets
   - ✅ Enable HTTPS in production
   - ✅ Keep dependencies updated
   - ✅ Set up MongoDB authentication
   - ✅ Configure firewall rules

### Deployment Platforms

#### Heroku

```bash
# Install Heroku CLI and login
heroku login

# Create app
heroku create your-app-name

# Add MongoDB (use MongoDB Atlas add-on or external)
heroku addons:create mongolab:sandbox

# Set environment variables
heroku config:set TELEGRAM_BOT_TOKEN=your_token
heroku config:set SESSION_SECRET=your_secret
heroku config:set NODE_ENV=production

# Deploy
git push heroku main
```

#### Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard
```

#### DigitalOcean / VPS

1. Set up a VPS with Node.js and MongoDB
2. Clone the repository
3. Install dependencies
4. Configure nginx as reverse proxy
5. Use PM2 to run the application:
   ```bash
   npm install -g pm2
   pm2 start server/index.js --name hackathon-platform
   pm2 startup
   pm2 save
   ```

## Maintenance

### Update Dependencies

```bash
npm update
```

### View Logs

```bash
# If using PM2:
pm2 logs hackathon-platform

# If running directly:
# Check console output
```

### Backup Database

```bash
# MongoDB dump
mongodump --uri="mongodb://localhost:27017/hackathon_platform" --out=/path/to/backup

# Restore
mongorestore --uri="mongodb://localhost:27017/hackathon_platform" /path/to/backup/hackathon_platform
```

## Support

For issues or questions:
- Check the [README.md](README.md) for general information
- Review the API documentation in README
- Check the GitHub issues page
- Review server logs for error messages

## Next Steps

- Customize the CSS to match your event branding
- Add more user roles if needed (edit `server/config/constants.js`)
- Set up monitoring and error tracking
- Configure backups for production
- Add analytics if desired

Happy hacking! 🚀
