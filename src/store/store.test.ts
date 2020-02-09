import Versionable from ".";

it("should be work", () => {
  const store = new Versionable();
  store.set("foo", "bar");
  expect(store.get("foo")).toBe("bar");
});
