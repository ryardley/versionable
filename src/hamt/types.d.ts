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
};

type LeafTrieNode = TrieNodeCommon & {
  type: 1;
  hash: number;
  key: any;
  value: any;
};

type CollisionTrieNode = TrieNodeCommon & {
  type: 2;
  hash: number;
  children: TrieNode[];
};

type IndexedTrieNode = TrieNodeCommon & {
  type: 3;
  mask: number;
  children: TrieNode[];
};

type ArrayTrieNode = TrieNodeCommon & {
  type: 4;
  size: number;
  children: TrieNode[];
};

type TrieNode = CollisionTrieNode | LeafTrieNode | IndexedTrieNode;
