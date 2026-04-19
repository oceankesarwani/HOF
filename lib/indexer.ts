import fs from "fs/promises";
import path from "path";
import { embedDocument } from "./chroma";

/**
 * Scans the project for source code files and indexes function/class names into ChromaDB.
 */
export async function indexCodeSymbols(baseDir: string = ".") {
  const files = await findCodeFiles(baseDir);
  console.log(`[Indexer] Found ${files.length} code files for symbol extraction.`);

  let totalSymbols = 0;

  for (const file of files) {
    const content = await fs.readFile(file, "utf-8");
    const relativePath = path.relative(baseDir, file);
    
    // Extract symbols based on file extension
    const symbols = extractSymbols(content, file);
    totalSymbols += symbols.length;
    
    for (const symbol of symbols) {
      const id = `symbol-${relativePath}-${symbol}`;
      await embedDocument(id, symbol, {
        path: relativePath,
        symbol: symbol,
        type: "code_symbol"
      });
    }
  }
  
  return { indexedFiles: files.length, totalSymbols };
}

async function findCodeFiles(dir: string): Promise<string[]> {
  const results: string[] = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      if (["node_modules", ".git", ".next", ".gemini", "chroma_data", "dist", "build"].includes(entry.name)) continue;
      results.push(...(await findCodeFiles(fullPath)));
    } else if (entry.isFile() && /\.(ts|tsx|js|jsx|py)$/i.test(entry.name)) {
      results.push(fullPath);
    }
  }

  return results;
}

function extractSymbols(content: string, filename: string): string[] {
  const symbols = new Set<string>();
  const isPython = filename.endsWith(".py");

  if (isPython) {
    // Python def and class
    const pyRegex = /^\s*(?:def|class)\s+([a-zA-Z0-9_$]+)\s*[:(]/gm;
    let match;
    while ((match = pyRegex.exec(content)) !== null) {
      if (match[1]) symbols.add(match[1]);
    }
  } else {
    // JS/TS function and class
    const jsRegex = /^\s*(?:export\s+)?(?:async\s+)?(?:function|class)\s+([a-zA-Z0-9_$]+)\s*[(<{]/gm;
    const arrowRegex = /^\s*(?:export\s+)?(?:const|let|var)\s+([a-zA-Z0-9_$]+)\s*=\s*(?:async\s+)?(?:\([^)]*\)|[a-zA-Z0-9_$]+)\s*=>/gm;
    
    let match;
    while ((match = jsRegex.exec(content)) !== null) {
      if (match[1]) symbols.add(match[1]);
    }
    while ((match = arrowRegex.exec(content)) !== null) {
      if (match[1]) symbols.add(match[1]);
    }
  }
  
  return Array.from(symbols);
}
