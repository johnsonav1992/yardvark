export type LawnSegment = {
	id: number;
	userId: string;
	name: string;
	size: number;
	coordinates?: number[][][] | null;
	color?: string;
};
