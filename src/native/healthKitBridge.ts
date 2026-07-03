import { Capacitor, registerPlugin } from '@capacitor/core';
import type { HealthMetricEntry } from '../types';

export interface HealthKitPermissionStatus {
  granted: boolean;
  unavailableReason?: string;
}

export interface HealthKitDailySummary extends HealthMetricEntry {
  activeEnergyKcal?: number;
  restingHeartRate?: number;
  sleepHours?: number;
}

export interface HealthKitBridge {
  isNativeAvailable(): Promise<boolean>;
  requestHealthPermissions(): Promise<HealthKitPermissionStatus>;
  readDailySummaries(startDate: string, endDate: string): Promise<HealthKitDailySummary[]>;
}

interface NativeHealthKitBridgePlugin {
  isNativeAvailable(): Promise<{ available: boolean }>;
  requestHealthPermissions(): Promise<HealthKitPermissionStatus>;
  readDailySummaries(options: { startDate: string; endDate: string }): Promise<{ entries: HealthKitDailySummary[] }>;
}

const NativeHealthKitBridge = registerPlugin<NativeHealthKitBridgePlugin>('PhysicalClimbHealthKitBridge');

class CapacitorHealthKitBridge implements HealthKitBridge {
  async isNativeAvailable() {
    const result = await NativeHealthKitBridge.isNativeAvailable();
    return result.available;
  }

  async requestHealthPermissions() {
    return NativeHealthKitBridge.requestHealthPermissions();
  }

  async readDailySummaries(startDate: string, endDate: string) {
    const result = await NativeHealthKitBridge.readDailySummaries({ startDate, endDate });
    return result.entries;
  }
}

class WebFallbackHealthKitBridge implements HealthKitBridge {
  async isNativeAvailable() {
    return false;
  }

  async requestHealthPermissions() {
    return {
      granted: false,
      unavailableReason: 'HealthKit is only available from an iOS native wrapper, not from the web PWA runtime.',
    };
  }

  async readDailySummaries() {
    return [];
  }
}

export function getHealthKitBridge(): HealthKitBridge {
  return Capacitor.isNativePlatform() ? new CapacitorHealthKitBridge() : new WebFallbackHealthKitBridge();
}