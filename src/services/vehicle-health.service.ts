import { prisma } from '../index';

export class VehicleHealthService {
  /**
   * Recalculates the health score for a given vehicle based on a multi-factor formula.
   * Updates the vehicle record in the database and returns the new score.
   */
  static async recalculate(vehicleId: string): Promise<number> {
    try {
      // Fetch the vehicle with its maintenance items and service records
      const vehicle = await prisma.vehicle.findUnique({
        where: { id: vehicleId },
        include: {
          maintenanceItems: true,
          serviceRecords: {
            orderBy: { date: 'desc' },
            take: 1
          }
        }
      });

      if (!vehicle) {
        throw new Error('Vehicle not found');
      }

      let totalDeductions = 0;

      // -------------------------------------------------------------
      // Factor 1: Maintenance Status (Max 50 points deduction)
      // -------------------------------------------------------------
      let maintenanceDeduction = 0;
      for (const item of vehicle.maintenanceItems) {
        if (item.status === 'overdue') {
          maintenanceDeduction += 25;
        } else if (item.status === 'due_soon') {
          maintenanceDeduction += 10;
        } else if (item.status === 'scheduled') {
          maintenanceDeduction += 3;
        }
      }
      totalDeductions += Math.min(maintenanceDeduction, 50);

      // -------------------------------------------------------------
      // Factor 2: Service Recency (Max 20 points deduction)
      // -------------------------------------------------------------
      const lastService = vehicle.serviceRecords[0];
      let serviceRecencyDeduction = 0;
      const now = new Date();

      if (!lastService) {
        serviceRecencyDeduction = 10;
      } else {
        const monthsSinceService = (now.getTime() - lastService.date.getTime()) / (1000 * 60 * 60 * 24 * 30);
        
        if (monthsSinceService > 12) {
          serviceRecencyDeduction = 20;
        } else if (monthsSinceService > 6) {
          serviceRecencyDeduction = 10;
        }
      }
      totalDeductions += Math.min(serviceRecencyDeduction, 20);

      // -------------------------------------------------------------
      // Factor 3: Mileage Overdue (Max 20 points deduction)
      // -------------------------------------------------------------
      let mileageDeduction = 0;
      if (lastService) {
        const mileageDelta = vehicle.mileage - lastService.mileageAtService;
        if (mileageDelta > 15000) {
          mileageDeduction = 20;
        } else if (mileageDelta > 10000) {
          mileageDeduction = 10;
        }
      }
      totalDeductions += Math.min(mileageDeduction, 20);

      // -------------------------------------------------------------
      // Factor 4: Vehicle Age (Max 10 points deduction)
      // -------------------------------------------------------------
      let ageDeduction = 0;
      const vehicleAge = now.getFullYear() - vehicle.year;
      if (vehicleAge > 10) {
        ageDeduction = 10;
      } else if (vehicleAge > 5) {
        ageDeduction = 5;
      }
      totalDeductions += Math.min(ageDeduction, 10);

      // Calculate final score
      const finalScore = Math.max(0, 100 - totalDeductions);

      // Update the vehicle
      await prisma.vehicle.update({
        where: { id: vehicleId },
        data: { healthScore: finalScore }
      });

      return finalScore;

    } catch (error) {
      console.error(`Error recalculating health score for vehicle ${vehicleId}:`, error);
      // Fallback: don't fail the caller if scoring calculations fail
      return 100;
    }
  }
}
