import { WorkflowDefinition } from './workflow.schema';

export const WORKFLOW_REGISTRY: Record<string, WorkflowDefinition> = {
  SEARCH_PLACES: {
    id: 'SEARCH_PLACES',
    description: 'Searches for places based on user criteria',
    steps: [
      {
        id: 'fetch_places',
        tool: 'hybrid_search',
        inputs: {
          query: '{{params.query}}',
          location: '{{params.location}}',
          budget: '{{params.budget}}',
          type: '{{params.type}}'
        }
      }
    ]
  },
  GENERAL_CHAT: {
    id: 'GENERAL_CHAT',
    description: 'Bypasses tools and goes straight to composer for generic conversation',
    steps: [] // No tools needed
  }
};
