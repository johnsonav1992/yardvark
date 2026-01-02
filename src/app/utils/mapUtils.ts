import * as L from 'leaflet';
import { EditableLayer, ShapeData } from '../types/map.types';
import { MAP_CONSTANTS } from '../constants/map-constants';

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

export const getPolygonData = (polygon: L.Polygon): ShapeData | null => {
  const latlngs = polygon.getLatLngs()[0] as L.LatLng[];

  if (latlngs.length < 3) return null;

  return {
    coordinates: polygonToCoordinates(polygon),
    size: calculatePolygonArea(polygon)
  };
};

export const createShapeFromCoordinates = (
  coords: number[][],
  color: string,
  renderer?: L.Renderer
): EditableLayer => {
  const options: L.PolylineOptions = { color, fillOpacity: 0.3 };

  if (renderer) {
    options.renderer = renderer;
  }

  if (isRectangleCoordinates(coords)) {
    const bounds = L.latLngBounds(
      [coords[0][1], coords[0][0]],
      [coords[2][1], coords[2][0]]
    );

    return L.rectangle(bounds, options) as EditableLayer;
  }

  const latlngs = coords
    .slice(0, -1)
    .map((coord): L.LatLngTuple => [coord[1], coord[0]]);

  return L.polygon(latlngs, options) as EditableLayer;
};

export const createDrawControl = (
  color: string,
  featureGroup: L.FeatureGroup
): L.Control.Draw =>
  new L.Control.Draw({
    draw: {
      rectangle: false,
      polygon: {
        shapeOptions: { color, fillOpacity: 0.3 },
        repeatMode: false,
        showArea: false,
        allowIntersection: false,
        drawError: { color: '#e74c3c', message: 'Polygon edges cannot cross' }
      },
      circle: false,
      marker: false,
      polyline: false,
      circlemarker: false
    },
    edit: {
      featureGroup,
      edit: false,
      remove: false
    }
  });

export const createLocationMarkerIcon = (): L.DivIcon =>
  L.divIcon({
    className: 'location-marker',
    html: MAP_CONSTANTS.LOCATION_MARKER_SVG,
    iconSize: [32, 32],
    iconAnchor: [16, 32]
  });

export type EditMode = 'move' | 'add' | 'remove';

interface VertexMarkerConfig {
  mode: EditMode;
  isMobile: boolean;
  canRemove: boolean;
}

export const createVertexMarkerIcon = ({
  mode,
  isMobile,
  canRemove
}: VertexMarkerConfig): L.DivIcon => {
  let className = 'vertex-marker';
  let html = '';
  let iconSize: [number, number] = isMobile ? [36, 36] : [14, 14];
  let iconAnchor: [number, number] = isMobile ? [18, 18] : [7, 7];

  if (mode === 'move') {
    className = 'vertex-marker move-mode';
    iconSize = isMobile ? [40, 40] : [16, 16];
    iconAnchor = isMobile ? [20, 20] : [8, 8];
  } else if (mode === 'remove' && canRemove) {
    className = 'vertex-marker remove-mode';
    html = '<i class="ti ti-x"></i>';
    iconSize = isMobile ? [44, 44] : [24, 24];
    iconAnchor = isMobile ? [22, 22] : [12, 12];
  }

  return L.divIcon({ className, html, iconSize, iconAnchor });
};

export const createMidpointMarkerIcon = (isMobile: boolean): L.DivIcon => {
  const size = isMobile ? 40 : 20;
  const anchor = size / 2;

  return L.divIcon({
    className: 'midpoint-marker',
    html: '<i class="ti ti-plus"></i>',
    iconSize: [size, size],
    iconAnchor: [anchor, anchor]
  });
};
