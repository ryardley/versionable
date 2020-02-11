export type RefFn = () => string;

export type QuickHash = number;
export type SlowHash = string;

export type ModifyFn = (
  shift: any,
  op: any,
  h: any,
  k: any,
  size: any,
  _refCreatedAt: any
) => any;

export type TrieNodeCommon = {
  _refCreatedAt: RefFn;
  _ref: RefFn;
  _modify: ModifyFn;
  children?: TrieNode[];
};

export type MapNodeShape = {
  type: 5;
  _root: string;
  _ref: string;
};

export type TrieNodeReferencePointer = {
  _ref: string;
};

export type TrieNodeSerializedCommon = {
  _refCreatedAt: string;
  _ref: string;
  _modify: undefined;
  children?: TrieNodeReferencePointer[];
};

export type LeafTrieNodeShape = {
  type: 1;
  hash: number;
  key: any;
  value: any;
};

export type CollisionTrieNodeShape = {
  type: 2;
  hash: number;
};

export type IndexedTrieNodeShape = {
  type: 3;
  mask: number;
};

export type ArrayTrieNodeShape = {
  type: 4;
  size: number;
};

export type LeafTrieNode = LeafTrieNodeShape & TrieNodeCommon;
export type CollisionTrieNode = CollisionTrieNodeShape & TrieNodeCommon;
export type IndexedTrieNode = IndexedTrieNodeShape & TrieNodeCommon;
export type ArrayTrieNode = ArrayTrieNodeShape & TrieNodeCommon;

export type LeafTrieNodeSerialized = LeafTrieNodeShape &
  TrieNodeSerializedCommon;
export type CollisionTrieNodeSerialized = CollisionTrieNodeShape &
  TrieNodeSerializedCommon;
export type IndexedTrieNodeSerialized = IndexedTrieNodeShape &
  TrieNodeSerializedCommon;
export type ArrayTrieNodeSerialized = ArrayTrieNodeShape &
  TrieNodeSerializedCommon;
export type MapNodeSerialized = MapNodeShape & TrieNodeSerializedCommon;
export type TrieNodeWithChildren = (
  | CollisionTrieNode
  | IndexedTrieNode
  | ArrayTrieNode
) & { children: TrieNode[] };
export type TrieNode = TrieNodeWithChildren | LeafTrieNode;

export type TrieNodeSerialized =
  | LeafTrieNodeSerialized
  | CollisionTrieNodeSerialized
  | IndexedTrieNodeSerialized
  | ArrayTrieNodeSerialized
  | MapNodeSerialized;

export type RefLookup = { [k: string]: string | TrieNodeSerialized };
