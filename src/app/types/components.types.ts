export type Tab<
  TTitles extends string = string,
  TValues extends string = Uncapitalize<TTitles>
> = {
  title: TTitles;
  value: TValues;
  content?: string;
};
