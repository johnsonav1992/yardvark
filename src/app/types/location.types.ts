export type LatLong = {
  lat: number;
  long: number;
};

export type MapboxGeocodingResponse = {
  type: 'FeatureCollection';
  query: string[];
  features: Feature[];
  attribution: string;
};

export type Feature = {
  id: string;
  type: 'Feature';
  geometry: {
    type: 'Point';
    coordinates: [number, number];
  };
  properties: {
    id: string;
    name: string;
    description: string;
    place_name: string;
    place_type: string[];
    relevance: number;
    address: string;
    context: Array<{
      id: string;
      text: string;
      wikidata?: string;
      short_code?: string;
      language: string;
      bbox?: [number, number, number, number];
    }>;
  };
};
