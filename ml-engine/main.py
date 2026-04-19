from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import torch
from transformers import pipeline
from sentence_transformers import SentenceTransformer
import chromadb
from typing import List, Dict, Any

app = FastAPI(title="CommitGuard ML Engine")

# --- Model Initialization ---
# Note: First startup will download models locally.
try:
    print("Loading Sentence Transformer...")
    # Using small/fast model for embeddings
    embedder = SentenceTransformer('all-MiniLM-L6-v2')
    
    print("Loading Code Classifier...")
    # In production, use microsoft/codebert-base or a fine-tuned Checkpoint.
    # We load a zero-shot or sentiment pipeline purely as a placeholder for the fine-tuned model
    classifier = pipeline("text-classification", model="distilbert-base-uncased-finetuned-sst-2-english")
    
    print("Initializing ChromaDB...")
    chroma_client = chromadb.PersistentClient(path="./chroma_data")
    docs_collection = chroma_client.get_or_create_collection(name="repo_docs")
    
    print("ML Engine Ready")
except Exception as e:
    print(f"Error loading models: {e}")

# --- Schemas ---
class DiffPayload(BaseModel):
    diff: str

class EmbedPayload(BaseModel):
    id: str
    text: str
    metadata: Dict[str, Any]

class QueryPayload(BaseModel):
    query: str
    top_k: int = 3
    where: Dict[str, Any] = None

# --- Endpoints ---

@app.get("/health")
def health_check():
    return {"status": "ok", "models_loaded": embedder is not None}

@app.post("/api/classify")
def classify_diff(payload: DiffPayload):
    """
    Classifies a PR Diff into Risk categories. 
    In the real implementation this passes through the fine-tuned CodeBERT.
    """
    if not payload.diff:
        raise HTTPException(status_code=400, detail="Empty diff provided")
        
    # Truncate for model constraints
    truncated = payload.diff[:512]
    
    # Placeholder classification logic
    # Real logic: scores = codebert(truncated)
    results = classifier(truncated)
    scored_label = results[0]['label'] # e.g. POSITIVE / NEGATIVE
    
    # IMPROVED: De-escalate risk for cosmetic/small changes
    diff_text = payload.diff.lower()
    is_cosmetic = any(x in diff_text for x in ["color", "hex", "#", "background", "font", "padding"])
    is_short = len(payload.diff) < 100

    if is_cosmetic or is_short:
        risk = "Low"
    else:
        # Map mock labels to our system states
        risk = "Low" if scored_label == "POSITIVE" else "High"
    
    return {
        "status": "success",
        "risk_level": risk,
        "raw_score": results[0]['score'],
        "domain": "General" # Extracted via AST/Regex in real pipeline
    }

@app.post("/api/rag/embed")
def embed_document(payload: EmbedPayload):
    """Generates embedding for a document chunk and saves to Chroma"""
    embedding = embedder.encode(payload.text).tolist()
    
    docs_collection.add(
        ids=[payload.id],
        embeddings=[embedding],
        documents=[payload.text],
        metadatas=[payload.metadata]
    )
    
    return {"status": "success", "id": payload.id, "dim": len(embedding)}

@app.post("/api/rag/query")
def query_documents(payload: QueryPayload):
    """Searches for similar doc chunks with optional metadata filtering"""
    query_emb = embedder.encode(payload.query).tolist()
    
    results = docs_collection.query(
        query_embeddings=[query_emb],
        n_results=payload.top_k,
        where=payload.where
    )
    
    return {"status": "success", "results": results}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
