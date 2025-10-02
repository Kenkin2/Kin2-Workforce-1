import { db } from "../db";
import { users, organizations, timesheets } from "@shared/schema";
import { eq, sql, gte, and } from "drizzle-orm";

// IoT device types
export enum DeviceType {
  RFID_SCANNER = 'rfid_scanner',
  BIOMETRIC_SCANNER = 'biometric_scanner',
  ENVIRONMENTAL_SENSOR = 'environmental_sensor',
  SECURITY_CAMERA = 'security_camera',
  ACCESS_CONTROL = 'access_control',
  SAFETY_BEACON = 'safety_beacon',
  ASSET_TRACKER = 'asset_tracker',
  WEARABLE_DEVICE = 'wearable_device',
  SMART_BADGE = 'smart_badge',
  TEMPERATURE_MONITOR = 'temperature_monitor'
}

interface IoTDevice {
  id: string;
  name: string;
  type: DeviceType;
  organizationId: string;
  location: {
    latitude: number;
    longitude: number;
    address: string;
    zone: string;
  };
  status: 'online' | 'offline' | 'maintenance' | 'error';
  battery: number;
  signalStrength: number;
  lastSeen: Date;
  firmware: string;
  configuration: any;
  capabilities: string[];
}

interface SensorReading {
  deviceId: string;
  timestamp: Date;
  type: string;
  value: number;
  unit: string;
  metadata?: any;
}

interface WorkplaceEnvironment {
  organizationId: string;
  zone: string;
  timestamp: Date;
  temperature: number;
  humidity: number;
  airQuality: number;
  noiseLevel: number;
  lightLevel: number;
  occupancy: number;
  safetyScore: number;
}

