import Versionable from ".";
describe("Versionable", () => {
  describe("immutability", () => {
    it("should provide a new ref when the data has changed", () => {
      const st1 = new Versionable();
      const st2 = st1.set("foo", "bar");
      expect(st1).not.toBe(st2);
    });

    it("should consider the same data being set as data not changing", () => {
      const store = new Versionable();
      const st1 = store.set("foo", "bar");
      const st2 = store.set("foo", "bar");
      expect(st1).toBe(st2);
    });
  });
});
