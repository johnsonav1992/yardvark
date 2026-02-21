import { LawnSegment } from "./lawn-segments.model";

export type LawnSegmentCreationRequest = Omit<
	InstanceType<typeof LawnSegment>,
	"id" | "entries" | "userId"
>;

export type LawnSegmentUpdateRequest = Partial<
	Omit<InstanceType<typeof LawnSegment>, "id" | "entries" | "userId">
>;

export type LawnSegmentMapData = {
	coordinates: number[][][];
	color: string;
};
