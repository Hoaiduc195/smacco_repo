# Project Changelog

---

## [2026-06-10 21:35] — Fix workspace panel labels and auto-open comparison table

- **Branch**: `feat/insight_wf`
- **Prompt**: User reported that all panel names had become saved-place labels and that the compare panel did not show the table after running the comparison workflow.
- **Changes**:
  - Replaced hard-coded saved-place copy in `LeftContextPanel` with per-panel metadata for search results, compare, insight, and saved places.
  - Restored generic workspace rail accessibility/close labels while preserving the active panel label in the close button.
  - Added `onAssistantMeta` support to `useStreamingChat` so consumers can react when streamed assistant metadata arrives.
  - Wired `ChatWidget` to auto-dispatch `app:open-place-comparison` once per streamed `comparisonResultId`, causing `HomePage` to fetch and render the structured comparison table in the compare panel immediately after workflow completion.
  - Added a targeted `useStreamingChat` test covering assistant metadata notification and message metadata application.
- **Modified files**: `frontend/src/components/ChatWidget.jsx`, `frontend/src/components/LeftContextPanel.jsx`, `frontend/src/components/WorkspaceRail.jsx`, `frontend/src/hooks/useStreamingChat.js`, `frontend/src/hooks/useStreamingChat.test.jsx`
- **Created files**: `.ppms/architecture-feat-insight_wf.md`, `.ppms/log-feat-insight_wf.md`
- **Deleted files**: None
- **Architecture impact**: Yes — frontend streaming chat now exposes assistant metadata for workflow-driven panel behavior, and comparison workflow results auto-open in the compare panel.

---
