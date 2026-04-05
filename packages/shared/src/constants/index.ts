// ── API Endpoints ────────────────────────────
export const API_VERSION = 'v1';
export const API_PREFIX = `/api/${API_VERSION}`;

// ── Service Ports ────────────────────────────
export const PORTS = {
  FRONTEND: 3000,
  CORE_SERVICE: 3001,
  AI_SERVICE: 8000,
  RECOMMENDATION_SERVICE: 8001,
  GATEWAY: 80,
  POSTGRES: 5432,
} as const;

// ── Place Types ──────────────────────────────
export const PLACE_TYPES = {
  FOOD: 'food',
  ACCOMMODATION: 'accommodation',
} as const;

// ── Budget Levels ────────────────────────────
export const BUDGET_LEVELS = {
  CHEAP: 'cheap',
  MEDIUM: 'medium',
  EXPENSIVE: 'expensive',
} as const;
