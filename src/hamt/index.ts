// Much of this file has been shamelessly lifted from Matt Bierner's excellent work
// https://github.com/mattbierner/hamt

// TODO: this file is a mess is huge and should be split up to make things simpler
// TODO: extract hamt assignment
// TODO: extract Map
// TODO: extract MapIterator
// TODO: extract functional interface

import sha1 from "js-sha1";

function hashObject(obj: any) {
  return sha1(JSON.stringify(obj));
}

const id = (a: any) => a;

/**
    @fileOverview Hash Array Mapped Trie.

    Code based on: https://github.com/exclipy/pdata
*/
const hamt: any = {}; // export

/* Configuration
 ******************************************************************************/
const SIZE = 5;

const BUCKET_SIZE = Math.pow(2, SIZE);

const MASK = BUCKET_SIZE - 1;

const MAX_INDEX_NODE = BUCKET_SIZE / 2;

const MIN_ARRAY_NODE = BUCKET_SIZE / 4;

/*
 ******************************************************************************/
const defaultValBind = (f: any, defaultValue: any) =>
  function(x: any) {
    return f(arguments.length === 0 ? defaultValue : x);
  };

/**
    Get 32 bit hash of string.

    Based on:
    http://stackoverflow.com/questions/7616461/generate-a-hash-from-string-in-javascript-jquery
*/
const hash = (hamt.hash = (str: any) => {
  const type = typeof str;
  if (type === "number") return str;
  if (type !== "string") str += "";

  let hash = 0;
  for (let i = 0, len = str.length; i < len; ++i) {
    const c = str.charCodeAt(i);
    hash = ((hash << 5) - hash + c) | 0;
  }
  return hash;
});

/* Bit Ops
 ******************************************************************************/
/**
    Hamming weight.

    Taken from: http://jsperf.com/hamming-weight
*/
const popcount = (x: any) => {
  x -= (x >> 1) & 0x55555555;
  x = (x & 0x33333333) + ((x >> 2) & 0x33333333);
  x = (x + (x >> 4)) & 0x0f0f0f0f;
  x += x >> 8;
  x += x >> 16;
  return x & 0x7f;
};

const hashFragment = (shift: any, h: any) => (h >>> shift) & MASK;

const toBitmap = (x: any) => 1 << x;

const fromBitmap = (bitmap: any, bit: any) => popcount(bitmap & (bit - 1));

/* Array Ops
 ******************************************************************************/
/**
    Set a value in an array.

    @param at Index to change.
    @param v New value
    @param arr Array.
*/
const arrayUpdate = (at: any, v: any, arr: any) => {
  const len = arr.length;
  const out = new Array(len);
  for (let i = 0; i < len; ++i) out[i] = arr[i];
  out[at] = v;
  return out;
};

/**
    Remove a value from an array.

    @param at Index to remove.
    @param arr Array.
*/
const arraySpliceOut = (at: any, arr: any) => {
  const len = arr.length;
  const out = new Array(len - 1);
  let i = 0,
    g = 0;
  while (i < at) out[g++] = arr[i++];
  ++i;
  while (i < len) out[g++] = arr[i++];
  return out;
};

/**
    Insert a value into an array.

    @param at Index to insert at.
    @param v Value to insert,
    @param arr Array.
*/
const arraySpliceIn = (at: any, v: any, arr: any) => {
  const len = arr.length;
  const out = new Array(len + 1);
  let i = 0,
    g = 0;
  while (i < at) out[g++] = arr[i++];
  out[g++] = v;
  while (i < len) out[g++] = arr[i++];
  return out;
};

/* Node Structures
 ******************************************************************************/
const LEAF = 1;
const COLLISION = 2;
const INDEX = 3;
const ARRAY = 4;
const MAP = 5;
/**
    Leaf holding a value.

    @member hash Hash of key.
    @member key Key.
    @member value Value stored.
    @member _refCreatedAt Function to return the rootNode's ref
*/
const Leaf = (
  hash: QuickHash,
  key: any,
  value: any,
  _refCreatedAt: any
): LeafTrieNode => {
  if (!_refCreatedAt) throw new Error("_refCreatedAt must be set");
  const _ref = () => hashObject({ type: LEAF, hash, key, value });
  return {
    type: LEAF,
    hash,
    key,
    value,
    _refCreatedAt,
    _ref,
    _modify: Leaf__modify
  };
};

