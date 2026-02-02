# JobMatcher Integration - Developer Reference

## 🏗️ Architecture

### Module Structure
```
src/
├── api/
│   ├── jobSourceConnectors.js    # 9 job source adapters
│   ├── jobAggregator.js           # Orchestration engine
│   └── base44Client.js            # Base44 integration
├── pages/
│   └── JobMatcher.jsx             # UI component
└── components/
    └── utils/
        └── retry.js               # Retry logic
```

### Data Flow
```
User Input (search params)
    ↓
JobMatcher Component
    ↓
jobAggregator.aggregateAndScoreJobs()
    ├→ extractUserBackground()
    ├→ aggregateJobs() → parallel connectors
    ├→ deduplicateJobs()
    ├→ scoreJobsAgainstBackground()
    └→ analyzeJobFit() (existing)
    ↓
UI Display with filters/sort
    ↓
Database Storage
```

---

## 📝 API Reference

### JobAggregator Class

#### Constructor
```javascript
const aggregator = new JobAggregator();
```

#### aggregateJobs(query, location, options)
**Purpose:** Search multiple job sources in parallel

**Parameters:**
```javascript
{
  query: "Senior Engineer",           // Job title/keywords
  location: "San Francisco, CA",      // City/State or "Remote"
  options: {
    sources: "all",                   // "all" or ["LinkedIn", "Indeed"]
    remote_only: false,               // boolean
    timeout: 45000,                   // milliseconds
    cache: true                       // Use cached results
  }
}
```

**Returns:**
```javascript
[
  {
    job_title: "Senior Software Engineer",
    company_name: "TechCorp",
    job_url: "https://indeed.com/viewjob?...",
    job_description: "Full job description...",
    location: "San Francisco, CA",
    salary_range: "$150k-$200k",
    source: "Indeed",
    posted_date: "2024-01-15T10:00:00Z",
    remote_friendly: false
  }
  // ... more jobs
]
```

#### aggregateAndScoreJobs(query, location, userBackground, options)
**Purpose:** Aggregate + score by background fit

**Parameters:**
```javascript
{
  query: "React Engineer",
  location: "Remote",
  userBackground: {
    current_title: "Senior Frontend Developer",
    years_experience: 8,
    skills: ["React", "TypeScript", "Node.js"],
    industries: ["SaaS", "FinTech"],
    education: "B.S. Computer Science",
    desired_direction: "Engineering Manager",
    seniority_level: "Senior",
    tech_focused: true,
    remote_preference: "Flexible"
  },
  options: { /* ... */ }
}
```

**Returns:** Jobs with additional fields
```javascript
{
  // ... job data ...
  background_fit_score: 87,
  background_analysis: {
    skills_match: 90,
    experience_fit: "Good growth opportunity",
    industry_relevance: "Aligned",
    career_alignment: "Excellent",
    reasons: [
      "React expertise is highly valued",
      "Leadership opportunity fits career goals",
      "Senior level appropriate for experience"
    ]
  }
}
```

#### extractUserBackground(resumeData)
**Purpose:** Analyze resume for background profile

**Parameters:**
```javascript
{
  resumeData: "Raw resume text or parsed JSON"
}
```

**Returns:**
```javascript
{
  current_title: "Senior Software Engineer",
  years_experience: 8,
  skills: ["Python", "React", "AWS", "PostgreSQL"],
  industries: ["SaaS", "FinTech"],
  education: "B.S. Computer Science, M.S. Business",
  desired_direction: "Tech Leadership",
  seniority_level: "Senior",
  tech_focused: true,
  remote_preference: "Flexible"
}
```

#### scoreJobsAgainstBackground(jobs, userBackground)
**Purpose:** Score jobs array against background

**Parameters:**
```javascript
{
  jobs: [/* job array */],
  userBackground: {/* background object */}
}
```

**Returns:** Same jobs with scores added

#### getCacheStats()
**Returns:**
```javascript
{
  cached_searches: 5,
  cache_entries: ["query1:location1:...", ...]
}
```

#### clearCache()
**Purpose:** Clear all cached results

#### clearExpiredCache()
**Purpose:** Remove cache entries older than 30 min

---

## 🔌 Job Source Connectors

### Connector Interface
```javascript
connector = {
  name: "LinkedIn",
  async search(query, location, options) {
    // Returns jobs array
  }
}
```

### Available Connectors

#### LinkedIn
```javascript
const jobs = await linkedinConnector.search(
  "Senior Engineer",
  "San Francisco, CA",
  { remote_only: false }
);
```

