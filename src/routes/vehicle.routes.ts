import { Router } from 'express';
import { VehicleController } from '../controllers/vehicle.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// All vehicle routes require authentication
router.use(authenticate);

// Vehicle routes
router.get('/', VehicleController.getVehicles);
router.get('/:id', VehicleController.getVehicle);
router.post('/', VehicleController.createVehicle);
router.put('/:id', VehicleController.updateVehicle);
router.delete('/:id', VehicleController.deleteVehicle);
router.post('/:id/primary', VehicleController.setPrimaryVehicle);

// Vehicle sub-resources
router.get('/:id/maintenance', VehicleController.getMaintenanceItems);
router.post('/:id/maintenance', VehicleController.createMaintenanceItem);
router.put('/:id/maintenance/:itemId', VehicleController.updateMaintenanceItem);
router.delete('/:id/maintenance/:itemId', VehicleController.deleteMaintenanceItem);
router.get('/:id/service-records', VehicleController.getServiceRecords);
router.post('/:id/service-records', VehicleController.createServiceRecord);
router.put('/:id/service-records/:recordId', VehicleController.updateServiceRecord);
router.delete('/:id/service-records/:recordId', VehicleController.deleteServiceRecord);
router.get('/:id/fuel-logs', VehicleController.getFuelLogs);
router.post('/:id/fuel-logs', VehicleController.createFuelLog);
router.put('/:id/fuel-logs/:logId', VehicleController.updateFuelLog);
router.delete('/:id/fuel-logs/:logId', VehicleController.deleteFuelLog);

export default router;