function isLeafNode(node: any): node is LeafTrieNode {
  return node.type === LEAF;
}

/**
    Leaf holding multiple values with the same hash but different keys.

    @member hash Hash of key.
    @member children Array of collision children node.
    @member _refCreatedAt Function to return the rootNode's ref
*/
const Collision = (
  hash: QuickHash,
  children: any,
  _refCreatedAt: any
): CollisionTrieNode => {
  const _ref = () => hashObject({ type: COLLISION, hash, children });
  return {
    type: COLLISION,
    hash,
    children,
    _refCreatedAt,
    _ref,
    _modify: Collision__modify
  };
};

function isCollisionNode(node: any): node is CollisionTrieNode {
  return node.type === COLLISION;
}

/**
    Internal node with a sparse set of children.

    Uses a bitmap and array to pack children.

    @member mask Bitmap that encode the positions of children in the array.
    @member children Array of child nodes.
    @member _refCreatedAt Function to return the rootNode's ref
*/
const IndexedNode = (
  mask: any,
  children: any,
  _refCreatedAt: any
): IndexedTrieNode => ({
  type: INDEX,
  mask,
  children,
  _refCreatedAt,
  _ref: () => hashObject({ type: INDEX, mask, children }),
  _modify: IndexedNode__modify
});

function isIndexedNode(node: any): node is IndexedTrieNode {
  return node.type === INDEX;
}

/**
    Internal node with many children.

    @member size Number of children.
    @member children Array of child nodes.
    @member _refCreatedAt Function to return the rootNode's ref
*/
const ArrayNode = (
  size: any,
  children: any,
  _refCreatedAt: any
): ArrayTrieNode => ({
  type: ARRAY,
  size,
  children,
  _refCreatedAt,
  _ref: () => hashObject({ type: ARRAY, size, children }),
  _modify: ArrayNode__modify
});

function isArrayNode(node: any): node is ArrayTrieNode {
  return node.type === ARRAY;
}

/**
    Is `node` a theoretical leaf node? 
    NOTE: this conflates collision nodes with leaf nodes. Honestly that seems odd. Why I am not sure. 
    So I cannot use it as a TS guard function
*/
function isLeaf(node: any) {
  return node.type === LEAF || node.type === COLLISION;
}

/* Internal node operations.
 ******************************************************************************/
/**
    Expand an indexed node into an array node.

    @param frag Index of added child.
    @param child Added child.
    @param mask Index node mask before child added.
    @param subNodes Index node children before child added.
*/
const expand = (
  frag: any,
  child: any,
  bitmap: any,
  subNodes: any,
  _refCreatedAt: any
) => {
  const arr = [];
  let bit = bitmap;
  let count = 0;
  for (let i = 0; bit; ++i) {
    if (bit & 1) arr[i] = subNodes[count++];
    bit >>>= 1;
  }
  arr[frag] = child;
  return ArrayNode(count + 1, arr, _refCreatedAt);
};

/**
    Collapse an array node into a indexed node.

    @param count Number of elements in new array.
    @param removed Index of removed element.
    @param elements Array node children before remove.
    @member _refCreatedAt Function to return the rootNode's ref
*/
const pack = (count: any, removed: any, elements: any, _refCreatedAt: any) => {
  const children = new Array(count - 1);
  let g = 0;
  let bitmap = 0;
  for (let i = 0, len = elements.length; i < len; ++i) {
    if (i !== removed) {
      const elem = elements[i];
      if (elem) {
        children[g++] = elem;
        bitmap |= 1 << i;
      }
    }
  }
  return IndexedNode(bitmap, children, _refCreatedAt);
};

