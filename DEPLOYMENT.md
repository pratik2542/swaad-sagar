# Deployment Guide - Swaad Sagar

## Pre-Deployment Checklist

✅ `.gitignore` updated to exclude:
- `.env` files
- `node_modules`
- `.next` build folders

## Important Notes Before Deploying

### 1. **Separate Deployments Required**
This project has two parts that need separate deployments:
- **Backend (API)**: Deploy root folder to Vercel (or Railway/Render)
- **Frontend (Next.js)**: Deploy `web/` folder to Vercel

### 2. **Backend Deployment (API Server)**

**Option A: Deploy to Vercel**
```bash
# From root directory
vercel
```

After deployment, add environment variables in Vercel Dashboard:
- `MONGO_URI` - Your MongoDB connection string
- `JWT_SECRET` - Your JWT secret key
- `GEMINI_API_KEY` - Your Google Gemini API key
- `EMAIL_USER` - Gmail address for password reset
- `EMAIL_PASS` - Gmail app password
- `FRONTEND_URL` - Your frontend URL (will be from next step)

**Option B: Deploy to Railway (Recommended for Node.js backends)**
1. Go to https://railway.app
2. Connect GitHub repo
3. Select root directory
4. Add all environment variables
5. Deploy

### 3. **Frontend Deployment (Next.js App)**

```bash
# From web/ directory
cd web
vercel
```

**Important:** In Vercel dashboard for frontend:
1. Set "Root Directory" to `web`
2. Add environment variable:
   - `NEXT_PUBLIC_API_BASE` - Your backend API URL (from step 2)

## Git Push Commands

```bash
# Check what will be committed
git status

# Verify .env files are NOT listed (should be ignored)
git add .
git commit -m "Initial commit - Swaad Sagar e-commerce app"

# Create GitHub repo first, then:
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git branch -M main
git push -u origin main
```

## Post-Deployment Steps

1. **Update CORS in backend** (`server.js`):
   ```javascript
   app.use(cors({
     origin: ['https://your-frontend-url.vercel.app'],
     credentials: true
   }));
   ```

2. **Update API base URL in frontend** (`web/.env.local`):
   ```
   NEXT_PUBLIC_API_BASE=https://your-backend-url.vercel.app/api
   ```

3. **Test the deployment**:
   - Try registering a new user
   - Add products via admin panel
   - Place a test order
   - Test password reset email

## Environment Variables Reference

### Backend (.env)
```
MONGO_URI=mongodb+srv://...
JWT_SECRET=your-secret-key
GEMINI_API_KEY=your-gemini-key
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
FRONTEND_URL=https://your-frontend.vercel.app
PORT=4000
```

### Frontend (web/.env.local)
```
NEXT_PUBLIC_API_BASE=https://your-backend.vercel.app/api
```

## Troubleshooting

### "Cannot find module" errors
- Make sure `package.json` includes all dependencies
- Run `npm install` before deploying

### CORS errors
- Update CORS origin in `server.js`
- Ensure credentials are handled correctly

### Database connection errors
- Verify MongoDB allows connections from Vercel IPs (0.0.0.0/0)
- Check MongoDB Atlas network access settings

### Image upload issues
- Base64 images work fine for small scale
- For production with many products, consider using Cloudinary or AWS S3

## Recommended Architecture

For best performance:
1. **Backend**: Railway.app or Render.com (better for Node.js with persistent connections)
2. **Frontend**: Vercel (optimized for Next.js)
3. **Database**: MongoDB Atlas (already configured)

## Security Reminders

- ✅ Never commit `.env` files
- ✅ Use environment variables in Vercel dashboard
- ✅ Enable MongoDB network restrictions
- ✅ Use strong JWT secrets in production
- ✅ Enable HTTPS only
- ✅ Set secure CORS origins
