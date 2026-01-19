# Browser Cache Clearing Instructions

## Problem
If you're seeing `apiBaseUrl is not defined` errors, your browser is likely using a cached JavaScript bundle. The code fix is correct, but the browser needs to load the latest bundle.

## Quick Fix: Hard Refresh

### Windows/Linux:
- Press `Ctrl + Shift + R` or `Ctrl + F5`

### Mac:
- Press `Cmd + Shift + R`

## Complete Cache Clear (If Hard Refresh Doesn't Work)

### Chrome/Edge:
1. Open DevTools (Press `F12`)
2. Right-click on the refresh button (next to the address bar)
3. Select **"Empty Cache and Hard Reload"**

### Firefox:
1. Open DevTools (Press `F12`)
2. Right-click on the refresh button
3. Select **"Empty Cache and Hard Reload"**

## Clear Service Workers (If Present)

1. Open DevTools (Press `F12`)
2. Go to the **Application** tab
3. Click on **Service Workers** in the left sidebar
4. If any service workers are registered:
   - Click **Unregister** for each one
5. Go to **Storage** in the left sidebar
6. Click **Clear site data**
7. Close DevTools and refresh the page

## Verify Latest Bundle is Loaded

After clearing cache, check the browser console (F12):
- You should see logs from `index-Dl0-bG3P.js` (or a newer bundle)
- You should NOT see logs from `index-DAExhHA7.js` (old bundle)
- When creating a job, you should see:
  - `📊 Saving ratio report for job: [jobId]`
  - `🎨 Creating prepress job with data: {...}`

## Still Having Issues?

If the error persists after clearing cache:
1. Close all browser tabs with the application
2. Clear browser cache completely (Settings → Privacy → Clear browsing data)
3. Restart the browser
4. Open the application in a new tab

## Technical Details

The latest build should be: `index-Dl0-bG3P.js` (or newer)
If you see: `index-DAExhHA7.js` in errors, you're using an old cached bundle.

