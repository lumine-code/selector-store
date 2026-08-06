(function () {
  var deepExtend, getValueAtKeyPath, hasKeyPath;

  ({ deepExtend } = require("@lumine-code/underscore-plus"));

  ({ hasKeyPath, getValueAtKeyPath } = require("./key-path"));

  module.exports = class PropertySet {
    constructor(source, selector, properties) {
      this.source = source;
      this.selector = selector;
      this.properties = properties;
      this.name = this.source; // Supports deprecated usage
    }

    matches(scope) {
      return this.selector.matches(scope);
    }

    compare(other) {
      return this.selector.compare(other.selector);
    }

    merge(other) {
      return new PropertySet(
        this.source,
        this.selector,
        deepExtend({}, other.properties, this.properties),
      );
    }

    has(keyPath) {
      return hasKeyPath(this.properties, keyPath);
    }

    get(keyPath) {
      return getValueAtKeyPath(this.properties, keyPath);
    }
  };
}).call(this);
