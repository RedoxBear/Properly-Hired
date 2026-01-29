import os
import json
from typing import Dict, Any, Optional

RAG_INTEGRATION_PATH = "/mnt/f/Projects/AI_Projects/.agents"

class KyleAgent:
    """
    Kyle 2.0: The 'Strategic Storyteller' Architect.
    Enforces the Prague-Day Delivery Standard.
    """
    def __init__(self, author: str = "Unknown"):
        self.author = author
        self._rag = None
        self.template = """
________________________________________
Executive Profile
{profile_text}
Unique Differentiator: {differentiator}
________________________________________
Key Impact Metrics
{metrics_bar}
________________________________________
Professional Experience
{experience_blocks}
________________________________________
Earlier Career
{earlier_career_bullets}
________________________________________
Education & Certifications
{education_and_certs}
________________________________________
Technical Proficiency
{tech_proficiency}
        """

    def build_system_prompt(self):
        return """
        You are Kyle, the Strategic Storyteller. You transform Master CVs into Hero Narratives.
        You MUST follow the Prague-Day Delivery Standard:
        - 40-character underscores for lines.
        - Pipe-delimited metrics bar.
        - "Strategic Impact" headers for each major role.
        - Focus on 0-to-1 building and cross-border APAC expertise.
        """

    def _init_rag(self):
        if self._rag is not None:
            return
        try:
            import sys
            if RAG_INTEGRATION_PATH not in sys.path:
                sys.path.insert(0, RAG_INTEGRATION_PATH)
            from rag_integration import RAGIntegration
            self._rag = RAGIntegration()
        except Exception:
            self._rag = False

    def rag_query(self, question: str, k: int = 4) -> Optional[dict]:
        self._init_rag()
        if not self._rag:
            return None
        return self._rag.query(question, k=k, show_sources=True)

    def save_output(self, content: str, organization: str, job_title: str) -> str:
        """
        Saves the CV with the sequence: <yymmddhhmm - {Organization} - {job title}>
        """
        import datetime
        timestamp = datetime.datetime.now().strftime("%y%m%d%H%M")
        safe_org = organization.replace(" ", "_")
        safe_title = job_title.replace(" ", "_")
        filename = f"{timestamp} - {safe_org} - {safe_title}.txt"
        
        output_dir = "/mnt/f/Projects/AI_Projects/code/prague-day/data/CVs/"
        if not os.path.exists(output_dir):
            os.makedirs(output_dir)
            
        file_path = os.path.join(output_dir, filename)
        with open(file_path, "w") as f:
            f.write(content)
        return file_path

    def optimize_cv(self, master_cv_data: str, job_description: str) -> str:
        # Implementation logic to parse master_cv and JD, then fill the template
        # (This would call an LLM in a production setup)
        print(f"✍️ [KYLE]: Applying Prague-Day Standard to CV for {self.author}...")
        rag_insights = self.rag_query("What are the most important impact signals for this role?", k=6)
        if rag_insights:
            print("   -> RAG: Using evidence-backed insights from knowledge base")
        return "PRAGUE_DAY_OUTPUT_GENERATED"
