import * as L from 'leaflet';

export const MAP_CONSTANTS = {
  DEFAULT_US_CENTER: [39.8283, -98.5795] as L.LatLngTuple,
  LOCATION_ZOOM: 19,
  MAX_ZOOM: 22,
  MAX_NATIVE_ZOOM: 20,
  OVERVIEW_ZOOM: 4,
  SATELLITE_TILE_URL:
    'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  STREET_TILE_URL: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  SEGMENT_POPUP_HTML: (name: string, size: number) => `
    <div style="text-align: center;">
      <strong>${name}</strong><br/>
      ${size.toFixed(2)} ft²
    </div>
  `,
  LOCATION_MARKER_SVG: `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32">
      <path fill="#e74c3c" stroke="#fff" stroke-width="1" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
      <circle fill="#fff" cx="12" cy="9" r="2.5"/>
    </svg>
  `
};