/**
    Merge two leaf nodes.

    @param shift Current shift.
    @param h1 Node 1 hash.
    @param n1 Node 1.
    @param h2 Node 2 hash.
    @param n2 Node 2.
    @member _refCreatedAt Function to return the rootNode's ref
*/
const mergeLeaves = (
  shift: any,
  h1: any,
  n1: any,
  h2: any,
  n2: any,
  _refCreatedAt: any
): any => {
  if (h1 === h2) return Collision(h1, [n2, n1], _refCreatedAt);

  const subH1 = hashFragment(shift, h1);
  const subH2 = hashFragment(shift, h2);
  return IndexedNode(
    toBitmap(subH1) | toBitmap(subH2),
    subH1 === subH2
      ? [mergeLeaves(shift + SIZE, h1, n1, h2, n2, _refCreatedAt)]
      : subH1 < subH2
      ? [n1, n2]
      : [n2, n1],
    _refCreatedAt
  );
};

/**
    Update an entry in a collision list.

    @param hash Hash of collision.
    @param list Collision list.
    @param op Update operation.
    @param k Key to update.
    @param size Size reference
    @member _refCreatedAt Function to return the rootNode's ref
*/
const updateCollisionList = (
  h: any,
  list: any,
  op: any,
  k: any,
  size: any,
  _refCreatedAt: any
) => {
  const len = list.length;
  for (let i = 0; i < len; ++i) {
    const child = list[i];
    if (child.key === k) {
      const value = child.value;
      if (op.__hamt_delete_op) {
        --size.value;
        return arraySpliceOut(i, list);
      }
      const newValue = op.__hamt_set_op ? op.value : op(value);
      if (newValue === value) return list;
      return arrayUpdate(i, Leaf(h, k, newValue, _refCreatedAt), list);
    }
  }

  if (op.__hamt_delete_op) return list;
  const newValue = op.__hamt_set_op ? op.value : op();
  ++size.value;
  return arrayUpdate(len, Leaf(h, k, newValue, _refCreatedAt), list);
};

/* Editing
 ******************************************************************************/
const Leaf__modify = function(
  shift: any,
  op: any,
  h: any,
  k: any,
  size: any,
  _refCreatedAt: any
) {
  // console.log({ Leaf__modify: _refCreatedAt });
  if (k === this.key) {
    if (op.__hamt_delete_op) {
      --size.value;
      return undefined;
    }
    const currentValue = this.value;
    const newValue = op.__hamt_set_op ? op.value : op(currentValue);
    return newValue === currentValue
      ? this
      : Leaf(h, k, newValue, _refCreatedAt);
  }
  if (op.__hamt_delete_op) return this;
  const newValue = op.__hamt_set_op ? op.value : op();
  ++size.value;
  return mergeLeaves(
    shift,
    this.hash,
    this,
    h,
    Leaf(h, k, newValue, _refCreatedAt),
    _refCreatedAt
  );
};

const Collision__modify = function(
  shift: any,
  op: any,
  h: any,
  k: any,
  size: any,
  _refCreatedAt: any
) {
  if (h === this.hash) {
    const list = updateCollisionList(
      this.hash,
      this.children,
      op,
      k,
      size,
      _refCreatedAt
    );
    if (list === this.children) return this;

    return list.length > 1
      ? Collision(this.hash, list, _refCreatedAt)
      : list[0]; // collapse single element collision list
  }
  if (op.__hamt_delete_op) return this;
  const newValue = op.__hamt_set_op ? op.value : op();
  ++size.value;
  return mergeLeaves(
    shift,
    this.hash,
    this,
    h,
    Leaf(h, k, newValue, _refCreatedAt),
    _refCreatedAt
  );
};

