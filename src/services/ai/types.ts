import { DiagnosisResult } from '../../types';

export interface AIResponse {
  content: string;
  diagnosisResult?: DiagnosisResult;
}

export interface AIContext {
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
}

export interface IssueIdentification {
  type: string;
  confidence: number;
  severity: 'low' | 'medium' | 'high';
  symptoms: string[];
}