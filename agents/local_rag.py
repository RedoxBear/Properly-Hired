#!/usr/bin/env python3
"""
Local RAG Implementation for Kyle and Simon
Uses local knowledge files instead of external RAG integration
"""

import os
import re
from pathlib import Path
from typing import Optional, Dict, List, Any
import json


class LocalRAG:
    """
    Lightweight RAG implementation that loads and searches local knowledge files
    """

    def __init__(self, knowledge_path: str, llm_provider: Optional[str] = None):
        """
        Initialize LocalRAG with a knowledge directory path

        Args:
            knowledge_path: Path to directory containing .txt, .md files
            llm_provider: LLM provider name (for compatibility)
        """
        self.knowledge_path = Path(knowledge_path)
        self.llm_provider = llm_provider
        self.documents = []
        self.index = {}
        self._load_documents()

    def _load_documents(self):
        """Load all knowledge files from the directory"""
        if not self.knowledge_path.exists():
            print(f"⚠️ Knowledge path not found: {self.knowledge_path}")
            return

        file_count = 0
        try:
            for file_path in self.knowledge_path.glob("*"):
                # Support .txt and .md files
                if file_path.suffix in ['.txt', '.md']:
                    try:
                        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                            content = f.read()
                            if content.strip():
                                doc = {
                                    'source': file_path.name,
                                    'content': content,
                                    'full_path': str(file_path)
                                }
                                self.documents.append(doc)
                                file_count += 1
                                # Index by keywords
                                self._index_document(doc)
                    except Exception as e:
                        print(f"⚠️ Error loading {file_path.name}: {e}")

            if file_count > 0:
                print(f"✓ LocalRAG loaded {file_count} knowledge files from {self.knowledge_path.name}/")
        except Exception as e:
            print(f"⚠️ Error loading documents: {e}")

    def _index_document(self, doc: Dict):
        """Create keyword index for a document"""
        # Extract keywords from title and content
        keywords = self._extract_keywords(doc['content'])
        for keyword in keywords:
            if keyword not in self.index:
                self.index[keyword] = []
            self.index[keyword].append(doc['source'])

    def _extract_keywords(self, text: str, limit: int = 50) -> List[str]:
        """Extract important keywords from text"""
        # Split into words and filter
        words = re.findall(r'\b\w+\b', text.lower())

        # Common stopwords to skip
        stopwords = {
            'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
            'of', 'with', 'by', 'from', 'up', 'about', 'into', 'through', 'is',
            'was', 'are', 'be', 'been', 'being', 'has', 'have', 'had', 'do',
            'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might',
            'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she',
            'it', 'we', 'they', 'what', 'which', 'who', 'when', 'where', 'why',
            'how', 'all', 'each', 'every', 'both', 'few', 'more', 'most', 'other',
            'some', 'such', 'no', 'nor', 'not', 'only', 'same', 'so', 'than', 'too'
        }

        # Filter out stopwords and very short words
        keywords = set()
        for word in words:
            if word not in stopwords and len(word) > 2:
                keywords.add(word)

        return list(keywords)[:limit]

    def is_ready(self) -> bool:
        """Check if RAG is ready (has documents loaded)"""
        return len(self.documents) > 0

    def search(self, query: str, k: int = 4) -> List[Dict]:
        """
        Search knowledge base for relevant passages

        Args:
            query: Search query string
            k: Number of results to return

        Returns:
            List of matching document passages
        """
        if not self.is_ready():
            return []

        query_keywords = self._extract_keywords(query)
        results = []

        # Score each document based on keyword matches
        doc_scores = {}
        for doc in self.documents:
            score = 0
            for keyword in query_keywords:
                # Count occurrences in document
                score += doc['content'].lower().count(keyword)
            if score > 0:
                doc_scores[doc['source']] = (score, doc)

        # Sort by score and extract top k
        sorted_docs = sorted(doc_scores.items(), key=lambda x: x[1][0], reverse=True)

        for _, (score, doc) in sorted_docs[:k]:
            # Extract relevant passages (paragraphs containing keywords)
            passages = self._extract_passages(doc['content'], query_keywords, max_length=300)
            for passage in passages[:2]:  # Up to 2 passages per doc
                results.append({
                    'source': doc['source'],
                    'content': passage,
                    'score': score
                })

        return results[:k]

    def _extract_passages(self, content: str, keywords: List[str], max_length: int = 300) -> List[str]:
        """Extract passages containing keywords"""
        passages = []

        # Split into paragraphs
        paragraphs = content.split('\n\n')

        for para in paragraphs:
            # Check if paragraph contains any keywords
            if any(kw in para.lower() for kw in keywords):
                # Clean and truncate
                cleaned = para.strip()
                if cleaned:
                    passages.append(cleaned[:max_length])

        return passages

    def ask(self, question: str, k: int = 4, show_sources: bool = True) -> Optional[Dict]:
        """
        Query the knowledge base and return a synthesized answer

        Args:
            question: Question to ask
            k: Number of source passages to use
            show_sources: Whether to include sources in response

        Returns:
            Dict with 'answer' and optionally 'sources'
        """
        if not self.is_ready():
            return None

        # Search for relevant passages
        matches = self.search(question, k=k)

        if not matches:
            return {
                'answer': 'No relevant information found in knowledge base.',
                'sources': [] if show_sources else None
            }

        # Synthesize answer from top passages
        answer_parts = []
        sources = []

        for match in matches:
            answer_parts.append(match['content'])
            if show_sources and match['source'] not in sources:
                sources.append({'source': match['source']})

        answer = '\n\n'.join(answer_parts)

        result = {'answer': answer}
        if show_sources:
            result['sources'] = sources

        return result


class LocalRAGClient:
    """
    Compatible wrapper for LocalRAG to replace the external RAGClient
    """

    def __init__(self, knowledge_path: str, llm_provider: Optional[str] = None):
        """
        Initialize LocalRAGClient with a knowledge directory

        Args:
            knowledge_path: Path to directory containing knowledge files
            llm_provider: LLM provider (for compatibility, not used)
        """
        self.llm_provider = llm_provider
        try:
            self._rag = LocalRAG(knowledge_path, llm_provider)
        except Exception as e:
            print(f"⚠️ LocalRAGClient initialization error: {e}")
            self._rag = None

    def is_ready(self) -> bool:
        """Check if RAG is ready"""
        if not self._rag:
            return False
        return self._rag.is_ready()

    def ask(self, question: str, k: int = 4, show_sources: bool = True) -> Optional[Dict]:
        """Ask a question"""
        if not self._rag:
            return None
        return self._rag.ask(question, k=k, show_sources=show_sources)

    def search(self, query: str, k: int = 4) -> List[Dict]:
        """Search knowledge base"""
        if not self._rag:
            return []
        return self._rag.search(query, k=k)


if __name__ == "__main__":
    # Test the local RAG
    kb_path = "/root/projects/prague-day/knowledge/kyle"
    rag = LocalRAGClient(kb_path)

    if rag.is_ready():
        print("✓ LocalRAG ready")
        result = rag.ask("What are best practices for resume writing?", k=3, show_sources=True)
        if result:
            print(f"\nAnswer: {result['answer'][:500]}...")
            if result.get('sources'):
                print(f"\nSources: {[s['source'] for s in result['sources']]}")
    else:
        print("⚠️ LocalRAG not ready - no knowledge files loaded")