interface AutomationRule {
  id: string;
  name: string;
  organizationId: string;
  trigger: {
    deviceType: DeviceType;
    condition: string;
    threshold: number;
  };
  actions: Array<{
    type: 'notification' | 'automation' | 'alert' | 'workflow';
    target: string;
    parameters: any;
  }>;
  isActive: boolean;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export class IoTService {
  private devices: Map<string, IoTDevice> = new Map();
  private automationRules: Map<string, AutomationRule> = new Map();
  private sensorData: Map<string, SensorReading[]> = new Map();

  constructor() {
    this.initializeDevices();
    this.initializeAutomation();
    this.startDataCollection();
  }

  // Device Management
  async registerDevice(device: Omit<IoTDevice, 'id' | 'lastSeen' | 'status'>): Promise<IoTDevice> {
    const newDevice: IoTDevice = {
      ...device,
      id: this.generateDeviceId(),
      status: 'online',
      lastSeen: new Date()
    };

    this.devices.set(newDevice.id, newDevice);
    await this.storeDevice(newDevice);
    
    // Start monitoring
    this.startDeviceMonitoring(newDevice.id);
    
    return newDevice;
  }

  async getDevices(organizationId: string): Promise<IoTDevice[]> {
    return Array.from(this.devices.values())
      .filter(device => device.organizationId === organizationId);
  }

  async getDeviceStatus(deviceId: string): Promise<IoTDevice | null> {
    return this.devices.get(deviceId) || null;
  }

  async updateDeviceConfiguration(deviceId: string, configuration: any): Promise<void> {
    const device = this.devices.get(deviceId);
    if (device) {
      device.configuration = { ...device.configuration, ...configuration };
      this.devices.set(deviceId, device);
      await this.storeDevice(device);
      
      // Send configuration to physical device
      await this.sendConfigurationToDevice(deviceId, configuration);
    }
  }

  // Biometric Authentication
  async processBiometricScan(
    deviceId: string,
    biometricData: {
      type: 'fingerprint' | 'face' | 'iris' | 'voice';
      data: string;
      confidence: number;
    }
  ): Promise<{ userId: string | null; confidence: number; timestamp: Date }> {
    
    // Process biometric data
    const result = await this.matchBiometric(biometricData);
    
    // Log scan attempt
    await this.logBiometricScan(deviceId, biometricData, result);
    
    // If successful, record attendance
    if (result.userId && result.confidence > 0.85) {
      await this.recordAttendance(result.userId, deviceId);
    }
    
    return {
      userId: result.userId,
      confidence: result.confidence,
      timestamp: new Date()
    };
  }

  async enrollBiometric(
    userId: string,
    biometricData: {
      type: 'fingerprint' | 'face' | 'iris' | 'voice';
      samples: string[];
    }
  ): Promise<boolean> {
    
    // Process and store biometric template
    const template = await this.createBiometricTemplate(biometricData);
    
    // Store in secure biometric database
    await this.storeBiometricTemplate(userId, template);
    
    return true;
  }

  // Environmental Monitoring
  async recordSensorReading(reading: SensorReading): Promise<void> {
    const deviceReadings = this.sensorData.get(reading.deviceId) || [];
    deviceReadings.push(reading);
    
    // Keep only last 1000 readings per device
    if (deviceReadings.length > 1000) {
      deviceReadings.shift();
    }
    
    this.sensorData.set(reading.deviceId, deviceReadings);
    
    // Store in database
    await this.storeSensorReading(reading);
    
    // Check for automation triggers
    await this.checkAutomationTriggers(reading);
    
    // Update workplace environment
    await this.updateWorkplaceEnvironment(reading);
  }

  async getEnvironmentalData(
    organizationId: string,
    timeRange: { start: Date; end: Date }
  ): Promise<WorkplaceEnvironment[]> {
    
    return await this.getWorkplaceEnvironments(organizationId, timeRange);
  }

  async getAirQualityReport(organizationId: string): Promise<{
    current: number;
    trend: 'improving' | 'stable' | 'deteriorating';
    recommendations: string[];
    zones: Record<string, number>;
  }> {
    
    const devices = this.getDevices(organizationId);
    const airQualityDevices = (await devices).filter(d => 
      d.capabilities.includes('air_quality')
    );
    
    let totalAirQuality = 0;
    let deviceCount = 0;
    const zones: Record<string, number> = {};
    
    for (const device of airQualityDevices) {
      const readings = this.sensorData.get(device.id) || [];
      const latestReading = readings
        .filter(r => r.type === 'air_quality')
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0];
      
      if (latestReading) {
        totalAirQuality += latestReading.value;
        deviceCount++;
        zones[device.location.zone] = latestReading.value;
      }
    }
    
    const current = deviceCount > 0 ? totalAirQuality / deviceCount : 0;
    const trend = this.calculateAirQualityTrend(organizationId);
    
    return {
      current,
      trend,
      recommendations: this.generateAirQualityRecommendations(current),
      zones
    };
  }

  // Asset Tracking
  async trackAsset(
    assetId: string,
    location: { latitude: number; longitude: number },
    metadata?: any
  ): Promise<void> {
    
    const tracking = {
      assetId,
      timestamp: new Date(),
      location,
      metadata
    };
    
    await this.storeAssetTracking(tracking);
    
    // Check for geofencing violations
    await this.checkGeofencing(assetId, location);
  }

  async getAssetLocation(assetId: string): Promise<{
    location: { latitude: number; longitude: number };
    timestamp: Date;
    zone?: string;
    status: string;
  } | null> {
    
    return await this.getLatestAssetLocation(assetId);
  }

  async createGeofence(
    name: string,
    organizationId: string,
    boundaries: Array<{ latitude: number; longitude: number }>,
    rules: {
      assetTypes: string[];
      notifications: string[];
      restrictions: string[];
    }
  ): Promise<string> {
    
    const geofence = {
      id: this.generateGeofenceId(),
      name,
      organizationId,
      boundaries,
      rules,
      isActive: true,
      createdAt: new Date()
    };
    
    await this.storeGeofence(geofence);
    
    return geofence.id;
  }

