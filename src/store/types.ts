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
  checkout: (commitHash: string) => IVersionable;
  commit: (message?: string) => IVersionable;
  log: () => Commit[];
  setIn: (keys: Key[], value: any) => IVersionable;
  getIn: (keys: Key[]) => any;

  fromJS: (obj: any) => IVersionable;
  toJS: () => any;
  status: {
    head: string;
    headCommit: Commit;
    hasChanges: boolean;
  };
}
