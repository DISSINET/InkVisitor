export interface IResponseUsersStats {
  byType: { [key: string]: number };
  byEditor: { [key: string]: number };
  byTime: { [key: string]: number };
}
