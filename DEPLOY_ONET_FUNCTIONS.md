# Deploy O*NET Functions to Base44

## Error You're Seeing
```
POST https://base44.app/api/apps/68af4e866eafaf5bc320af8a/functions/queryONetAPI 401 (Unauthorized)
```

This means the `queryONetAPI` function isn't deployed to Base44 yet.

## Functions to Deploy

Located in `Prague-Day/functions/`:
1. **queryONetAPI.ts** - Queries O*NET Web Services API
2. **importONetBulk.ts** - Bulk import O*NET data

## Deployment Steps

### Option 1: Via Base44 CLI (Recommended)

```bash
cd Prague-Day

# Deploy queryONetAPI function
base44 functions deploy queryONetAPI

# Deploy importONetBulk function
base44 functions deploy importONetBulk
```

### Option 2: Via Base44 Web Interface

1. Go to https://app.base44.com
2. Navigate to your app: **68af4e866eafaf5bc320af8a**
3. Go to **Functions** section
4. Click **"New Function"** or **"Deploy"**
5. Upload/paste the contents of:
   - `functions/queryONetAPI.ts`
   - `functions/importONetBulk.ts`

### Option 3: Manual Deployment Script

```bash
#!/bin/bash
# deploy-functions.sh

APP_ID="68af4e866eafaf5bc320af8a"
API_KEY="daadd83830f1405a9ed3b8e030da05b4"
BASE_URL="https://app.base44.com/api"

# Deploy queryONetAPI
curl -X POST "$BASE_URL/apps/$APP_ID/functions" \
  -H "api_key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d @- <<EOF
{
  "name": "queryONetAPI",
  "code": $(cat Prague-Day/functions/queryONetAPI.ts | jq -Rs .)
}
EOF

# Deploy importONetBulk
curl -X POST "$BASE_URL/apps/$APP_ID/functions" \
  -H "api_key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d @- <<EOF
{
  "name": "importONetBulk",
  "code": $(cat Prague-Day/functions/importONetBulk.ts | jq -Rs .)
}
EOF
```

## Required Environment Variables

After deploying, set these in Base44:

### For queryONetAPI function:
```
ONET_API_USERNAME=<your-onet-username>
ONET_API_PASSWORD=<your-onet-password>
```

You can get O*NET API credentials from:
https://services.onetcenter.org/reference/

## Verify Deployment

After deploying, test the function:

```bash
# Test queryONetAPI
curl -X POST https://base44.app/api/apps/68af4e866eafaf5bc320af8a/functions/queryONetAPI \
  -H "api_key: daadd83830f1405a9ed3b8e030da05b4" \
  -H "Content-Type: application/json" \
  -d '{
    "endpoint": "/online/occupations/15-1252.00",
    "params": {}
  }'
```

## Troubleshooting

### 401 Unauthorized
- Function not deployed OR user not logged in
- Solution: Deploy function, ensure user is authenticated

### 500 O*NET API credentials not configured
- Environment variables not set
- Solution: Set ONET_API_USERNAME and ONET_API_PASSWORD in Base44

### Function not found
- Function name mismatch
- Solution: Ensure function is named exactly "queryONetAPI"

## After Deployment

Once deployed, the O*NET import page will be able to:
1. Query O*NET Web Services API for occupation data
2. Fall back to local database when API is unavailable
3. Import and sync O*NET data automatically

---

**Quick Deploy Command:**
```bash
cd Prague-Day && base44 functions deploy queryONetAPI importONetBulk
```
