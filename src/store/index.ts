import hamt from "../hamt";
type Map = typeof hamt.empty;

type Commit = {
  id: string;
  parentId: string;
};

type CommitLookup = {
  [s: string]: Commit;
};

type HamtLookup = {
  [s: string]: Map;
};

export default class Versionable {
  _head: string | undefined;
  _workspace: Map = hamt.empty;
  _commits: CommitLookup = {};
  _hamt: HamtLookup = {};

  set(key: string, value: any) {
    this._workspace = this._workspace.set(key, value);
  }

  get(key: string) {
    return this._workspace.get(key);
  }

  commit() {
    this._workspace.root.ref();
  }
}
