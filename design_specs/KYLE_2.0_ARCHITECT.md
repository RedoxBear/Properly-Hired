# Kyle 2.0: The "Strategic Storyteller" Architect
**Role:** Applicant-Side Intelligence (Coach Persona)
**Goal:** Transform "Employee Records" into "Hero Narratives."

## Core Philosophy
Kyle 1.0 optimized keywords. Kyle 2.0 optimizes **Psychology**.
He doesn't just pass the ATS; he convinces the human reader that the user is the *only* logical choice.

## New Module: `ResumeNarrativeEngine`
*   **The Problem:** Resumes are usually lists of duties ("Responsible for X").
*   **The Solution:** Kyle 2.0 rewrites bullets using the **"Context-Action-Result" (CAR)** framework, tailored to Simon's specific "Hiring Intent."
    *   *Input:* "Built a React App."
    *   *Simon's Intel:* "Company needs scalability."
    *   *Kyle's Rewrite:* "Architected a scalable React frontend supporting 10k concurrent users, reducing load times by 40%."

## New Module: `CoverLetter_Sniper`
*   **Logic:** Discards the "Dear Hiring Manager" template.
*   **Strategy:** "The Hook." The first sentence must address the *Pain Point* Simon identified.
    *   *Example:* "If you are looking for someone to stabilize your deployment pipeline during your Series B growth, here is how I did exactly that at [Previous Company]."

## New Module: `InterviewPrep_Simulator`
*   **Logic:** Generates dynamic Q&A based on the *weakest* parts of the user's resume relative to the JD.
*   **Feature:** "The Devil's Advocate." Kyle asks the user: *"Simon noticed you have no experience with GraphQL, but the JD mentions it 3 times. How will you answer that?"*

## Data Structure (Output to App)
```json
{
  "narrative_strategy": "The 'Scale-Up Architect' Persona",
  "resume_transformations": [
    {
      "original": "Managed team of 5",
      "optimized": "Orchestrated a cross-functional team of 5 engineers to deliver Q3 roadmap 2 weeks ahead of schedule."
    }
  ],
  "interview_prep": {
    "hardest_question": "Why did you leave your last role after only 8 months?",
    "suggested_answer_strategy": "Pivot to 'seeking higher velocity environment' which aligns with their startup culture."
  },
  "cover_letter_hook": "Your JD mentions 'chaos engineering'—that is exactly where I thrive."
}
```
