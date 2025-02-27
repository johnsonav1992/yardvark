export const getSoilTemperatureDisplayColor = (soilTemp: number) => {
  const temperatureColorMap: { [key: number]: string } = {
    25: 'purple',
    40: 'blue',
    45: 'green',
    50: 'yellow',
    55: 'orange',
  };

  for (const [temp, color] of Object.entries(temperatureColorMap)) {
    if (soilTemp < Number(temp)) return color;
  }

  return 'red';
};
