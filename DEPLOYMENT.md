# 🚀 Deployment Guide for Multiplayer Connect 4

This guide will help you deploy your multiplayer Connect 4 game so others can play it online!

## 📋 Prerequisites

- GitHub account
- Node.js 18+ installed locally
- Git installed locally

## 🎯 Deployment Options

### **Option 1: GitHub Pages (Client Demo Only) - FREE**
- ✅ **Pros**: Free, easy setup, automatic deployment
- ❌ **Cons**: Only shows the UI (no multiplayer functionality)
- 🎯 **Best for**: Showcasing the game interface, demos, portfolios

### **Option 2: Full Stack Deployment - FREE/PAID**
- ✅ **Pros**: Full multiplayer functionality, real gameplay
- ❌ **Cons**: More complex setup, may have costs
- 🎯 **Best for**: Actual gameplay, multiplayer experience

---

## 🚀 **Option 1: GitHub Pages Deployment (Recommended for Demo)**

### Step 1: Prepare Your Repository

1. **Push your code to GitHub** (if you haven't already):
   ```bash
   git add .
   git commit -m "Add GitHub Pages deployment"
   git push origin main
   ```

2. **Enable GitHub Pages**:
   - Go to your repository on GitHub
   - Click **Settings** → **Pages**
   - Under **Source**, select **GitHub Actions**
   - Click **Save**

### Step 2: Automatic Deployment

The GitHub Actions workflow I created will automatically:
- Build your React app when you push to main
- Deploy it to GitHub Pages
- Your game will be available at: `https://yourusername.github.io/multiplayer_connect_4/`

### Step 3: Test the Demo

- Visit your GitHub Pages URL
- You'll see the demo mode with interactive UI
- People can explore the lobby and game interface
- Click columns to add demo tokens

---

## 🌐 **Option 2: Full Stack Deployment (Multiplayer)**

### **Platform A: Render (Recommended - FREE)**

1. **Sign up at [render.com](https://render.com)**

2. **Deploy the Server**:
   ```bash
   # In your server directory
   cd server
   npm run build
   ```

3. **Create a new Web Service**:
   - Connect your GitHub repository
   - Set **Root Directory** to `server`
   - Set **Build Command** to `npm install && npm run build`
   - Set **Start Command** to `npm start`
   - Choose **Free** plan

4. **Set Environment Variables**:
   ```
   NODE_ENV=production
   PORT=10000
   ```

5. **Deploy the Client**:
   - Create another Web Service
   - Set **Root Directory** to `client`
   - Set **Build Command** to `npm install && npm run build`
   - Set **Start Command** to `npm run preview`
   - Choose **Free** plan

### **Platform B: Railway (Alternative - FREE)**

1. **Sign up at [railway.app](https://railway.app)**

2. **Deploy both services**:
   - Connect your GitHub repository
   - Deploy server and client as separate services
   - Railway will automatically assign URLs

### **Platform C: Heroku (Alternative - PAID)**

1. **Sign up at [heroku.com](https://heroku.com)**

2. **Deploy using Heroku CLI**:
   ```bash
   # Deploy server
   cd server
   heroku create your-connect4-server
   git push heroku main
   
   # Deploy client
   cd ../client
   heroku create your-connect4-client
   git push heroku main
   ```

---

## 🔧 **Configuration Updates**

### Update Client for Production

When deploying the full stack, update your client's socket connection:

```typescript
// In client/src/api/socket.ts
const SOCKET_URL = process.env.NODE_ENV === 'production' 
  ? 'wss://your-server-url.com'  // Your deployed server URL
  : 'ws://localhost:3001';        // Local development

export const socket = io(SOCKET_URL);
```

### Environment Variables

Create `.env` files for production:

**Server (.env):**
```env
NODE_ENV=production
PORT=10000
CORS_ORIGIN=https://your-client-url.com
```

**Client (.env):**
```env
VITE_SERVER_URL=https://your-server-url.com
```

---

## 📱 **Custom Domain (Optional)**

1. **Buy a domain** (e.g., from Namecheap, GoDaddy)
2. **Configure DNS** to point to your deployment
3. **Update your deployment** with the custom domain

---

## 🧪 **Testing Your Deployment**

### Test Checklist:
- [ ] Client loads without errors
- [ ] Server responds to health checks
- [ ] WebSocket connection works
- [ ] Game creation works
- [ ] Multiplayer functionality works
- [ ] Mobile responsiveness

### Common Issues:
- **CORS errors**: Check server CORS configuration
- **WebSocket connection failed**: Verify server URL and protocol
- **Build failures**: Check Node.js version compatibility

---

## 📊 **Monitoring & Maintenance**

### **Free Tier Limitations:**
- **Render**: 750 hours/month, auto-sleep after 15 min inactivity
- **Railway**: $5/month after free trial
- **Heroku**: $7/month after free tier removal

### **Scaling Up:**
- Upgrade to paid plans for better performance
- Add monitoring (UptimeRobot, Pingdom)
- Set up alerts for downtime

---

## 🎮 **Sharing Your Game**

### **Demo Mode (GitHub Pages):**
```
🎮 Try our Connect 4 game: https://yourusername.github.io/multiplayer_connect_4/
```

### **Full Game:**
```
🎮 Play Connect 4 with friends: https://your-game-url.com
```

---

## 🆘 **Need Help?**

### **Common Problems:**
1. **Build fails**: Check Node.js version and dependencies
2. **Deployment errors**: Verify environment variables
3. **CORS issues**: Check server configuration
4. **WebSocket fails**: Verify server URL and protocol

### **Resources:**
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Render Documentation](https://render.com/docs)
- [Railway Documentation](https://docs.railway.app)
- [Heroku Documentation](https://devcenter.heroku.com)

---

## 🎯 **Quick Start Summary**

1. **Push code to GitHub** ✅
2. **Enable GitHub Pages** ✅
3. **Test demo mode** ✅
4. **Choose full deployment platform** (Render recommended)
5. **Deploy server and client** ✅
6. **Update client configuration** ✅
7. **Test multiplayer functionality** ✅
8. **Share with friends!** 🎉

Your game will be live and playable online! 🚀
