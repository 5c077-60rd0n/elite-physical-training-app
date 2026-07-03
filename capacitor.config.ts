import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.flashgordonpool.physicalclimb',
  appName: 'Physical Climb',
  webDir: 'dist',
  bundledWebRuntime: false,
  ios: {
    contentInset: 'automatic',
  },
  server: {
    androidScheme: 'https',
  },
};

export default config;