#### Indeed
```javascript
const jobs = await indeedConnector.search(query, location, options);
```

#### Glassdoor
```javascript
const jobs = await glassdoorConnector.search(query, location, options);
```

#### ZipRecruiter
```javascript
const jobs = await zipRecruiterConnector.search(query, location, options);
```

#### Dice (Tech jobs)
```javascript
const jobs = await diceConnector.search(query, location, options);
```

#### FlexJobs (Remote)
```javascript
const jobs = await flexJobsConnector.search(query, location, options);
```

#### WellFound (Startups)
```javascript
const jobs = await wellFoundConnector.search(query, location, options);
```

#### Upwork (Freelance)
```javascript
const jobs = await upworkConnector.search(query, location, options);
```

#### Company Career Pages
```javascript
const jobs = await companyCareerPagesConnector.search(query, location, options);
```

### Utility Functions

#### deduplicateJobs(jobs)
**Purpose:** Remove duplicate jobs across sources

```javascript
const unique = deduplicateJobs(jobs);
// Uses URL + Title:Company for dedup
```

#### getConnector(name)
**Purpose:** Get connector by name

```javascript
const connector = getConnector("Indeed");
```

#### normalizeJobData(job)
**Purpose:** Convert job to standard format

```javascript
const normalized = normalizeJobData(rawJobData);
```

---

## 🧩 Integration with JobMatcher

### Setup
```javascript
import { jobAggregator } from "@/api/jobAggregator";
import { base44 } from "@/api/base44Client";
```

### Usage in Component
```javascript
const handleAutoSearch = async () => {
  const resume = resumes.find(r => r.id === selectedResume);
  
  // Extract background
  const background = await jobAggregator.extractUserBackground(
    resume.parsed_content
  );
  
  // Search and score
  const jobs = await jobAggregator.aggregateAndScoreJobs(
    searchQuery,
    location,
    background
  );
  
  // Analyze each job
  for (const job of jobs) {
    const analysis = await analyzeJobFit(job, selectedResume);
    
    // Store in database
    await JobMatch.create({
      ...job,
      background_fit_score: job.background_fit_score,
      background_analysis: job.background_analysis,
      match_score: analysis.match_score,
      // ... other fields
    });
  }
};
```

---

## 💾 Database Integration

### JobMatch Entity Fields

**Existing Fields:**
```javascript
job_title: string,
company_name: string,
job_url: string,
job_description: string,
location: string,
salary_range: string,
resume_id: string,
status: "new" | "reviewed" | "interested" | "applied" | "dismissed",
fit_analysis: object,
key_keywords: array,
ai_reasoning: string
```

**New Fields:**
```javascript
job_source: string,          // "Indeed", "LinkedIn", etc.
auto_matched: boolean,       // true if from aggregation
background_fit_score: number, // 0-100%
background_analysis: {
  skills_match: number,
  experience_fit: string,
  industry_relevance: string,
  career_alignment: string,
  reasons: array
}
```

### Query Examples

**Find jobs from specific source:**
```javascript
const jobs = await JobMatch.filter(
  { job_source: "LinkedIn" }
);
```

**Find high background fit:**
```javascript
const jobs = await JobMatch.filter(
  { background_fit_score: { $gte: 75 } }
);
```

**Find auto-matched jobs:**
```javascript
const jobs = await JobMatch.filter(
  { auto_matched: true }
);
```

---

## 🛠️ Customization

### Modify Scoring Weights
**File:** `jobAggregator.js` → `scoreJobsAgainstBackground()` method

Current weights (in prompt):
```
Skills Match (30%)
Experience Level (25%)
Industry Relevance (20%)
Growth Opportunity (15%)
Location Fit (10%)
```

### Add New Job Source

1. Create connector in `jobSourceConnectors.js`:
```javascript
export const newSourceConnector = {
  name: "NewSource",
  async search(query, location, options) {
    const prompt = `...`;
    const results = await base44.integrations.Core.InvokeLLM({
      prompt,
      add_context_from_internet: true,
      response_json_schema: { /* ... */ }
    });
    return (results || []).map(job => normalizeJobData({
      ...job,
      source: "NewSource"
    }));
  }
};
```

2. Add to `allConnectors` array:
```javascript
export const allConnectors = [
  // ... existing ...
  newSourceConnector
];
```

3. Add to UI dropdown in JobMatcher:
```jsx
<SelectItem value="NewSource">NewSource</SelectItem>
```

### Modify URL Validation

**File:** `jobSourceConnectors.js` → `connectorName.search()` method

