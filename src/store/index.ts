import hamt, { Map } from "../hamt";
import { IVersionable, CommitLookup, HamtLookup, Key, Commit } from "./types";

import hashObject from "../utils/hashObject";

function deeplySetIn(map: Map, keys: Key[], value: any): Map {
  const [keyCurrent, ...keyTail] = keys;

  if (keyTail.length > 0) {
    // NOTE: this will possibly overwrite arrays?
    // TODO: Write a test for arrays
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

const instanceMap = new WeakMap();

export default class Versionable implements IVersionable {
  private _workspace: Map;
  private _head: string;
  private _commits: CommitLookup;
  private _hamt: HamtLookup;

  constructor(versionable?: Versionable) {
    const cloneProps = versionable?.getPropsForClone() || {
      _workspace: hamt.empty as Map,
      _head: "-1",
      _commits: {},
      _hamt: {}
    };

    // Have to explcitly set the props here
    this._workspace = cloneProps._workspace;
    this._head = cloneProps._head;
    this._commits = cloneProps._commits;
    this._hamt = cloneProps._hamt;
    return this;
  }

  // Because protected props dont appear on the type
  // they cause a TS error when we try to use them
  // So we need to use a func to expose them
  protected getPropsForClone() {
    return {
      _workspace: this._workspace,
      _head: this._head,
      _commits: this._commits,
      _hamt: this._hamt
    };
  }

  private getNewInstance() {
    const newThis = new Versionable(this);
    instanceMap.set(this._workspace, newThis);
    return newThis;
  }

  // Return a new instance that tracks the instances _workspace object reference
  private newImmutableInstance(forceNew: boolean = false) {
    if (forceNew) return this.getNewInstance();
    const cacheInstance = instanceMap.get(this._workspace);
    if (cacheInstance) return cacheInstance;
    return this.getNewInstance();
  }

  set(key: Key, value: any) {
    this._workspace = this._workspace.set(key, value);
    return this.newImmutableInstance();
  }

  setIn(keys: Key[], value: any) {
    this._workspace = deeplySetIn(this._workspace, keys, value);
    return this.newImmutableInstance();
  }

  getIn(keys: Key[]) {
    return deeplyGetIn(this._workspace, keys);
  }

  get(key: string) {
    return this._workspace.get(key);
  }

  fromJS(obj: any) {
    this._workspace = hamt.fromJS(obj);
    return this.newImmutableInstance();
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
    return this.newImmutableInstance(true);
  }

  hasChanges() {
    return this._workspace.root?._ref() !== this._commits[this._head].treeId;
  }

  checkout(commitRef: string) {
    if (this.hasChanges()) {
      throw new Error(
        "Workspace is not clean! You need to commit your changes before moving to a new commit."
      );
    }
    const commit = this._commits[commitRef];
    const { treeId } = commit;

    this._workspace = this._hamt[treeId];
    this._head = commit.id;
    return this.newImmutableInstance(true);
  }

  get status() {
    return {
      head: this._head,
      headCommit: this._commits[this._head],
      hasChanges: this.hasChanges(),
      _commitRefs: this._commits
    };
  }
}

export function createStore(store?: Versionable) {
  return new Versionable(store);
}
