# Job Discovery APIs

## Approved Sources Only — No Scraping

### JSearch (RapidAPI) — Primary Source
- Coverage: Indeed, LinkedIn, Glassdoor, ZipRecruiter aggregated
- Env vars: JSEARCH_API_KEY
- Endpoint: https://jsearch.p.rapidapi.com/search
- Key params: query, location, remote_jobs_only, date_posted, employment_type
- Rate limit: 500 req/month free tier
- Docs: https://rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch

### Adzuna — Secondary Source (Good Salary Data)
- Coverage: Broad US + international
- Env vars: ADZUNA_APP_ID, ADZUNA_API_KEY (both required)
- Endpoint: https://api.adzuna.com/v1/api/jobs/us/search/1
- Key params: what, where, salary_min, full_time, permanent
- Rate limit: 250 req/day free tier
- Docs: https://developer.adzuna.com/

### USAJobs — Federal Roles (Free, Official)
- Coverage: All US federal government positions
- Env vars: USAJOBS_EMAIL, USAJOBS_API_KEY
- Endpoint: https://data.usajobs.gov/api/search
- Key params: Keyword, LocationName, PayGradeLow, PositionTitle
- Rate limit: 1000 req/day
- Docs: https://developer.usajobs.gov/
- Note: Important for veteran hiring preference — Richard's background

## NOT Approved (Never Use)
- LinkedIn direct scraping — ToS violation, account ban
- Indeed direct scraping — ToS violation
- Any headless browser scraping of job boards
- Greenhouse/Workday/Lever board scraping

## Deduplication
Same job appears across multiple sources constantly.
Dedup key: normalize(company_name) + normalize(job_title) + normalize(location)
Hash this → store as dedup_hash on JobListing entity
If hash exists for this user → skip, don't create duplicate record

## Match Scoring Dimensions
Simon scores each listing 0-100:
1. Job title alignment (30%) — semantic match to user's target roles
2. Required skills overlap (35%) — skills in JD vs skills in resume
3. Industry/domain match (15%) — sector alignment
4. Location/remote fit (10%) — geography + remote preference
5. Seniority level alignment (10%) — exec/director/manager/professional

Thresholds:
- 80+: Auto-add to Review Queue
- 60-79: Optional — surface as "stretch roles"
- Below 60: Filter out (user can adjust threshold in settings)

## API Usage Tracking
Log every API call to prevent quota blowout:
```javascript
// In discoverJobs.ts — track usage
await ApiUsageLog.create({
  user_id,
  api_source: 'jsearch',
  endpoint: '/search',
  timestamp: new Date().toISOString()
});
// Alert when daily quota reaches 80%
```
