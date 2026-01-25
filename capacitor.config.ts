import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.yardvark.app',
  appName: 'Yardvark',
  webDir: 'dist/yardvark/browser',
  // server: {
  //   // Uncomment these lines to enable live reload during development
  //   url: 'http://192.168.4.72:4200',
  //   cleartext: true,
  // },
  plugins: {
    SplashScreen: {
      launchAutoHide: false,
    },
  },
};

export default config;
