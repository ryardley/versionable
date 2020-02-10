type RefFn = () => string;

type QuickHash = number;
type SlowHash = string;

type ModifyFn = (
  shift: any,
  op: any,
  h: any,
  k: any,
  size: any,
  _refCreatedAt: any
) => any;

type TrieNodeCommon = {
  _refCreatedAt: RefFn;
  _ref: RefFn;
  _modify: ModifyFn;
  children?: TrieNode[];
};

type MapNodeSerialized = {
  type: 5;
  _root: string;
  _ref: string;
};

type TrieNodeReferencePointer = {
  _ref: string;
};

type TrieNodeSerializedCommon = {
  _refCreatedAt: string;
  _ref: string;
  _modify: undefined;
  children?: TrieNodeReferencePointer[];
};

type LeafTrieNodeShape = {
  type: 1;
  hash: number;
  key: any;
  value: any;
};

type CollisionTrieNodeShape = {
  type: 2;
  hash: number;
};

type IndexedTrieNodeShape = {
  type: 3;
  mask: number;
};

type ArrayTrieNodeShape = {
  type: 4;
  size: number;
};

type LeafTrieNode = LeafTrieNodeShape & TrieNodeCommon;
type CollisionTrieNode = CollisionTrieNodeShape & TrieNodeCommon;
type IndexedTrieNode = IndexedTrieNodeShape & TrieNodeCommon;
type ArrayTrieNode = ArrayTrieNodeShape & TrieNodeCommon;

type LeafTrieNodeSerialized = LeafTrieNodeShape & TrieNodeSerializedCommon;
type CollisionTrieNodeSerialized = CollisionTrieNodeShape &
  TrieNodeSerializedCommon;
type IndexedTrieNodeSerialized = IndexedTrieNodeShape &
  TrieNodeSerializedCommon;
type ArrayTrieNodeSerialized = ArrayTrieNodeShape & TrieNodeSerializedCommon;

type TrieNodeWithChildren = (
  | CollisionTrieNode
  | IndexedTrieNode
  | ArrayTrieNode
) & { children: TrieNode[] };
type TrieNode = TrieNodeWithChildren | LeafTrieNode;

type TrieNodeSerialized =
  | LeafTrieNodeSerialized
  | CollisionTrieNodeSerialized
  | IndexedTrieNodeSerialized
  | ArrayTrieNodeSerialized;

type RefLookup = { [k: string]: string | TrieNodeSerialized };
