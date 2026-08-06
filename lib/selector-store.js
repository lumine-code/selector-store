(function () {
  var CompositeDisposable,
    Disposable,
    PropertySet,
    Selector,
    _,
    checkValueAtKeyPath,
    deepClone,
    deepDefaults,
    isPlainObject,
    parse,
    indexOf = [].indexOf;

  ({ parse, Selector } = require("@lumine-code/selector-kit"));

  _ = require("@lumine-code/underscore-plus");

  ({ Disposable, CompositeDisposable } = require("@lumine-code/event-kit"));

  PropertySet = require("./property-set");

  ({ isPlainObject, checkValueAtKeyPath, deepDefaults, deepClone } = require("./helpers"));

  // Public:
  module.exports = class SelectorStore {
    constructor() {
      this.cache = {};
      this.propertySets = [];
      this.escapeCharacterRegex = /[-!"#$%&'*+,/:;=?@|^~()<>{}[\]]/g;
    }

    // Public: Add scoped properties to be queried with {::get}

    // * `source` A string describing these properties to allow them to be removed
    //   later.
    // * `propertiesBySelector` An {Object} containing CSS-selectors mapping to
    //   {Objects} containing properties. For example: `{'.foo .bar': {x: 1, y: 2}`

    // Returns a {Disposable} on which you can call `.dispose()` to remove the
    // added properties.
    addProperties(source, propertiesBySelector, options) {
      var compositeDisposable, i, len, properties, ref, selector, selectorSource;
      this.bustCache();
      compositeDisposable = new CompositeDisposable();
      for (selectorSource in propertiesBySelector) {
        properties = propertiesBySelector[selectorSource];
        ref = Selector.create(selectorSource, options);
        for (i = 0, len = ref.length; i < len; i++) {
          selector = ref[i];
          compositeDisposable.add(
            this.addPropertySet(new PropertySet(source, selector, properties)),
          );
        }
      }
      this.propertySets.sort(function (a, b) {
        return a.compare(b);
      });
      return compositeDisposable;
    }

    // Public: Get the value of a previously stored key-path in a given scope.

    // * `scopeChain` This describes a location in the document. It uses the same
    //   syntax as selectors, with each space-separated component representing one
    //   element.
    // * `keyPath` A `.` separated string of keys to traverse in the properties.
    // * `options` (optional) {Object}
    //   * `sources` (optional) {Array} of {String} source names. If provided, only
    //     values that were associated with these sources during {::addProperties}
    //     will be used.
    //   * `excludeSources` (optional) {Array} of {String} source names. If provided,
    //     values that  were associated with these sources during {::addProperties}
    //     will not be used.

    // Returns the property value or `undefined` if none is found.
    getPropertyValue(scopeChain, keyPath, options) {
      var excludeSources, sources;
      if (options != null) {
        ({ sources, excludeSources } = options);
      }
      return this.withCaching(
        `getPropertyValue:${scopeChain}:${keyPath}`,
        sources != null || excludeSources != null,
        () => {
          var hasMergedValue, hasValue, i, len, mergedValue, ref, ref1, ref2, scopes, set, value;
          scopes = this.parseScopeChain(scopeChain);
          mergedValue = void 0;
          hasMergedValue = false;
          while (scopes.length > 0) {
            ref = this.propertySets;
            for (i = 0, len = ref.length; i < len; i++) {
              set = ref[i];
              if (
                excludeSources != null &&
                ((ref1 = set.source), indexOf.call(excludeSources, ref1) >= 0)
              ) {
                continue;
              }
              if (sources != null && !((ref2 = set.source), indexOf.call(sources, ref2) >= 0)) {
                continue;
              }
              if (set.matches(scopes)) {
                [value, hasValue] = checkValueAtKeyPath(set.properties, keyPath);
                if (hasValue) {
                  if (hasMergedValue) {
                    deepDefaults(mergedValue, value);
                  } else {
                    hasMergedValue = true;
                    mergedValue = deepClone(value);
                  }
                  if (!isPlainObject(mergedValue)) {
                    return mergedValue;
                  }
                }
              }
            }
            scopes.pop();
          }
          return mergedValue;
        },
      );
    }

    // Public: Get *all* values for the given key-path in a given scope.
    getAll(scopeChain, keyPath, options) {
      var excludeSources, scopes, sources, values;
      if (options != null) {
        ({ sources, excludeSources } = options);
      }
      scopes = this.parseScopeChain(scopeChain);
      values = [];
      return this.withCaching(
        `getAll:${scopeChain}:${keyPath}`,
        sources != null || excludeSources != null,
        () => {
          var hasValue, i, len, ref, ref1, ref2, set, value;
          while (scopes.length > 0) {
            ref = this.propertySets;
            for (i = 0, len = ref.length; i < len; i++) {
              set = ref[i];
              if (
                excludeSources != null &&
                ((ref1 = set.source), indexOf.call(excludeSources, ref1) >= 0)
              ) {
                continue;
              }
              if (sources != null && !((ref2 = set.source), indexOf.call(sources, ref2) >= 0)) {
                continue;
              }
              if (set.matches(scopes)) {
                [value, hasValue] = checkValueAtKeyPath(set.properties, keyPath);
                if (hasValue) {
                  values.push({
                    scopeSelector: set.selector.toString(),
                    value: value,
                  });
                }
              }
            }
            scopes.pop();
          }
          return values;
        },
      );
    }

    // Public: Get *all* properties for a given source.

    // ## Examples

    // ```coffee
    // store.addProperties('some-source', {'.source.ruby': {foo: 'bar'}})
    // store.addProperties('some-source', {'.source.ruby': {omg: 'wow'}})
    // store.propertiesForSource('some-source') # => {'.source.ruby': {foo: 'bar', omg: 'wow'}}
    // ```

    // * `source` {String}

    // Returns an {Object} in the format {scope: {property: value}}
    propertiesForSource(source) {
      var propertiesBySelector, propertySet, propertySets, selector;
      propertySets = this.mergeMatchingPropertySets(
        this.propertySets.filter(function (set) {
          return set.source === source;
        }),
      );
      propertiesBySelector = {};
      for (selector in propertySets) {
        propertySet = propertySets[selector];
        propertiesBySelector[selector] = propertySet.properties;
      }
      return propertiesBySelector;
    }

    // Public: Get *all* properties matching the given source and scopeSelector.

    // * `source` {String}
    // * `scopeSelector` {String} `scopeSelector` is matched exactly.

    // Returns an {Object} in the format {property: value}
    propertiesForSourceAndSelector(source, scopeSelector) {
      var i, len, properties, propertySet, propertySets, ref, selector, setSelector;
      propertySets = this.mergeMatchingPropertySets(
        this.propertySets.filter(function (set) {
          return set.source === source;
        }),
      );
      properties = {};
      ref = Selector.create(scopeSelector);
      for (i = 0, len = ref.length; i < len; i++) {
        selector = ref[i];
        for (setSelector in propertySets) {
          propertySet = propertySets[setSelector];
          if (selector.isEqual(setSelector)) {
            _.extend(properties, propertySet.properties);
          }
        }
      }
      return properties;
    }

    // Public: Get *all* properties matching the given scopeSelector.

    // * `scopeSelector` {String} `scopeSelector` is matched exactly.

    // Returns an {Object} in the format {property: value}
    propertiesForSelector(scopeSelector) {
      var i, len, properties, propertySet, propertySets, ref, selector, setSelector;
      propertySets = this.mergeMatchingPropertySets(this.propertySets);
      properties = {};
      ref = Selector.create(scopeSelector);
      for (i = 0, len = ref.length; i < len; i++) {
        selector = ref[i];
        for (setSelector in propertySets) {
          propertySet = propertySets[setSelector];
          if (selector.isEqual(setSelector)) {
            _.extend(properties, propertySet.properties);
          }
        }
      }
      return properties;
    }

    // Public: Remove all properties for a given source.

    // * `source` {String}
    removePropertiesForSource(source) {
      this.bustCache();
      return (this.propertySets = this.propertySets.filter(function (set) {
        return set.source !== source;
      }));
    }

    // Public: Remove all properties for a given source.

    // * `source` {String}
    // * `scopeSelector` {String} `scopeSelector` is matched exactly.
    removePropertiesForSourceAndSelector(source, scopeSelector) {
      var i, len, ref, selector;
      this.bustCache();
      ref = Selector.create(scopeSelector);
      for (i = 0, len = ref.length; i < len; i++) {
        selector = ref[i];
        this.propertySets = this.propertySets.filter(function (set) {
          return !(set.source === source && set.selector.isEqual(selector));
        });
      }
    }

    mergeMatchingPropertySets(propertySets) {
      var i, len, matchingPropertySet, merged, propertySet, selector;
      merged = {};
      for (i = 0, len = propertySets.length; i < len; i++) {
        propertySet = propertySets[i];
        selector = propertySet.selector.toString() || "*";
        matchingPropertySet = merged[selector];
        if (matchingPropertySet) {
          merged[selector] = matchingPropertySet.merge(propertySet);
        } else {
          merged[selector] = propertySet;
        }
      }
      return merged;
    }

    bustCache() {
      return (this.cache = {});
    }

    withCaching(cacheKey, skipCache, callback) {
      if (skipCache) {
        return callback();
      }
      if (Object.hasOwn(this.cache, cacheKey)) {
        return this.cache[cacheKey];
      } else {
        return (this.cache[cacheKey] = callback());
      }
    }

    addPropertySet(propertySet) {
      this.propertySets.push(propertySet);
      return new Disposable(() => {
        var index;
        index = this.propertySets.indexOf(propertySet);
        if (index > -1) {
          this.propertySets.splice(index, 1);
        }
        return this.bustCache();
      });
    }

    parseScopeChain(scopeChain) {
      var i, len, ref, ref1, results, scope;
      scopeChain = scopeChain.replace(this.escapeCharacterRegex, function (match) {
        return `\\${match[0]}`;
      });
      ref1 = (ref = parse(scopeChain)[0]) != null ? ref : [];
      results = [];
      for (i = 0, len = ref1.length; i < len; i++) {
        scope = ref1[i];
        results.push(scope);
      }
      return results;
    }
  };
}).call(this);
