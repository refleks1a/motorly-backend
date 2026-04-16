import { DiagnosisResult } from '../../types';

export interface AIResponse {
  content: string;
  diagnosisResult?: DiagnosisResult;
}

export interface AIContext {
  /** User ID — used by agentic tools to scope all DB queries safely */
  userId?: string;
  /** Vehicle ID string — used by agentic tools when the model calls DB tools */
  vehicleId?: string | null;
  vehicle?: {
    make: string;
    model: string;
    year: number;
    mileage: number;
  };
  maintenanceHistory?: Array<{
    serviceType: string;
    date: string;
    mileageAtService: number;
  }>;
  recentMessages?: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
  }>;
  imageUrl?: string | null;
}

export interface IssueIdentification {
  type: string;
  confidence: number;
  severity: 'low' | 'medium' | 'high';
  symptoms: string[];
}