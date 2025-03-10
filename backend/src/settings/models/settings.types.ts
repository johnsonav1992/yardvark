export type SettingsData = {
  temperatureUnit: 'celsius' | 'fahrenheit';
};

export type SettingsResponse = {
  id: number;
  userId: string;
  value: SettingsData;
};