const IndexedNode__modify = function(
  shift: any,
  op: any,
  h: any,
  k: any,
  size: any,
  _refCreatedAt: any
) {
  const mask = this.mask;
  const children = this.children;
  const frag = hashFragment(shift, h);
  const bit = toBitmap(frag);
  const indx = fromBitmap(mask, bit);
  const exists = mask & bit;
  if (!exists) {
    // add
    const newChild = empty__modify(shift + SIZE, op, h, k, size, _refCreatedAt);
    if (!newChild) return this;

    return children.length >= MAX_INDEX_NODE
      ? expand(frag, newChild, mask, children, _refCreatedAt)
      : IndexedNode(
          mask | bit,
          arraySpliceIn(indx, newChild, children),
          _refCreatedAt
        );
  }

  const current = children[indx];
  const newChild = current._modify(shift + SIZE, op, h, k, size, _refCreatedAt);
  if (current === newChild) return this;

  if (!newChild) {
    // remove
    const bitmap = mask & ~bit;
    if (!bitmap) return undefined;

    return children.length === 2 && isLeaf(children[indx ^ 1])
      ? children[indx ^ 1] // collapse
      : IndexedNode(bitmap, arraySpliceOut(indx, children), _refCreatedAt);
  }

  // modify
  return op.__hamt_delete_op && children.length === 1 && isLeaf(newChild)
    ? newChild // propagate collapse
    : IndexedNode(mask, arrayUpdate(indx, newChild, children), _refCreatedAt);
};

const ArrayNode__modify = function(
  shift: any,
  op: any,
  h: any,
  k: any,
  size: any,
  _refCreatedAt: any
) {
  const count = this.size;
  const children = this.children;
  const frag = hashFragment(shift, h);
  const child = children[frag];
  const newChild = child
    ? child._modify(shift + SIZE, op, h, k, size, _refCreatedAt)
    : empty__modify(shift + SIZE, op, h, k, size, _refCreatedAt);

  if (child === newChild) return this;

  if (!child && newChild) {
    // add
    return ArrayNode(
      count + 1,
      arrayUpdate(frag, newChild, children),
      _refCreatedAt
    );
  }
  if (child && !newChild) {
    // remove
    return count - 1 <= MIN_ARRAY_NODE
      ? pack(count, frag, children, _refCreatedAt)
      : ArrayNode(
          count - 1,
          arrayUpdate(frag, undefined, children),
          _refCreatedAt
        );
  }

  // modify
  return ArrayNode(count, arrayUpdate(frag, newChild, children), _refCreatedAt);
};

const empty__modify = (
  _: any,
  op: any,
  h: any,
  k: any,
  size: any,
  _refCreatedAt: any
) => {
  if (op.__hamt_delete_op) return undefined;
  const newValue = op.__hamt_set_op ? op.value : op();
  ++size.value;
  return Leaf(h, k, newValue, _refCreatedAt || (() => -1));
};

/*
 ******************************************************************************/

class Map {
  __hamt_isMap = true;

  constructor(public root: TrieNode | undefined, public size: number) {}

  setTree(root: TrieNode, size: number) {
    return root === this.root ? this : new Map(root, size);
  }

  tryGetHash(alt: any, hash: QuickHash, key: any) {
    return tryGetHash(alt, hash, key, this);
  }

  tryGet(alt: any, key: any) {
    return tryGet(alt, key, this);
  }

  getHash(hash: QuickHash, key: any) {
    return getHash(hash, key, this);
  }

  get(key: any, alt: any) {
    return tryGet(alt, key, this);
  }
  hasHash(hash: QuickHash, key: any) {
    return hasHash(hash, key, this);
  }

  has(key: any) {
    return has(key, this);
  }

  isEmpty() {
    return hamt.isEmpty(this);
  }

  modifyHash(hash: QuickHash, key: any, f: any) {
    return modifyHash(f, hash, key, this);
  }

  modify(key: any, f: any) {
    return modify(f, key, this);
  }

  modifyValueHash(hash: QuickHash, key: any, f: any, defaultValue: any) {
    return modifyValueHash(f, defaultValue, hash, key, this);
  }

  modifyValue(key: any, f: any, defaultValue: any) {
    return modifyValue(f, defaultValue, key, this);
  }

  setHash(hash: QuickHash, key: any, value: any) {
    return setHash(hash, key, value, this);
  }

  set(key: any, value: any) {
    return set(key, value, this);
  }

  deleteHash(hash: QuickHash, key: any) {
    return removeHash(hash, key, this);
  }
  removeHash = this.deleteHash;

  delete(key: any) {
    return remove(key, this);
  }
  remove = this.delete;

  entries() {
    return entries(this);
  }

  [Symbol.iterator] = this.entries;