  // Workplace Safety
  async detectSafetyIncident(
    deviceId: string,
    incidentType: 'fall' | 'panic' | 'gas_leak' | 'fire' | 'unauthorized_access',
    severity: 'low' | 'medium' | 'high' | 'critical',
    data: any
  ): Promise<void> {
    
    const incident = {
      id: this.generateIncidentId(),
      deviceId,
      type: incidentType,
      severity,
      timestamp: new Date(),
      data,
      status: 'active',
      responseTime: null
    };
    
    await this.storeSafetyIncident(incident);
    
    // Trigger emergency response
    if (severity === 'critical' || severity === 'high') {
      await this.triggerEmergencyResponse(incident);
    }
    
    // Send notifications
    await this.sendSafetyNotifications(incident);
  }

  async getWorkplaceSafetyScore(organizationId: string): Promise<{
    score: number;
    factors: Record<string, number>;
    incidents: number;
    trends: any;
    recommendations: string[];
  }> {
    
    const incidents = await this.getSafetyIncidents(organizationId, 30); // Last 30 days
    const environmentalData = await this.getEnvironmentalData(organizationId, {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      end: new Date()
    });
    
    const factors = {
      incidents: Math.max(0, 100 - incidents.length * 5),
      airQuality: this.calculateAirQualityScore(environmentalData),
      compliance: 95, // Would be calculated from compliance data
      training: 88,   // Would be calculated from training completion
      equipment: 92   // Would be calculated from equipment status
    };
    
    const score = Object.values(factors).reduce((sum, val) => sum + val, 0) / Object.keys(factors).length;
    
    return {
      score: Math.round(score),
      factors,
      incidents: incidents.length,
      trends: this.calculateSafetyTrends(organizationId),
      recommendations: this.generateSafetyRecommendations(score, factors)
    };
  }

  // Smart Workplace Automation
  async createAutomationRule(rule: Omit<AutomationRule, 'id'>): Promise<string> {
    const ruleId = this.generateRuleId();
    const newRule: AutomationRule = {
      ...rule,
      id: ruleId
    };
    
    this.automationRules.set(ruleId, newRule);
    await this.storeAutomationRule(newRule);
    
    return ruleId;
  }

  async executeAutomation(
    ruleId: string,
    triggerData: any
  ): Promise<void> {
    
    const rule = this.automationRules.get(ruleId);
    if (!rule || !rule.isActive) return;
    
    for (const action of rule.actions) {
      await this.executeAutomationAction(action, triggerData);
    }
    
    // Log automation execution
    await this.logAutomationExecution(ruleId, triggerData);
  }

  // Predictive Maintenance
  async predictMaintenanceNeeds(organizationId: string): Promise<Array<{
    deviceId: string;
    deviceName: string;
    predictedFailureDate: Date;
    confidence: number;
    maintenanceType: string;
    urgency: 'low' | 'medium' | 'high';
    estimatedCost: number;
  }>> {
    
    const devices = await this.getDevices(organizationId);
    const predictions = [];
    
    for (const device of devices) {
      const prediction = await this.analyzePredictiveMaintenance(device);
      if (prediction) {
        predictions.push(prediction);
      }
    }
    
    return predictions.sort((a, b) => a.predictedFailureDate.getTime() - b.predictedFailureDate.getTime());
  }

