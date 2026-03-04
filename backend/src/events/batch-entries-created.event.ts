export class BatchEntriesCreatedEvent {
	public readonly userId: string;
	public readonly count: number;
	public readonly feature: string;

	constructor(
		userId: string,
		count: number,
		feature: string = "entry_creation",
	) {
		this.userId = userId;
		this.count = count;
		this.feature = feature;
	}
}
