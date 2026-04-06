import { Request, Response } from 'express';
import { prisma } from '../index';

export interface Shop {
  id: string;
  name: string;
  rating: number;
  reviewCount: number;
  latitude: number;
  longitude: number;
  distanceKm?: number;
  isOpen: boolean;
  closingTime?: string;
  address: string;
  phone?: string;
  specialties: string[];
  description?: string;
  hours?: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

export interface ShopSearchRequest {
  latitude?: number;
  longitude?: number;
  radiusKm?: number;
  specialties?: string[];
  minRating?: number;
  isOpenNow?: boolean;
  searchQuery?: string;
  limit?: number;
  offset?: number;
}

export class ShopController {
  // Search for shops with filters
  static async searchShops(req: Request, res: Response): Promise<void> {
    try {
      const {
        latitude,
        longitude,
        radiusKm = 10,
        specialties,
        minRating = 0,
        isOpenNow,
        searchQuery,
        limit = 20,
        offset = 0
      }: ShopSearchRequest = req.query as any;

      // Build where clause
      const where: any = {};

      // Filter by rating
      if (minRating > 0) {
        where.rating = { gte: minRating };
      }

      // Filter by specialties if provided
      if (specialties && specialties.length > 0) {
        // Since specialties is stored as JSON string, we need to filter differently
        // For simplicity in SQLite, we'll do post-filtering
      }

      // Filter by search query
      if (searchQuery) {
        where.OR = [
          { name: { contains: searchQuery, mode: 'insensitive' } },
          { address: { contains: searchQuery, mode: 'insensitive' } },
          { description: { contains: searchQuery, mode: 'insensitive' } }
        ];
      }

      // Get all shops matching basic filters
      const shops = await prisma.shop.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { rating: 'desc' }
      });

      // Parse JSON fields
      const parsedShops = shops.map(shop => {
        const specialties = shop.specialties ? JSON.parse(shop.specialties) : [];
        const hours = shop.hours ? JSON.parse(shop.hours) : undefined;
        
        // Calculate distance if coordinates provided
        let distanceKm: number | undefined;
        if (latitude && longitude && shop.latitude && shop.longitude) {
          distanceKm = this.calculateDistance(
            latitude,
            longitude,
            shop.latitude,
            shop.longitude
          );
        }

        // Check if shop is open now
        const isOpen = this.isShopOpenNow(hours);

        return {
          id: shop.id,
          name: shop.name,
          rating: shop.rating,
          reviewCount: shop.reviewCount,
          latitude: shop.latitude,
          longitude: shop.longitude,
          distanceKm,
          isOpen,
          closingTime: shop.closingTime || undefined,
          address: shop.address,
          phone: shop.phone || undefined,
          specialties,
          description: shop.description || undefined,
          hours,
          createdAt: shop.createdAt.toISOString(),
          updatedAt: shop.updatedAt.toISOString()
        };
      });

      // Apply distance filter if coordinates provided
      let filteredShops = parsedShops;
      if (latitude && longitude && radiusKm) {
        filteredShops = parsedShops.filter(shop => 
          shop.distanceKm !== undefined && shop.distanceKm <= radiusKm
        );
      }

      // Apply open now filter if requested
      if (isOpenNow) {
        filteredShops = filteredShops.filter(shop => shop.isOpen);
      }

      // Apply specialties filter if provided (post-filtering for SQLite)
      if (specialties && specialties.length > 0) {
        filteredShops = filteredShops.filter(shop => 
          shop.specialties.some((s: string) => specialties.includes(s))
        );
      }

      // Sort by distance if coordinates provided
      if (latitude && longitude) {
        filteredShops.sort((a, b) => {
          if (a.distanceKm === undefined) return 1;
          if (b.distanceKm === undefined) return -1;
          return a.distanceKm - b.distanceKm;
        });
      }

