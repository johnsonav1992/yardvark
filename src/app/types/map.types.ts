import type * as L from "leaflet";

export type LeafletShape = L.Rectangle | L.Polygon;

export type EditableLayer = LeafletShape & {
	editing?: {
		enable: () => void;
		disable: () => void;
	};
};

export interface ShapeData {
	coordinates: number[][];
	size: number;
}
