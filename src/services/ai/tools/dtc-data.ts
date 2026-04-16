/**
 * Local OBD-II / DTC code lookup database.
 * Covers the most common P, B, C, and U codes encountered in everyday diagnosis.
 * No external API needed — instant lookups with zero latency.
 */

export interface DtcEntry {
  name: string;
  description: string;
  commonCauses: string[];
  severity: 'low' | 'medium' | 'high';
  category: 'powertrain' | 'body' | 'chassis' | 'network';
}

import dtcDatabaseJson from './dtc-codes.json';

const dtcDatabase: Record<string, DtcEntry> = dtcDatabaseJson as Record<string, DtcEntry>;

/**
 * Look up a DTC code in the local database.
 * Case-insensitive; returns a not-found message for unknown codes.
 */
export function lookupDtcCode(code: string): object {
  const normalized = code.toUpperCase().trim().replace(/\s/g, '');
  const entry = dtcDatabase[normalized];

  if (!entry) {
    // Provide some guidance even for unknown codes
    const prefix = normalized.charAt(0);
    const categoryHint: Record<string, string> = {
      P: 'Powertrain (engine/transmission)',
      B: 'Body (airbags, windows, locks)',
      C: 'Chassis (ABS, brakes, steering)',
      U: 'Network/Communication (CAN bus)'
    };
    const hint = categoryHint[prefix] ?? 'Unknown category';

    return {
      found: false,
      code: normalized,
      category: hint,
      message:
        `Code ${normalized} is not in the local database. It is a ${hint} code. ` +
        'This may be a manufacturer-specific code. Advise the user to check their vehicle-specific service manual ' +
        'or consult a dealer/mechanic with a factory scan tool.'
    };
  }

  return {
    found: true,
    code: normalized,
    name: entry.name,
    description: entry.description,
    category: entry.category,
    commonCauses: entry.commonCauses,
    severity: entry.severity,
    severityNote: entry.severity === 'high'
      ? 'Stop driving if safe to do so and have this diagnosed immediately.'
      : entry.severity === 'medium'
      ? 'Schedule a repair soon — continued driving may cause additional damage.'
      : 'Low urgency — monitor and address at next service opportunity.'
  };
}
