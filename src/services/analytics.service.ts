// Analytics service for Phase 2
// Provides insights and analytics for vehicle health and user behavior

export interface VehicleAnalytics {
  vehicleId: string;
  userId: string;
  overallHealthScore: number;
  maintenanceScore: number;
  diagnosticScore: number;
  fuelEfficiencyScore: number;
  lastUpdated: string;
  insights: string[];
  recommendations: string[];
}

export interface UserAnalytics {
  userId: string;
  totalVehicles: number;
  totalDiagnoses: number;
  totalMaintenanceItems: number;
  averageVehicleAge: number;
  mostCommonIssue: string;
  maintenanceSpendEstimate: number;
  lastUpdated: string;
}

export interface DiagnosticAnalytics {
  sessionId: string;
  vehicleId: string;
  userId: string;
  issueType: string;
  severity: 'low' | 'medium' | 'high';
  confidence: number;
  timestamp: string;
  recommendedShops: number;
  userAction: 'ignored' | 'scheduled' | 'completed' | 'pending';
}

export class AnalyticsService {
  private static instance: AnalyticsService;

  private constructor() {}

  static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  /**
   * Get vehicle health analytics
   */
  async getVehicleAnalytics(vehicleId: string, userId: string): Promise<VehicleAnalytics> {
    // In a real implementation, this would query the database
    // For now, we'll generate simulated analytics
    
    const baseScore = 75 + Math.random() * 20; // 75-95
    
    // Generate insights based on score
    const insights: string[] = [];
    const recommendations: string[] = [];
    
    if (baseScore < 80) {
      insights.push('Vehicle health is below average');
      insights.push('Multiple maintenance items overdue');
      recommendations.push('Schedule comprehensive inspection');
      recommendations.push('Prioritize overdue maintenance');
    } else if (baseScore < 90) {
      insights.push('Vehicle health is good');
      insights.push('Some maintenance items due soon');
      recommendations.push('Schedule routine maintenance');
      recommendations.push('Monitor fuel efficiency');
    } else {
      insights.push('Vehicle health is excellent');
      insights.push('All maintenance up to date');
      recommendations.push('Continue regular maintenance schedule');
      recommendations.push('Consider fuel efficiency improvements');
    }
    
    // Add random insights
    const possibleInsights = [
      'Brake system in good condition',
      'Engine performance optimal',
      'Tire wear within normal range',
      'Battery health good',
      'Cooling system functioning properly',
      'Electrical system stable'
    ];
    
    const randomInsight = possibleInsights[Math.floor(Math.random() * possibleInsights.length)];
    if (!insights.includes(randomInsight)) {
      insights.push(randomInsight);
    }
    
    return {
      vehicleId,
      userId,
      overallHealthScore: Math.round(baseScore),
      maintenanceScore: Math.round(baseScore - 5 + Math.random() * 10),
      diagnosticScore: Math.round(baseScore - 10 + Math.random() * 20),
      fuelEfficiencyScore: Math.round(baseScore - 15 + Math.random() * 30),
      lastUpdated: new Date().toISOString(),
      insights,
      recommendations
    };
  }

