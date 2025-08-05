// src/data/schedulingRules.js
// This file centralizes the business logic for scheduling requirements.

export const SCHEDULING_RULES = {
  coverage: {
    // 08:00 - 17:00
    primary: {
      start: '08:00',
      end: '17:00',
      requirements: {
        'Reservations': 3,
        'Dispatch': 1,
      },
    },
    // 17:00 onwards
    evening: {
      start: '17:00',
      end: '22:00',
      requirements: {
        'Reservations': 2,
        'Dispatch': 1,
      },
    },
  },
  lunches: {
    // Standard lunch windows for Greenville staff
    standardWindows: [
      { start: '11:00', end: '12:30' },
      { start: '12:00', end: '13:30' },
      { start: '12:30', end: '14:00' },
    ],
    // Exceptions for specific employees
    exceptions: {
      'Katy': { start: '15:00', end: '16:00' },
    },
  },
  // This defines the order of importance for scheduling tasks.
  priorityHierarchy: [
    'EXACT_COVERAGE_FIRST',
    'DISPATCH_CONTINUITY',
    'LUNCH_COMPLIANCE',
    'EVENING_COVERAGE',
    'HOUR_COMPLIANCE',
    'SPECIALIST_TIME',
  ],
};
