# json-schema-default-instance

[![Build Status](https://travis-ci.org/dancasey/json-schema-default-instance.svg?branch=master)](https://travis-ci.org/dancasey/json-schema-default-instance)

Creates an object as an instance of the given schema using its `default` properties.

- Accepts multiple schemas, referenced by `id`.
- Resolves `$ref` and `allOf`.
- Instantiates all properties that have a `default`. 
- If `requiredOnly = true`, ignores properties that are not listed in the `required` array (see example below).
- If `resolveDefaultRefs = true`, also resolves references within `default`s.


## Usage

Install with `npm install --save json-schema-default-instance`

See `test/test.js` for an example with `$ref` and `allOf`.

Simple example below:

```js
const {Instantiator} = require('json-schema-default-instance');
const mySchemas = [
  {
    "$schema": "http://json-schema.org/draft-04/schema#",
    "id": "theSchemaId",
    "type": "object",
    "required": [
      "firstName",
      "lastName"
    ],
    "properties": {
      "firstName": {
        "type": "string",
        "default": "Foo"
      },
      "lastName": {
        "type": "string",
        "default": "Bar"
      },
      "optionalProperty": {
        "type": "string",
        "default": "Hello"
      }
    }
  }
]

/* Instantiate with all properties */
let ins = new Instantiator(mySchemas);
let myDefaultInstance = ins.instantiate('theSchemaId');
console.log(myDefaultInstance);

// => { firstName: 'Foo', lastName: 'Bar', optionalProperty: 'Hello' }

/* This time, only with `required` properties */
ins.requiredOnly = true;
let myRequiredInstance = ins.instantiate('theSchemaId');
console.log(myRequiredInstance);

// => { firstName: 'Foo', lastName: 'Bar' }

```


## Notes

Relies heavily on `Ajv` for caching and lookup by ref, even though no validation is done here.
[Ajv: Another JSON Schema Validator](https://github.com/epoberezkin/ajv)

`Ajv` *does* have its own `useDefaults` option which can be used instead of this package,
but it does not support `default` keywords in subschemas or `allOf`.
If you don't need `allOf`, just use `Ajv` directly (see [Ajv assigning-defaults](https://github.com/epoberezkin/ajv#assigning-defaults) and related [discussion](https://github.com/epoberezkin/ajv/issues/42)).

**Performance**: this code recursively walks through the schema on each call, which can negatively impact performance. 
Depending on the use case, it may make sense to precompute the defaults and cache them to an object or module.

Need help understanding JSON Schema? I would recommend the Space Telescope Science Institute's [Understanding JSON Schema](https://spacetelescope.github.io/understanding-json-schema/index.html)


## License

Public Domain