export type SettingsData = {
  /**
   * The user's preferred temperature unit
   */
  temperatureUnit: 'celsius' | 'fahrenheit';
  /**
   * The type of grass the user has
   */
  grassType: 'warm' | 'cool';
  /**
   * Lawn size in sqft
   */
  lawnSize: number;
};

export type SettingsResponse = {
  id: number;
  userId: string;
  value: SettingsData;
};