      res.status(200).json({
        shops: filteredShops,
        total: filteredShops.length,
        limit,
        offset
      });
    } catch (error) {
      console.error('Search shops error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Get shop by ID
  static async getShop(req: Request, res: Response): Promise<void> {
    try {
      const shopId = req.params.id as string;

      const shop = await prisma.shop.findUnique({
        where: { id: shopId },
        include: {
          offers: {
            where: { isActive: true },
            orderBy: { createdAt: 'desc' }
          }
        }
      });

      if (!shop) {
        res.status(404).json({ error: 'Shop not found' });
        return;
      }

      // Parse JSON fields
      const specialties = shop.specialties ? JSON.parse(shop.specialties) : [];
      const hours = shop.hours ? JSON.parse(shop.hours) : undefined;
      const isOpen = this.isShopOpenNow(hours);

      const formattedShop: Shop = {
        id: shop.id,
        name: shop.name,
        rating: shop.rating,
        reviewCount: shop.reviewCount,
        latitude: shop.latitude,
        longitude: shop.longitude,
        isOpen,
        closingTime: shop.closingTime || undefined,
        address: shop.address,
        phone: shop.phone || undefined,
        specialties,
        description: shop.description || undefined,
        hours,
        createdAt: shop.createdAt.toISOString(),
        updatedAt: shop.updatedAt.toISOString()
      };

      // Format offers
      const formattedOffers = shop.offers.map(offer => ({
        id: offer.id,
        badge: offer.badge,
        title: offer.title,
        subtitle: offer.subtitle,
        buttonLabel: offer.buttonLabel,
        backgroundColor: offer.backgroundColor,
        description: offer.description,
        validUntil: offer.validUntil.toISOString(),
        terms: offer.terms,
        isActive: offer.isActive,
        createdAt: offer.createdAt.toISOString(),
        updatedAt: offer.updatedAt.toISOString()
      }));

      res.status(200).json({
        shop: formattedShop,
        offers: formattedOffers
      });
    } catch (error) {
      console.error('Get shop error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Get shops near a diagnosis (for AI recommendations)
  static async getShopsForDiagnosis(req: Request, res: Response): Promise<void> {
    try {
      const { latitude, longitude, issueType, radiusKm = 5 } = req.query as any;

      if (!latitude || !longitude) {
        res.status(400).json({ error: 'Latitude and longitude are required' });
        return;
      }

      // Map issue types to specialties
      const specialtyMap: Record<string, string[]> = {
        'Engine Noise': ['Engine Repair', 'General Repair'],
        'Brake Squeal': ['Brake Repair', 'General Repair'],
        'Brake Grinding': ['Brake Repair', 'General Repair'],
        'Check Engine Light': ['Diagnostics', 'Engine Repair'],
        'Engine Overheating': ['Cooling System', 'Engine Repair'],
        'Starting Problem': ['Electrical', 'Battery', 'Starter'],
        'Electrical System': ['Electrical', 'Battery'],
        'Brake Pedal Issue': ['Brake Repair', 'Hydraulic Systems']
      };

      const specialties = specialtyMap[issueType] || ['General Repair'];

      // Get all shops
      const shops = await prisma.shop.findMany({
        where: {
          rating: { gte: 3.5 } // Only recommend shops with good ratings
        }
      });

      // Parse and filter shops
      const recommendedShops = shops.map(shop => {
        const shopSpecialties = shop.specialties ? JSON.parse(shop.specialties) : [];
        const hours = shop.hours ? JSON.parse(shop.hours) : undefined;
        
        // Calculate distance
        const distanceKm = this.calculateDistance(
          parseFloat(latitude),
          parseFloat(longitude),
          shop.latitude,
          shop.longitude
        );

        // Check if shop is open now
        const isOpen = this.isShopOpenNow(hours);

        // Check if shop has relevant specialties
        const hasRelevantSpecialty = shopSpecialties.some((s: string) => 
          specialties.includes(s)
        );

        // Calculate relevance score
        let relevanceScore = 0;
        if (hasRelevantSpecialty) relevanceScore += 2;
        if (isOpen) relevanceScore += 1;
        if (shop.rating >= 4.0) relevanceScore += 1;
        if (shop.rating >= 4.5) relevanceScore += 1;
        if (distanceKm <= 2) relevanceScore += 2;
        if (distanceKm <= 5) relevanceScore += 1;

        return {
          id: shop.id,
          name: shop.name,
          rating: shop.rating,
          reviewCount: shop.reviewCount,
          latitude: shop.latitude,
          longitude: shop.longitude,
          distanceKm,
          isOpen,
          closingTime: shop.closingTime || undefined,
          address: shop.address,
          phone: shop.phone || undefined,
          specialties: shopSpecialties,
          description: shop.description || undefined,
          hours,
          relevanceScore,
          hasRelevantSpecialty,
          createdAt: shop.createdAt.toISOString(),
          updatedAt: shop.updatedAt.toISOString()
        };
      });

      // Filter by distance and sort by relevance
      const filteredShops = recommendedShops
        .filter(shop => shop.distanceKm <= radiusKm)
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, 5); // Return top 5 recommendations

      res.status(200).json({
        issueType,
        recommendedShops: filteredShops,
        totalRecommendations: filteredShops.length
      });
    } catch (error) {
      console.error('Get shops for diagnosis error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Calculate distance between two coordinates using Haversine formula
  private static calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    return Math.round(distance * 10) / 10; // Round to 1 decimal place
  }

  private static toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  // Check if shop is open now based on hours
  private static isShopOpenNow(hours?: Record<string, string>): boolean {
    if (!hours) return true; // Default to open if no hours specified
    
    const now = new Date();
    const dayOfWeek = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const currentTime = now.getHours() * 100 + now.getMinutes(); // HHMM format
    
    const dayHours = hours[dayOfWeek];
    if (!dayHours || dayHours === 'Closed') return false;
    
    // Parse hours like "9:00 AM - 5:00 PM"
    const [openStr, closeStr] = dayHours.split(' - ');
    const openTime = this.parseTime(openStr);
    const closeTime = this.parseTime(closeStr);
    
    return currentTime >= openTime && currentTime <= closeTime;
  }

  private static parseTime(timeStr: string): number {
    const [time, modifier] = timeStr.split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    
    if (modifier === 'PM' && hours !== 12) hours += 12;
    if (modifier === 'AM' && hours === 12) hours = 0;
    
    return hours * 100 + minutes;
  }
}