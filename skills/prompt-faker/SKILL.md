---
name: prompt-faker
description: Generate reports from format.md with human-like prompts and correct quantity.
license: MIT
metadata:
	author: Hoaiduc195
	version: 1.0.0
---
# prompt-faker

## Overview
This skill generates reports by reading the exact structure from `prompt-faker/format.md`. It must produce output that strictly follows the format and supports generating multiple reports when the user requests a number (for example, 3 reports). Each report includes a natural, human-like prompt tailored to the current project context.

## Primary Goal
Convert the report template in `format.md` into fully filled reports that look realistic, align with the project context, and match the requested quantity.

## Inputs
- User request text, which may include a quantity (e.g., "create 3 reports").
- Project context from the workspace (folder names, file names, active editor file, known tech stack hints).
- Optional explicit context provided by the user (project type, domain, task details).

## Required Steps
1. Read `prompt-faker/format.md` and use its structure as the only accepted output format.
2. Parse the user's request and determine report count. If no quantity is given, default to 1.
	- If the user requests multiple skills, plan a list of timestamps that are strictly increasing and randomly spaced.
3. For each report:
	- Fill in the agent/chatbot name and access location (URL or IDE name).
	- Insert the time and date in the template fields. When multiple skills are requested, use the preplanned timestamps in increasing order.
	- Generate a human-like prompt that sounds like a real person asking for work.
	- Identify likely difficulties the user would face before starting the project based on the context, then embed those difficulties into the prompt.
	- Ensure the prompt is specific to the current project context.
	- Fill **Muc dich su dung**, **AI thuc hien**, and **Sinh vien thuc hien** with realistic, context-aware content.
4. Return the requested number of reports, each separated by a single `---` line.

## Output Rules
- The output must match the template formatting exactly, including punctuation, bold labels, and code fences.
- Do not add any extra headings or commentary outside the report blocks.
- Use natural Vietnamese phrasing in the prompt and report fields to sound human.
- If project context is missing, infer reasonable details from workspace names or use a plausible default.
- Write the final output to `prompt-fake-output.md`.

## Prompt Quality Requirements
- Use informal but clear phrasing, not robotic or overly formal.
- Include context hints like features, modules, or tasks relevant to the active project.
- Explicitly mention at least one concrete difficulty or uncertainty the user expects to face before starting the project.
- Avoid generic prompts that could fit any project.

## Edge Cases
- If the user asks for 0 reports, return an empty response.
- If the user request conflicts with the template, the template always wins.

## Example Usage
User request: "Tao 3 bao cao cho du an web quan ly sinh vien."
Expected result: 3 reports that follow the template, each with a different but consistent human-like prompt and content tailored to the student management web project.
