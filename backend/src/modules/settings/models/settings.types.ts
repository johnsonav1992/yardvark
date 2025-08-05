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
  /**
   * The user's preferred location address and lat/long
   */
  location: {
    address: string;
    lat: number;
    long: number;
  };
  /**
   * current settings for the entry log view
   */
  entryView: 'calendar' | 'list';
  /**
   * Whether to hide system products in the product list
   */
  hideSystemProducts: boolean;
  /**
   * Array of hidden dashboard widget names
   */
  hiddenWidgets: string[];
};

export type SettingsResponse = {
  id: number;
  userId: string;
  value: SettingsData;
};
