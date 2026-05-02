import { DiagnosisResult } from '../../types';

export interface AIResponse {
  content: string;
  diagnosisResult?: DiagnosisResult;
  /** Present when the AI needs more info before diagnosing */
  clarificationQuestion?: string;
  /** Quick-reply options the user can tap (populated only with clarificationQuestion) */
  suggestedReplies?: string[];
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
  /** If false, disables the agentic tool loop and forces a single-shot fast response */
  useAgent?: boolean;
}

export interface IssueIdentification {
  type: string;
  confidence: number;
  severity: 'low' | 'medium' | 'high';
  symptoms: string[];
}