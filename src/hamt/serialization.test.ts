import hamt from ".";

describe("hamt serialization", () => {
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

    it("should be deserializable with nested hamts", () => {
      const mapJson = hamt.empty
        .set("nested", hamt.empty.set("foo", "bar"))
        .serialize();

      const map1 = hamt.deserialize(mapJson);
      const map2 = map1.set("nested", 5);

      expect(map1.get("nested").get("foo")).toBe("bar");
      expect(map2.get("nested")).toBe(5);
    });

    it("should handle deep nesting", () => {
      const mapJson = hamt.empty
        .set(
          "one",
          hamt.empty
            .set("two", hamt.empty.set("three", hamt.empty.set("four", 1234)))
            .set("sibling", "hello")
        )
        .serialize();

      const map = hamt.deserialize(mapJson);

      expect(
        map
          .get("one")
          .get("two")
          .get("three")
          .get("four")
      ).toBe(1234);
    });

    it("should throw errors on undeserializable input", () => {
      expect(() => {
        hamt.deserialize("{}");
      }).toThrow();

      expect(() => {
        hamt.deserialize('{"_root": "1234"}');
      }).toThrow();

      expect(() => {
        hamt.deserialize('{"_root": "1234", "1234":{}}');
      }).toThrow();
    });
  });
});