  /**
   * Get user analytics
   */
  async getUserAnalytics(userId: string): Promise<UserAnalytics> {
    // In a real implementation, this would query the database
    // For now, we'll generate simulated analytics
    
    const issueTypes = [
      'Engine Noise',
      'Brake Squeal',
      'Check Engine Light',
      'Starting Problem',
      'Electrical System',
      'Brake Pedal Issue'
    ];
    
    return {
      userId,
      totalVehicles: Math.floor(Math.random() * 3) + 1,
      totalDiagnoses: Math.floor(Math.random() * 10) + 5,
      totalMaintenanceItems: Math.floor(Math.random() * 20) + 10,
      averageVehicleAge: Math.floor(Math.random() * 10) + 3,
      mostCommonIssue: issueTypes[Math.floor(Math.random() * issueTypes.length)],
      maintenanceSpendEstimate: Math.floor(Math.random() * 2000) + 500,
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Track diagnostic session
   */
  async trackDiagnosticSession(sessionData: {
    sessionId: string;
    vehicleId: string;
    userId: string;
    issueType: string;
    severity: 'low' | 'medium' | 'high';
    confidence: number;
    recommendedShops: number;
  }): Promise<void> {
    // Log the diagnostic session
    console.log('[Analytics] Diagnostic session tracked:', {
      sessionId: sessionData.sessionId,
      issueType: sessionData.issueType,
      severity: sessionData.severity,
      confidence: sessionData.confidence
    });
    
    // In a real implementation, this would store in a database
    // For now, we'll just log it
  }

  /**
   * Update user action for a diagnostic session
   */
  async updateDiagnosticAction(sessionId: string, action: 'ignored' | 'scheduled' | 'completed'): Promise<void> {
    console.log(`[Analytics] Diagnostic action updated: ${sessionId} -> ${action}`);
    
    // In a real implementation, this would update the database
    // For now, we'll just log it
  }

  /**
   * Get maintenance cost prediction
   */
  async getMaintenanceCostPrediction(_vehicleId: string, maintenanceType: string): Promise<{
    estimatedCost: number;
    costRange: [number, number];
    confidence: number;
    factors: string[];
  }> {
    const costRanges: Record<string, [number, number]> = {
      'Oil Change': [50, 100],
      'Brake Pad Replacement': [150, 300],
      'Tire Rotation': [30, 80],
      'Battery Replacement': [100, 250],
      'Engine Diagnostic': [80, 150],
      'Transmission Service': [200, 400],
      'Cooling System Flush': [100, 200],
      'Brake Fluid Change': [80, 150]
    };
    
    const range = costRanges[maintenanceType] || [100, 300];
    const estimatedCost = Math.floor((range[0] + range[1]) / 2);
    
    return {
      estimatedCost,
      costRange: range,
      confidence: 0.7 + Math.random() * 0.2, // 70-90%
      factors: [
        'Vehicle make and model',
        'Local labor rates',
        'Parts availability',
        'Shop reputation',
        'Service complexity'
      ]
    };
  }

  /**
   * Get fuel efficiency analytics
   */
  async getFuelEfficiencyAnalytics(_vehicleId: string): Promise<{
    currentMpg: number;
    averageMpg: number;
    trend: 'improving' | 'declining' | 'stable';
    improvementTips: string[];
    estimatedMonthlySavings: number;
  }> {
    const currentMpg = 25 + Math.random() * 10; // 25-35 MPG
    const averageMpg = 24 + Math.random() * 12; // 24-36 MPG
    
    let trend: 'improving' | 'declining' | 'stable';
    if (currentMpg > averageMpg + 2) {
      trend = 'improving';
    } else if (currentMpg < averageMpg - 2) {
      trend = 'declining';
    } else {
      trend = 'stable';
    }
    
    const improvementTips = [
      'Maintain proper tire pressure',
      'Avoid aggressive acceleration',
      'Reduce idling time',
      'Use recommended fuel grade',
      'Keep up with regular maintenance',
      'Remove excess weight from vehicle'
    ];
    
    // Randomly select 2-3 tips
    const selectedTips = improvementTips
      .sort(() => Math.random() - 0.5)
      .slice(0, Math.floor(Math.random() * 2) + 2);
    
    const estimatedMonthlySavings = Math.floor(Math.random() * 50) + 10; // $10-60
    
    return {
      currentMpg: Math.round(currentMpg * 10) / 10,
      averageMpg: Math.round(averageMpg * 10) / 10,
      trend,
      improvementTips: selectedTips,
      estimatedMonthlySavings
    };
  }

  /**
   * Generate monthly report
   */
  async generateMonthlyReport(_userId: string, month: number, year: number): Promise<{
    month: number;
    year: number;
    totalDiagnoses: number;
    maintenanceCompleted: number;
    estimatedSavings: number;
    healthScoreChange: number;
    topInsights: string[];
  }> {
    return {
      month,
      year,
      totalDiagnoses: Math.floor(Math.random() * 5) + 1,
      maintenanceCompleted: Math.floor(Math.random() * 3) + 1,
      estimatedSavings: Math.floor(Math.random() * 200) + 50,
      healthScoreChange: Math.floor(Math.random() * 20) - 10, // -10 to +10
      topInsights: [
        'Regular maintenance improved vehicle health',
        'Fuel efficiency increased by 5%',
        'Reduced diagnostic issues this month',
        'Cost savings from preventive maintenance'
      ]
    };
  }

  /**
   * Compare with similar vehicles
   */
  async compareWithSimilarVehicles(_vehicleId: string): Promise<{
    comparisonPoints: Array<{
      metric: string;
      yourVehicle: number;
      similarAverage: number;
      difference: number;
      unit: string;
    }>;
    overallComparison: 'better' | 'worse' | 'similar';
  }> {
    const metrics = [
      { metric: 'Fuel Efficiency', your: 28, avg: 26, unit: 'MPG' },
      { metric: 'Maintenance Cost', your: 1200, avg: 1500, unit: '$/year' },
      { metric: 'Health Score', your: 85, avg: 82, unit: 'points' },
      { metric: 'Diagnostic Issues', your: 2, avg: 3, unit: 'count' },
      { metric: 'Service Frequency', your: 4, avg: 5, unit: 'times/year' }
    ];
    
    const comparisonPoints = metrics.map(m => ({
      metric: m.metric,
      yourVehicle: m.your,
      similarAverage: m.avg,
      difference: m.your - m.avg,
      unit: m.unit
    }));
    
    const totalDifference = comparisonPoints.reduce((sum, point) => sum + point.difference, 0);
    const overallComparison = totalDifference > 2 ? 'better' : totalDifference < -2 ? 'worse' : 'similar';
    
    return {
      comparisonPoints,
      overallComparison
    };
  }
}

// Export singleton instance
export const analyticsService = AnalyticsService.getInstance();