  // Real-time Analytics
  async getIoTAnalytics(organizationId: string): Promise<{
    deviceStatus: Record<string, number>;
    dataVolume: number;
    systemHealth: number;
    alerts: number;
    efficiency: number;
    costSavings: number;
  }> {
    
    const devices = await this.getDevices(organizationId);
    
    const deviceStatus = {
      online: devices.filter(d => d.status === 'online').length,
      offline: devices.filter(d => d.status === 'offline').length,
      maintenance: devices.filter(d => d.status === 'maintenance').length,
      error: devices.filter(d => d.status === 'error').length
    };
    
    const dataVolume = Array.from(this.sensorData.values())
      .reduce((sum, readings) => sum + readings.length, 0);
    
    const systemHealth = this.calculateSystemHealth(devices);
    const alerts = await this.getActiveAlerts(organizationId);
    const efficiency = await this.calculateIoTEfficiency(organizationId);
    const costSavings = await this.calculateCostSavings(organizationId);
    
    return {
      deviceStatus,
      dataVolume,
      systemHealth,
      alerts: alerts.length,
      efficiency,
      costSavings
    };
  }

  // Private helper methods
  private initializeDevices(): void {
    // Initialize sample devices for demo
    const sampleDevice: IoTDevice = {
      id: 'device_001',
      name: 'Main Entrance Scanner',
      type: DeviceType.BIOMETRIC_SCANNER,
      organizationId: 'org_001',
      location: {
        latitude: 40.7128,
        longitude: -74.0060,
        address: '123 Business St',
        zone: 'entrance'
      },
      status: 'online',
      battery: 85,
      signalStrength: 92,
      lastSeen: new Date(),
      firmware: '2.1.4',
      configuration: {
        sensitivity: 'high',
        timeout: 30,
        multiScan: true
      },
      capabilities: ['fingerprint', 'face_recognition', 'access_control']
    };
    
    this.devices.set(sampleDevice.id, sampleDevice);
  }

  private initializeAutomation(): void {
    // Initialize sample automation rules
    const sampleRule: AutomationRule = {
      id: 'rule_001',
      name: 'High Temperature Alert',
      organizationId: 'org_001',
      trigger: {
        deviceType: DeviceType.TEMPERATURE_MONITOR,
        condition: 'greater_than',
        threshold: 75
      },
      actions: [
        {
          type: 'notification',
          target: 'facilities_team',
          parameters: { message: 'High temperature detected', urgency: 'medium' }
        },
        {
          type: 'automation',
          target: 'hvac_system',
          parameters: { action: 'increase_cooling', intensity: 10 }
        }
      ],
      isActive: true,
      priority: 'medium'
    };
    
    this.automationRules.set(sampleRule.id, sampleRule);
  }

  private startDataCollection(): void {
    // Start periodic data collection from devices
    setInterval(() => {
      this.collectDataFromDevices();
    }, 30000); // Every 30 seconds
  }

  private async collectDataFromDevices(): Promise<void> {
    for (const device of Array.from(this.devices.values())) {
      if (device.status === 'online') {
        await this.simulateDataCollection(device);
      }
    }
  }

  private async simulateDataCollection(device: IoTDevice): Promise<void> {
    // Simulate sensor readings based on device type
    switch (device.type) {
      case DeviceType.ENVIRONMENTAL_SENSOR:
        await this.recordSensorReading({
          deviceId: device.id,
          timestamp: new Date(),
          type: 'temperature',
          value: 20 + Math.random() * 10,
          unit: 'celsius'
        });
        break;
      
      case DeviceType.BIOMETRIC_SCANNER:
        // Simulate random scans
        if (Math.random() > 0.95) {
          await this.processBiometricScan(device.id, {
            type: 'fingerprint',
            data: 'simulated_fingerprint_data',
            confidence: 0.9 + Math.random() * 0.1
          });
        }
        break;
    }
  }

  private generateDeviceId(): string {
    return 'device_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2);
  }

  private generateRuleId(): string {
    return 'rule_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2);
  }

  private generateIncidentId(): string {
    return 'incident_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2);
  }

  private generateGeofenceId(): string {
    return 'geofence_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2);
  }

  private async matchBiometric(biometricData: any): Promise<{ userId: string | null; confidence: number }> {
    // Simulate biometric matching
    return {
      userId: Math.random() > 0.1 ? 'user_123' : null,
      confidence: 0.85 + Math.random() * 0.15
    };
  }

