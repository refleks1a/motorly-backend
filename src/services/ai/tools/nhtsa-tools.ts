import axios from 'axios';

const NHTSA_BASE_URL = 'https://api.nhtsa.gov';
const REQUEST_TIMEOUT_MS = 8000;

/**
 * Check for active NHTSA safety recalls for a specific vehicle.
 * Uses the free NHTSA API — no API key required.
 */
export async function checkRecalls(
  make: string,
  model: string,
  year: number
): Promise<object> {
  try {
    const response = await axios.get(`${NHTSA_BASE_URL}/recalls/recallsByVehicle`, {
      params: {
        make: make.trim(),
        model: model.trim(),
        modelYear: year
      },
      timeout: REQUEST_TIMEOUT_MS
    });

    const results: any[] = response.data?.results ?? [];

    if (results.length === 0) {
      return {
        found: false,
        recallCount: 0,
        summary: `No active NHTSA recalls found for the ${year} ${make} ${model}.`
      };
    }

    return {
      found: true,
      recallCount: results.length,
      vehicle: `${year} ${make} ${model}`,
      recalls: results.map((r: any) => ({
        campaignNumber: r.NHTSACampaignNumber,
        reportDate: r.ReportReceivedDate,
        component: r.Component,
        summary: r.Summary,
        consequence: r.Consequence,
        remedy: r.Remedy,
        notes: r.Notes ?? null
      }))
    };
  } catch (error: any) {
    console.error('[Tool: check_recalls] NHTSA API error:', error?.message);
    return {
      error: true,
      message:
        'Could not reach the NHTSA recalls database at this time. ' +
        'Advise the user to manually check recalls at recall.nhtsa.gov using their VIN.'
    };
  }
}
