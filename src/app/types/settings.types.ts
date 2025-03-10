export type Settings = {
  id: number;
  userId: string;
  value: {
    temperatureUnit?: 'celsius' | 'fahrenheit';
  };
};
