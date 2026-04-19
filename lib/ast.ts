/**
 * Lightweight AST-like parser to extract changed function names from Git diffs.
 */

export function extractChangedFunctions(diff: string): string[] {
  const functions = new Set<string>();
  
  // Look for lines that look like function definitions and were added (+)
  // Javascript/Typescript patterns:
  // function name(...)
  // const name = (...) =>
  // name(...) { (class methods)
  // Python patterns:
  // def name(...):
  
  const lines = diff.split("\n");
  
  const jsFunctionRegex = /\+\s*(?:async\s+)?function\s+([a-zA-Z0-9_$]+)\s*\(/;
  const jsArrowRegex = /\+\s*(?:const|let|var)\s+([a-zA-Z0-9_$]+)\s*=\s*(?:async\s+)?(\([^)]*\)|[a-zA-Z0-9_$]+)\s*=>/;
  const jsMethodRegex = /\+\s*([a-zA-Z0-9_$]+)\s*\([^)]*\)\s*\{/;
  const pythonDefRegex = /\+\s*def\s+([a-zA-Z0-9_$]+)\s*\(/;

  for (const line of lines) {
    // Only look at added lines (start with + but not +++)
    if (line.startsWith("+") && !line.startsWith("+++")) {
      const jsMatch = line.match(jsFunctionRegex);
      if (jsMatch) functions.add(jsMatch[1]);

      const arrowMatch = line.match(jsArrowRegex);
      if (arrowMatch) functions.add(arrowMatch[1]);

      const methodMatch = line.match(jsMethodRegex);
      if (methodMatch) functions.add(methodMatch[1]);

      const pyMatch = line.match(pythonDefRegex);
      if (pyMatch) functions.add(pyMatch[1]);
    }
  }

  return Array.from(functions);
}
