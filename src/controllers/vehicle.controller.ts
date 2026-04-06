import { Request, Response } from 'express';
import { prisma } from '../index';
import { 
  CreateVehicleRequest,
  UpdateVehicleRequest,
  Vehicle,
  MaintenanceItem,
  CreateMaintenanceItemRequest,
  ServiceRecord,
  FuelLog,
  CreateFuelLogRequest
} from '../types';

export class VehicleController {
  // Get all vehicles for the authenticated user
  static async getVehicles(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        res.status(401).json({ error: 'Not authenticated' });
        return;
      }

      const vehicles = await prisma.vehicle.findMany({
        where: { userId },
        orderBy: { isPrimary: 'desc' },
        select: {
          id: true,
          make: true,
          model: true,
          year: true,
          mileage: true,
          licensePlate: true,
          isPrimary: true,
          imageUrl: true,
          healthScore: true,
          createdAt: true,
          updatedAt: true
        }
      });

      const formattedVehicles: Vehicle[] = vehicles.map(vehicle => ({
        id: vehicle.id,
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        mileage: vehicle.mileage,
        licensePlate: vehicle.licensePlate || undefined,
        isPrimary: vehicle.isPrimary,
        imageUrl: vehicle.imageUrl || undefined,
        healthScore: vehicle.healthScore || undefined
      }));

