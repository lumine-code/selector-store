# selector-store

Stores and retrieves properties associated with CSS selectors.

## Features

- **Selector matching**: associates values with element, class, attribute, descendant, and child selectors.
- **Nested properties**: retrieves complete property sets or individual values by key path.
- **Disposable updates**: removes groups of registered properties through Event Kit disposables.

## Installation

```sh
npm install @lumine-code/selector-store
```

## Usage

Currently, this library only supports the combinations of the following
elements. More could be added pretty easily.

- Element names: `div`
- Class names: `.foo`
- Simple attributes: `[foo=bar]`
- Descendant selectors: `.foo .bar`
- Child selectors: `.foo > .bar`

Usage:

```js
const SelectorStore = require("@lumine-code/selector-store");
const store = new SelectorStore();

// First associate some properties with selectors
const disposable = store.addProperties("some-description", {
  ".foo.bar .baz": {
    x: { y: 1, z: 2 },
  },
  ".foo": {
    x: { y: 3 },
  },
});

// Then query properties based on a string description of a path in the DOM.
store.getPropertyValue("div.foo.bar p.baz", "x.y"); // 1
store.getPropertyValue("div.foo.bar p.baz", "x.z"); // 2

// Falls back to selectors matching an ancestor if necessary.
store.getPropertyValue("div.foo p.baz", "x.y"); // 3

// You can also remove properties via the returned Disposable.
disposable.dispose();
```

## Contributing

Got ideas to make this package better, found a bug, or want to help add new features? Just drop your thoughts on GitHub. Any feedback is welcome!
