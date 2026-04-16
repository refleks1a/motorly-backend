import { prisma } from '../../../index';

/**
 * Get all maintenance items for a vehicle.
 * Security: validates the vehicle belongs to the user before returning data.
 */
export async function getMaintenanceHistory(
  vehicleId: string,
  userId: string
): Promise<object> {
  try {
    // Verify vehicle belongs to user
    const vehicle = await prisma.vehicle.findFirst({
      where: { id: vehicleId, userId },
      select: { id: true, make: true, model: true, year: true, mileage: true }
    });

    if (!vehicle) {
      return { error: 'Vehicle not found or access denied.' };
    }

    const items = await prisma.maintenanceItem.findMany({
      where: { vehicleId },
      orderBy: [
        { status: 'asc' }, // overdue first
        { dueDate: 'asc' }
      ],
      select: {
        name: true,
        status: true,
        dueInKm: true,
        dueDate: true,
        notes: true,
        updatedAt: true
      }
    });

    const overdue = items.filter(i => i.status === 'overdue');
    const dueSoon = items.filter(i => i.status === 'due_soon');
    const scheduled = items.filter(i => i.status === 'scheduled');
    const good = items.filter(i => i.status === 'good');

    return {
      vehicle: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
      currentMileage: vehicle.mileage,
      totalItems: items.length,
      summary: {
        overdue: overdue.length,
        dueSoon: dueSoon.length,
        scheduled: scheduled.length,
        good: good.length
      },
      overdueItems: overdue.map(i => ({
        name: i.name,
        dueInKm: i.dueInKm,
        dueDate: i.dueDate?.toISOString().split('T')[0] ?? null,
        notes: i.notes
      })),
      dueSoonItems: dueSoon.map(i => ({
        name: i.name,
        dueInKm: i.dueInKm,
        dueDate: i.dueDate?.toISOString().split('T')[0] ?? null,
        notes: i.notes
      })),
      scheduledItems: scheduled.map(i => ({
        name: i.name,
        dueInKm: i.dueInKm,
        dueDate: i.dueDate?.toISOString().split('T')[0] ?? null
      }))
    };
  } catch (error: any) {
    console.error('[Tool: get_maintenance_history] DB error:', error?.message);
    return { error: 'Failed to retrieve maintenance history.' };
  }
}

/**
 * Get recent service records for a vehicle.
 * Security: validates the vehicle belongs to the user before returning data.
 */
export async function getServiceRecords(
  vehicleId: string,
  userId: string,
  limit: number = 10
): Promise<object> {
  try {
    // Verify vehicle belongs to user
    const vehicle = await prisma.vehicle.findFirst({
      where: { id: vehicleId, userId },
      select: { id: true, make: true, model: true, year: true }
    });

    if (!vehicle) {
      return { error: 'Vehicle not found or access denied.' };
    }

    const records = await prisma.serviceRecord.findMany({
      where: { vehicleId },
      orderBy: { date: 'desc' },
      take: Math.min(limit, 20), // cap at 20 to avoid huge responses
      select: {
        serviceType: true,
        date: true,
        mileageAtService: true,
        shopName: true,
        cost: true,
        currency: true
      }
    });

    if (records.length === 0) {
      return {
        vehicle: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
        recordCount: 0,
        message: 'No service records found for this vehicle.'
      };
    }

    return {
      vehicle: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
      recordCount: records.length,
      serviceRecords: records.map(r => ({
        serviceType: r.serviceType,
        date: r.date.toISOString().split('T')[0],
        mileageAtService: r.mileageAtService,
        shopName: r.shopName ?? null,
        cost: r.cost ? `${r.cost} ${r.currency ?? 'USD'}` : null
      }))
    };
  } catch (error: any) {
    console.error('[Tool: get_service_records] DB error:', error?.message);
    return { error: 'Failed to retrieve service records.' };
  }
}