  private async createBiometricTemplate(biometricData: any): Promise<string> {
    // Create biometric template
    return 'template_' + Math.random().toString(36);
  }

  private calculateAirQualityTrend(organizationId: string): 'improving' | 'stable' | 'deteriorating' {
    // Calculate air quality trend
    return 'stable';
  }

  private generateAirQualityRecommendations(airQuality: number): string[] {
    if (airQuality < 50) {
      return [
        'Improve ventilation systems',
        'Check air filters',
        'Consider air purifiers',
        'Monitor outdoor air quality'
      ];
    }
    return ['Maintain current air quality systems'];
  }

  private calculateSystemHealth(devices: IoTDevice[]): number {
    const onlineDevices = devices.filter(d => d.status === 'online').length;
    return devices.length > 0 ? (onlineDevices / devices.length) * 100 : 0;
  }

  private calculateAirQualityScore(environmentalData: WorkplaceEnvironment[]): number {
    if (environmentalData.length === 0) return 0;
    const avgAirQuality = environmentalData.reduce((sum, env) => sum + env.airQuality, 0) / environmentalData.length;
    return Math.min(100, avgAirQuality);
  }

  private calculateSafetyTrends(organizationId: string): any {
    return {
      incidents: { trend: 'decreasing', rate: -15 },
      compliance: { trend: 'stable', rate: 2 },
      training: { trend: 'increasing', rate: 8 }
    };
  }

  private generateSafetyRecommendations(score: number, factors: any): string[] {
    const recommendations = [];
    
    if (factors.incidents < 80) {
      recommendations.push('Increase safety training frequency');
    }
    if (factors.airQuality < 70) {
      recommendations.push('Improve ventilation systems');
    }
    if (factors.equipment < 85) {
      recommendations.push('Schedule equipment maintenance');
    }
    
    return recommendations;
  }

  // Placeholder methods for database operations
  private async storeDevice(device: IoTDevice): Promise<void> {}
  private async storeSensorReading(reading: SensorReading): Promise<void> {}
  private async storeAssetTracking(tracking: any): Promise<void> {}
  private async storeGeofence(geofence: any): Promise<void> {}
  private async storeSafetyIncident(incident: any): Promise<void> {}
  private async storeAutomationRule(rule: AutomationRule): Promise<void> {}
  private async storeBiometricTemplate(userId: string, template: string): Promise<void> {}
  private async logBiometricScan(deviceId: string, data: any, result: any): Promise<void> {}
  private async recordAttendance(userId: string, deviceId: string): Promise<void> {}
  private async sendConfigurationToDevice(deviceId: string, config: any): Promise<void> {}
  private async checkAutomationTriggers(reading: SensorReading): Promise<void> {}
  private async updateWorkplaceEnvironment(reading: SensorReading): Promise<void> {}
  private async getWorkplaceEnvironments(orgId: string, range: any): Promise<WorkplaceEnvironment[]> { return []; }
  private async checkGeofencing(assetId: string, location: any): Promise<void> {}
  private async getLatestAssetLocation(assetId: string): Promise<any> { return null; }
  private async getSafetyIncidents(orgId: string, days: number): Promise<any[]> { return []; }
  private async triggerEmergencyResponse(incident: any): Promise<void> {}
  private async sendSafetyNotifications(incident: any): Promise<void> {}
  private async executeAutomationAction(action: any, data: any): Promise<void> {}
  private async logAutomationExecution(ruleId: string, data: any): Promise<void> {}
  private async analyzePredictiveMaintenance(device: IoTDevice): Promise<any> { return null; }
  private async getActiveAlerts(orgId: string): Promise<any[]> { return []; }
  private async calculateIoTEfficiency(orgId: string): Promise<number> { return 85; }
  private async calculateCostSavings(orgId: string): Promise<number> { return 25000; }
  private async startDeviceMonitoring(deviceId: string): Promise<void> {}
}

export const iotService = new IoTService();