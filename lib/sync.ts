import { getPRDiff, createPRComment } from "./github";
import { extractChangedFunctions } from "./ast";
import { queryDocuments } from "./chroma";

/**
 * Checks a PR for function changes and compares them against repository documentation.
 * If a mismatch is likely, posts a "Knowledge Bridge" sticker (comment).
 */
export async function checkDocSync(prNumber: number) {
  const diff = await getPRDiff(prNumber);
  const changedFunctions = extractChangedFunctions(diff);
  
  if (changedFunctions.length === 0) {
    console.log(`[Sync] PR #${prNumber}: No function changes detected.`);
    return { status: "no_functions_detected" };
  }

  console.log(`[Sync] PR #${prNumber}: Analyzing ${changedFunctions.length} functions:`, changedFunctions);
  
  const stickers: string[] = [];

  for (const funcName of changedFunctions) {
    // Query ChromaDB for documentation containing this function name
    const matches = await queryDocuments(funcName, 3);
    
    // Filtter matches by similarity. In ChromaDB proxy, score is often high for relevant docs.
    // For now, any relevant match mentioning the function name is a candidate.
    const relevantMatches = matches.filter((m: any) => 
       m.document.toLowerCase().includes(funcName.toLowerCase())
    );

    if (relevantMatches.length > 0) {
      const bestMatch = relevantMatches[0];
      const docPath = bestMatch.metadata.path;
      
      stickers.push(`- I noticed you changed the \`${funcName}()\` function. You might need to update the documentation in **${docPath}** which mentions this function!`);
    }
  }

  if (stickers.length > 0) {
    const commentBody = `### 🌉 CommitGuard Knowledge Bridge\n\nIt looks like your changes might affect existing documentation:\n\n${stickers.join("\n")}\n\n*Keeping documentation in sync prevents technical debt!*`;
    
    await createPRComment(prNumber, commentBody);
    return { status: "stickers_posted", count: stickers.length };
  }

  return { status: "no_relevant_docs_found" };
}
