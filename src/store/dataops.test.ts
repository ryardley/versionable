import Versionable from ".";
describe("Versionable", () => {
  describe("data operations", () => {
    describe("getters and setters", () => {
      it("should store basic data", () => {
        const store = new Versionable();
        store.set("foo", "bar");
        expect(store.get("foo")).toBe("bar");
      });

      it("should have a chainable interface", () => {
        const store = new Versionable();
        store.set("foo", "bar").set("bing", "bop");
        expect(store.get("foo")).toBe("bar");
        expect(store.get("bing")).toBe("bop");
      });
    });

    describe("setIn()", () => {
      it("should deeply set a value in the store", () => {
        const store = new Versionable();
        store.setIn(["one", "two", "three"], 3);
        store.setIn(["one", "side"], "this is on the side");
        expect(store.toJS()).toEqual({
          one: {
            side: "this is on the side",
            two: {
              three: 3
            }
          }
        });
      });
      it("should clobber any values in the way", () => {
        const store = new Versionable();

        store.fromJS({
          one: "hello"
        });

        store.setIn(["one", "two"], 3);
        expect(store.toJS()).toEqual({
          one: {
            two: 3
          }
        });
      });
    });
    describe("getIn()", () => {
      it("should deeply set a value in the store", () => {
        const store = new Versionable();

        store.fromJS({
          one: {
            two: {
              three: 4
            }
          }
        });

        expect(store.getIn(["one", "two", "three"])).toBe(4);
        expect(store.getIn(["foo", "fie"])).toBe(undefined);
      });
    });

    describe("js interop", () => {
      it("should accept JS objects", () => {
        const store = new Versionable();

        store.fromJS({
          name: "Rudi",
          age: 43,
          occupation: "Web Developer"
        });
        expect(store.toJS()).toEqual({
          name: "Rudi",
          age: 43,
          occupation: "Web Developer"
        });
      });

      it("should accept deeply nested JS objects", () => {
        const store = new Versionable();
        store.fromJS({
          one: {
            two: {
              three: 3
            }
          }
        });
        expect(
          store
            .get("one")
            .get("two")
            .get("three")
        ).toBe(3);
      });
    });
  });
});
