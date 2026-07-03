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

const NativeHealthKitBridgeByJsName = registerPlugin<NativeHealthKitBridgePlugin>('PhysicalClimbHealthKitBridge');
const NativeHealthKitBridgeByIdentifier = registerPlugin<NativeHealthKitBridgePlugin>('PhysicalClimbHealthKitPlugin');

function isNotImplementedError(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();
  return message.includes('not implemented') || message.includes('unimplemented') || message.includes('plugin is not implemented');
}

async function callBridgeWithFallback<T>(
  invoke: (plugin: NativeHealthKitBridgePlugin) => Promise<T>,
): Promise<T> {
  try {
    return await invoke(NativeHealthKitBridgeByJsName);
  } catch (error) {
    if (!isNotImplementedError(error)) {
      throw error;
    }
    return invoke(NativeHealthKitBridgeByIdentifier);
  }
}

class CapacitorHealthKitBridge implements HealthKitBridge {
  async isNativeAvailable() {
    try {
      const result = await callBridgeWithFallback((plugin) => plugin.isNativeAvailable());
      return result.available;
    } catch {
      return false;
    }
  }

  async requestHealthPermissions() {
    return callBridgeWithFallback((plugin) => plugin.requestHealthPermissions());
  }

  async readDailySummaries(startDate: string, endDate: string) {
    const result = await callBridgeWithFallback((plugin) => plugin.readDailySummaries({ startDate, endDate }));
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