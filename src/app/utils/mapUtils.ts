import * as L from 'leaflet';

const EARTH_RADIUS_METERS = 6371000;
const SQ_METERS_TO_SQ_FEET = 10.7639;

const degreesToRadians = (degrees: number): number => (degrees * Math.PI) / 180;

const roundToTwoDecimals = (value: number): number =>
  Math.round(value * 100) / 100;

export const polygonToCoordinates = (polygon: L.Polygon): number[][] => {
  const latlngs = polygon.getLatLngs()[0] as L.LatLng[];
  const coords = latlngs.map((latlng) => [latlng.lng, latlng.lat]);

  if (coords.length > 0) coords.push([...coords[0]]);

  return coords;
};

export const calculatePolygonArea = (polygon: L.Polygon): number => {
  const latlngs = polygon.getLatLngs()[0] as L.LatLng[];

  if (latlngs.length < 3) return 0;

  let area = 0;

  for (let i = 0; i < latlngs.length; i++) {
    const p1 = latlngs[i];
    const p2 = latlngs[(i + 1) % latlngs.length];

    const lat1 = degreesToRadians(p1.lat);
    const lat2 = degreesToRadians(p2.lat);
    const lng1 = degreesToRadians(p1.lng);
    const lng2 = degreesToRadians(p2.lng);

    area += (lng2 - lng1) * (2 + Math.sin(lat1) + Math.sin(lat2));
  }

  const areaSquareMeters = Math.abs(
    (area * EARTH_RADIUS_METERS * EARTH_RADIUS_METERS) / 2
  );

  return roundToTwoDecimals(areaSquareMeters * SQ_METERS_TO_SQ_FEET);
};

export const isRectangleCoordinates = (coords: number[][]): boolean =>
  coords.length === 5 &&
  coords[0][0] === coords[3][0] &&
  coords[0][1] === coords[1][1] &&
  coords[1][0] === coords[2][0] &&
  coords[2][1] === coords[3][1];
