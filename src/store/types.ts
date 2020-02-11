import { Map } from "../hamt";

// Configuration types
export type Key = any;

// Objects
export type Commit = {
  id: string;
  parentId: string | "-1";
  treeId: string;
  message?: string;
};

export type CommitLookup = {
  [s: string]: Commit;
};

export type HamtLookup = {
  [s: string]: Map;
};

// Classes
export interface IVersionable {
  set: (key: Key, value: any) => IVersionable;
  get: (key: Key) => any;
  checkout: (commitHash: string) => Commit;
  commit: (message?: string) => Commit;
  log: () => Commit[];
  setIn: (keys: Key[], value: any) => IVersionable;
  getIn: (keys: Key[]) => any;

  fromJS: (obj: any) => IVersionable;
  toJS: () => any;
}
