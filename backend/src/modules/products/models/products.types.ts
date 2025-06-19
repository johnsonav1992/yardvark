export const PRODUCT_TYPES = {
	LAWN_FERTILIZER: 'fertilizer',
	PRE_EMERGENT: 'pre-emergent',
	POST_EMERGENT: 'post-emergent',
	BIO_STIMULANT: 'bio-stimulant',
	INSECT_CONTROL: 'insect-control',
	PLANT_FERTILIZER: 'plant-fertilizer',
	SEED: 'seed',
	FUNGUS_CONTROL: 'fungus-control',
	OTHER: 'other'
} as const;

export const productTypesArray = Object.values(PRODUCT_TYPES) as ProductType[];

export type ProductType = (typeof PRODUCT_TYPES)[keyof typeof PRODUCT_TYPES];
