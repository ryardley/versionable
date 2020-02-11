import Versionable from ".";

describe("Versionable", () => {
  describe("version API", () => {
    describe("commit()", () => {
      it("should", () => {
        const store = new Versionable();
        store.set("foo", "bar");
        store.commit();
        expect(store._head).toBe("c629ac92fd15bc4102a3eb12db6e59fc6277679e");
        expect(store._commits).toEqual({
          c629ac92fd15bc4102a3eb12db6e59fc6277679e: {
            id: "c629ac92fd15bc4102a3eb12db6e59fc6277679e",
            parentId: "-1",
            treeId: "e27b406b924ccf4d1ca89d903a693e3c27d09149"
          }
        });

        store.set("foo", "baz");
        store.commit();
        expect(store._head).toBe("bb99edd77c99aae06a4104c9699c3c0cf2be5fe2");
        expect(store._commits).toEqual({
          bb99edd77c99aae06a4104c9699c3c0cf2be5fe2: {
            id: "bb99edd77c99aae06a4104c9699c3c0cf2be5fe2",
            parentId: "c629ac92fd15bc4102a3eb12db6e59fc6277679e",
            treeId: "ce5f9b235f7c53c25a6fe321a4c5ed82947f4dcc"
          },
          c629ac92fd15bc4102a3eb12db6e59fc6277679e: {
            id: "c629ac92fd15bc4102a3eb12db6e59fc6277679e",
            parentId: "-1",
            treeId: "e27b406b924ccf4d1ca89d903a693e3c27d09149"
          }
        });
        expect(store.log()).toEqual([
          {
            id: "bb99edd77c99aae06a4104c9699c3c0cf2be5fe2",
            parentId: "c629ac92fd15bc4102a3eb12db6e59fc6277679e",
            treeId: "ce5f9b235f7c53c25a6fe321a4c5ed82947f4dcc"
          },
          {
            id: "c629ac92fd15bc4102a3eb12db6e59fc6277679e",
            parentId: "-1",
            message: undefined,
            treeId: "e27b406b924ccf4d1ca89d903a693e3c27d09149"
          }
        ]);

        store.set("bing", "bong");
        store.commit();

        expect(store.log()).toEqual([
          {
            id: "50ccca40a9d1e5633796ad5be51f3ab76d36dea6",
            parentId: "bb99edd77c99aae06a4104c9699c3c0cf2be5fe2",
            treeId: "f38f6b6a57261b5d9601083e6c1a385e6a8be5b2"
          },
          {
            id: "bb99edd77c99aae06a4104c9699c3c0cf2be5fe2",
            parentId: "c629ac92fd15bc4102a3eb12db6e59fc6277679e",
            treeId: "ce5f9b235f7c53c25a6fe321a4c5ed82947f4dcc"
          },
          {
            id: "c629ac92fd15bc4102a3eb12db6e59fc6277679e",
            parentId: "-1",
            treeId: "e27b406b924ccf4d1ca89d903a693e3c27d09149"
          }
        ]);
        store.set("ding", "bat");
        expect(() => {
          store.checkout("bb99edd77c99aae06a4104c9699c3c0cf2be5fe2");
        }).toThrow(
          "Workspace is not clean! You need to commit your changes before moving to a new commit."
        );

        store.commit();

        expect(() => {
          store.checkout("bb99edd77c99aae06a4104c9699c3c0cf2be5fe2");
        }).not.toThrow();
      });
      it("should be able to support a basic commit workflow", () => {
        const store = new Versionable();
        store.setIn(["foo", "bar"], "This is foo.bar!");
        expect(store.toJS()).toEqual({ foo: { bar: "This is foo.bar!" } });
        expect(store.log()).toEqual([]);

        expect(store.commit("Initial commit")).toEqual({
          id: "bd12d103ade0ade2be4a5029bb0fe439e5e2eee6",
          message: "Initial commit",
          parentId: "-1",
          treeId: "0fbadfe6e04904fcfb7bb67ad32efa768764a609"
        });
        store.setIn(["foo", "bar"], "BAZZZ!");
        store.setIn(["thing"], "pop!");
        expect(store.commit("Change to BAZZZ!")).toEqual({
          id: "2be9953cbc7bae8d83d7a68af04d166f15d4d60d",
          message: "Change to BAZZZ!",
          parentId: "bd12d103ade0ade2be4a5029bb0fe439e5e2eee6",
          treeId: "68d46d4604c443d144d5a2eeaf186a1d0897421f"
        });
        expect(store.toJS()).toEqual({ foo: { bar: "BAZZZ!" }, thing: "pop!" });
        expect(
          store.checkout("bd12d103ade0ade2be4a5029bb0fe439e5e2eee6")
        ).toEqual({
          id: "bd12d103ade0ade2be4a5029bb0fe439e5e2eee6",
          message: "Initial commit",
          parentId: "-1",
          treeId: "0fbadfe6e04904fcfb7bb67ad32efa768764a609"
        });
        expect(store.toJS()).toEqual({ foo: { bar: "This is foo.bar!" } });

        store.checkout("2be9953cbc7bae8d83d7a68af04d166f15d4d60d");

        expect(store.toJS()).toEqual({ foo: { bar: "BAZZZ!" }, thing: "pop!" });

        expect(store.log()).toEqual([
          {
            id: "2be9953cbc7bae8d83d7a68af04d166f15d4d60d",
            message: "Change to BAZZZ!",
            parentId: "bd12d103ade0ade2be4a5029bb0fe439e5e2eee6",
            treeId: "68d46d4604c443d144d5a2eeaf186a1d0897421f"
          },
          {
            id: "bd12d103ade0ade2be4a5029bb0fe439e5e2eee6",
            message: "Initial commit",
            parentId: "-1",
            treeId: "0fbadfe6e04904fcfb7bb67ad32efa768764a609"
          }
        ]);
      });
    });
  });
});
