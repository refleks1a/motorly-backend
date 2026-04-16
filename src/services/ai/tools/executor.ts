import { getMaintenanceHistory, getServiceRecords } from './db-tools';
import { checkRecalls } from './nhtsa-tools';
import { lookupDtcCode } from './dtc-data';

/**
 * Context passed to each tool so DB tools can scope queries to the current user.
 */
export interface ToolExecutionContext {
  userId: string;
  vehicleId?: string | null;
}

/**
 * Central router for all agentic tool calls.
 * Takes the tool name + arguments returned by the LLM and dispatches
 * to the correct implementation, returning a plain object result.
 *
 * All errors are caught and returned as { error: string } objects
 * so the LLM can gracefully handle failures in its next turn.
 */
export async function executeToolCall(
  name: string,
  args: Record<string, any>,
  context: ToolExecutionContext
): Promise<object> {
  console.log(`[Tool Call] → ${name}`, JSON.stringify(args));

  try {
    let result: object;

    switch (name) {
      case 'get_maintenance_history': {
        const vehicleId = args.vehicleId ?? context.vehicleId;
        if (!vehicleId) {
          return { error: 'No vehicleId provided and no vehicle is associated with this session.' };
        }
        result = await getMaintenanceHistory(vehicleId, context.userId);
        break;
      }

      case 'get_service_records': {
        const vehicleId = args.vehicleId ?? context.vehicleId;
        if (!vehicleId) {
          return { error: 'No vehicleId provided and no vehicle is associated with this session.' };
        }
        result = await getServiceRecords(vehicleId, context.userId, args.limit ?? 10);
        break;
      }

      case 'check_recalls': {
        const { make, model, year } = args;
        if (!make || !model || !year) {
          return { error: 'check_recalls requires make, model, and year arguments.' };
        }
        result = await checkRecalls(make, model, Number(year));
        break;
      }

      case 'lookup_dtc_code': {
        const { code } = args;
        if (!code) {
          return { error: 'lookup_dtc_code requires a code argument (e.g. "P0300").' };
        }
        result = lookupDtcCode(code);
        break;
      }

      default:
        result = { error: `Unknown tool: "${name}". No implementation found.` };
    }

    console.log(`[Tool Result] ← ${name} OK`);
    return result;
  } catch (error: any) {
    console.error(`[Tool Error] ← ${name}:`, error?.message);
    return {
      error: `Tool "${name}" failed: ${error?.message ?? 'Unknown error'}. Please provide a best-effort answer without this data.`
    };
  }
}
