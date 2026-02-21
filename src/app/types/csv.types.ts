export type CsvRowMapperFn<T> = (
	item: T,
) => (string | number | undefined | null)[];

export interface CsvExportConfig<T> {
	headers: string[];
	rowMapper: CsvRowMapperFn<T>;
	filename?: string;
}
