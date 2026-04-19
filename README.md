<div align="center">
  <img src="https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png" alt="CommitGuard Logo" width="100" height="100">
  <h1>CommitGuard</h1>
  <p><b>Intelligently securing, delegating, and analyzing your open-source Pull Requests.</b></p>
</div>

---

## 🛑 The Maintainer's Dilemma

Maintaining a large-scale repository or a fast-paced open-source project is exhausting. From a maintainer's perspective, handling Pull Requests (PRs) poses several critical bottlenecks:
1. **The Context Gap:** Finding the right person to review a complex architectural change is tedious. Maintainers often default to guessing, tagging the wrong engineers, or manually crawling `git blame`.
2. **Information Overload:** Understanding an 800-line diff without any human-readable context requires painful cognitive load and time.
3. **Spam & Bot Floods:** Sifting through low-quality contributions, AI-generated spam PRs, and improperly formatted code wastes hours of engineering time.
4. **The Non-Tech Stakeholder Gap:** Business owners, product managers, and leadership often lack deep technical knowledge but still need to track repository progress. Raw pull requests make it impossible for them to intuitively understand what is actually being built or fixed.

## 🛡️ Enter CommitGuard

**CommitGuard** is an AI-powered GitHub repository intelligence platform tailored for open-source maintainers and engineering leads.

Instead of manually playing traffic cop, CommitGuard acts as an autonomous assistant. It intelligently bridges the gap between raw code changes and human operations by seamlessly evaluating PR health, aggressively catching AI spam, synthesizing code diffs into plain English, and autonomously matching incoming pull requests with the absolute best reviewer based on historical context and current workload.

## ✨ Core Features

### 🎯 1. AI Contributor Matchmaker
Never manually assign a PR again. CommitGuard scans your entire repository’s commit history, file extensions, and diff complexity to assign the perfect Subject Matter Expert (SME). 
- Uses **Llama-3 (Groq)** to reason over domain alignment. 
- Analyzes cross-repository expertise.
- Enforces strict administrative API fallbacks to ensure only authorized maintainers are pinged.

### 📝 2. Intelligent PR Summarizer
Drowning in undocumented PRs? CommitGuard fetches the raw Git diffs and feeds them through an LLM to instantly generate structured, plain-English summaries. This completely bridges the communication gap, enabling non-technical stakeholders, business owners, and managers to easily digest and understand the exact purpose of complex code implementations without needing to read a single line of code.

### 🤖 3. AI Spam & Bot Detection
Protect your `main` branch. The bot detection layer actively analyzes PR payloads to verify whether the incoming code is human-generated or low-effort AI spam, rejecting malicious payloads before review time is wasted.

### 🩺 4. Automated Health Scoring
Get a bird’s-eye view of a PR's structural integrity. Before deep reviews begin, PRs are algorithmically classified (e.g., *Ready for Review*, *Needs More Info*), shielding maintainers from reviewing broken or incomplete contributions.

### ⚡ 5. Real-time Webhook Live Feed
CommitGuard establishes live WebSocket / Webhooks with your GitHub repository, pushing activity data directly to your dynamic command dashboard without manual page refreshes.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- NPM, Yarn, or pnpm
- Valid GitHub API Token

### Installation

1. First, clone the repository and navigate into the directory:
   ```bash
   git clone https://github.com/your-org/CommitGuard.git
   cd CommitGuard
   ```

2. Install the necessary dependencies:
   ```bash
   npm install
   ```

3. Configure your environmental variables utilizing `.env.local` based on `.env.example`.

4. Start the development server:
   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) with your browser to witness the operations dashboard.
