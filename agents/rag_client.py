#!/usr/bin/env python3
"""
Lightweight RAG client for Career-Coach agents (Kyle/Simon).
Tries external RAG integration first, falls back to local knowledge files.
"""
import os
from typing import Optional
from pathlib import Path

RAG_INTEGRATION_PATH = os.environ.get(
    "RAG_INTEGRATION_PATH",
    str(Path(__file__).parent.parent / ".agents")
)


class RAGClient:
    def __init__(self, llm_provider: Optional[str] = None, knowledge_path: Optional[str] = None):
        """
        Initialize RAGClient

        Args:
            llm_provider: LLM provider (claude, openai, gemini, ollama)
            knowledge_path: Optional local knowledge path. If not provided, tries external path first.
        """
        self.llm_provider = llm_provider
        self.knowledge_path = knowledge_path
        self._rag = None

    def _init_rag(self):
        if self._rag is not None:
            return

        # Try 1: External RAG integration (if available)
        try:
            import sys
            if RAG_INTEGRATION_PATH not in sys.path:
                sys.path.insert(0, RAG_INTEGRATION_PATH)
            from rag_integration import RAGIntegration
            self._rag = RAGIntegration(llm_provider=self.llm_provider)
            print(f"✓ Using external RAG integration from {RAG_INTEGRATION_PATH}")
            return
        except Exception as e:
            pass  # External RAG not available, try local

        # Try 2: Local RAG with provided knowledge path
        if self.knowledge_path:
            try:
                from local_rag import LocalRAGClient
                self._rag = LocalRAGClient(self.knowledge_path, llm_provider=self.llm_provider)
                return
            except Exception as e:
                pass  # Local RAG with provided path failed

        # Failed to initialize any RAG
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
        return self._rag.ask(question, k=k, show_sources=show_sources)

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
