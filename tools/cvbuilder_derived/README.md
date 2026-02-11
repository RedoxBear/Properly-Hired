# CV_Builder Derived Layer (IP-Safe)

This folder contains an extraction tool that converts mirrored legacy ResumeMaker-style
data into structural artifacts only.

## What It Produces

- `interview_taxonomy` (from `VirtInt.Dat`)
- `resume_review_rubric` (from `ResReview.xml`)
- `role_taxonomy` (from `jobtitle.dat`, `GRPI.xml`, `GRP.xml`)
- `pattern_specs` (source-independent)
- provenance metadata and a similarity QA report

## What It Does Not Do

- It does not copy templates/letters/resume prose.
- It does not preserve interview answer text from source.
- It does not output legacy sentence libraries for generation.


## QA Guard

The build runs a similarity check against source corpus and fails by default if
high-similarity strings are found.

