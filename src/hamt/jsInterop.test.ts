import hamt from ".";

describe("toJS()", () => {
  it("should return a javascript object", () => {
    expect(
      hamt.empty
        .set("foo", "bar")
        .set("baz", "bip")
        .toJS()
    ).toEqual({ foo: "bar", baz: "bip" });
  });

  it("should return arrays for hamts that only have numeric keys", () => {
    expect(
      hamt.empty
        .set(0, "bar")
        .set(1, "bip")
        .toJS()
    ).toEqual(["bar", "bip"]);
  });

  it("should return objects for hamts that have mixed type keys", () => {
    expect(
      hamt.empty
        .set(0, "bar")
        .set("foo", "bip")
        .toJS()
    ).toEqual({ "0": "bar", foo: "bip" });
  });

  it("should handle nested maps", () => {
    expect(
      hamt.empty
        .set("foo", hamt.empty.set("nested", "down"))
        .set("baz", "bip")
        .toJS()
    ).toEqual({ foo: { nested: "down" }, baz: "bip" });
  });

  it("should handle nested maps that are arrays", () => {
    expect(
      hamt.empty
        .set("foo", hamt.empty.set(0, "one").set(1, "two"))
        .set("baz", "bip")
        .toJS()
    ).toEqual({ foo: ["one", "two"], baz: "bip" });
  });
});

describe("fromJS()", () => {
  it("should return a map", () => {
    const map = hamt.fromJS({ foo: "bar", baz: "bip" });
    expect(map.get("foo")).toEqual("bar");
    expect(map.get("baz")).toEqual("bip");
  });

  it("should return a map is it passed", () => {
    const map = hamt.fromJS(hamt.empty.set("foo", "bar"));
    expect(map.get("foo")).toBe("bar");
  });

  it("should return a nested map is it passed", () => {
    const map = hamt.fromJS({ nested: hamt.empty.set("foo", "bar") });
    expect(map.get("nested").get("foo")).toBe("bar");
  });

  it("should handle nested maps", () => {
    const map = hamt.fromJS({
      foo: "bar",
      baz: "bip",
      nested: { next: "level" }
    });
    expect(map.get("nested").get("next")).toEqual("level");
  });

  it("should serialize arrays correctly", () => {
    const map = hamt.fromJS(["1", "2", "3"]);
    expect(map.get(0)).toEqual("1");
    expect(map.get(1)).toEqual("2");
  });
});
