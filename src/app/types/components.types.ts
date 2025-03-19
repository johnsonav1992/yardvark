export type Tab<TTitles extends string = string> = {
  title: TTitles;
  value: Uncapitalize<TTitles>;
  content?: string;
};
