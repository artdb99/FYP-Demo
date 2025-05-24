# chatbot_using_rag.py

from sentence_transformers import SentenceTransformer
from pinecone import Pinecone
import os

# Initialize Pinecone and embedder (do this only once)
pc = Pinecone(api_key="pcsk_5UMeti_URqGVi7gSoy9fSBa6mxnSFSQ5XfS8fjC5gtPzrbU97XhqypVypyYBDLhoH5w3BZ")
index = pc.Index("medicalbooks")
embedder = SentenceTransformer("BAAI/bge-large-en")

def retrieve_context(query, top_k=3):
    """Embed the query and retrieve top-k context chunks from Pinecone."""
    query_vec = embedder.encode([query])[0].tolist()
    results = index.query(vector=query_vec, top_k=top_k, include_metadata=True)
    return [match["metadata"]["text"] for match in results["matches"]]

def generate_rag_response(user_query):
    from openai import OpenAI
    print("[RAG] Received query:", user_query)

    try:
        context_chunks = retrieve_context(user_query)
        print("[RAG] Retrieved context:", context_chunks)

        context = "\n".join(context_chunks)
        prompt = f"Context:\n{context}\n\nUser Question: {user_query}\n\nAnswer:"

        client = OpenAI(
            api_key= "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",
            base_url="https://api.groq.com/openai/v1"
        )

        response = client.chat.completions.create(
            model="deepseek-r1-distill-llama-70b",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7
        )

        print("[RAG] Response received")
        return response.choices[0].message.content

    except Exception as e:
        print("[RAG ERROR]", str(e))
        return "❌ AI backend error: " + str(e)

