export type LatLong = {
  lat: number;
  long: number;
};

export interface MapboxGeocodingResponse {
  type: string;
  features: Feature[];
  attribution: string;
}

export interface Feature {
  type: string;
  id: string;
  geometry: Geometry;
  properties: Properties;
}

export interface Geometry {
  type: string;
  coordinates: number[];
}

export interface Properties {
  mapbox_id: string;
  feature_type: string;
  full_address: string;
  name: string;
  name_preferred: string;
  coordinates: Coordinates;
  place_formatted: string;
  match_code: MatchCode;
  context: Context;
}

export interface Coordinates {
  longitude: number;
  latitude: number;
  accuracy: string;
  routable_points: RoutablePoint[];
}

export interface RoutablePoint {
  name: string;
  latitude: number;
  longitude: number;
}

export interface MatchCode {
  address_number: string;
  street: string;
  postcode: string;
  place: string;
  region: string;
  locality: string;
  country: string;
  confidence: string;
}

export interface Context {
  address: Address;
  street: Street;
  postcode: Postcode;
  place: Place;
  district: District;
  region: Region;
  country: Country;
  neighborhood?: Neighborhood;
}

export interface Address {
  mapbox_id: string;
  address_number: string;
  street_name: string;
  name: string;
}

export interface Street {
  mapbox_id: string;
  name: string;
}

export interface Postcode {
  mapbox_id: string;
  name: string;
}

export interface Place {
  mapbox_id: string;
  name: string;
  wikidata_id: string;
  alternate?: Alternate;
}

export interface Alternate {
  mapbox_id: string;
  name: string;
}

export interface District {
  mapbox_id: string;
  name: string;
  wikidata_id: string;
}

export interface Region {
  mapbox_id: string;
  name: string;
  wikidata_id: string;
  region_code: string;
  region_code_full: string;
}

export interface Country {
  mapbox_id: string;
  name: string;
  wikidata_id: string;
  country_code: string;
  country_code_alpha_3: string;
}

export interface Neighborhood {
  mapbox_id: string;
  name: string;
}
