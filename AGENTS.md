# Research Journey - working guide

This repository is a personal research notebook. Keep it clear, factual, and useful for later reading rather than writing it like a course website.

## Project and publishing

- The site is a Vite/React static site. Research entries live in `src/data.ts`; rendering is in `src/App.tsx`; visual rules are in `src/styles.css`.
- Each paper has one independent public page at `/weeks/<slug>` and its original PDF lives in `public/papers/`.
- `/adminzzz` is intentionally unauthenticated and browser-local. It is for private drafting only; it does not publish shared changes.
- After every requested site change, run `npm run check` and `npm run build`, deploy production with `npx --yes netlify deploy --prod --dir dist`, then commit and push to `main`. The user explicitly requested automatic Git pushes.
- Production site: `https://aircollides-research.netlify.app`.
- Do not introduce Cloudflare, a backend, authentication, or database unless the user explicitly asks.

## Writing style for paper notes

- Write in plain, direct English. Explain technical ideas before judging them.
- Keep one idea per paragraph. Use informative headings, not generic headings such as “Analysis”.
- Start paper pages with a `Paper overview` containing an abbreviation and a short factual summary.
- Separate these clearly:
  - What the paper does and reports.
  - The user’s interpretation, when supplied.
  - Critical feedback/limitations. Label critique as a limitation or feedback; do not present it as a result from the paper.
- Prefer concrete details: number of robots, sensors, timing, experimental setting, metrics, baselines, and reported outcomes.
- When the user asks a question, add it to a `Q&A` table with a direct answer. State the distinction between measured evidence and an inference.
- Do not overclaim. If a paper does not evaluate an issue (for example, packet loss, full round-trip latency, physical robots, or state-of-the-art baselines), say that it is not established.
- Use paper PDFs provided in `public/papers/` as the primary source. Do not invent details or imply that a testbed is simulated/physical beyond what the paper states.

## Status convention

Every paper entry should include a `status` block. The sidebar automatically mirrors the status with a colored dot, title, and entry number.

| Status | Meaning |
| --- | --- |
| `red` | Not read yet |
| `green` | Okay, very good |
| `yellow` | In progress; questions remain |
| `pink` | Very important |

Do not use a color as a quality judgment unless the user has assigned it. The selected page can remain underlined; status color must remain visible.

## Diagrams and tables

- Use Mermaid when a system path, communication loop, or multi-component relationship is easier to understand visually.
- Label arrows with what moves (for example, `UDP observation`, `real wireless uplink`, or `returned action`).
- For hybrid systems, explicitly separate `Virtual` from `Physical` components. Explain what is real hardware, what is simulation, and what is measured.
- In O-RACES diagrams, retain the established color language unless the user requests otherwise: virtual robot purple, modem orange, O-RU/radio blue, O-DU/O-CU/O-RACES green, AI Edge Cloud pink, competing traffic yellow.
- Use tables for definitions, metrics, real-vs-virtual comparisons, and Q&A. Keep cells readable rather than cramming multiple unrelated claims into one cell.

## Current O-RACES note conventions

- O-RACES is a hybrid experiment: virtual Unitree H1 physics/sensors/walking in Isaac Sim; physical modems, indoor Open RAN, radio scheduling, and edge hardware in the loop.
- The virtual robot sends a control observation every 6.67 ms (150 Hz); the AI Edge Cloud runs the PPO actor and returns a joint action.
- Do not call the reported 6.3–7.6 ms 16-robot result a full round-trip latency: the paper reports it as one-way uplink application latency.
- Distinguish the two learned components: the PPO locomotion controller runs at the AI Edge Cloud; the DLinear traffic predictor supports O-RACES near the O-DU.
- Retain the core critique: comparisons against reactive Round Robin and static over-provisioning show a useful tradeoff, but do not establish superiority over newer learned/predictive/channel-aware schedulers.

## Adding a new paper

1. Copy the source PDF into `public/papers/` using a stable lowercase kebab-case filename.
2. Add a published `Week` in `src/data.ts` with a unique number and slug, plus an `Open PDF` resource block and a status block.
3. Add the overview, definitions, summary, evidence/metrics, limitations, and a notes-ready section. Use Mermaid only where it materially clarifies the paper.
4. Verify the type check/build, deploy, commit, and push.
