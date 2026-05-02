// Authentication types
export interface RegisterRequest {
  email: string;
  password: string;
  name?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name?: string;
  };
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  email: string;
  code: string;
  newPassword: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

// User types
export interface UserProfile {
  id: string;
  email: string;
  name?: string;
  preferences: UserPreferences;
  notificationSettings: NotificationSettings;
  privacySettings: PrivacySettings;
  emailPreferences: EmailPreferences;
}

export interface UserPreferences {
  distanceUnit: 'kilometers' | 'miles';
  fuelUnit: 'liters' | 'gallons';
  temperatureUnit: 'celsius' | 'fahrenheit';
  currency: string;
  theme: 'light' | 'dark' | 'auto';
  fontSize: 'small' | 'medium' | 'large';
}

export interface NotificationSettings {
  maintenanceReminders: boolean;
  serviceDueAlerts: boolean;
  promotionalOffers: boolean;
  diagnosticAlerts: boolean;
}

export interface PrivacySettings {
  allowAnonymousData: boolean;
  allowAnalytics: boolean;
  allowThirdPartyData: boolean;
}

export interface EmailPreferences {
  marketingEmails: boolean;
  transactionalEmails: boolean;
}

// Vehicle types
export interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  mileage: number;
  licensePlate?: string;
  isPrimary: boolean;
  imageUrl?: string;
  healthScore?: number;
}

export interface CreateVehicleRequest {
  make: string;
  model: string;
  year: number;
  mileage: number;
  licensePlate?: string;
}

export interface UpdateVehicleRequest {
  make?: string;
  model?: string;
  year?: number;
  mileage?: number;
  licensePlate?: string;
  imageUrl?: string;
}

// Maintenance types
export interface MaintenanceItem {
  id: string;
  name: string;
  status: 'overdue' | 'due_soon' | 'scheduled' | 'good';
  dueInKm?: number;
  dueDate?: string;
  notes?: string;
}

export interface CreateMaintenanceItemRequest {
  name: string;
  status: 'overdue' | 'due_soon' | 'scheduled' | 'good';
  dueInKm?: number;
  dueDate?: string;
  notes?: string;
}

// Service Record types
export interface ServiceRecord {
  id: string;
  serviceType: string;
  date: string;
  mileageAtService: number;
  shopName?: string;
  cost?: number;
  currency?: string;
  receiptUrl?: string;
}

export interface CreateServiceRecordRequest {
  serviceType: string;
  date: string;
  mileageAtService: number;
  shopName?: string;
  cost?: number;
  currency?: string;
}

// Fuel Log types
export interface FuelLog {
  id: string;
  date: string;
  liters: number;
  costPerLiter: number;
  totalCost: number;
  mileageAtFill: number;
  station?: string;
}

export interface CreateFuelLogRequest {
  date: string;
  fuelAmount: number;
  fuelUnit: 'liters' | 'gallons';
  pricePerUnit: number;
  totalCost: number;
  mileageAtFill: number;
  station?: string;
}

// AI Chat types
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
  diagnosisResult?: DiagnosisResult;
  /** Populated when AI is asking a clarifying question */
  suggestedReplies?: string[];
}

export interface DiagnosisResult {
  confidence: number;
  severity: 'low' | 'medium' | 'high';
  potentialIssues: PotentialIssue[];
  recommendedActions: string[];
}

export interface PotentialIssue {
  name: string;
  description: string;
  estimatedCost: string;
  urgency: 'immediate' | 'soon' | 'later';
}

export interface ChatSession {
  id: string;
  title: string;
  vehicleId?: string;
  createdAt: string;
  updatedAt: string;
  vehicle?: {
    make: string;
    model: string;
    year: number;
    mileage?: number;
  };
  messages?: ChatMessage[];
}

export interface CreateChatSessionRequest {
  vehicleId?: string;
  initialMessage?: string;
}

export interface SendMessageRequest {
  content: string;
}

export interface SendMessageResponse {
  userMessage: ChatMessage;
  aiMessage: ChatMessage;
}

// Shop types
export interface Shop {
  id: string;
  name: string;
  rating: number;
  reviewCount: number;
  distanceKm: number;
  isOpen: boolean;
  closingTime?: string;
  address: string;
  phone?: string;
  specialties: string[];
  latitude: number;
  longitude: number;
}

// Offer types
export interface Offer {
  id: string;
  badge: string;
  title: string;
  subtitle: string;
  buttonLabel: string;
  backgroundColor: string;
  description: string;
  validUntil: string;
  terms: string;
  shop: {
    name: string;
    address: string;
    phone?: string;
  };
}

// Error response type
export interface ErrorResponse {
  error: string;
  message?: string;
  details?: Record<string, any>;
}