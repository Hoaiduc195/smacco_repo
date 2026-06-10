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
  },
  COMPARE_PLACES: {
    id: 'COMPARE_PLACES',
    description: 'Compares two or more tagged places using review data and metadata. No tool steps — analysis is done by the composer using tagged place context.',
    steps: []
  },
  ANALYZE_PLACE: {
    id: 'ANALYZE_PLACE',
    description: 'Builds a detailed insight for exactly one tagged place using small deterministic context tools and a final aggregate context.',
    steps: [
      {
        id: 'place_metadata_context',
        tool: 'place_metadata_context',
        inputs: {
          taggedPlaces: '{{params.taggedPlaces}}'
        }
      },
      {
        id: 'geocode_start_location',
        tool: 'geocode_anchor',
        inputs: {
          query: '{{params.startLocation}}',
          location: '{{params.location}}'
        }
      },
      {
        id: 'resolve_start_location_context',
        tool: 'resolve_start_location_context',
        inputs: {
          userLocation: '{{params.userContext}}',
          startLocation: '{{geocode_start_location.data.location}}',
          startLocationLabel: '{{params.startLocation}}'
        }
      },
      {
        id: 'travel_estimate_context',
        tool: 'travel_estimate_context',
        inputs: {
          place: '{{place_metadata_context.data.place}}',
          startLocation: '{{resolve_start_location_context.data}}'
        }
      },
      {
        id: 'nearby_poi_context',
        tool: 'nearby_poi_context',
        inputs: {
          place: '{{place_metadata_context.data.place}}'
        }
      },
      {
        id: 'place_insight_context',
        tool: 'place_insight_context',
        inputs: {
          metadata: '{{place_metadata_context.data}}',
          startLocation: '{{resolve_start_location_context.data}}',
          travel: '{{travel_estimate_context.data}}',
          nearby: '{{nearby_poi_context.data}}',
          criteria: '{{params.criteria}}',
          tripPurposes: '{{params.tripPurposes}}'
        }
      }
    ]
  }
};
