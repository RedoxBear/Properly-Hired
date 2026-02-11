# Derived CV_Builder Knowledge Layer

This folder stores IP-safe derived artifacts extracted from mirrored ResumeMaker-style data.

Rules:
- Use only structural metadata (taxonomy, rubric, normalization, pattern specs).
- Do not ingest legacy prose/templates from source files.
- Keep provenance and similarity QA reports with each generation.


Then copy:
- JSON to `knowledge/derived_cvbuilder/json/`
- QA/provenance to `knowledge/derived_cvbuilder/qa/` and `knowledge/derived_cvbuilder/provenance/`
- MD summaries to `knowledge/kyle/`
