import hamt from ".";

describe("hamt serialization", () => {
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
        _root: "3fe8ce7ece9291ed00ac9aa746be44ed69e22d65",
        "104fd0eb89c57b34ae639754696da5e0edcf36b4": {
          type: 1,
          hash: 3148896,
          key: "foof",
          value: "foof",
          _ref: "104fd0eb89c57b34ae639754696da5e0edcf36b4",
          _refCreatedAt: "aad15d5ee41f4c0abc882dfa88ed66f742183957"
        },
        "1da6e29042bf02713d42732baac7194d0b60722d": {
          type: 1,
          hash: -1396235488,
          key: "barbar",
          value: "barbar",
          _ref: "1da6e29042bf02713d42732baac7194d0b60722d",
          _refCreatedAt: "106d10b0094dec89854ab431af3cd251788a30bc"
        },
        aad15d5ee41f4c0abc882dfa88ed66f742183957: {
          type: 1,
          hash: -764338240,
          key: "foofoofoofoofoofoofoofoofoofoofoofoofoofoo",
          value: "foo",
          _ref: "aad15d5ee41f4c0abc882dfa88ed66f742183957",
          _refCreatedAt: -1
        },
        bf71b6c0fa62416a65d0ccc0725b66fc4fc272a6: {
          type: 3,
          mask: 1107296264,
          _ref: "bf71b6c0fa62416a65d0ccc0725b66fc4fc272a6",
          _refCreatedAt: "106d10b0094dec89854ab431af3cd251788a30bc",
          children: [
            { _ref: "104fd0eb89c57b34ae639754696da5e0edcf36b4" },
            { _ref: "1da6e29042bf02713d42732baac7194d0b60722d" },
            { _ref: "aad15d5ee41f4c0abc882dfa88ed66f742183957" }
          ]
        },
        "5c7c469e6ce57fb6e0e32e22afa9c252875bc4ab": {
          type: 1,
          hash: 97299,
          key: "bar",
          value: "bar",
          _ref: "5c7c469e6ce57fb6e0e32e22afa9c252875bc4ab",
          _refCreatedAt: "d63598fb347aeae03d802a3729d12c534ec0edcb"
        },
        ff94d94896804e39b05cb259d8ba5bbcab504203: {
          type: 1,
          hash: 3016376,
          key: "bark",
          value: "bark",
          _ref: "ff94d94896804e39b05cb259d8ba5bbcab504203",
          _refCreatedAt: "d0344692370a5b0a9e79c47855810e4359450061"
        },
        "4933af477033f65a09242b8fd490ed61d5b81854": {
          type: 1,
          hash: 97615897,
          key: "foofy",
          value: "foofy",
          _ref: "4933af477033f65a09242b8fd490ed61d5b81854",
          _refCreatedAt: "4e6080dd99f1bf340f5260d1c62d92e7df8ad7a8"
        },
        "3fe8ce7ece9291ed00ac9aa746be44ed69e22d65": {
          type: 3,
          mask: 50855937,
          _ref: "3fe8ce7ece9291ed00ac9aa746be44ed69e22d65",
          _refCreatedAt: "d0344692370a5b0a9e79c47855810e4359450061",
          children: [
            { _ref: "bf71b6c0fa62416a65d0ccc0725b66fc4fc272a6" },
            { _ref: "5c7c469e6ce57fb6e0e32e22afa9c252875bc4ab" },
            { _ref: "ff94d94896804e39b05cb259d8ba5bbcab504203" },
            { _ref: "4933af477033f65a09242b8fd490ed61d5b81854" }
          ]
        }
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
        aa0b72c312d6ab82ab9cbadb448b0194bda18708: {
          _ref: "aa0b72c312d6ab82ab9cbadb448b0194bda18708",
          _modify: undefined,
          _refCreatedAt: -1,
          hash: 99162322,
          key: "hello",
          type: 1,
          value: "world"
        },
        _root: "aa0b72c312d6ab82ab9cbadb448b0194bda18708"
      });
      const b = a.set("addition", "next");

      expect(b.refsLatest()).toEqual({
        "1206f78f86ff92880e550b1c022ff71b8e86f711": {
          _modify: undefined,
          _ref: "1206f78f86ff92880e550b1c022ff71b8e86f711",
          _refCreatedAt: "aa0b72c312d6ab82ab9cbadb448b0194bda18708",
          hash: -1226589444,
          key: "addition",
          type: 1,
          value: "next"
        },
        c2151f189e47efade2921d02e7a39d05f4a990c4: {
          _modify: undefined,
          _ref: "c2151f189e47efade2921d02e7a39d05f4a990c4",
          _refCreatedAt: "aa0b72c312d6ab82ab9cbadb448b0194bda18708",
          children: [
            {
              _ref: "aa0b72c312d6ab82ab9cbadb448b0194bda18708"
            },
            {
              _ref: "1206f78f86ff92880e550b1c022ff71b8e86f711"
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
        _root: "673e21f8e7d5b92b6abe794ed2cb20312829b416",
        e27b406b924ccf4d1ca89d903a693e3c27d09149: {
          type: 1,
          hash: 101574,
          key: "foo",
          value: "bar",
          _ref: "e27b406b924ccf4d1ca89d903a693e3c27d09149",
          _refCreatedAt: -1
        },
        "3eadf3651124b705103ef2e602d04a91b2333791": {
          type: 1,
          hash: 3083518,
          key: "ding",
          value: "bat",
          _ref: "3eadf3651124b705103ef2e602d04a91b2333791",
          _refCreatedAt: "e27b406b924ccf4d1ca89d903a693e3c27d09149"
        },
        "673e21f8e7d5b92b6abe794ed2cb20312829b416": {
          type: 3,
          mask: 1073741888,
          _ref: "673e21f8e7d5b92b6abe794ed2cb20312829b416",
          _refCreatedAt: "e27b406b924ccf4d1ca89d903a693e3c27d09149",
          children: [
            { _ref: "e27b406b924ccf4d1ca89d903a693e3c27d09149" },
            { _ref: "3eadf3651124b705103ef2e602d04a91b2333791" }
          ]
        }
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

      // TODO: this should throw as the output tree will not be valid
      expect(() => {
        hamt.deserialize('{"_root": "1234", "1234":{}}');
      }).not.toThrow();
    });
  });
});
