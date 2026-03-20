# Browser Automation Guide — ATS Form Filling

## Hard Rule
APPLY, DO NOT SUBMIT.
Fill the form completely. Stop at the Submit button. Screenshot. Queue for review.
Never click Submit under any circumstance. This is non-negotiable.

## Technology
- Playwright (install: npm install playwright)
- AI-guided navigation for unknown form structures
- Claude Vision as last resort for unusual layouts

## ATS Detection Logic
```javascript
function detectATS(url, pageContent) {
  if (url.includes('myworkdayjobs.com') || url.includes('workday.com')) return 'workday';
  if (url.includes('greenhouse.io') || url.includes('boards.greenhouse.io')) return 'greenhouse';
  if (url.includes('jobs.lever.co')) return 'lever';
  if (url.includes('icims.com')) return 'icims';
  if (url.includes('taleo.net')) return 'taleo';
  // Check page source for ATS signatures
  if (pageContent.includes('data-automation-id')) return 'workday';
  if (pageContent.includes('greenhouse-job-board')) return 'greenhouse';
  return 'direct';
}
```

## Standard Fill Flow
```javascript
async function fillApplication(jobUrl, userProfile, resumeVersion) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.goto(jobUrl);
    const atsType = detectATS(jobUrl, await page.content());
    const strategy = loadStrategy(atsType);

    // Fill all fields
    const fillResult = await strategy.fill(page, userProfile, resumeVersion);

    // HARD STOP before submit
    await strategy.hoverOverSubmitButton(page); // hover but never click
    
    // Capture state
    const screenshot = await page.screenshot({ fullPage: true });
    const screenshotUrl = await base44.files.upload(screenshot);

    return {
      status: 'pending_review',
      ats_type: atsType,
      fill_summary: fillResult.summary,
      screenshot_url: screenshotUrl,
      browser_state: await page.context().storageState()
    };

  } catch (error) {
    return handleFailure(error, jobUrl);
  } finally {
    await browser.close();
  }
}
```

## ATS Strategies — Build in This Order

### Greenhouse (Build First — Easiest)
- Single-page form, clean structure
- No account required in most cases
- File upload via standard input or dropzone
- Demographic questions at end — use user preferences or "Decline to state"
- Selectors: standard HTML form elements, relatively stable

### Workday (Build Second — Most Common)
- Multi-step wizard format
- Always requires account creation → flag LOGIN_REQUIRED on first encounter
- Stable selectors: look for [data-automation-id] attributes
- Resume upload via file input
- After account created once, session can be reused

### Lever (Build Third)
- Minimal fields, very clean
- No account required
- Easy Apply variant common
- Quick win after Greenhouse

### Direct Pages (Build Fourth)
- Every page is unique
- Use AI-guided approach: read the DOM, identify form fields semantically
- More failure-prone — flag UNSUPPORTED_ATS if confidence is low

## CAPTCHA Handling
```javascript
async function checkForCaptcha(page) {
  const captchaSelectors = [
    'iframe[src*="recaptcha"]',
    'iframe[src*="hcaptcha"]',
    '[class*="captcha"]',
    '#cf-challenge-running' // Cloudflare
  ];
  
  for (const selector of captchaSelectors) {
    if (await page.locator(selector).count() > 0) {
      return true; // CAPTCHA detected
    }
  }
  return false;
}

// If CAPTCHA found:
// 1. DO NOT attempt to solve
// 2. Save current URL and page state
// 3. Return status: CAPTCHA_BLOCKED
// 4. Surface to user with direct link and manual instructions
```

Never use 2captcha, CapSolver, or any CAPTCHA bypass service. Ever.

## Failure States
```javascript
const FAILURE_HANDLERS = {
  LOGIN_REQUIRED: (url) => ({
    status: 'needs_attention',
    flagged_reason: `Account required. Create account at: ${url} then return to approve.`
  }),
  CAPTCHA_BLOCKED: (url) => ({
    status: 'needs_attention',
    flagged_reason: `CAPTCHA detected. Complete manually at: ${url}`
  }),
  FORM_ERROR: (error) => ({
    status: 'needs_attention',
    flagged_reason: `Form fill error: ${error.message}. Partial state saved.`
  }),
  UPLOAD_FAILED: () => ({
    status: 'needs_attention',
    flagged_reason: 'Resume upload failed. Try uploading manually.'
  }),
  UNSUPPORTED_ATS: (url) => ({
    status: 'manual',
    flagged_reason: `Unknown form structure at ${url}. Flagged for manual application.`
  })
};
```

## Rate Limits
```
Max fills: 50 per user per day
Min delay: 30 seconds between fills (same user)
Concurrency: 1 at a time per user — no parallel fills
Dedup check: always verify company+role hasn't been applied to before starting
```

## Testing
- All Playwright tests use mock ATS pages — never test against live job boards
- Create mock pages in tests/mocks/ats-pages/
- Run: npm run test:automation (create this script)
- Never run automation tests in CI against real URLs
