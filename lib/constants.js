// Static UI configuration (not data). Previously colocated in dummy-data.js.

export const STATUS_COLORS = {
  active:  '#22c55e',
  resting: '#60a5fa',
  warning: '#f59e0b',
  sos:     '#ef4444',
  offline: '#6b7280',
};

// Fallback map center used until a session/fence provides its own focus.
// Base: lat -1.0954771917261503, lng 37.01428310094132
export const CAMP_CENTER = { lng: 37.01428310094132, lat: -1.0954771917261503 };
