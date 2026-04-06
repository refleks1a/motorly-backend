import { AIResponse, AIContext, IssueIdentification } from './types';

export class SimulatedAIService {
  /**
   * Generate simulated AI response for car diagnosis
   */
  async generateDiagnosis(
    userMessage: string,
    context?: AIContext
  ): Promise<AIResponse> {
    const lowerMessage = userMessage.toLowerCase();
    
    // Check for common car issues
    const issues = this.identifyPotentialIssues(lowerMessage);
    
    if (issues.length > 0) {
      const primaryIssue = issues[0];
      return {
        content: this.buildDiagnosisContent(primaryIssue, context),
        diagnosisResult: this.buildDiagnosisResult(primaryIssue, issues)
      };
    }

    // Default response asking for more details
    return {
      content: this.buildDefaultResponse(context),
      diagnosisResult: {
        confidence: 0.3,
        severity: 'low',
        potentialIssues: [],
        recommendedActions: [
          'Provide more specific symptoms',
          'Note when the issue occurs',
          'Share vehicle maintenance history'
        ]
      }
    };
  }

  /**
   * Identify potential issues based on symptoms
   */
  private identifyPotentialIssues(message: string): IssueIdentification[] {
    const issues: IssueIdentification[] = [];

    // Enhanced keyword matching - more flexible patterns
    const words = message.toLowerCase().split(/\s+/);
    
    // Check for common car issue patterns
    const hasEngine = words.some(w => w.includes('engine') || w.includes('motor'));
    const hasBrake = words.some(w => w.includes('brake') || w.includes('stop'));
    const hasTransmission = words.some(w => w.includes('transmission') || w.includes('gear') || w.includes('shift'));
    const hasElectrical = words.some(w => w.includes('electr') || w.includes('battery') || w.includes('light'));
    const hasTire = words.some(w => w.includes('tire') || w.includes('wheel') || w.includes('alignment'));
    
    // Check for symptom patterns
    const hasNoise = words.some(w => w.includes('noise') || w.includes('sound') || w.includes('knock') || 
                           w.includes('tap') || w.includes('squeak') || w.includes('squeal') || 
                           w.includes('rattle') || w.includes('grind'));
    const hasVibration = words.some(w => w.includes('vibrat') || w.includes('shake') || w.includes('wobble'));
    const hasStart = words.some(w => w.includes('start') || w.includes('crank') || w.includes('turn over'));
    const hasOverheat = words.some(w => w.includes('overheat') || w.includes('hot') || w.includes('temperature'));
    const hasWarning = words.some(w => w.includes('warning') || w.includes('light') || w.includes('dashboard'));
    const hasLeak = words.some(w => w.includes('leak') || w.includes('drip') || w.includes('fluid'));
    
    // Engine-related issues
    if (hasEngine) {
      if (hasNoise) {
        issues.push({
          type: 'Engine Noise',
          confidence: 0.8,
          severity: 'medium',
          symptoms: ['unusual engine sounds', 'knocking', 'tapping', 'rattling', 'squealing']
        });
      }
      if (hasOverheat) {
        issues.push({
          type: 'Engine Overheating',
          confidence: 0.9,
          severity: 'high',
          symptoms: ['high temperature gauge', 'steam from hood', 'coolant loss', 'engine running hot']
        });
      }
      if (hasStart) {
        issues.push({
          type: 'Starting Problem',
          confidence: 0.7,
          severity: 'medium',
          symptoms: ['difficulty starting', 'slow cranking', 'no start', 'engine won\'t turn over']
        });
      }
      if (hasLeak) {
        issues.push({
          type: 'Engine Fluid Leak',
          confidence: 0.75,
          severity: 'medium',
          symptoms: ['oil spots under car', 'coolant loss', 'fluid dripping']
        });
      }
    }

    // Brake-related issues
    if (hasBrake) {
      if (hasNoise) {
        issues.push({
          type: 'Brake Noise',
          confidence: 0.85,
          severity: 'medium',
          symptoms: ['squeaking', 'squealing', 'grinding', 'clicking when braking']
        });
      }
      if (hasVibration) {
        issues.push({
          type: 'Brake Vibration',
          confidence: 0.8,
          severity: 'medium',
          symptoms: ['steering wheel shakes', 'pedal pulsation', 'vibration when braking']
        });
      }
      if (message.includes('soft') || message.includes('spongy') || message.includes('pedal')) {
        issues.push({
          type: 'Brake Pedal Issue',
          confidence: 0.75,
          severity: 'high',
          symptoms: ['soft brake pedal', 'pedal goes to floor', 'spongy feeling', 'low pedal']
        });
      }
    }

    // Electrical issues
    if (hasElectrical || hasWarning) {
      issues.push({
        type: 'Electrical System',
        confidence: 0.6,
        severity: 'medium',
        symptoms: ['battery problems', 'warning lights', 'electrical failures', 'power issues']
      });
    }

    // Check engine light
    if (hasWarning || message.includes('check engine') || message.includes('cel')) {
      issues.push({
        type: 'Check Engine Light',
        confidence: 0.7,
        severity: 'medium',
        symptoms: ['dashboard warning light', 'engine light on', 'warning indicators']
      });
    }

    // Transmission issues
    if (hasTransmission) {
      if (hasNoise) {
        issues.push({
          type: 'Transmission Noise',
          confidence: 0.75,
          severity: 'medium',
          symptoms: ['whining', 'grinding', 'clunking from transmission']
        });
      }
      if (message.includes('slip') || message.includes('shift')) {
        issues.push({
          type: 'Transmission Slipping',
          confidence: 0.8,
          severity: 'high',
          symptoms: ['delayed shifting', 'slipping gears', 'rough shifts']
        });
      }
    }

    // Tire/Suspension issues
    if (hasTire) {
      if (hasVibration) {
        issues.push({
          type: 'Tire/Suspension Vibration',
          confidence: 0.7,
          severity: 'medium',
          symptoms: ['steering wheel shake', 'vibration at speed', 'uneven tire wear']
        });
      }
      if (hasNoise) {
        issues.push({
          type: 'Tire Noise',
          confidence: 0.65,
          severity: 'low',
          symptoms: ['road noise', 'humming', 'whirring from tires']
        });
      }
    }

    // Generic car problems - catch-all for common phrases
    if (issues.length === 0) {
      // Check for generic problem indicators
      const hasProblem = words.some(w => w.includes('problem') || w.includes('issue') || w.includes('trouble') || 
                                 w.includes('broken') || w.includes('fix') || w.includes('repair'));
      const hasCar = words.some(w => w.includes('car') || w.includes('vehicle') || w.includes('auto'));
      
      if (hasCar && hasProblem) {
        // Provide a general diagnostic response
        issues.push({
          type: 'General Car Issue',
          confidence: 0.4,
          severity: 'medium',
          symptoms: ['unspecified car problem', 'general vehicle issue', 'need for diagnosis']
        });
      }
    }

    // Sort by confidence
    return issues.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Build diagnosis content based on identified issue
   */
  private buildDiagnosisContent(
    issue: IssueIdentification,
    context?: AIContext
  ): string {
    let content = `Based on your description, I've identified a ${issue.type} issue.\n\n`;
    
    content += `Confidence Level: ${Math.round(issue.confidence * 100)}%\n`;
    content += `Severity: ${issue.severity.charAt(0).toUpperCase() + issue.severity.slice(1)}\n\n`;
    
    if (context?.vehicle) {
      const { make, model, year } = context.vehicle;
      content += `For your ${year} ${make} ${model}, here are the most likely causes:\n\n`;
    } else {
      content += `Here are the most likely causes:\n\n`;
    }

    switch (issue.type) {
      case 'Engine Noise':
        content += `1. Worn serpentine belt - Common cause of squealing noises, especially during acceleration\n`;
        content += `2. Failing water pump - Can cause grinding or whining sounds from the front of the engine\n`;
        content += `3. Rod knock - Serious internal engine damage requiring immediate attention\n`;
        content += `4. Valve train issues - Ticking or tapping sounds from the top of the engine\n\n`;
        content += `Recommended action: Have a mechanic perform a diagnostic test to identify the exact source. Engine noises can range from minor ($100-300) to serious ($2000-5000) repairs.`;
        break;
        
      case 'Brake Squeal':
        content += `1. Worn brake pads - Most common cause, pads have wear indicators that create noise\n`;
        content += `2. Brake dust accumulation - Can cause temporary squealing, especially after rain\n`;
        content += `3. Glazed brake pads - Pads have become hardened from overheating\n`;
        content += `4. Missing shims - Anti-vibration shims may be missing or damaged\n\n`;
        content += `Safety note: While squealing is often just a wear indicator, have your brakes inspected soon. Grinding sounds indicate immediate danger.`;
        break;
        
      case 'Check Engine Light':
        content += `1. Loose gas cap - Simple fix, check this first (most common cause)\n`;
        content += `2. Oxygen sensor failure - Affects fuel efficiency and emissions\n`;
        content += `3. Catalytic converter issues - Can be expensive but important for emissions\n`;
        content += `4. Mass airflow sensor - Affects air/fuel mixture and performance\n\n`;
        content += `Next steps: Use an OBD-II scanner to read the specific error code. Many auto parts stores offer free code reading.`;
        break;
        
      case 'General Car Issue':
        content += `Since you've described a general car problem, here are the most common areas to check:\n\n`;
        content += `1. Check engine oil level and quality - Low or dirty oil can cause many issues\n`;
        content += `2. Inspect battery connections - Loose or corroded terminals cause electrical problems\n`;
        content += `3. Check tire pressure and condition - Underinflated or worn tires affect handling\n`;
        content += `4. Listen for unusual noises - Note when and where sounds occur\n\n`;
        content += `To help me provide better diagnosis:\n`;
        content += `- Describe specific symptoms (noises, vibrations, smells)\n`;
        content += `- Note when the problem occurs (starting, driving, braking)\n`;
        content += `- Share any warning lights on your dashboard\n`;
        content += `- Mention recent maintenance or repairs`;
        break;
        
      default:
        content += `This appears to be a ${issue.type.toLowerCase()} issue. The symptoms you described (${issue.symptoms.join(', ')}) suggest several possible causes that should be diagnosed by a professional.\n\n`;
        content += `Recommended: Schedule a diagnostic appointment with a trusted mechanic. Provide them with all the details you've shared with me.`;
    }

    return content;
  }

  /**
   * Build diagnosis result object
   */
  private buildDiagnosisResult(
    primaryIssue: IssueIdentification,
    allIssues: IssueIdentification[]
  ): any {
    const potentialIssues = allIssues.map(issue => ({
      name: issue.type,
      description: `Symptoms include: ${issue.symptoms.join(', ')}`,
      estimatedCost: this.getEstimatedCost(issue.type),
      urgency: issue.severity === 'high' ? 'immediate' : 
               issue.severity === 'medium' ? 'soon' : 'when convenient'
    }));

    return {
      confidence: primaryIssue.confidence,
      severity: primaryIssue.severity,
      potentialIssues,
      recommendedActions: this.getRecommendedActions(primaryIssue.type)
    };
  }

  /**
   * Get estimated cost for issue type
   */
  private getEstimatedCost(issueType: string): string {
    const costRanges: Record<string, string> = {
      'Engine Noise': '$100-$5000',
      'Engine Overheating': '$300-$1500',
      'Starting Problem': '$150-$800',
      'Brake Squeal': '$150-$400 per axle',
      'Brake Grinding': '$300-$600 per axle',
      'Brake Pedal Issue': '$200-$800',
      'Electrical System': '$100-$1000',
      'Check Engine Light': '$0-$2500'
    };

    return costRanges[issueType] || '$100-$1000';
  }

  /**
   * Get recommended actions for issue type
   */
  private getRecommendedActions(issueType: string): string[] {
    const actions: Record<string, string[]> = {
      'Engine Noise': [
        'Have a mechanic perform a diagnostic test',
        'Check belt tension and condition',
        'Listen for specific noise patterns',
        'Check oil level and quality'
      ],
      'Engine Overheating': [
        'Check coolant level immediately',
        'Inspect for leaks in cooling system',
        'Check radiator and fans',
        'Do not drive if overheating continues'
      ],
      'Starting Problem': [
        'Test battery voltage',
        'Check starter motor',
        'Inspect ignition system',
        'Check fuel delivery'
      ],
      'Brake Squeal': [
        'Have brakes inspected soon',
        'Check brake pad thickness',
        'Clean brake components',
        'Test brake performance'
      ],
      'Brake Grinding': [
        'Have brakes inspected immediately',
        'Do not drive if grinding is severe',
        'Check brake rotor condition',
        'Test brake system thoroughly'
      ],
      'Check Engine Light': [
        'Check gas cap is tight',
        'Use OBD-II scanner for error codes',
        'Monitor for other symptoms',
        'Schedule diagnostic appointment'
      ]
    };

    return actions[issueType] || [
      'Schedule diagnostic appointment',
      'Monitor symptoms',
      'Check related systems',
      'Consult professional mechanic'
    ];
  }

  /**
   * Build default response when no specific issue identified
   */
  private buildDefaultResponse(context?: AIContext): string {
    let response = "I understand you're describing a car issue. To provide more accurate diagnosis, please provide:\n\n";
    response += "1. Specific symptoms (noises, vibrations, warning lights, smells)\n";
    response += "2. When it occurs (during acceleration, braking, at idle, when turning)\n";
    response += "3. Vehicle details (make, model, year, mileage)\n";
    response += "4. Recent maintenance or repairs\n";
    response += "5. Any warning lights on the dashboard\n\n";
    
    if (context?.vehicle) {
      const { make, model, year, mileage } = context.vehicle;
      response += `For your ${year} ${make} ${model} with ${mileage.toLocaleString()} miles, `;
      response += "common issues at this mileage might include:\n";
      response += "- Suspension components\n";
      response += "- Brake system wear\n";
      response += "- Engine mounts\n";
      response += "- Electrical system components\n\n";
    }
    
    response += "The more details you provide, the better I can help diagnose the issue.";
    
    return response;
  }
}