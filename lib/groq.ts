import Groq from "groq-sdk";

let groqInstance: Groq | null = null;

export function getGroq(): Groq {
  if (!groqInstance) {
    groqInstance = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });
  }
  return groqInstance;
}

export async function summarizeDiff(
  prTitle: string,
  diff: string
): Promise<{ summary: string; model: string; tokensUsed?: number }> {
  const groq = getGroq();

  // Truncate diff to avoid token limits (roughly 12k chars ≈ 3k tokens)
  const truncatedDiff = diff.length > 12000 ? diff.slice(0, 12000) + "\n...[truncated]" : diff;

  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      {
        role: "system",
        content: `You are a senior software engineer reviewing pull requests.
Summarize the PR diff in clear, plain English for a non-technical stakeholder.
Structure your response as:
**What changed**: (1-2 sentences)
**Why it matters**: (1 sentence about impact)
**Key files**: (bullet list of most important changed files)
**Risk level**: (Low / Medium / High with brief reason)
Be concise. Avoid jargon.`,
      },
      {
        role: "user",
        content: `PR Title: "${prTitle}"\n\nDiff:\n\`\`\`diff\n${truncatedDiff}\n\`\`\``,
      },
    ],
    temperature: 0.3,
    max_tokens: 512,
  });

  const message = completion.choices[0]?.message?.content ?? "No summary generated.";
  return {
    summary: message,
    model: completion.model,
    tokensUsed: completion.usage?.total_tokens,
  };
}

export type PRHealthResult = {
  score: number;
  classification: "Ready for Review" | "Needs More Info" | "Potential Security Risk";
  reasoning: string;
};

export async function analyzePRHealth(
  pr: { title: string; body: string },
  issues: { title: string; body: string }[],
  diff: string
): Promise<PRHealthResult> {
  const groq = getGroq();

  const issueContext = issues.length > 0 
    ? issues.map(i => `Linked Issue: "${i.title}"\nDescription: ${i.body}`).join("\n\n")
    : "No explicitly linked issues found.";

  const truncatedDiff = diff.length > 8000 ? diff.slice(0, 8000) + "\n...[truncated]" : diff;

  const prompt = `You are a senior code reviewer. Analyze the following Pull Request (PR) against its intended purpose (Linked Issues).

PR Title: "${pr.title}"
PR Description: "${pr.body}"

${issueContext}

PR Diff:
\`\`\`diff
${truncatedDiff}
\`\`\`

Evaluate the PR on these 3 criteria:
1. **Relevance**: Does the code actually address the linked issues?
2. **Quality**: Is the code structure sound, logical, and without obvious bugs?
3. **Security**: Are there potential security risks (hardcoded secrets, unsafe patterns)?

Classify the PR as one of:
- "Ready for Review": High relevance, good quality, no security risks.
- "Needs More Info": Low relevance to issues, unclear logic, or missing implementation.
- "Potential Security Risk": Detected unsafe patterns or sensitive data.

Return ONLY a JSON object in this format:
{
  "score": number (0-100),
  "classification": "Ready for Review" | "Needs More Info" | "Potential Security Risk",
  "reasoning": "1-2 sentence explanation"
}`;

  let resText = "{}";
  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.1,
      response_format: { type: "json_object" },
    });
    resText = completion.choices[0]?.message?.content ?? "{}";
  } catch (err) {
    console.error(`[Groq] Health API request failed:`, err);
    return {
      score: 50,
      classification: "Needs More Info",
      reasoning: "Technical error connecting to analysis engine."
    };
  }

  try {
    const cleaned = cleanJson(resText);
    const parsed = JSON.parse(cleaned);
    return {
      score: 50,
      classification: "Needs More Info",
      reasoning: "Analysis complete.",
      ...parsed
    } as PRHealthResult;
  } catch (e) {
    console.error(`[Groq] Failed to parse health response:`, resText, e);
    return {
      score: 50,
      classification: "Needs More Info",
      reasoning: "Analysis failed due to response format error."
    };
  }
}

export type AIDetectionResult = {
  score: number;
  confidence: "Low" | "Medium" | "High";
  reasoning: string[];
  isBot: boolean;
  recommendedAction: string;
};

/**
 * Helper to extract JSON from potentially conversational/markdown LLM responses
 */
