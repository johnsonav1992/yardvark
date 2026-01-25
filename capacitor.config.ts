import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.yardvark.app',
  appName: 'Yardvark',
  webDir: 'dist/yardvark/browser',
  plugins: {
    SplashScreen: {
      launchAutoHide: false,
    },
  },
};

export default config;
