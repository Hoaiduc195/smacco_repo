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
      },
      {
        id: 'geocode_anchor',
        tool: 'geocode_anchor',
        inputs: {
          query: '{{params.anchor}}',
          location: '{{params.location}}'
        }
      },
      {
        id: 'recommend_places',
        tool: 'recommend_places',
        inputs: {
          places: '{{fetch_places.data}}',
          budget: '{{params.budget}}',
          anchorLocation: '{{geocode_anchor.data.location}}',
          anchorLabel: '{{geocode_anchor.data.label}}',
          query: '{{params.query}}',
          maxResults: 10
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
