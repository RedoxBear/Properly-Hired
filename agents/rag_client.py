#!/usr/bin/env python3
"""
Lightweight RAG client for Career-Coach agents (Kyle/Simon).
Wraps the shared .agents/rag_integration.py helper.
"""
from typing import Optional

RAG_INTEGRATION_PATH = "/mnt/f/Projects/AI_Projects/.agents"


class RAGClient:
    def __init__(self, llm_provider: Optional[str] = None):
        self.llm_provider = llm_provider
        self._rag = None

    def _init_rag(self):
        if self._rag is not None:
            return
        try:
            import sys
            if RAG_INTEGRATION_PATH not in sys.path:
                sys.path.insert(0, RAG_INTEGRATION_PATH)
            from rag_integration import RAGIntegration
            self._rag = RAGIntegration(llm_provider=self.llm_provider)
        except Exception:
            self._rag = False

    def is_ready(self) -> bool:
        self._init_rag()
        if not self._rag:
            return False
        return self._rag.is_ready()

    def ask(self, question: str, k: int = 4, show_sources: bool = True) -> Optional[dict]:
        self._init_rag()
        if not self._rag:
            return None
        return self._rag.query(question, k=k, show_sources=show_sources)

    def search(self, query: str, k: int = 4):
        self._init_rag()
        if not self._rag:
            return []
        return self._rag.search(query, k=k)


def quick_answer(question: str, k: int = 4, llm_provider: Optional[str] = None) -> Optional[str]:
    client = RAGClient(llm_provider=llm_provider)
    result = client.ask(question, k=k, show_sources=False)
    if not result:
        return None
    return result.get("answer")


if __name__ == "__main__":
    client = RAGClient()
    if not client.is_ready():
        print("RAG system not ready. Run ingest.py in rag-system.")
    else:
        result = client.ask("What is the main topic?", k=4)
        if result:
            print(result.get("answer", "")[:500])
