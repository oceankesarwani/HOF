/**
 * ML Engine ChromaDB Integration
 * Proxies calls to the Python FastAPI ML microservice.
 */
const ML_ENGINE_URL = process.env.ML_ENGINE_URL || "http://localhost:8000";

export interface EmbedResult {
  id: string;
  text: string;
  metadata: Record<string, unknown>;
  embedding: number[]; // mock — real embeddings need an embedding model
}

export interface QueryResult {
  id: string;
  document: string;
  score: number;
  metadata: Record<string, unknown>;
}

const MOCK_COLLECTION = "commit-guard-code";

/**
 * Embed a code snippet into ChromaDB via ML Engine
 */
export async function embedDocument(
  id: string,
  text: string,
  metadata: Record<string, unknown>
): Promise<{ id: string; dim: number }> {
  const res = await fetch(`${ML_ENGINE_URL}/api/rag/embed`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, text, metadata }),
  });
  
  if (!res.ok) {
    throw new Error(`ML Engine failed: ${await res.text()}`);
  }
  
  return res.json();
}

/**
 * Query ChromaDB for similar doc chunks via ML Engine
 */
export async function queryDocuments(
  queryText: string,
  topK: number = 3,
  where: any = null
): Promise<any> {
  const res = await fetch(`${ML_ENGINE_URL}/api/rag/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ 
      query: queryText, 
      top_k: topK, 
      ...(where && { where }) 
    }),
  });

  if (!res.ok) {
    throw new Error(`ML Engine query failed: ${await res.text()}`);
  }

  const data = await res.json();
  return data.results;
}

export const CHROMA_STATUS = {
  connected: true,
  message: "Connected to Python ML Engine via HTTP",
  collection: "repo_docs",

  docsUrl: "https://docs.trychroma.com/getting-started",
};
