# 🚀 Render Deployment Guide

## **Prerequisites**
- ✅ All build issues fixed (COMPLETED)
- ✅ Project builds successfully (COMPLETED)
- ✅ Server TypeScript configuration fixed (COMPLETED)
- ✅ Render account created

## **Step 1: Create Render Services**

### **Service 1: Client (Static Site)**
1. **Go to [render.com](https://render.com)**
2. **Click "New +" → "Static Site"**
3. **Connect your GitHub repository**
4. **Configure:**
   - **Name**: `connect4-client` (or your preferred name)
   - **Branch**: `main`
   - **Build Command**: `npm run build`
   - **Publish Directory**: `client/dist`
   - **Auto-Deploy**: ✅ Enabled

### **Service 2: Server (Web Service)**
1. **Click "New +" → "Web Service"**
2. **Connect your GitHub repository**
3. **Configure:**
   - **Name**: `connect4-server` (or your preferred name)
   - **Branch**: `main`
   - **Runtime**: `Node`
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`
   - **Auto-Deploy**: ✅ Enabled

**Note**: The server build now uses a separate TypeScript configuration (`tsconfig.build.json`) that excludes test files and only builds production source code.

## **Step 2: Configure Environment Variables**

### **In Server Service:**
Add these environment variables:
```bash
NODE_ENV=production
PORT=10000
CLIENT_URL=https://your-client-service-name.onrender.com
```

**Important**: Replace `your-client-service-name` with your actual client service name.

## **Step 3: Update Client Configuration**

### **Important: Asset Path Configuration**
The client is now configured to use relative paths (`/`) instead of the GitHub Pages path (`/multiplayer_connect_4/`). This ensures assets load correctly on Render.

### **Option A: Environment Variable (Recommended)**
1. **In Client Service**, add environment variable:
   ```bash
   VITE_SERVER_URL=https://your-server-service-name.onrender.com
   ```

2. **Replace** `your-server-service-name` with your actual server service name.

### **Option B: Manual Update**
If you prefer to hardcode, update `client/src/api/socket.ts`:
```typescript
constructor() {
  this.serverUrl = 'https://your-server-service-name.onrender.com';
}
```

## **Step 4: Deploy**

1. **Push your code to GitHub** (if not already done)
2. **Render will automatically build and deploy** both services
3. **Wait for both services to show "Live" status**

## **Step 5: Test Your Game**

1. **Open your client URL**: `https://your-client-service-name.onrender.com`
2. **Create a room** or **join an existing room**
3. **Play the game!** 🎮

## **Troubleshooting**

### **Common Issues:**

1. **Build Fails**
   - Check that all TypeScript errors are fixed
   - Ensure `npm run build` works locally
   - **Server Build Issues**: If you see errors about missing type definitions or test files being included, the build configuration has been fixed in the latest code

2. **Client Can't Connect to Server**
   - Verify `VITE_SERVER_URL` is correct
   - Check server is running and accessible
   - Ensure CORS is properly configured

3. **Server Won't Start**
   - Check environment variables are set correctly
   - Verify `PORT` is set to `10000`
   - Check server logs in Render dashboard

4. **TypeScript Compilation Errors**
   - **Missing @types**: The server now includes `@types/express` and `@types/bcrypt`
   - **Test Files in Build**: Fixed with `tsconfig.build.json` that excludes test files

### **Check Server Logs:**
1. Go to your server service in Render
2. Click "Logs" tab
3. Look for any error messages

## **Final URLs**

After deployment, you'll have:
- **Client**: `https://your-client-service-name.onrender.com`
- **Server**: `https://your-server-service-name.onrender.com`

## **🎉 Success!**

Once both services are live and the client can connect to the server, your multiplayer Connect 4 game will be fully functional on Render!

---

**Need Help?** Check the Render documentation or contact Render support.
