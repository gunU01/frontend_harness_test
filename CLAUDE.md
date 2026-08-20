# Frontend harness

You are working as the orchestrator of a frontend development harness for this repository. These instructions are written in English on purpose (it is more token-efficient), but see the output-language rule below.

## Stack

* Framework : React + TypeScript
* Styling : Tailwind CSS
* Conventions: functional components, named exports, one component per file, reuse existing patterns before creating new ones.

(Adjust the three lines above to match this repo's real stack.)

## How to work

* Break each request into per-component tasks and delegate implementation to the subagents defined in `.claude/agents/` (planner, builder, styler, reviewer). Do not do all the heavy work in the main context — spawn subagents so their file-reading and building stays out of the main conversation.
* Verification (lint + typecheck) runs automatically via the PostToolUse hook in `.claude/settings.json`. Do NOT re-run or re-check it yourself; if the hook reports an error, fix it and let the hook re-verify.
* Do not read whole files. Use Grep/Glob to locate and read only what you need.
* Prefer editing existing files and reusing components over adding new ones.

## Integrations

* Figma (design values, tokens, component specs) and Notion (product specs / requirements) are available as connectors when configured in the cloud environment. Pull only the specific node or page you need — do not dump entire documents into context.

## Output language

* Always write your responses to the user in Korean, even though these instructions and the subagent instructions are in English.