  keys() {
    return keys(this);
  }

  values() {
    return values(this);
  }

  fold(f: any, z: any) {
    return fold(f, z, this);
  }

  forEach(f: any) {
    return forEach(f, this);
  }

  count() {
    return count(this);
  }

  serialize({ filter, ...options } = { filter: id, includeRootKey: true }) {
    return toJSON(this.refs(filter, options));
  }

  serializeLatest() {
    return toJSON(this.refsLatest());
  }

  refsLatest() {
    const rootRef = this.root?._refCreatedAt();
    if (!rootRef) throw new Error("rootRef is undefined");
    return references(this, node => node._refCreatedAt() === rootRef, false);
  }

  refs(filter = id, options = { includeRootKey: true }) {
    return references(this, filter, options.includeRootKey);
  }

  toJS() {
    return toJS(this);
  }
}

/* Queries
 ******************************************************************************/
/**
    Lookup the value for `key` in `map` using a custom `hash`.

    Returns the value or `alt` if none.
*/
const tryGetHash = (hamt.tryGetHash = (
  alt: any,
  hash: QuickHash,
  key: any,
  map: any
) => {
  if (!map.root) return alt;

  let node = map.root;
  let shift = 0;
  while (true)
    switch (node.type) {
      case LEAF: {
        return key === node.key ? node.value : alt;
      }
      case COLLISION: {
        if (hash === node.hash) {
          const children = node.children;
          for (let i = 0, len = children.length; i < len; ++i) {
            const child = children[i];
            if (key === child.key) return child.value;
          }
        }
        return alt;
      }
      case INDEX: {
        const frag = hashFragment(shift, hash);
        const bit = toBitmap(frag);
        if (node.mask & bit) {
          node = node.children[fromBitmap(node.mask, bit)];
          shift += SIZE;
          break;
        }
        return alt;
      }
      case ARRAY: {
        node = node.children[hashFragment(shift, hash)];
        if (node) {
          shift += SIZE;
          break;
        }
        return alt;
      }
      default:
        return alt;
    }
});

/**
    Lookup the value for `key` in `map` using internal hash function.

    @see `tryGetHash`
*/
const tryGet = (hamt.tryGet = (alt: any, key: any, map: any) =>
  tryGetHash(alt, hash(key), key, map));

/**
    Lookup the value for `key` in `map` using a custom `hash`.

    Returns the value or `undefined` if none.
*/
const getHash = (hamt.getHash = (hash: QuickHash, key: any, map: any) =>
  tryGetHash(undefined, hash, key, map));

/**
    Lookup the value for `key` in `map` using internal hash function.

    @see `get`
*/
/*const get = */

hamt.get = (key: any, map: any) => tryGetHash(undefined, hash(key), key, map);

const nothing = {};
/**
    Does an entry exist for `key` in `map`? Uses custom `hash`.
*/
const hasHash = (hamt.has = (hash: QuickHash, key: any, map: any) =>
  tryGetHash(nothing, hash, key, map) !== nothing);

/**
    Does an entry exist for `key` in `map`? Uses internal hash function.
*/
const has = (hamt.has = (key: any, map: any) => hasHash(hash(key), key, map));

/**
    Empty node.
*/
hamt.empty = new Map(undefined, 0);

/**
    Is `value` a map?
*/
function isMap(value: any): value is Map {
  return !!(value && value.__hamt_isMap);
}

hamt.isMap = isMap;

/**
    Does `map` contain any elements?
*/
hamt.isEmpty = (map: any) => hamt.isMap(map) && !map.root;

/* Updates
 ******************************************************************************/
/**
    Alter the value stored for `key` in `map` using function `f` using
    custom hash.

    `f` is invoked with the current value for `k` if it exists,
    or `defaultValue` if it is specified. Otherwise, `f` is invoked with no arguments
    if no such value exists.

    `modify` will always either update or insert a value into the map.

    Returns a map with the modified value. Does not alter `map`.
*/
const modifyHash = (hamt.modifyHash = (
  f: any,
  hash: QuickHash,
  key: any,
  map: any
) => {
  const size = { value: map.size };
  const newRoot = map.root
    ? map.root._modify(0, f, hash, key, size, map.root._ref)
    : empty__modify(0, f, hash, key, size, undefined);
  return map.setTree(newRoot, size.value);
});

