import OpenAI from 'openai';

/**
 * Agentic tool definitions for Motorly AI.
 * Passed to the LLM so it knows what tools are available.
 * Supports both OpenAI and DeepSeek (OpenAI-compatible tool_choice API).
 */
export const motorlyTools: OpenAI.Chat.ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'get_maintenance_history',
      description:
        "Get all maintenance items for the user's vehicle, including overdue, due-soon, and scheduled items. " +
        'Call this when the user asks about maintenance, what needs to be done, or when diagnosing issues that could be related to deferred maintenance.',
      parameters: {
        type: 'object',
        properties: {
          vehicleId: {
            type: 'string',
            description: 'The vehicle ID to look up maintenance for.'
          }
        },
        required: ['vehicleId']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_service_records',
      description:
        "Get the most recent service records for the user's vehicle (oil changes, brake jobs, tire rotations, repairs, etc.) " +
        'ordered by most recent first. Use this to understand what has been done recently and what may be overdue.',
      parameters: {
        type: 'object',
        properties: {
          vehicleId: {
            type: 'string',
            description: 'The vehicle ID to look up service records for.'
          },
          limit: {
            type: 'number',
            description: 'Maximum number of records to return. Defaults to 10.'
          }
        },
        required: ['vehicleId']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'check_recalls',
      description:
        'Check for active NHTSA (National Highway Traffic Safety Administration) safety recalls for a vehicle. ' +
        'Always call this when the user reports safety-related issues: airbag warning lights, brake problems, ' +
        'steering issues, fire risk, fuel leaks, or any issue that could cause accidents. ' +
        'Recalls can often be fixed for FREE at a dealership.',
      parameters: {
        type: 'object',
        properties: {
          make: {
            type: 'string',
            description: 'Vehicle manufacturer, e.g. "Toyota", "Honda", "Ford"'
          },
          model: {
            type: 'string',
            description: 'Vehicle model, e.g. "Camry", "Civic", "F-150"'
          },
          year: {
            type: 'number',
            description: 'Vehicle model year as a number, e.g. 2019'
          }
        },
        required: ['make', 'model', 'year']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'lookup_dtc_code',
      description:
        'Look up an OBD-II / DTC (Diagnostic Trouble Code) such as P0300, P0171, B0001, C0035, U0100. ' +
        'Returns the official code name, full description, common causes, and severity level. ' +
        'Always call this when the user mentions or pastes a specific error code from their OBD scanner or dashboard.',
      parameters: {
        type: 'object',
        properties: {
          code: {
            type: 'string',
            description: 'The DTC code to look up, e.g. "P0300" or "p0171" (case-insensitive)'
          }
        },
        required: ['code']
      }
    }
  }
];
