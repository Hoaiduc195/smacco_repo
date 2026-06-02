# AI Orchestration Architecture

## 1. Overview
The AI module is built as an **AI Execution Platform**, moving away from a monolithic chatbot design. It uses a strictly decoupled, four-layer architecture to separate LLM reasoning from business logic execution.

This ensures the system is **deterministic**, **scalable**, and **extensible**.

---

## 2. The Four Pillars

### Layer 1: Task Router (LLM-based)
- **Role:** The intelligent gateway. It classifies user intent into specific workflows and extracts structured parameters.
- **Implementation:** `GroqTaskRouterService`.
- **Constraint:** Uses Groq LLM in JSON Mode to output only a strict JSON schema containing `workflowId` and `parameters`.
- **Logic:** It "decides" what the user wants but "does not execute" it.

### Layer 2: Workflow Engine (Deterministic)
- **Role:** The conductor. It executes a Directed Acyclic Graph (DAG) of steps defined in JSON.
- **Implementation:** `WorkflowEngineService`.
- **Logic:**
  - Reads workflow templates from the `WORKFLOW_REGISTRY`.
  - Resolves dynamic variables (e.g., `{{params.location}}` or `{{step1.data.id}}`).
  - Sequentially executes Tools via the `ToolRegistry`.
- **Constraint:** NO LLM calls allowed in this layer.

### Layer 3: Tool Layer (Deterministic)
- **Role:** The execution units. Each tool is a black box that interacts with a specific database, API, or service.
- **Implementation:** Any class implementing the `ITool` interface (e.g., `SearchPlacesTool`).
- **Standard:** All tools accept `ToolInput` and return `ToolOutput<T>` with a `{ status, data, error }` format.

### Layer 4: Response Composer (LLM-based)
- **Role:** The storyteller. It takes raw tool data and converts it into user-friendly GitHub-Flavored Markdown (GFM).
- **Implementation:** `GroqResponseComposerService`.
- **Logic:** It sees the original user query + the raw JSON results from the tools and summarizes/interprets them.
- **Constraint:** Minimizes hallucinations by strictly anchoring the response to the tool results provided in the system context.

---

## 3. Data Flow
1. **User Query:** "Tìm khách sạn 5 sao ở Đà Lạt."
2. **Task Router:** Parses intent -> `{ workflowId: "SEARCH_PLACES", parameters: { query: "khách sạn 5 sao", location: "Đà Lạt" } }`.
3. **Workflow Engine:** Looks up `SEARCH_PLACES` template -> Triggers `hybrid_search` tool with parameters.
4. **Tool Layer:** `SearchPlacesTool` calls External APIs (OSM/Goong) + Local DB -> Returns list of hotels.
5. **Response Composer:** Receives query + hotel list -> Generates "Tôi tìm thấy 3 khách sạn 5 sao tại Đà Lạt: **Ana Mandara**, **Dalat Palace**...".
6. **Output:** Clean Markdown displayed in the Chat UI.

---

## 4. How to Extend

### Adding a New Tool
1. Create a service in `orchestration/tools/` implementing `ITool`.
2. Register it in `AiModule` constructor using `toolRegistry.registerTool()`.

### Adding a New Workflow
1. Define a new kịch bản (workflow) in `orchestration/engine/workflow-registry.ts`.
2. Update the `ROUTER_SYSTEM_PROMPT` in `GroqTaskRouterService` to include the new `workflowId` and its extraction rules.

### Versioning & A/B Testing
Since workflows are defined in JSON, you can easily point the Task Router to `SEARCH_V2` for specific users or during feature rollouts without touching the core execution code.

---

## 5. Fail-Safe Mechanisms
- **Router Failure:** If the LLM returns invalid JSON, it defaults to `GENERAL_CHAT`.
- **Tool Failure:** If a tool crashes, the engine catches the error, marks the step as `error`, and continues or yields to the Composer to explain the situation gracefully.
- **Composer Failure:** If the final response generation fails, a hardcoded fallback message is returned.