/**
    Alter the value stored for `key` in `map` using function `f` using
    internal hash function.

    @see `modifyHash`
*/
const modify = (hamt.modify = (f: any, key: any, map: any) =>
  modifyHash(f, hash(key), key, map));

/**
    Same as `modifyHash`, but invokes `f` with `defaultValue` if no entry exists.

    @see `modifyHash`
*/
const modifyValueHash = (hamt.modifyValueHash = (
  f: any,
  defaultValue: any,
  hash: QuickHash,
  key: any,
  map: any
) => modifyHash(defaultValBind(f, defaultValue), hash, key, map));

/**
    @see `modifyValueHash`
*/
const modifyValue = (hamt.modifyValue = (
  f: any,
  defaultValue: any,
  key: any,
  map: any
) => modifyValueHash(f, defaultValue, hash(key), key, map));

/**
    Store `value` for `key` in `map` using custom `hash`.

    Returns a map with the modified value. Does not alter `map`.
*/
const setHash = (hamt.setHash = function(
  hash: QuickHash,
  key: any,
  value: any,
  map: any
) {
  return modifyHash({ __hamt_set_op: true, value: value }, hash, key, map);
});

/**
    Store `value` for `key` in `map` using internal hash function.

    @see `setHash`
*/
const set = (hamt.set = (key: any, value: any, map: any) =>
  setHash(hash(key), key, value, map));

/**
    Remove the entry for `key` in `map`.

    Returns a map with the value removed. Does not alter `map`.
*/
const del = { __hamt_delete_op: true };
const removeHash = (hamt.removeHash = (hash: QuickHash, key: any, map: any) =>
  modifyHash(del, hash, key, map));

/**
    Remove the entry for `key` in `map` using internal hash function.

    @see `removeHash`
*/
const remove = (hamt.remove = (key: any, map: any) =>
  removeHash(hash(key), key, map));

/* Traversal
 ******************************************************************************/
/**
    Apply a continuation.
*/
const appk = (k: any) =>
  k && lazyVisitChildren(k.len, k.children, k.i, k.f, k.k);

/**
    Recursively visit all values stored in an array of nodes lazily.
*/
const lazyVisitChildren = (
  len: any,
  children: any,
  i: any,
  f: any,
  k: any
): any => {
  while (i < len) {
    const child = children[i++];
    if (child) return lazyVisit(child, f, { len, children, i, f, k });
  }
  return appk(k);
};

/**
    Recursively visit all values stored in `node` lazily.
*/
const lazyVisit = (node: any, f: any, k?: any) => {
  if (node.type === LEAF) return { value: f(node), rest: k };

  const children = node.children;
  return lazyVisitChildren(children.length, children, 0, f, k);
};

const DONE = { done: true };

/**
    Javascript iterator over a map.
*/

class MapIterator {
  v: any;
  constructor(v: any) {
    this.v = v;
  }

  next() {
    if (!this.v) return DONE;
    const v0 = this.v;
    this.v = appk(v0.rest);
    return v0;
  }

  [Symbol.iterator] = () => this;
}

/**
    Lazily visit each value in map with function `f`.
*/
const visit = (map: any, f: any) =>
  new MapIterator(map.root ? lazyVisit(map.root, f) : undefined);

/**
    Get a Javascript iterator of `map`.

    Iterates over `[key, value]` arrays.
*/
const buildPairs = (x: any) => [x.key, x.value];
const entries = (hamt.entries = (map: any) => visit(map, buildPairs));

/**
    Get array of all keys in `map`.

    Order is not guaranteed.
*/
const buildKeys = (x: any) => x.key;
const keys = (hamt.keys = (map: any) => visit(map, buildKeys));

/**
    Get array of all values in `map`.

    Order is not guaranteed, duplicates are preserved.
*/
const buildValues = (x: any) => x.value;

const values = (hamt.values = (map: any) => visit(map, buildValues));

