var checkValueAtKeyPath, deepClone, deepDefaults;

({ checkValueAtKeyPath, deepDefaults, deepClone } = require("../lib/helpers"));

describe("Helpers", function () {
  describe(".checkValueAtKeyPath", function () {
    describe("when the object is a primitive", function () {
      return it("indicates that the object affects the given key-path", function () {
        var hasValue, value;
        [value, hasValue] = checkValueAtKeyPath(null, "the.key.path");
        expect(value).toBeUndefined();
        expect(hasValue).toBe(true);
        [value, hasValue] = checkValueAtKeyPath(5, "the.key.path");
        expect(value).toBeUndefined();
        return expect(hasValue).toBe(true);
      });
    });
    describe("when one of the object's children on the key-path is a primitive", function () {
      return it("indicates that the object affects the given key-path", function () {
        var hasValue, value;
        [value, hasValue] = checkValueAtKeyPath(
          {
            the: 5,
          },
          "the.key.path",
        );
        expect(value).toBeUndefined();
        expect(hasValue).toBe(true);
        [value, hasValue] = checkValueAtKeyPath(
          {
            the: {
              key: 5,
            },
          },
          "the.key.path",
        );
        expect(value).toBeUndefined();
        return expect(hasValue).toBe(true);
      });
    });
    describe("when the object is of a custom type", function () {
      var Thing;
      Thing = class Thing {};
      return it("indicates that the object affects the given key-path", function () {
        var hasValue, value;
        [value, hasValue] = checkValueAtKeyPath(new Thing(), "the.key.path");
        expect(value).toBeUndefined();
        return expect(hasValue).toBe(true);
      });
    });
    describe("when one of the object's children on the key-path is of a custom type", function () {
      var Thing;
      Thing = class Thing {};
      return it("indicates that the object affects the given key-path", function () {
        var hasValue, value;
        [value, hasValue] = checkValueAtKeyPath(
          {
            the: new Thing(),
          },
          "the.key.path",
        );
        expect(value).toBeUndefined();
        expect(hasValue).toBe(true);
        [value, hasValue] = checkValueAtKeyPath(
          {
            the: {
              key: new Thing(),
            },
          },
          "the.key.path",
        );
        expect(value).toBeUndefined();
        return expect(hasValue).toBe(true);
      });
    });
    describe("when the object has a value for the given key-path", function () {
      return it("indicates that the object affects the given key-path", function () {
        var hasValue, value;
        [value, hasValue] = checkValueAtKeyPath(
          {
            the: {
              key: {
                path: 5,
              },
            },
          },
          "the.key.path",
        );
        expect(value).toBe(5);
        return expect(hasValue).toBe(true);
      });
    });
    return describe("when the object doesn't have a value for the given key-path", function () {
      return it("indicates that the object doesn't affect the given key-path", function () {
        var hasValue, value;
        [value, hasValue] = checkValueAtKeyPath(
          {
            the: {
              other: {
                path: 5,
              },
            },
          },
          "the.key.path",
        );
        expect(value).toBe(void 0);
        return expect(hasValue).toBe(false);
      });
    });
  });
  describe(".deepDefaults", function () {
    it("fills in missing values on the target object", function () {
      var defaults, target;
      target = {
        one: 1,
        two: 2,
        nested: {
          a: "a",
          b: "b",
        },
      };
      defaults = {
        one: 100,
        three: 300,
        nested: {
          a: "A",
          c: "C",
        },
      };
      deepDefaults(target, defaults);
      return expect(target).toEqual({
        one: 1,
        two: 2,
        three: 300,
        nested: {
          a: "a",
          b: "b",
          c: "C",
        },
      });
    });
    return it("does nothing if the target isn't a plain object", function () {
      var Thing, defaults, target;
      Thing = class Thing {};
      target = new Thing();
      defaults = {
        one: 1,
      };
      deepDefaults(target, defaults);
      expect(Object.hasOwn(target, "one")).toBe(false);
      target = "stuff";
      deepDefaults(target, defaults);
      return expect(Object.hasOwn(target, "one")).toBe(false);
    });
  });
  return describe(".deepClone", function () {
    it("clones the object", function () {
      var clone, object;
      object = {
        a: {
          b: [
            {
              c: "d",
              e: "f",
            },
          ],
        },
      };
      clone = deepClone(object);
      expect(clone).toEqual(object);
      return expect(clone.a.b[0]).not.toBe(object.a.b[0]);
    });
    return it("doesn't clone custom-objects", function () {
      var Test, clone1, clone2, object1, object2;
      Test = class Test {
        constructor(value1) {
          this.value = value1;
        }
      };
      object1 = new Test({
        a: "b",
      });
      clone1 = deepClone(object1);
      expect(clone1).toBe(object1);
      object2 = {
        x: new Test({
          a: "b",
        }),
      };
      clone2 = deepClone(object2);
      expect(clone2).toEqual(object2);
      return expect(clone2.x).toBe(object2.x);
    });
  });
});
