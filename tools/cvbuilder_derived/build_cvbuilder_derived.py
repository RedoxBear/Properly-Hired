#!/usr/bin/env python3
"""
Build IP-safe derived artifacts from mirrored ResumeMaker-style corpus.

The script extracts structural intelligence only:
- interview taxonomy
- resume review rubric
- role/title normalization taxonomy
- reusable writing pattern specs

No legacy prose/templates are copied into outputs.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import xml.etree.ElementTree as ET
from collections import Counter, defaultdict
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Iterable, List, Tuple
import difflib


INTERVIEW_TAGS = {
    "company_research": ["company", "organization", "work here", "division"],
    "career_motivation": ["why", "motivation", "looking for", "career", "job search"],
    "work_style": ["team", "alone", "supervision", "work style", "collaborat", "multitask"],
    "communication": ["communicat", "present", "write", "explain", "interpersonal"],
    "leadership": ["lead", "manage", "supervis", "delegate", "mentor"],
    "problem_solving": ["problem", "obstacle", "solve", "conflict", "challenge"],
    "technical_depth": ["technical", "software", "system", "skill", "tool"],
    "achievements": ["accomplishment", "result", "impact", "achievement", "satisfaction"],
    "culture_fit": ["colleague", "values", "ethic", "environment", "fit"],
    "risk_flags": ["terminated", "unemployed", "gap", "overqualified", "weakness"],
}

RUBRIC_TAGS = {
    "targeting": ["target", "position", "objective", "relevance", "candidate"],
    "impact_evidence": ["achievement", "result", "measurable", "quantified", "benefit"],
    "keyword_alignment": ["keyword", "skills", "section", "ats"],
    "clarity_and_density": ["clear", "direct", "concise", "organized", "logical"],
    "layout_readability": ["legible", "font", "format", "white space", "margin"],
    "credibility": ["truth", "background", "verify", "positive", "accurate"],
    "proofreading": ["reviewed", "feedback", "duplicate", "thesaurus", "pronouns"],
    "compliance_hygiene": ["personal information", "references", "reasons for leaving"],
}

ROLE_FAMILIES = {
    "executive": ["chief", "ceo", "cfo", "coo", "cto", "president", "vice president"],
    "management": ["manager", "director", "supervisor", "administrator", "lead"],
    "human_resources": ["human resources", "recruit", "talent", "benefits", "labor relations"],
    "finance_accounting": ["finance", "financial", "account", "audit", "controller", "treasurer"],
    "sales_marketing": ["sales", "marketing", "brand", "advertis", "account executive"],
    "operations": ["operations", "logistics", "distribution", "production", "process"],
    "technology": ["software", "computer", "systems", "data", "database", "it", "technology"],
    "legal_compliance": ["legal", "compliance", "attorney", "counsel", "regulatory"],
    "healthcare": ["medical", "clinical", "physician", "nurse", "health"],
    "education_training": ["teacher", "instructor", "trainer", "education", "professor"],
}


@dataclass
class SourceFileInfo:
    path: str
    bytes: int
    sha256: str


def normalize_text(value: str) -> str:
    value = value.lower()
    value = re.sub(r"\s+", " ", value)
    value = re.sub(r"[^a-z0-9 ]+", "", value)
    return value.strip()


def slugify(value: str) -> str:
    value = value.lower().strip()
    value = re.sub(r"[^a-z0-9]+", "-", value)
    value = re.sub(r"-{2,}", "-", value).strip("-")
    return value or "untitled"


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as fh:
        while True:
            chunk = fh.read(1024 * 1024)
            if not chunk:
                break
            digest.update(chunk)
    return digest.hexdigest()


def classify_tags(text: str, tag_map: Dict[str, List[str]]) -> List[str]:
    t = text.lower()
    hits: List[str] = []
    for tag, keywords in tag_map.items():
        if any(keyword in t for keyword in keywords):
            hits.append(tag)
    return hits


def parse_virtint(path: Path) -> Dict:
    categories: List[Dict] = []
    current: Dict | None = None

    with path.open("r", encoding="utf-8", errors="ignore") as fh:
        for raw in fh:
            line = raw.strip()
            if not line:
                continue

            if line.startswith("$C,"):
                if current:
                    categories.append(current)
                title = line[3:].strip() or "Untitled Category"
                current = {
                    "id": slugify(title),
                    "title": title,
                    "question_count": 0,
                    "question_styles": Counter(),
                    "tag_counter": Counter(),
                }
                continue

            if line.startswith("$Q,") and current:
                q = line[3:].strip()
                current["question_count"] += 1

                first_word = q.split(" ", 1)[0].lower().rstrip("?")
                if first_word in {"what", "why", "how", "tell", "describe", "which", "do", "did", "have"}:
                    current["question_styles"][first_word] += 1
                else:
                    current["question_styles"]["other"] += 1

                for tag in classify_tags(q, INTERVIEW_TAGS):
                    current["tag_counter"][tag] += 1

    if current:
        categories.append(current)

    competency_distribution = Counter()
    cleaned_categories = []
    total_questions = 0
    for category in categories:
        total_questions += category["question_count"]
        top_tags = [k for k, _ in category["tag_counter"].most_common(4)]
        for tag, count in category["tag_counter"].items():
            competency_distribution[tag] += count

        cleaned_categories.append(
            {
                "id": category["id"],
                "title": category["title"],
                "question_count": category["question_count"],
                "top_competencies": top_tags,
                "question_style_distribution": dict(category["question_styles"].most_common()),
            }
        )

    return {
        "version": "1.0.0",
        "artifact": "interview_taxonomy",
        "summary": {
            "category_count": len(cleaned_categories),
            "question_count": total_questions,
            "competency_distribution": dict(competency_distribution.most_common()),
        },
        "categories": cleaned_categories,
    }


def parse_resreview(path: Path) -> Dict:
    tree = ET.parse(path)
    root = tree.getroot()
    category_nodes = root.findall(".//content/category")

    categories = []
    all_dims = Counter()

    for cat in category_nodes:
        title = (cat.attrib.get("title") or "Untitled").strip()
        cat_id = slugify(title)
        questions = cat.findall("./question")
        weight_total = 0
        weight_high = 0
        dim_counter = Counter()

        for q in questions:
            text = "".join(q.itertext()).strip()
            weight = int(q.attrib.get("weight", "1"))
            weight_total += weight
            if weight >= 3:
                weight_high += 1
            for dim in classify_tags(text, RUBRIC_TAGS):
                dim_counter[dim] += 1
                all_dims[dim] += 1

        categories.append(
            {
                "id": cat_id,
                "title": title,
                "question_count": len(questions),
                "weight_total": weight_total,
                "critical_item_count": weight_high,
                "top_dimensions": [k for k, _ in dim_counter.most_common(5)],
            }
        )

    return {
        "version": "1.0.0",
        "artifact": "resume_review_rubric",
        "score_model": {
            "weight_range": [1, 3],
            "banding": [
                {"label": "strong", "min_weight_ratio": 0.85},
                {"label": "good", "min_weight_ratio": 0.7},
                {"label": "needs_work", "min_weight_ratio": 0.0},
            ],
        },
        "dimensions": dict(all_dims.most_common()),
        "categories": categories,
    }


def parse_jobtitle_dat(path: Path) -> Tuple[List[str], Counter]:
    titles = []
    family_counter = Counter()

    with path.open("r", encoding="utf-8", errors="ignore") as fh:
        for raw in fh:
            title = raw.strip()
            if not title:
                continue
            titles.append(title)
            lower = title.lower()
            matched = False
            for family, keywords in ROLE_FAMILIES.items():
                if any(keyword in lower for keyword in keywords):
                    family_counter[family] += 1
                    matched = True
                    break
            if not matched:
                family_counter["other"] += 1

    return titles, family_counter


def parse_grpi(path: Path) -> Dict:
    tree = ET.parse(path)
    root = tree.getroot()

    major_groups = []

    def walk(node: ET.Element, depth: int = 0) -> int:
        cid = node.attrib.get("id", "unknown")
        direct_jobs = len(node.findall("./job"))
        total_jobs = direct_jobs
        for sub in node.findall("./cat"):
            total_jobs += walk(sub, depth + 1)
        if depth == 0:
            group_key = f"soc_group_{cid.split('-')[0]}"
            major_groups.append(
                {
                    "id": cid,
                    "group_key": group_key,
                    "total_job_titles": total_jobs,
                }
            )
        return total_jobs

    for top_cat in root.findall("./cat"):
        walk(top_cat, depth=0)

    return {
        "major_groups": sorted(major_groups, key=lambda x: x["id"]),
        "major_group_count": len(major_groups),
    }


def parse_grp(path: Path) -> Dict:
    phrase_count_by_code = {}
    leading_word_counter = Counter()

    for _, elem in ET.iterparse(path, events=("end",)):
        if elem.tag != "jobcode":
            continue
        code = elem.attrib.get("id", "unknown")
        phrase_count = 0
        for phrase_elem in elem.findall("./phrase"):
            text = "".join(phrase_elem.itertext()).strip()
            if not text:
                continue
            phrase_count += 1
            m = re.search(r"[A-Za-z]+", text)
            if m:
                leading_word_counter[m.group(0).lower()] += 1
        phrase_count_by_code[code] = phrase_count
        elem.clear()

    top_codes = sorted(phrase_count_by_code.items(), key=lambda x: x[1], reverse=True)[:200]
    return {
        "jobcode_count": len(phrase_count_by_code),
        "top_jobcodes_by_phrase_density": [{"jobcode": code, "phrase_count": count} for code, count in top_codes],
        "leading_action_tokens": dict(leading_word_counter.most_common(60)),
    }


def build_role_taxonomy(job_titles: List[str], family_counter: Counter, grpi_data: Dict, grp_data: Dict) -> Dict:
    unique_titles = sorted(set(job_titles))
    normalized_title_samples = sorted(
        {
            re.sub(r"\s+", " ", re.sub(r"[^\w\s/+-]+", " ", t)).strip().lower()
            for t in unique_titles
        }
    )[:250]

    normalization_rules = [
        {"pattern": r"^cfo$", "canonical": "chief financial officer"},
        {"pattern": r"^ceo$", "canonical": "chief executive officer"},
        {"pattern": r"^coo$", "canonical": "chief operating officer"},
        {"pattern": r"^cto$", "canonical": "chief technology officer"},
        {"pattern": r"^cio$", "canonical": "chief information officer"},
        {"pattern": r"\bvp\b", "canonical": "vice president"},
        {"pattern": r"\bhr\b", "canonical": "human resources"},
        {"pattern": r"\ba/r\b", "canonical": "accounts receivable"},
        {"pattern": r"\ba/p\b", "canonical": "accounts payable"},
    ]

    return {
        "version": "1.0.0",
        "artifact": "role_taxonomy",
        "title_inventory": {
            "raw_title_count": len(job_titles),
            "unique_title_count": len(unique_titles),
            "family_distribution": dict(family_counter.most_common()),
            "normalized_title_samples": normalized_title_samples,
        },
        "soc_taxonomy": grpi_data,
        "phrase_density": grp_data,
        "normalization_rules": normalization_rules,
    }


def build_pattern_specs() -> Dict:
    return {
        "version": "1.0.0",
        "artifact": "pattern_specs",
        "patterns": [
            {
                "id": "arc",
                "name": "Action-Result-Context",
                "slots": ["action_verb", "result_metric", "context_scope"],
                "validation": ["must_include_metric_or_scale", "must_specify_scope"],
            },
            {
                "id": "star",
                "name": "Situation-Task-Action-Result",
                "slots": ["situation", "task", "action", "result"],
                "validation": ["result_should_include_quant_or_business_effect"],
            },
            {
                "id": "carl",
                "name": "Challenge-Action-Result-Learning",
                "slots": ["challenge", "action", "result", "learning"],
                "validation": ["learning_must_show_growth_or_transferability"],
            },
            {
                "id": "value_proposition",
                "name": "Role-Fit Value Proposition",
                "slots": ["target_role", "core_strength", "business_value", "proof_signal"],
                "validation": ["proof_signal_required"],
            },
        ],
        "usage_constraints": {
            "allow_direct_legacy_phrases": False,
            "require_candidate_specific_evidence": True,
            "require_role_specific_keywords": True,
        },
    }


def iter_string_values(payload: object) -> Iterable[str]:
    if isinstance(payload, str):
        yield payload
    elif isinstance(payload, dict):
        for v in payload.values():
            yield from iter_string_values(v)
    elif isinstance(payload, list):
        for item in payload:
            yield from iter_string_values(item)


def build_source_segments(text: str, limit: int = 50000) -> Dict[str, List[str]]:
    rough = re.split(r"(?:[\n\r]+|[.!?]\s+|\]\]>)", text)
    index: Dict[str, List[str]] = defaultdict(list)
    count = 0
    for seg in rough:
        norm = normalize_text(seg)
        if len(norm) < 40:
            continue
        key = norm.split(" ", 1)[0]
        bucket = index[key]
        if len(bucket) < 400:
            bucket.append(norm)
            count += 1
            if count >= limit:
                break
    return index


def similarity_guard(
    outputs: Dict[str, Dict],
    source_files: Dict[str, Path],
    threshold: float = 0.88,
) -> Dict:
    source_blob = {}
    source_index = {}
    for name, path in source_files.items():
        text = path.read_text(encoding="utf-8", errors="ignore")
        source_blob[name] = normalize_text(text)
        source_index[name] = build_source_segments(text)

    violations = []
    for artifact_name, artifact in outputs.items():
        for value in iter_string_values(artifact):
            norm = normalize_text(value)
            if len(norm) < 50:
                continue

            for src_name, src_norm in source_blob.items():
                if norm and norm in src_norm:
                    violations.append(
                        {
                            "artifact": artifact_name,
                            "source": src_name,
                            "reason": "direct_substring_match",
                            "text_preview": value[:120],
                            "score": 1.0,
                        }
                    )
                    break
            if violations:
                continue

            first = norm.split(" ", 1)[0]
            for src_name, idx in source_index.items():
                candidates = idx.get(first, [])
                max_ratio = 0.0
                for cand in candidates:
                    if abs(len(cand) - len(norm)) > 120:
                        continue
                    ratio = difflib.SequenceMatcher(a=norm, b=cand).ratio()
                    if ratio > max_ratio:
                        max_ratio = ratio
                    if ratio >= threshold:
                        violations.append(
                            {
                                "artifact": artifact_name,
                                "source": src_name,
                                "reason": "high_similarity_match",
                                "text_preview": value[:120],
                                "score": round(ratio, 4),
                            }
                        )
                        break
                if max_ratio >= threshold:
                    break

    return {
        "status": "failed" if violations else "passed",
        "threshold": threshold,
        "violations": violations,
    }


def markdown_interview(payload: Dict) -> str:
    lines = [
        "# Derived Interview Taxonomy",
        "",
        "IP-safe structural abstraction derived from legacy interview corpus.",
        "",
        f"- Categories: {payload['summary']['category_count']}",
        f"- Questions Indexed: {payload['summary']['question_count']}",
        "",
        "## Competency Distribution",
    ]
    for k, v in payload["summary"]["competency_distribution"].items():
        lines.append(f"- {k}: {v}")
    lines.append("")
    lines.append("## Category Map")
    for cat in payload["categories"]:
        comps = ", ".join(cat["top_competencies"]) if cat["top_competencies"] else "none"
        lines.append(f"- {cat['title']} ({cat['question_count']}): {comps}")
    lines.append("")
    lines.append("_No source wording retained; this file contains only taxonomy._")
    return "\n".join(lines)


def markdown_rubric(payload: Dict) -> str:
    lines = [
        "# Derived Resume Review Rubric",
        "",
        "IP-safe rubric abstraction derived from legacy review checklist.",
        "",
        "## Core Dimensions",
    ]
    for k, v in payload["dimensions"].items():
        lines.append(f"- {k}: {v}")
    lines.append("")
    lines.append("## Category Weights")
    for cat in payload["categories"]:
        dims = ", ".join(cat["top_dimensions"]) if cat["top_dimensions"] else "none"
        lines.append(
            f"- {cat['title']}: questions={cat['question_count']}, weight={cat['weight_total']}, critical={cat['critical_item_count']}, dimensions={dims}"
        )
    lines.append("")
    lines.append("_No source wording retained; this file contains only scoring/rubric metadata._")
    return "\n".join(lines)


def markdown_roles(payload: Dict) -> str:
    inv = payload["title_inventory"]
    lines = [
        "# Derived Role Taxonomy",
        "",
        "IP-safe role/title normalization metadata derived from legacy title mappings.",
        "",
        f"- Raw titles: {inv['raw_title_count']}",
        f"- Unique titles: {inv['unique_title_count']}",
        "",
        "## Role Families",
    ]
    for k, v in inv["family_distribution"].items():
        lines.append(f"- {k}: {v}")
    lines.append("")
    lines.append("## SOC Major Groups")
    for group in payload["soc_taxonomy"]["major_groups"]:
        lines.append(f"- {group['id']} ({group['group_key']}): {group['total_job_titles']}")
    lines.append("")
    lines.append("## Normalization Rules")
    for rule in payload["normalization_rules"]:
        lines.append(f"- {rule['pattern']} -> {rule['canonical']}")
    lines.append("")
    lines.append("_No source wording retained; this file contains only taxonomy and normalization metadata._")
    return "\n".join(lines)


def markdown_patterns(payload: Dict) -> str:
    lines = [
        "# Derived Writing Pattern Specs",
        "",
        "Reusable patterns for generation and QA. Source-independent and IP-safe.",
        "",
        "## Patterns",
    ]
    for pattern in payload["patterns"]:
        slots = ", ".join(pattern["slots"])
        rules = ", ".join(pattern["validation"])
        lines.append(f"- {pattern['id']} ({pattern['name']}): slots=[{slots}] rules=[{rules}]")
    lines.append("")
    lines.append("## Constraints")
    for key, value in payload["usage_constraints"].items():
        lines.append(f"- {key}: {value}")
    return "\n".join(lines)


def write_json(path: Path, data: Dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, indent=2, ensure_ascii=True) + "\n", encoding="utf-8")


def write_text(path: Path, text: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text.rstrip() + "\n", encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser(description="Build derived IP-safe CV_Builder artifacts")
    parser.add_argument("--source-root", required=True, help="Path to CV_Builder DATA directory")
    parser.add_argument("--output-root", required=True, help="Path to output root")
    parser.add_argument("--similarity-threshold", type=float, default=0.88)
    parser.add_argument("--allow-similarity-fail", action="store_true")
    args = parser.parse_args()

    source_root = Path(args.source_root)
    output_root = Path(args.output_root)

    source_files = {
        "virtint": source_root / "VirtInt.Dat",
        "resreview": source_root / "ResReview.xml",
        "jobtitle": source_root / "jobtitle.dat",
        "grpi": source_root / "GRPI.xml",
        "grp": source_root / "GRP.xml",
    }
    missing = [name for name, path in source_files.items() if not path.exists()]
    if missing:
        raise FileNotFoundError(f"Missing source files: {missing}")

    interview = parse_virtint(source_files["virtint"])
    rubric = parse_resreview(source_files["resreview"])
    job_titles, family_counter = parse_jobtitle_dat(source_files["jobtitle"])
    grpi_data = parse_grpi(source_files["grpi"])
    grp_data = parse_grp(source_files["grp"])
    roles = build_role_taxonomy(job_titles, family_counter, grpi_data, grp_data)
    patterns = build_pattern_specs()

    outputs = {
        "interview_taxonomy": interview,
        "resume_review_rubric": rubric,
        "role_taxonomy": roles,
        "pattern_specs": patterns,
    }

    guard = similarity_guard(outputs, source_files, threshold=args.similarity_threshold)
    guard_path = output_root / "qa" / "similarity_report.json"
    write_json(guard_path, guard)

    if guard["status"] != "passed" and not args.allow_similarity_fail:
        raise RuntimeError(
            f"Similarity guard failed with {len(guard['violations'])} violations. "
            f"See {guard_path}"
        )

    json_dir = output_root / "json"
    md_dir = output_root / "md"
    write_json(json_dir / "interview_taxonomy.json", interview)
    write_json(json_dir / "resume_review_rubric.json", rubric)
    write_json(json_dir / "role_taxonomy.json", roles)
    write_json(json_dir / "pattern_specs.json", patterns)

    write_text(md_dir / "derived_cvbuilder_interview_taxonomy.md", markdown_interview(interview))
    write_text(md_dir / "derived_cvbuilder_resume_review_rubric.md", markdown_rubric(rubric))
    write_text(md_dir / "derived_cvbuilder_role_taxonomy.md", markdown_roles(roles))
    write_text(md_dir / "derived_cvbuilder_pattern_specs.md", markdown_patterns(patterns))

    provenance = {
        "generated_at_utc": datetime.now(timezone.utc).isoformat(),
        "generator": "build_cvbuilder_derived.py",
        "source_root": str(source_root),
        "sources": [
            SourceFileInfo(
                path=str(path),
                bytes=path.stat().st_size,
                sha256=sha256_file(path),
            ).__dict__
            for path in source_files.values()
        ],
        "artifacts": sorted(outputs.keys()),
        "similarity_guard": guard,
        "license_note": (
            "Derived artifacts contain structural metadata only. "
            "No direct legacy prose/templates should be reused."
        ),
    }
    write_json(output_root / "provenance" / "provenance.json", provenance)

    print("Derived artifacts generated successfully.")
    print(f"Output root: {output_root}")
    print(f"Similarity guard: {guard['status']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
