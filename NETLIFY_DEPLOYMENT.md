# Netlify Deployment Guide

This application has been restructured to deploy on Netlify with serverless functions.

## Prerequisites

1. **Netlify Account**: Sign up at [netlify.com](https://netlify.com)
2. **Database**: You'll need a PostgreSQL database. Recommended option:
   - [Neon](https://neon.tech) - Serverless PostgreSQL (free tier available)

## Environment Variables

Set these environment variables in your Netlify site settings (Site settings → Environment variables):

```
DATABASE_URL=postgresql://user:password@host/database?sslmode=require
```

You can get the `DATABASE_URL` from your Neon dashboard or any PostgreSQL provider.

## Deployment Steps

### Option 1: Deploy from Git (Recommended)

1. Push your code to GitHub, GitLab, or Bitbucket
2. Log in to Netlify
3. Click "Add new site" → "Import an existing project"
4. Connect your repository
5. Netlify will auto-detect the configuration from `netlify.toml`
6. Add your `DATABASE_URL` environment variable
7. Click "Deploy site"

### Option 2: Netlify CLI

1. Install Netlify CLI:
   ```bash
   npm install -g netlify-cli
   ```

2. Login to Netlify:
   ```bash
   netlify login
   ```

3. Initialize the site:
   ```bash
   netlify init
   ```

4. Set environment variables:
   ```bash
   netlify env:set DATABASE_URL "your_database_url"
   ```

5. Deploy:
   ```bash
   netlify deploy --prod
   ```

## Database Setup

After creating your database on Neon (or another provider):

1. Get your connection string (DATABASE_URL)
2. Run migrations locally first:
   ```bash
   export DATABASE_URL="your_connection_string"
   npx drizzle-kit push
   ```
3. The schema will be created in your production database

## Architecture

The application uses:
- **Frontend**: React + Vite (static build)
- **Backend**: Netlify Functions (serverless)
- **Database**: PostgreSQL (Neon or any provider)
- **API Routes**:
  - `/api/clients` → `/.netlify/functions/clients`
  - `/api/clients/:id` → `/.netlify/functions/clients/:id`
  - `/api/payments/:clientId` → `/.netlify/functions/payments/:clientId`
  - `/api/payments/toggle` → `/.netlify/functions/payments/toggle`
  - `/api/stats` → `/.netlify/functions/stats`
  - `/api/export` → `/.netlify/functions/export`

## Files Structure

```
netlify/
  functions/
    clients.ts         # Handle /api/clients and /api/clients/:id
    payments.ts        # Handle /api/payments/:clientId and /api/payments/toggle
    stats.ts           # Handle /api/stats
    export.ts          # Handle /api/export
netlify.toml          # Netlify configuration
```

## Troubleshooting

### Function Errors
- Check Netlify Function logs in the dashboard
- Ensure `DATABASE_URL` is set correctly
- Verify the database is accessible from Netlify's servers

### Build Errors
- Make sure all dependencies are in `package.json`
- Check build logs in Netlify dashboard

### CORS Issues
- Functions include CORS headers by default
- If issues persist, check browser console for specific errors

## Important Notes

1. **Cold Starts**: Serverless functions may have cold start delays (1-3 seconds) on first request
2. **Database Connections**: Using Neon's serverless driver handles connection pooling automatically
3. **Function Timeout**: Netlify free tier has 10-second timeout for functions
4. **Concurrent Executions**: Free tier allows 125k function invocations per month
