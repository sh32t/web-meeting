import Query from 'query-string';

export interface WMUrl extends Query.ParsedUrl {
  roomId: string;
}