Current validation:
```javascript
.filter(job => job.job_url?.includes("indeed.com"))
```

Modify to change URL requirements.

### Adjust Cache Timeout

**File:** `jobAggregator.js` → Constructor

```javascript
this.cacheTimeout = 30 * 60 * 1000; // 30 minutes (change as needed)
```

### Modify Search Timeout

**File:** `JobMatcher.jsx` → `autoSearchJobs()` method

```javascript
timeout: 60000 // Change this value (milliseconds)
```

---

## 🔍 Debugging

### Enable Logging
Add console.logs to trace flow:

```javascript
console.log("Starting search for:", query);
console.log("Background extracted:", background);
console.log("Jobs found:", jobs.length);
console.log("After dedup:", deduped.length);
console.log("Scored jobs:", scoredJobs);
```

### Test Single Connector
```javascript
const jobs = await indeedConnector.search(
  "Engineer",
  "San Francisco",
  { remote_only: false }
);
console.log("Indeed jobs:", jobs.length, jobs);
```

### Test Background Extraction
```javascript
const bg = await jobAggregator.extractUserBackground(
  resumeContent
);
console.log("Background:", bg);
```

### Check Cache
```javascript
const stats = jobAggregator.getCacheStats();
console.log("Cache stats:", stats);
jobAggregator.clearCache();
```

### Monitor LLM Calls
Track in Base44 logs/analytics.

---

## 🚨 Error Handling

### Handle Search Errors
```javascript
try {
  const jobs = await jobAggregator.aggregateJobs(...);
  // Success
} catch (error) {
  console.error("Search failed:", error.message);
  // Show user-friendly error
  setError("Job search failed. Please try again.");
}
```

### Handle Connector Failures
Individual connector failures don't break the system.
Other sources continue, failed source returns `[]`.

### Handle Scoring Errors
If scoring fails, jobs returned without scores:
```javascript
{ ...job, background_fit_score: 0 }
```

### Handle Timeout
```javascript
// Automatically handled - returns results so far
// User sees: "Search timeout. Showing results from available sources."
```

---

## 📊 Monitoring & Analytics

### Track Metrics
```javascript
// Search success rate
const successRate = successfulSearches / totalSearches;

// Average search time
const avgTime = totalTime / searchCount;

// Cache hit rate
const cacheHitRate = cacheHits / totalSearches;

// Jobs per source
const jobsBySource = {};
jobs.forEach(j => {
  jobsBySource[j.source] = (jobsBySource[j.source] || 0) + 1;
});

// Deduplication rate
const dedupeRate = (totalJobs - dedupeJobs) / totalJobs;
```

### Log Events
```javascript
logger.info("Job search started", { query, location });
logger.info("Background extracted", { background });
logger.info("Jobs aggregated", { count: jobs.length });
logger.info("Jobs scored", { count: scoredJobs.length });
logger.info("Search completed", { duration: endTime - startTime });
```

---

## 🧪 Testing

### Unit Test Template
```javascript
describe("JobAggregator", () => {
  let aggregator;
  
  beforeEach(() => {
    aggregator = new JobAggregator();
  });
  
  test("should aggregate jobs", async () => {
    const jobs = await aggregator.aggregateJobs(
      "Engineer",
      "Remote"
    );
    expect(jobs).toBeArray();
    expect(jobs.length).toBeGreaterThan(0);
  });
  
  test("should deduplicate", async () => {
    // ... test dedup logic
  });
  
  test("should score jobs", async () => {
    // ... test scoring
  });
});
```

### Integration Test Template
```javascript
describe("JobMatcher Integration", () => {
  test("end-to-end search", async () => {
    // 1. Select resume
    // 2. Search
    // 3. Verify results
    // 4. Filter
    // 5. Sort
  });
});
```

---

## 📚 Related Files

- `src/components/utils/retry.js` - Retry logic
- `src/api/base44Client.js` - Base44 integration
- `src/lib/utils.js` - Utility functions
- `src/pages/JobMatcher.jsx` - Main component

---

## 🔗 External Resources

- [Indeed API](https://opensource.indeedeng.io/api-documentation/)
- [LinkedIn API](https://docs.microsoft.com/en-us/linkedin/talent/talent-solutions-apis)
- [Base44 Documentation](http://base44docs.example.com)

---

## 📞 Support

For issues or questions:
1. Check `JOB_AGGREGATION_IMPLEMENTATION.md`
2. Review troubleshooting guide
3. Check logs for errors
4. Test individual connectors

---

**Document Version:** 1.0  
**Last Updated:** 2024  
**Status:** Complete and Production Ready
