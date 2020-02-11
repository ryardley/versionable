import hamt, { Map } from "../hamt";
import { IVersionable, CommitLookup, HamtLookup, Key, Commit } from "./types";

import hashObject from "../utils/hashObject";

function deeplySetIn(map: Map, keys: Key[], value: any): Map {
  const [keyCurrent, ...keyTail] = keys;

  if (keyTail.length > 0) {
    // NOTE: this will possibly overwrite arrays?
    const currentValue = map.get(keyCurrent);
    const newMap = hamt.isMap(currentValue) ? currentValue : hamt.empty;
    return map.set(keyCurrent, deeplySetIn(newMap, keyTail, value));
  }
  return map.set(keyCurrent, value);
}

function deeplyGetIn(map: Map, keys: Key[]): any {
  const [keyCurrent, ...keyTail] = keys;

  if (keyTail.length > 0) {
    return deeplyGetIn(map.get(keyCurrent), keyTail);
  }

  if (map) {
    return map.get(keyCurrent);
  }

  return undefined;
}

function crawlLog(
  commitId: string,
  commitRefs: CommitLookup,
  list: Commit[] = []
): Commit[] {
  const commit = commitRefs[commitId];

  if (!commit) return list;

  const tail: Commit[] =
    commit.parentId !== "-1" ? crawlLog(commit.parentId, commitRefs) : [];

  return [...list, commit, ...tail];
}

export default class Versionable implements IVersionable {
  _workspace: Map = hamt.empty;
  _head: string = "-1";
  _commits: CommitLookup = {};
  _hamt: HamtLookup = {};

  set(key: Key, value: any) {
    this._workspace = this._workspace.set(key, value);
    return this;
  }

  setIn(keys: Key[], value: any) {
    this._workspace = deeplySetIn(this._workspace, keys, value);
    return this;
  }

  getIn(keys: Key[]) {
    return deeplyGetIn(this._workspace, keys);
  }

  get(key: string) {
    return this._workspace.get(key);
  }

  fromJS(obj: any) {
    this._workspace = hamt.fromJS(obj);
    return this;
  }

  toJS() {
    return this._workspace.toJS();
  }

  log() {
    return crawlLog(this._head, this._commits);
  }

  commit(message?: string) {
    // TODO: refactor to be more functional

    const treeRef = this._workspace.root?._ref() || "-1";

    const commitPayload = {
      parentId: this._head,
      treeId: treeRef
    };

    const commitRef = hashObject(commitPayload);
    const commit = { id: commitRef, message, ...commitPayload };

    this._head = commitRef;
    this._hamt[treeRef] = this._workspace;
    this._commits[commitRef] = commit;
    return commit;
  }

  checkout(commitRef: string) {
    // TODO: If workspace ref does not equal this._head then error.
    const wsRef = this._workspace.root?._ref();
    if (wsRef !== this._commits[this._head].treeId) {
      throw new Error(
        "Workspace is not clean! You need to commit your changes before moving to a new commit."
      );
    }
    const commit = this._commits[commitRef];
    const { treeId } = commit;

    this._workspace = this._hamt[treeId];
    this._head = commit.id;
    return commit;
  }
}