/* Fold
 ******************************************************************************/
/**
    Visit every entry in the map, aggregating data.

    Order of nodes is not guaranteed.

    @param f Function mapping accumulated value, value, and key to new value.
    @param z Starting value.
    @param m HAMT
*/
const fold = (hamt.fold = (f: any, z: any, m: any) => {
  const root = m.root;
  if (!root) return z;

  if (root.type === LEAF) return f(z, root.value, root.key);

  for (let toVisit = root; toVisit; ) {
    const children = toVisit.children;
    toVisit = toVisit.next;
    for (let i = 0, len = children.length; i < len; ) {
      const child = children[i++];
      if (child) {
        if (child.type === LEAF) z = f(z, child.value, child.key);
        else toVisit = { children: child.children, next: toVisit };
      }
    }
  }
  return z;
});

/**
    Visit every entry in the map, aggregating data.

    Order of nodes is not guaranteed.

    @param f Function invoked with value and key
    @param map HAMT
*/
const forEach = (hamt.forEach = (f: any, map: any) =>
  fold((_: any, value: any, key: any) => f(value, key, map), null, map));

/* Aggregate
 ******************************************************************************/
/**
    Get the number of entries in `map`.
*/
const count = (hamt.count = (map: any) => map.size);

/* Serialize
 ******************************************************************************/
/**
    Serialize the internal HAMT structure to JSON
*/
function toJSON(refs: any) {
  return JSON.stringify(refs);
}

function fromJSON(str: any) {
  return JSON.parse(str);
}

/* Deserialize
 ******************************************************************************/
/**
    Deserialize a string representation of the internal HAMT structure to a tree
*/
hamt.deserialize = function deserialize(strOrObject: any) {
  const refs =
    typeof strOrObject === "string" ? fromJSON(strOrObject) : strOrObject;

  const rootKey = refs._root;
  if (!rootKey) {
    throw new Error("_root key not found in refs");
  }

  const rootNode = refs[rootKey];

  if (!rootNode) {
    throw new Error("_root object not found in refs");
  }

  return hamt.empty.setTree(rebuildNode(rootNode, refs));
};

const modifyFnTable = {
  [LEAF]: Leaf__modify,
  [COLLISION]: Collision__modify,
  [INDEX]: IndexedNode__modify,
  [ARRAY]: ArrayNode__modify
};

function rebuildNode(
  node: {
    type: keyof typeof modifyFnTable;
    children: any[];
    _refCreatedAt: () => any;
    _ref: () => any;
  },
  refs: any
): any {
  return {
    ...node,
    ...(node.children
      ? {
          children: node.children.map(({ _ref }: any) =>
            rebuildNode(refs[_ref], refs)
          )
        }
      : {}),
    _ref: () => node._ref,
    _refCreatedAt: () => node._refCreatedAt,
    _modify: modifyFnTable[node.type]
  };
}

/* Serialize Latest
 ******************************************************************************/
/**
    Serialize internal HAMT structure to JSON
*/

/* References Latest
 ******************************************************************************/
/**
  Get an object lookup table containing the most recently created node references 
  indexed by objectHash
*/

/* Refs
 ******************************************************************************/
/**
  Get an object lookup table containing all the node references indexed by objectHash
*/

function references(
  node: TrieNode | Map,
  filter = id,
  includeRootKey = true
): RefLookup {
  const trieNode: TrieNode | undefined = isMap(node) ? node.root : node;

  if (!trieNode) return {};

  const lookupTable: RefLookup = includeRootKey
    ? { _root: trieNode._ref() }
    : {};

  return createGatherRefsReducer(filter)(lookupTable, trieNode);
}

function nodeHasChildren(node: TrieNode): node is TrieNodeWithChildren {
  return !!(node as TrieNode & { children: any[] }).children;
}

function serializeLeaf(node: LeafTrieNode): LeafTrieNodeSerialized {
  const { _ref, _refCreatedAt, type, hash, key, value } = node;
  return {
    type,
    hash,
    key,
    value,
    _ref: _ref(),
    _refCreatedAt: _refCreatedAt(),
    _modify: undefined
  };
}