function cleanJson(text: string): string {
    // 1. Try to find JSON block between backticks
    const match = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (match) return match[1].trim();
    
    // 2. Fallback: Find anything that looks like a JSON object
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start !== -1 && end !== -1) {
        return text.substring(start, end + 1).trim();
    }
    
    return text.trim();
}

export async function detectAIGeneratedPR(
  pr: { title: string; body: string; additions: number; deletions: number },
  diff: string,
  existingSymbols: string[],
  expertContext: string
): Promise<AIDetectionResult> {
  const groq = getGroq();

  const truncatedDiff = diff.length > 8000 ? diff.slice(0, 8000) + "\n...[truncated]" : diff;
  
  // Extract symbols from the DIFF to check for hallucinations
  const diffSymbolsMatch = Array.from(diff.matchAll(/(?:\.\s+|function\s+|def\s+)([a-zA-Z0-9_$]+)\s*\(/g)).map(m => m[1]);
  const uniqueDiffSymbols = Array.from(new Set(diffSymbolsMatch)).slice(0, 50);

  const prompt = `You are a cybersecurity expert and code forensic analyst specializing in bot detection. 
Determine the probability that the following Pull Request (PR) was generated by an LLM (Large Language Model) rather than a human developer.

### PR CONTEXT
Title: "${pr.title}"
Description: "${pr.body}"
Scale: +${pr.additions} / -${pr.deletions} lines changed

### AUTHOR EXPERTISE (Previous History)
${expertContext}

### SYMBOLS IN PR DIFF
${uniqueDiffSymbols.join(", ")}

### KNOWN SYMBOLS IN REPOSITORY (RAG Context)
${existingSymbols.join(", ")}

### FULL DIFF
\`\`\`diff
${truncatedDiff}
\`\`\`

### CRITICAL DETECTION CRITERIA:
1. **Hallucination Detection (EXTREME WEIGHT)**: Compare 'SYMBOLS IN PR DIFF' against 'KNOWN SYMBOLS IN REPOSITORY'. If the PR uses functions or classes that DO NOT exist in the repository context (case-insensitive), it is a definitive hallucination.
2. **Expertise Mismatch**: Check 'AUTHOR EXPERTISE'. If the author has 0 commits in the domain they are modifying (e.g., changing SQL logic without DB history), and the code is complex, this is a strong sign of an AI bypass.
3. **Linguistic Markers**: 
   - LLMs use phrases like "This PR introduces...", "Key changes include...", or "The following modifications were made...".
   - Perfect spelling, redundant bullet points, and high verbosity for simple changes are red flags.
4. **Empty Knowledge Gap**: If the PR includes logic that assumes external APIs or library functions that are not imported or present in the repo, flag it.
5. **Historical Disconnect**: Human developers often mention previous discussions, issues, or specific project quirks. LLMs provide a "vacuum" summary.

Return ONLY a JSON object:
{
  "score": number (0-100, where 100 is definitely AI),
  "confidence": "Low" | "Medium" | "High",
  "reasoning": ["point 1", "point 2", ...],
  "isBot": boolean (true if score > 70),
  "recommendedAction": "Flag for Manual Review" | "Request Human Verification" | "Safe to Proceed"
}`;
  let resText = "{}";
  try {
    console.log(`[Groq] Requesting analysis from model: llama-3.3-70b-versatile`);
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.1,
      response_format: { type: "json_object" },
    });
    resText = completion.choices[0]?.message?.content ?? "{}";
  } catch (err) {
    console.error(`[Groq] API request failed:`, err);
    return {
      score: 1,
      confidence: "Low",
      reasoning: ["AI analysis request failed. Please check GROQ_API_KEY or connection."],
      isBot: false,
      recommendedAction: "Technical Failure - Review Manually"
    };
  }

  try {
    const cleaned = cleanJson(resText);
    return JSON.parse(cleaned) as AIDetectionResult;
  } catch (e) {
    console.error(`[Groq] Failed to parse response:`, resText, e);
    return {
      score: 1,
      confidence: "Low",
      reasoning: ["AI analysis completed but result parsing failed. See logs."],
      isBot: false,
      recommendedAction: "Technical Failure - Review Manually"
    };
  }
}
