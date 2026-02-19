export class EntryCreatedEvent {
  public readonly userId: string;
  public readonly entryId: number;
  public readonly feature: string;

  constructor(
    userId: string,
    entryId: number,
    feature: string = 'entry_creation',
  ) {
    this.userId = userId;
    this.entryId = entryId;
    this.feature = feature;
  }
}