function serializeArrayNode(node: ArrayTrieNode): ArrayTrieNodeSerialized {
  const { _ref, _refCreatedAt, type, size, children = [] } = node;

  return {
    type,
    size,
    children: children.map((c: TrieNode) => ({ _ref: c._ref() })),
    _ref: _ref(),
    _refCreatedAt: _refCreatedAt(),
    _modify: undefined
  };
}

function serializeCollisionNode(
  node: CollisionTrieNode
): CollisionTrieNodeSerialized {
  const { _ref, _refCreatedAt, type, hash, children = [] } = node;
  return {
    type,
    hash,
    children: children.map((c: TrieNode) => ({ _ref: c._ref() })),
    _ref: _ref(),
    _refCreatedAt: _refCreatedAt(),
    _modify: undefined
  };
}

function serializeIndexedNode(
  node: IndexedTrieNode
): IndexedTrieNodeSerialized {
  const { _ref, _refCreatedAt, type, mask, children = [] } = node;
  return {
    type,
    mask,
    children: children.map((c: TrieNode) => ({ _ref: c._ref() })),
    _ref: _ref(),
    _refCreatedAt: _refCreatedAt(),
    _modify: undefined
  };
}

function serializeMap(map: Map): MapNodeSerialized {
  if (!map.root) {
    throw new Error("Cannot serialize an empty map.");
  }
  return {
    type: MAP,
    _root: map.root._ref(),
    _ref: sha1(map.root._ref())
  };
}

type NodeFilterFn = (node: TrieNode) => boolean;

function getSerializeNode(node: TrieNode): TrieNodeSerialized {
  if (isArrayNode(node)) return serializeArrayNode(node);
  if (isCollisionNode(node)) return serializeCollisionNode(node);
  if (isIndexedNode(node)) return serializeIndexedNode(node);

  return serializeLeaf(node); // This will not be reached in theory
}

const createGatherRefsReducer = (filter: NodeFilterFn) =>
  function gatherRefsReducer(acc: RefLookup, node?: TrieNode) {
    if (!node) return acc;

    if (nodeHasChildren(node)) {
      acc = node.children.reduce(gatherRefsReducer, acc);
    }

    if (filter(node)) {
      const serialized = getSerializeNode(node);

      // TODO: Refactor leafnode handling
      // The following should all somehow go in the serialise leaf function.
      // Problem is we have side effects of editing the accumulator
      // There are neater ways to do this
      if (isLeafNode(node)) {
        const serializedLeaf = serialized as LeafTrieNodeSerialized;
        const map = node.value;

        if (isMap(map)) {
          const subRefs = map.refs(filter, { includeRootKey: false });

          if (map.root) {
            const serializedMap = serializeMap(map);
            const mapRef = serializedMap._ref;
            const serializedMapPointer = { _ref: mapRef };

            // TODO: Move merging objects out to happen once
            // This is pretty darn slow as happens every
            // time a map is found should happen at the end on a big sweep
            acc = Object.assign(acc, subRefs, {
              [mapRef]: serializedMap
            });

            serializedLeaf.value = serializedMapPointer;
          } else {
            serializedLeaf.value = {};
          }
        }
      }
      acc[serialized._ref] = serialized;
    }
    return acc;
  };

function toJS(map: Map) {
  let isArray = true;
  for (const key of map.keys()) {
    if (typeof key !== "number") {
      isArray = false;
    }
  }

  return fold(
    (acc: any, v: any, k: any) => {
      acc[k] = v.toJS ? v.toJS() : v;
      return acc;
    },
    isArray ? [] : {},
    map
  );
}

/* fromJS
 ******************************************************************************/
/**
  Create a HAMT from a standard JS object
*/
function fromJS(obj: any): Map {
  if (isMap(obj)) return obj;

  const isArray = Array.isArray(obj);
  return Object.entries(obj).reduce((map, [key, val]) => {
    return map.set(
      isArray ? Number(key) : key,
      typeof val === "object" ? fromJS(val) : val
    );
  }, hamt.empty);
}
hamt.fromJS = fromJS;
/* Export
 ******************************************************************************/
export default hamt;
