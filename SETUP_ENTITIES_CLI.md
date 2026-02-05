# O*NET Entities Setup via CLI

This guide shows you how to create the 8 required O*NET entities in Base44 using the CLI setup script.

## Prerequisites

You need:
1. **API Key** - Your Base44 API key
2. **App ID** - Your Base44 application ID
3. **Server URL** - Your Base44 server URL

## Finding Your Credentials

### 1. Get Your API Key

**Option A: From Base44 Dashboard**
1. Go to your Base44 application dashboard
2. Navigate to: **Settings → API Keys** or **Developer → Tokens**
3. Create or copy an existing API key
4. It will look like: `sk_live_abc123xyz...` or similar

**Option B: From Environment Variables**
- Check your `.env` file for `BASE44_TOKEN` or similar variable

### 2. Get Your App ID

**From the URL:**
- Visit your Base44 app dashboard
- Look at the URL: `https://base44.app/apps/YOUR_APP_ID_HERE`
- Copy the App ID from the URL

**Or from `.env` file:**
- Your `.env` file has `appId` variable

### 3. Get Your Server URL

**From Base44 Dashboard:**
1. Go to your app settings
2. Look for "API Endpoint" or "Server URL"
3. It will look like: `https://preview-sandbox--xxxxx.base44.app` or `https://api.base44.app`

**Or from `.env` file:**
- Check `serverUrl` in your `.env` file

## Running the Setup Script

### Command Format

```bash
node setup-onet-entities.js <API_KEY> <APP_ID> <SERVER_URL>
```

### Example

```bash
node setup-onet-entities.js sk_live_abc123def456 app_68af4e866eafaf5bc320af8a https://preview-sandbox--4a418bc.base44.app
```

### Step-by-Step

1. **Open terminal in project directory**
   ```bash
   cd /root/projects/prague-day
   ```

2. **Run the setup script**
   ```bash
   node setup-onet-entities.js YOUR_API_KEY YOUR_APP_ID YOUR_SERVER_URL
   ```

3. **Wait for completion**
   - The script will check for existing entities
   - Create any missing entities
   - Show a summary

### Example Output

```
============================================================
O*NET Entities Setup Script
============================================================

📡 Connecting to Base44...
   App ID: app_68af4e866eafaf5bc320af8a
   Server: https://preview-sandbox--4a418bc.base44.app

✓ Authenticated as: user@example.com

🔍 Checking existing entities...

⚠ Missing entities (8):
  • ONetOccupation
  • ONetSkill
  • ONetAbility
  • ONetKnowledge
  • ONetTask
  • ONetWorkActivity
  • ONetWorkContext
  • ONetReference

📦 Creating missing entities...
✓ Entity already exists: ONetOccupation
✓ Successfully created: ONetSkill
✓ Successfully created: ONetAbility
... (and so on)

============================================================
Setup Summary
============================================================

✓ Already existed: 1
✓ Successfully created: 7
✗ Errors: 0

✅ All entities are now ready for O*NET import!
```

## What the Script Does

1. **Authenticates** with your Base44 account using the API key
2. **Checks** which entities already exist
3. **Creates** any missing entities automatically
4. **Reports** the results with a summary

## Entities Created

The script will create these 8 entities:

- `ONetOccupation` - Job titles and occupations
- `ONetSkill` - Skills data
- `ONetAbility` - Abilities data
- `ONetKnowledge` - Knowledge areas
- `ONetTask` - Task statements
- `ONetWorkActivity` - Work activities
- `ONetWorkContext` - Work context/environment
- `ONetReference` - Reference lookup tables

## Troubleshooting

### "Authentication failed"
- Verify your API key is correct
- Check that your key has the right permissions
- Make sure the key hasn't expired

### "App not found"
- Verify your App ID is correct
- Check that you're using the right Base44 server

### "Cannot create entity via SDK"
- This means the Base44 SDK doesn't support direct entity creation
- **Solution:** Create entities manually in Base44 dashboard:
  1. Go to Base44 app settings
  2. Navigate to Settings → Schema/Entities
  3. Create each entity from the list above
  4. Set each as "Data Entity" and "Expose in API"

### Script runs but entities still don't appear
- Refresh the Base44 dashboard
- Wait 10-30 seconds for changes to propagate
- Try running the setup script again to verify

## After Setup

Once all 8 entities are created:

1. **Verify in Base44 Dashboard:**
   - Go to Settings → Schema/Entities
   - You should see all 8 ONet entities listed

2. **Run diagnostics:**
   - Go to O*NET Import page
   - Click "Diagnostics" button
   - Console should show ✓ for all entities

3. **Start importing:**
   - Download O*NET CSV files
   - Use the import page to upload and import

## Need Help?

If the script encounters errors:

1. Check the error message in the output
2. Verify all credentials are correct
3. Try creating one entity manually in Base44 dashboard to test access
4. Check `.env` file for correct values

For API key or app ID issues, contact your Base44 administrator.
