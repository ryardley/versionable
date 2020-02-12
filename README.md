# Versionable

This is experimental and not ready for use quite yet (eta March 2020).

An event driven memory efficient version control data container.

```ts
const store = new Versionable();

store.setIn(["foo", "bar"], "This is foo.bar!");
store.toJS(); // { foo: { bar: "This is foo.bar!" } }
store.log(); // []
store.commit(); // { id: '12345678', parent: null }
store.log(); // [{ id: '12345678' } ]
store.setIn(["foo", "bar"], "BAZZZ!");
store.setIn(["thing"], "pop!");
store.commit(); // { id: '23456789',  parent: '12345678' }
store.log(); // [{ id: '12345678', parent: null  }, { id: '23456789', parent: '12345678'  }]
store.toJS(); // { foo: { bar: "BAZZZ!" }, thing: "pop!" }
store.checkout("12345678"); // { id: '12345678',  parent: null }
store.current(); // { id: '12345678',  parent: null }
store.toJS(); // { foo: { bar: "This is foo.bar!" } }
```

## Why?

I needed a way to branch from history of user actions and for users to go back to any state in the app and build up new history branches. I also needed to serialize the data and send it to the server in the most efficient way possible.
