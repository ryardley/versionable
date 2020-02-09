import hamt from ".";

describe("hamt", () => {
  describe("toJS()", () => {
    it("should get a javascript object", () => {
      expect(
        hamt.empty
          .set("foo", "bar")
          .set("baz", "bip")
          .toJS()
      ).toEqual({ foo: "bar", baz: "bip" });
    });
  });
  describe("refs()", () => {
    it("should expose data structure nodes", () => {
      const map = hamt.empty
        .set("foofoofoofoofoofoofoofoofoofoofoofoofoofoo", "foo")
        .set("foof", "foof")
        .set("foofy", "foofy")
        .set("bar", "bar")
        .set("barbar", "barbar")
        .set("bark", "bark");

      expect(map.refs()).toEqual({
        "1193547398": {
          _modify: undefined,
          _ref: 1193547398,
          _refCreatedAt: 2646222528,
          hash: -1396235488,
          key: "barbar",
          type: 1,
          value: "barbar"
        },
        "2005019093": {
          _modify: undefined,
          _ref: 2005019093,
          _refCreatedAt: 2514118110,
          hash: 97615897,
          key: "foofy",
          type: 1,
          value: "foofy"
        },
        "2741534580": {
          _modify: undefined,
          _ref: 2741534580,
          _refCreatedAt: 2646222528,
          children: [
            { _ref: 2953525920 },
            { _ref: 1193547398 },
            { _ref: 680030965 }
          ],
          mask: 1107296264,
          type: 3
        },
        "2953525920": {
          _modify: undefined,
          _ref: 2953525920,
          _refCreatedAt: 680030965,
          hash: 3148896,
          key: "foof",
          type: 1,
          value: "foof"
        },
        "3595962320": {
          _modify: undefined,
          _ref: 3595962320,
          _refCreatedAt: 3034670574,
          children: [
            { _ref: 2741534580 },
            { _ref: 4126690946 },
            { _ref: 367924869 },
            { _ref: 2005019093 }
          ],
          mask: 50855937,
          type: 3
        },
        "367924869": {
          _modify: undefined,
          _ref: 367924869,
          _refCreatedAt: 3034670574,
          hash: 3016376,
          key: "bark",
          type: 1,
          value: "bark"
        },
        "4126690946": {
          _modify: undefined,
          _ref: 4126690946,
          _refCreatedAt: 316244223,
          hash: 97299,
          key: "bar",
          type: 1,
          value: "bar"
        },
        "680030965": {
          _modify: undefined,
          _ref: 680030965,
          _refCreatedAt: -1,
          hash: -764338240,
          key: "foofoofoofoofoofoofoofoofoofoofoofoofoofoo",
          type: 1,
          value: "foo"
        },
        _root: 3595962320
      });
    });
    it("should be the same for identical hashes", () => {
      const map1 = hamt.empty.set("foo", "bar").set("baz", "bip");
      const map2 = hamt.empty.set("foo", "bar").set("baz", "bip");
      expect(map1.refs()).toEqual(map2.refs());
    });
  });
  describe("refsLatest()", () => {
    it("should keep track of additions to the object graph", () => {
      const a = hamt.empty.set("hello", "world");
      expect(a.refs()).toEqual({
        "3189021808": {
          _ref: 3189021808,
          _modify: undefined,
          _refCreatedAt: -1,
          hash: 99162322,
          key: "hello",
          type: 1,
          value: "world"
        },
        _root: 3189021808
      });
      const b = a.set("addition", "next");

      expect(b.refsLatest()).toEqual({
        "3890809064": {
          _modify: undefined,
          _ref: 3890809064,
          _refCreatedAt: 3189021808,
          hash: -1226589444,
          key: "addition",
          type: 1,
          value: "next"
        },
        "4251379459": {
          _modify: undefined,
          _ref: 4251379459,
          _refCreatedAt: 3189021808,
          children: [
            {
              _ref: 3189021808
            },
            {
              _ref: 3890809064
            }
          ],
          mask: 268697600,
          type: 3
        }
      });
    });
  });
  describe("serialize()", () => {
    it("should serialize to the correct json", () => {
      expect(
        JSON.parse(
          hamt.empty
            .set("foo", "bar")
            .set("ding", "bat")
            .serialize()
        )
      ).toEqual({
        "1748619310": {
          type: 1,
          hash: 3083518,
          key: "ding",
          value: "bat",
          _ref: 1748619310,
          _refCreatedAt: 1870036284
        },
        "1870036284": {
          type: 1,
          hash: 101574,
          key: "foo",
          value: "bar",
          _ref: 1870036284,
          _refCreatedAt: -1
        },
        "1906831043": {
          type: 3,
          mask: 1073741888,
          _ref: 1906831043,
          _refCreatedAt: 1870036284,
          children: [{ _ref: 1870036284 }, { _ref: 1748619310 }]
        },
        _root: 1906831043
      });
    });
  });
  describe("deserialize()", () => {
    it("should be deserializable and editable", () => {
      const mapJson = hamt.empty
        .set("foo", "bar")
        .set("ding", "bat")
        .serialize();

      const map1 = hamt.deserialize(mapJson);

      expect(map1.get("foo")).toBe("bar");
      expect(map1.get("ding")).toBe("bat");

      const map2 = map1.set("foo", "wat");

      expect(map2.get("foo")).toBe("wat");
    });

    it("should throw errors on undeserializable input", () => {
      expect(() => {
        hamt.deserialize("{}");
      }).toThrow();

      expect(() => {
        hamt.deserialize('{"_root": "1234"}');
      }).toThrow();

      // TODO: this should throw as the output tree will not be valid?
      expect(() => {
        hamt.deserialize('{"_root": "1234", "1234":{}}');
      }).not.toThrow();
    });
  });
});
