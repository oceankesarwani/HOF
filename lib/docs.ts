import fs from "fs/promises";
import path from "path";
import { embedDocument } from "./chroma";

/**
 * Scans the project for Markdown files and indexes them into ChromaDB.
 */
export async function indexProjectDocs(baseDir: string = ".") {
  const docs = await findMarkdownFiles(baseDir);
  console.log(`[Docs] Found ${docs.length} markdown files for indexing.`);

  for (const doc of docs) {
    const content = await fs.readFile(doc, "utf-8");
    const relativePath = path.relative(baseDir, doc);
    
    // Chunk content by section (splitting by headers)
    const chunks = chunkMarkdown(content);
    
    for (let i = 0; i < chunks.length; i++) {
      const id = `${relativePath}-chunk-${i}`;
      await embedDocument(id, chunks[i], {
        path: relativePath,
        chunk: i,
        type: "documentation"
      });
    }
  }
  
  return { indexedFiles: docs.length };
}

async function findMarkdownFiles(dir: string): Promise<string[]> {
  const results: string[] = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    // Ignore node_modules, git, and other common build dirs
    if (entry.isDirectory()) {
      if (["node_modules", ".git", ".next", ".gemini", "chroma_data"].includes(entry.name)) continue;
      results.push(...(await findMarkdownFiles(fullPath)));
    } else if (entry.isFile() && /\.(md|mdx)$/i.test(entry.name)) {
      results.push(fullPath);
    }
  }

  return results;
}

function chunkMarkdown(content: string): string[] {
  // Simple chunking by headers
  const chunks = content.split(/(?=^#+ )/m).filter(c => c.trim().length > 0);
  
  // If no headers, just return the whole thing (or split into 1000 char blocks if huge)
  if (chunks.length === 1 && chunks[0].length > 2000) {
     const subChunks: string[] = [];
     for (let i = 0; i < chunks[0].length; i += 1500) {
       subChunks.push(chunks[0].substring(i, i + 1500));
     }
     return subChunks;
  }
  
  return chunks;
}