      res.status(200).json(formattedVehicles);
    } catch (error) {
      console.error('Get vehicles error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Get a single vehicle by ID
  static async getVehicle(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      const vehicleId = req.params.id as string;

      if (!userId) {
        res.status(401).json({ error: 'Not authenticated' });
        return;
      }

      const vehicle = await prisma.vehicle.findFirst({
        where: {
          id: vehicleId,
          userId
        },
        select: {
          id: true,
          make: true,
          model: true,
          year: true,
          mileage: true,
          licensePlate: true,
          isPrimary: true,
          imageUrl: true,
          healthScore: true,
          createdAt: true,
          updatedAt: true
        }
      });

      if (!vehicle) {
        res.status(404).json({ error: 'Vehicle not found' });
        return;
      }

      const formattedVehicle: Vehicle = {
        id: vehicle.id,
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        mileage: vehicle.mileage,
        licensePlate: vehicle.licensePlate || undefined,
        isPrimary: vehicle.isPrimary,
        imageUrl: vehicle.imageUrl || undefined,
        healthScore: vehicle.healthScore || undefined
      };

      res.status(200).json(formattedVehicle);
    } catch (error) {
      console.error('Get vehicle error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Create a new vehicle
  static async createVehicle(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      const { make, model, year, mileage, licensePlate }: CreateVehicleRequest = req.body;

      if (!userId) {
        res.status(401).json({ error: 'Not authenticated' });
        return;
      }

      // Validate required fields
      if (!make || !model || !year || !mileage) {
        res.status(400).json({ error: 'Make, model, year, and mileage are required' });
        return;
      }

      // Validate year
      const currentYear = new Date().getFullYear();
      if (year < 1900 || year > currentYear + 1) {
        res.status(400).json({ error: `Year must be between 1900 and ${currentYear + 1}` });
        return;
      }

      // Validate mileage
      if (mileage < 0) {
        res.status(400).json({ error: 'Mileage must be a positive number' });
        return;
      }

      // Check if this is the first vehicle (will be set as primary)
      const existingVehicles = await prisma.vehicle.count({
        where: { userId }
      });

      const isPrimary = existingVehicles === 0;

      // Create vehicle
      const vehicle = await prisma.vehicle.create({
        data: {
          userId,
          make,
          model,
          year,
          mileage,
          licensePlate,
          isPrimary,
          healthScore: 100 // Default health score
        },
        select: {
          id: true,
          make: true,
          model: true,
          year: true,
          mileage: true,
          licensePlate: true,
          isPrimary: true,
          imageUrl: true,
          healthScore: true,
          createdAt: true,
          updatedAt: true
        }
      });

      const formattedVehicle: Vehicle = {
        id: vehicle.id,
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        mileage: vehicle.mileage,
        licensePlate: vehicle.licensePlate || undefined,
        isPrimary: vehicle.isPrimary,
        imageUrl: vehicle.imageUrl || undefined,
        healthScore: vehicle.healthScore || undefined
      };

      res.status(201).json(formattedVehicle);
    } catch (error) {
      console.error('Create vehicle error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Update a vehicle
  static async updateVehicle(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      const vehicleId = req.params.id as string;
      const updates: UpdateVehicleRequest = req.body;

      if (!userId) {
        res.status(401).json({ error: 'Not authenticated' });
        return;
      }

      // Check if vehicle exists and belongs to user
      const existingVehicle = await prisma.vehicle.findFirst({
        where: {
          id: vehicleId,
          userId
        }
      });

      if (!existingVehicle) {
        res.status(404).json({ error: 'Vehicle not found' });
        return;
      }

      // Validate updates
      const updateData: any = {};
      
      if (updates.make !== undefined) updateData.make = updates.make;
      if (updates.model !== undefined) updateData.model = updates.model;
      
      if (updates.year !== undefined) {
        const currentYear = new Date().getFullYear();
        if (updates.year < 1900 || updates.year > currentYear + 1) {
          res.status(400).json({ error: `Year must be between 1900 and ${currentYear + 1}` });
          return;
        }
        updateData.year = updates.year;
      }
      
      if (updates.mileage !== undefined) {
        if (updates.mileage < 0) {
          res.status(400).json({ error: 'Mileage must be a positive number' });
          return;
        }
        updateData.mileage = updates.mileage;
      }
      
      if (updates.licensePlate !== undefined) updateData.licensePlate = updates.licensePlate;

      // Update vehicle
      const updatedVehicle = await prisma.vehicle.update({
        where: { id: vehicleId },
        data: updateData,
        select: {
          id: true,
          make: true,
          model: true,
          year: true,
          mileage: true,
          licensePlate: true,
          isPrimary: true,
          imageUrl: true,
          healthScore: true,
          createdAt: true,
          updatedAt: true
        }
      });

      const formattedVehicle: Vehicle = {
        id: updatedVehicle.id,
        make: updatedVehicle.make,
        model: updatedVehicle.model,
        year: updatedVehicle.year,
        mileage: updatedVehicle.mileage,
        licensePlate: updatedVehicle.licensePlate || undefined,
        isPrimary: updatedVehicle.isPrimary,
        imageUrl: updatedVehicle.imageUrl || undefined,
        healthScore: updatedVehicle.healthScore || undefined
      };

      res.status(200).json(formattedVehicle);
    } catch (error) {
      console.error('Update vehicle error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Set a vehicle as primary
  static async setPrimaryVehicle(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      const vehicleId = req.params.id as string;

      if (!userId) {
        res.status(401).json({ error: 'Not authenticated' });
        return;
      }

      // Check if vehicle exists and belongs to user
      const existingVehicle = await prisma.vehicle.findFirst({
        where: {
          id: vehicleId,
          userId
        }
      });

      if (!existingVehicle) {
        res.status(404).json({ error: 'Vehicle not found' });
        return;
      }

      // Start a transaction to update all vehicles
      await prisma.$transaction([
        // Reset all vehicles to non-primary
        prisma.vehicle.updateMany({
          where: { userId },
          data: { isPrimary: false }
        }),
        // Set the selected vehicle as primary
        prisma.vehicle.update({
          where: { id: vehicleId },
          data: { isPrimary: true }
        })
      ]);

      // Get the updated vehicle
      const updatedVehicle = await prisma.vehicle.findUnique({
        where: { id: vehicleId },
        select: {
          id: true,
          make: true,
          model: true,
          year: true,
          mileage: true,
          licensePlate: true,
          isPrimary: true,
          imageUrl: true,
          healthScore: true,
          createdAt: true,
          updatedAt: true
        }
      });

      const formattedVehicle: Vehicle = {
        id: updatedVehicle!.id,
        make: updatedVehicle!.make,
        model: updatedVehicle!.model,
        year: updatedVehicle!.year,
        mileage: updatedVehicle!.mileage,
        licensePlate: updatedVehicle!.licensePlate || undefined,
        isPrimary: updatedVehicle!.isPrimary,
        imageUrl: updatedVehicle!.imageUrl || undefined,
        healthScore: updatedVehicle!.healthScore || undefined
      };

      res.status(200).json(formattedVehicle);
    } catch (error) {
      console.error('Set primary vehicle error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Delete a vehicle
  static async deleteVehicle(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      const vehicleId = req.params.id as string;

      if (!userId) {
        res.status(401).json({ error: 'Not authenticated' });
        return;
      }

      // Check if vehicle exists and belongs to user
      const existingVehicle = await prisma.vehicle.findFirst({
        where: {
          id: vehicleId,
          userId
        }
      });

      if (!existingVehicle) {
        res.status(404).json({ error: 'Vehicle not found' });
        return;
      }

      // Check if this is the primary vehicle
      if (existingVehicle.isPrimary) {
        // Find another vehicle to set as primary
        const otherVehicle = await prisma.vehicle.findFirst({
          where: {
            userId,
            id: { not: vehicleId }
          }
        });

        if (otherVehicle) {
          // Set another vehicle as primary
          await prisma.vehicle.update({
            where: { id: otherVehicle.id },
            data: { isPrimary: true }
          });
        }
      }

      // Delete the vehicle (Prisma will cascade delete related records)
      await prisma.vehicle.delete({
        where: { id: vehicleId }
      });

      res.status(200).json({ message: 'Vehicle deleted successfully' });
    } catch (error) {
      console.error('Delete vehicle error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Get maintenance items for a vehicle
  static async getMaintenanceItems(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      const vehicleId = req.params.id as string;

      if (!userId) {
        res.status(401).json({ error: 'Not authenticated' });
        return;
      }

      // Check if vehicle exists and belongs to user
      const vehicle = await prisma.vehicle.findFirst({
        where: {
          id: vehicleId,
          userId
        }
      });

      if (!vehicle) {
        res.status(404).json({ error: 'Vehicle not found' });
        return;
      }

      const maintenanceItems = await prisma.maintenanceItem.findMany({
        where: { vehicleId },
        orderBy: { status: 'asc' },
        select: {
          id: true,
          name: true,
          status: true,
          dueInKm: true,
          dueDate: true,
          notes: true,
          createdAt: true,
          updatedAt: true
        }
      });

      const formattedItems: MaintenanceItem[] = maintenanceItems.map(item => ({
        id: item.id,
        name: item.name,
        status: item.status as 'overdue' | 'due_soon' | 'scheduled' | 'good',
        dueInKm: item.dueInKm || undefined,
        dueDate: item.dueDate?.toISOString() || undefined,
        notes: item.notes || undefined
      }));

      res.status(200).json(formattedItems);
    } catch (error) {
      console.error('Get maintenance items error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Create a maintenance item for a vehicle
  static async createMaintenanceItem(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      const vehicleId = req.params.id as string;
      const { name, status, dueInKm, dueDate, notes }: CreateMaintenanceItemRequest = req.body;

      if (!userId) {
        res.status(401).json({ error: 'Not authenticated' });
        return;
      }

      // Validate required fields
      if (!name || !status) {
        res.status(400).json({ error: 'Name and status are required' });
        return;
      }

      // Validate status
      const validStatuses = ['overdue', 'due_soon', 'scheduled', 'good'];
      if (!validStatuses.includes(status)) {
        res.status(400).json({ error: `Status must be one of: ${validStatuses.join(', ')}` });
        return;
      }

      // Check if vehicle exists and belongs to user
      const vehicle = await prisma.vehicle.findFirst({
        where: {
          id: vehicleId,
          userId
        }
      });

      if (!vehicle) {
        res.status(404).json({ error: 'Vehicle not found' });
        return;
      }

      // Validate dueInKm if provided
      if (dueInKm !== undefined && dueInKm < 0) {
        res.status(400).json({ error: 'Due in km must be a positive number' });
        return;
      }

      // Parse dueDate if provided
      let parsedDueDate: Date | undefined;
      if (dueDate) {
        parsedDueDate = new Date(dueDate);
        if (isNaN(parsedDueDate.getTime())) {
          res.status(400).json({ error: 'Invalid due date format' });
          return;
        }
      }

      // Create maintenance item
      const maintenanceItem = await prisma.maintenanceItem.create({
        data: {
          vehicleId,
          name,
          status,
          dueInKm,
          dueDate: parsedDueDate,
          notes
        },
        select: {
          id: true,
          name: true,
          status: true,
          dueInKm: true,
          dueDate: true,
          notes: true,
          createdAt: true,
          updatedAt: true
        }
      });

      const formattedItem: MaintenanceItem = {
        id: maintenanceItem.id,
        name: maintenanceItem.name,
        status: maintenanceItem.status as 'overdue' | 'due_soon' | 'scheduled' | 'good',
        dueInKm: maintenanceItem.dueInKm || undefined,
        dueDate: maintenanceItem.dueDate?.toISOString() || undefined,
        notes: maintenanceItem.notes || undefined
      };

      res.status(201).json(formattedItem);
    } catch (error) {
      console.error('Create maintenance item error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Delete a maintenance item
  static async deleteMaintenanceItem(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      const vehicleId = req.params.id as string;
      const maintenanceItemId = req.params.itemId as string;

      if (!userId) {
        res.status(401).json({ error: 'Not authenticated' });
        return;
      }

      // Check if vehicle exists and belongs to user
      const vehicle = await prisma.vehicle.findFirst({
        where: {
          id: vehicleId,
          userId
        }
      });

      if (!vehicle) {
        res.status(404).json({ error: 'Vehicle not found' });
        return;
      }

      // Check if maintenance item exists and belongs to the vehicle
      const maintenanceItem = await prisma.maintenanceItem.findFirst({
        where: {
          id: maintenanceItemId,
          vehicleId
        }
      });

      if (!maintenanceItem) {
        res.status(404).json({ error: 'Maintenance item not found' });
        return;
      }

      // Delete the maintenance item
      await prisma.maintenanceItem.delete({
        where: { id: maintenanceItemId }
      });

      res.status(200).json({ message: 'Maintenance item deleted successfully' });
    } catch (error) {
      console.error('Delete maintenance item error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Update a maintenance item
  static async updateMaintenanceItem(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      const vehicleId = req.params.id as string;
      const maintenanceItemId = req.params.itemId as string;
      const { name, status, dueInKm, dueDate, notes } = req.body;

      if (!userId) {
        res.status(401).json({ error: 'Not authenticated' });
        return;
      }

      // Check if vehicle exists and belongs to user
      const vehicle = await prisma.vehicle.findFirst({
        where: {
          id: vehicleId,
          userId
        }
      });

      if (!vehicle) {
        res.status(404).json({ error: 'Vehicle not found' });
        return;
      }

      // Check if maintenance item exists and belongs to the vehicle
      const maintenanceItem = await prisma.maintenanceItem.findFirst({
        where: {
          id: maintenanceItemId,
          vehicleId
        }
      });

      if (!maintenanceItem) {
        res.status(404).json({ error: 'Maintenance item not found' });
        return;
      }

      // Update the maintenance item
      const updatedItem = await prisma.maintenanceItem.update({
        where: { id: maintenanceItemId },
        data: {
          name: name || maintenanceItem.name,
          status: status || maintenanceItem.status,
          dueInKm: dueInKm !== undefined ? dueInKm : maintenanceItem.dueInKm,
          dueDate: dueDate || maintenanceItem.dueDate,
          notes: notes || maintenanceItem.notes,
        },
        select: {
          id: true,
          name: true,
          status: true,
          dueInKm: true,
          dueDate: true,
          notes: true,
          createdAt: true,
          updatedAt: true,
        }
      });

      res.status(200).json(updatedItem);
    } catch (error) {
      console.error('Update maintenance item error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Get service records for a vehicle
  static async getServiceRecords(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      const vehicleId = req.params.id as string;

      if (!userId) {
        res.status(401).json({ error: 'Not authenticated' });
        return;
      }

      // Check if vehicle exists and belongs to user
      const vehicle = await prisma.vehicle.findFirst({
        where: {
          id: vehicleId,
          userId
        }
      });

      if (!vehicle) {
        res.status(404).json({ error: 'Vehicle not found' });
        return;
      }

      const serviceRecords = await prisma.serviceRecord.findMany({
        where: { vehicleId },
        orderBy: { date: 'desc' },
        select: {
          id: true,
          serviceType: true,
          date: true,
          mileageAtService: true,
          shopName: true,
          cost: true,
          currency: true,
          receiptUrl: true,
          createdAt: true,
          updatedAt: true
        }
      });

      const formattedRecords: ServiceRecord[] = serviceRecords.map(record => ({
        id: record.id,
        serviceType: record.serviceType,
        date: record.date.toISOString(),
        mileageAtService: record.mileageAtService,
        shopName: record.shopName || undefined,
        cost: record.cost || undefined,
        currency: record.currency || undefined,
        receiptUrl: record.receiptUrl || undefined
      }));

      res.status(200).json(formattedRecords);
    } catch (error) {
      console.error('Get service records error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Create a service record
  static async createServiceRecord(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      const vehicleId = req.params.id as string;
      const { serviceType, date, mileageAtService, shopName, cost, currency, receiptUrl } = req.body;

      if (!userId) {
        res.status(401).json({ error: 'Not authenticated' });
        return;
      }

      // Validate required fields
      if (!serviceType || !date || mileageAtService === undefined) {
        res.status(400).json({ error: 'Service type, date, and mileage are required' });
        return;
      }

      // Check if vehicle exists and belongs to user
      const vehicle = await prisma.vehicle.findFirst({
        where: {
          id: vehicleId,
          userId
        }
      });

      if (!vehicle) {
        res.status(404).json({ error: 'Vehicle not found' });
        return;
      }

      // Validate date
      const parsedDate = new Date(date);
      if (isNaN(parsedDate.getTime())) {
        res.status(400).json({ error: 'Invalid date format' });
        return;
      }

      // Validate mileage
      if (mileageAtService < 0) {
        res.status(400).json({ error: 'Mileage must be a positive number' });
        return;
      }

      // Validate cost if provided
      if (cost !== undefined && cost < 0) {
        res.status(400).json({ error: 'Cost must be a positive number' });
        return;
      }

      // Create the service record
      const serviceRecord = await prisma.serviceRecord.create({
        data: {
          vehicleId,
          serviceType,
          date: parsedDate,
          mileageAtService,
          shopName,
          cost,
          currency: currency || 'AZN',
          receiptUrl,
        },
        select: {
          id: true,
          serviceType: true,
          date: true,
          mileageAtService: true,
          shopName: true,
          cost: true,
          currency: true,
          receiptUrl: true,
          createdAt: true,
          updatedAt: true
        }
      });

      const formattedRecord: ServiceRecord = {
        id: serviceRecord.id,
        serviceType: serviceRecord.serviceType,
        date: serviceRecord.date.toISOString(),
        mileageAtService: serviceRecord.mileageAtService,
        shopName: serviceRecord.shopName || undefined,
        cost: serviceRecord.cost || undefined,
        currency: serviceRecord.currency || undefined,
        receiptUrl: serviceRecord.receiptUrl || undefined
      };

      res.status(201).json(formattedRecord);
    } catch (error) {
      console.error('Create service record error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Update a service record
  static async updateServiceRecord(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      const vehicleId = req.params.id as string;
      const recordId = req.params.recordId as string;
      const { serviceType, date, mileageAtService, shopName, cost, currency, receiptUrl } = req.body;

      if (!userId) {
        res.status(401).json({ error: 'Not authenticated' });
        return;
      }

      // Check if vehicle exists and belongs to user
      const vehicle = await prisma.vehicle.findFirst({
        where: {
          id: vehicleId,
          userId
        }
      });

      if (!vehicle) {
        res.status(404).json({ error: 'Vehicle not found' });
        return;
      }

      // Check if service record exists and belongs to the vehicle
      const serviceRecord = await prisma.serviceRecord.findFirst({
        where: {
          id: recordId,
          vehicleId
        }
      });

      if (!serviceRecord) {
        res.status(404).json({ error: 'Service record not found' });
        return;
      }

      // Validate date if provided
      let parsedDate: Date | undefined;
      if (date) {
        parsedDate = new Date(date);
        if (isNaN(parsedDate.getTime())) {
          res.status(400).json({ error: 'Invalid date format' });
          return;
        }
      }

      // Validate mileage if provided
      if (mileageAtService !== undefined && mileageAtService < 0) {
        res.status(400).json({ error: 'Mileage must be a positive number' });
        return;
      }

      // Validate cost if provided
      if (cost !== undefined && cost < 0) {
        res.status(400).json({ error: 'Cost must be a positive number' });
        return;
      }

      // Update the service record
      const updatedRecord = await prisma.serviceRecord.update({
        where: { id: recordId },
        data: {
          serviceType: serviceType || serviceRecord.serviceType,
          date: parsedDate || serviceRecord.date,
          mileageAtService: mileageAtService !== undefined ? mileageAtService : serviceRecord.mileageAtService,
          shopName: shopName !== undefined ? shopName : serviceRecord.shopName,
          cost: cost !== undefined ? cost : serviceRecord.cost,
          currency: currency || serviceRecord.currency,
          receiptUrl: receiptUrl !== undefined ? receiptUrl : serviceRecord.receiptUrl,
        },
        select: {
          id: true,
          serviceType: true,
          date: true,
          mileageAtService: true,
          shopName: true,
          cost: true,
          currency: true,
          receiptUrl: true,
          createdAt: true,
          updatedAt: true
        }
      });

      const formattedRecord: ServiceRecord = {
        id: updatedRecord.id,
        serviceType: updatedRecord.serviceType,
        date: updatedRecord.date.toISOString(),
        mileageAtService: updatedRecord.mileageAtService,
        shopName: updatedRecord.shopName || undefined,
        cost: updatedRecord.cost || undefined,
        currency: updatedRecord.currency || undefined,
        receiptUrl: updatedRecord.receiptUrl || undefined
      };

      res.status(200).json(formattedRecord);
    } catch (error) {
      console.error('Update service record error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Delete a service record
  static async deleteServiceRecord(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      const vehicleId = req.params.id as string;
      const recordId = req.params.recordId as string;

      if (!userId) {
        res.status(401).json({ error: 'Not authenticated' });
        return;
      }

      // Check if vehicle exists and belongs to user
      const vehicle = await prisma.vehicle.findFirst({
        where: {
          id: vehicleId,
          userId
        }
      });

      if (!vehicle) {
        res.status(404).json({ error: 'Vehicle not found' });
        return;
      }

      // Check if service record exists and belongs to the vehicle
      const serviceRecord = await prisma.serviceRecord.findFirst({
        where: {
          id: recordId,
          vehicleId
        }
      });

      if (!serviceRecord) {
        res.status(404).json({ error: 'Service record not found' });
        return;
      }

      // Delete the service record
      await prisma.serviceRecord.delete({
        where: { id: recordId }
      });

      res.status(200).json({ message: 'Service record deleted successfully' });
    } catch (error) {
      console.error('Delete service record error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Get fuel logs for a vehicle
  static async getFuelLogs(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      const vehicleId = req.params.id as string;

      if (!userId) {
        res.status(401).json({ error: 'Not authenticated' });
        return;
      }

      // Check if vehicle exists and belongs to user
      const vehicle = await prisma.vehicle.findFirst({
        where: {
          id: vehicleId,
          userId
        }
      });

      if (!vehicle) {
        res.status(404).json({ error: 'Vehicle not found' });
        return;
      }

      const fuelLogs = await prisma.fuelLog.findMany({
        where: { vehicleId },
        orderBy: { date: 'desc' },
        select: {
          id: true,
          date: true,
          liters: true,
          costPerLiter: true,
          totalCost: true,
          mileageAtFill: true,
          station: true,
          createdAt: true,
          updatedAt: true
        }
      });

      const formattedLogs: FuelLog[] = fuelLogs.map(log => ({
        id: log.id,
        date: log.date.toISOString(),
        liters: log.liters,
        costPerLiter: log.costPerLiter,
        totalCost: log.totalCost,
        mileageAtFill: log.mileageAtFill,
        station: log.station || undefined
      }));

      res.status(200).json(formattedLogs);
    } catch (error) {
      console.error('Get fuel logs error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Create a fuel log for a vehicle
  static async createFuelLog(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      const vehicleId = req.params.id as string;
      const { date, fuelAmount, fuelUnit, pricePerUnit, totalCost, mileageAtFill, station }: CreateFuelLogRequest = req.body;

      if (!userId) {
        res.status(401).json({ error: 'Not authenticated' });
        return;
      }

      // Validate required fields
      if (!date || fuelAmount === undefined || !fuelUnit || pricePerUnit === undefined || totalCost === undefined || mileageAtFill === undefined) {
        res.status(400).json({ error: 'Date, fuel amount, fuel unit, price per unit, total cost, and mileage are required' });
        return;
      }

      // Check if vehicle exists and belongs to user
      const vehicle = await prisma.vehicle.findFirst({
        where: {
          id: vehicleId,
          userId
        }
      });

      if (!vehicle) {
        res.status(404).json({ error: 'Vehicle not found' });
        return;
      }

      // Validate date
      const parsedDate = new Date(date);
      if (isNaN(parsedDate.getTime())) {
        res.status(400).json({ error: 'Invalid date format' });
        return;
      }

      // Validate fuel amount
      if (fuelAmount <= 0) {
        res.status(400).json({ error: 'Fuel amount must be a positive number' });
        return;
      }

      // Validate price per unit
      if (pricePerUnit < 0) {
        res.status(400).json({ error: 'Price per unit must be a non-negative number' });
        return;
      }

      // Validate total cost
      if (totalCost < 0) {
        res.status(400).json({ error: 'Total cost must be a non-negative number' });
        return;
      }

      // Validate mileage
      if (mileageAtFill < 0) {
        res.status(400).json({ error: 'Mileage must be a non-negative number' });
        return;
      }

      // Convert fuel amount to liters if needed
      let liters = fuelAmount;
      if (fuelUnit === 'gallons') {
        liters = fuelAmount * 3.78541; // Convert gallons to liters
      }

      // Calculate cost per liter (store in database)
      const costPerLiter = pricePerUnit;

      // Create fuel log
      const fuelLog = await prisma.fuelLog.create({
        data: {
          vehicleId,
          date: parsedDate,
          liters,
          costPerLiter,
          totalCost,
          mileageAtFill,
          station
        },
        select: {
          id: true,
          date: true,
          liters: true,
          costPerLiter: true,
          totalCost: true,
          mileageAtFill: true,
          station: true,
          createdAt: true,
          updatedAt: true
        }
      });

      const formattedLog: FuelLog = {
        id: fuelLog.id,
        date: fuelLog.date.toISOString(),
        liters: fuelLog.liters,
        costPerLiter: fuelLog.costPerLiter,
        totalCost: fuelLog.totalCost,
        mileageAtFill: fuelLog.mileageAtFill,
        station: fuelLog.station || undefined
      };

      res.status(201).json(formattedLog);
    } catch (error) {
      console.error('Create fuel log error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Update a fuel log
  static async updateFuelLog(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      const vehicleId = req.params.id as string;
      const logId = req.params.logId as string;
      const { date, fuelAmount, fuelUnit, pricePerUnit, totalCost, mileageAtFill, station } = req.body;

      if (!userId) {
        res.status(401).json({ error: 'Not authenticated' });
        return;
      }

      // Check if vehicle exists and belongs to user
      const vehicle = await prisma.vehicle.findFirst({
        where: {
          id: vehicleId,
          userId
        }
      });

      if (!vehicle) {
        res.status(404).json({ error: 'Vehicle not found' });
        return;
      }

      // Check if fuel log exists and belongs to the vehicle
      const fuelLog = await prisma.fuelLog.findFirst({
        where: {
          id: logId,
          vehicleId
        }
      });

      if (!fuelLog) {
        res.status(404).json({ error: 'Fuel log not found' });
        return;
      }

      // Validate date if provided
      let parsedDate: Date | undefined;
      if (date) {
        parsedDate = new Date(date);
        if (isNaN(parsedDate.getTime())) {
          res.status(400).json({ error: 'Invalid date format' });
          return;
        }
      }

      // Validate fuel amount if provided
      if (fuelAmount !== undefined && fuelAmount <= 0) {
        res.status(400).json({ error: 'Fuel amount must be a positive number' });
        return;
      }

      // Validate price per unit if provided
      if (pricePerUnit !== undefined && pricePerUnit < 0) {
        res.status(400).json({ error: 'Price per unit must be a non-negative number' });
        return;
      }

      // Validate total cost if provided
      if (totalCost !== undefined && totalCost < 0) {
        res.status(400).json({ error: 'Total cost must be a non-negative number' });
        return;
      }

      // Validate mileage if provided
      if (mileageAtFill !== undefined && mileageAtFill < 0) {
        res.status(400).json({ error: 'Mileage must be a non-negative number' });
        return;
      }

      // Convert fuel amount to liters if needed
      let liters: number | undefined;
      if (fuelAmount !== undefined && fuelUnit) {
        liters = fuelAmount;
        if (fuelUnit === 'gallons') {
          liters = fuelAmount * 3.78541; // Convert gallons to liters
        }
      }

      // Update fuel log
      const updatedLog = await prisma.fuelLog.update({
        where: { id: logId },
        data: {
          date: parsedDate || fuelLog.date,
          liters: liters !== undefined ? liters : fuelLog.liters,
          costPerLiter: pricePerUnit !== undefined ? pricePerUnit : fuelLog.costPerLiter,
          totalCost: totalCost !== undefined ? totalCost : fuelLog.totalCost,
          mileageAtFill: mileageAtFill !== undefined ? mileageAtFill : fuelLog.mileageAtFill,
          station: station !== undefined ? station : fuelLog.station,
        },
        select: {
          id: true,
          date: true,
          liters: true,
          costPerLiter: true,
          totalCost: true,
          mileageAtFill: true,
          station: true,
          createdAt: true,
          updatedAt: true
        }
      });

      const formattedLog: FuelLog = {
        id: updatedLog.id,
        date: updatedLog.date.toISOString(),
        liters: updatedLog.liters,
        costPerLiter: updatedLog.costPerLiter,
        totalCost: updatedLog.totalCost,
        mileageAtFill: updatedLog.mileageAtFill,
        station: updatedLog.station || undefined
      };

      res.status(200).json(formattedLog);
    } catch (error) {
      console.error('Update fuel log error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Delete a fuel log
  static async deleteFuelLog(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      const vehicleId = req.params.id as string;
      const logId = req.params.logId as string;

      if (!userId) {
        res.status(401).json({ error: 'Not authenticated' });
        return;
      }

      // Check if vehicle exists and belongs to user
      const vehicle = await prisma.vehicle.findFirst({
        where: {
          id: vehicleId,
          userId
        }
      });

      if (!vehicle) {
        res.status(404).json({ error: 'Vehicle not found' });
        return;
      }

      // Check if fuel log exists and belongs to the vehicle
      const fuelLog = await prisma.fuelLog.findFirst({
        where: {
          id: logId,
          vehicleId
        }
      });

      if (!fuelLog) {
        res.status(404).json({ error: 'Fuel log not found' });
        return;
      }

      // Delete the fuel log
      await prisma.fuelLog.delete({
        where: { id: logId }
      });

      res.status(200).json({ message: 'Fuel log deleted successfully' });
    } catch (error) {
      console.error('Delete fuel log error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
