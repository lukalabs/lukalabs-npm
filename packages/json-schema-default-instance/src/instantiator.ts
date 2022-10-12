
import has from 'lodash/has';
import transform from 'lodash/transform';
import isObject from 'lodash/isObject';
import curry from 'lodash/curry';
import merge from 'lodash/merge';
import get from 'lodash/get';
import omit from 'lodash/omit';

export interface Options {
  ajv?: any;
  resolveDefaultRefs?: boolean;
}

export interface Schema {
  id?: string;
  $id?: string;
}

export interface InstantiateResult {
  hasResult: boolean;
  result?: any;
  error?: string;
}

const defaultOptions: Options = {
  resolveDefaultRefs: false
};

type Iterator = (val: any, key: string | number | symbol, obj: object) => any;

function deepMap(obj: any, iterator: Iterator) {
  return transform(obj, (result, val: any, key) => {
    const newVal = iterator(val, key, obj);
    result[key] =
      isObject(val) && val === newVal ? deepMap(newVal, iterator) : newVal;
  });
}

function defaultLiteralValue(type: string): any {
  switch (type) {
    case 'array':
      return [];
    case 'string':
      return '';
    case 'integer':
    case 'number':
      return 0;
    case 'boolean':
      return false;
    case 'null':
      return null;
  }
}

function resolveRef(
  id: string,
  schema: object,
  options: Options
): InstantiateResult {
  const withoutRef = omit(schema, '$ref');

  const { schemaId = id, path } = parseRef(schema['$ref']);
  const validateFunction = options.ajv.getSchema(schemaId);

  if (!validateFunction) {
    return { hasResult: false, error: options.ajv.errors };
  }

  const filteredPath = path.filter(p => p !== undefined);

  const resolved = filteredPath.length > 0
    ? get(
      validateFunction.schema,
      filteredPath,
      {}
    )
    : validateFunction.schema;
  const result = merge({}, resolved, withoutRef);

  return recursiveInstantiate(schemaId, result, options);
}

function maybeResolveRefs(id: string, def: any, options: Options): any {
  if (!options.resolveDefaultRefs || !isObject(def)) {
    return def;
  }

  if (Array.isArray(def)) {
    return def.map(val => maybeResolveRefs(id, val, options));
  }

  let result = {};

  if (has(def, '$ref')) {
    const { hasResult, result: resolveResult } = resolveRef(id, def, options);
    def = omit(def, '$ref');
    if (hasResult) {
      result = resolveResult;
    }
  }

  const rest = deepMap(def, val =>
    has(val, '$ref') ? resolveRef(id, val, options).result : val
  );

  return merge({}, result, rest);
}

function recursiveInstantiate(
  id: string,
  schema: object,
  options: Options
): InstantiateResult {
  if (has(schema, 'default')) {
    return {
      hasResult: true,
      result: maybeResolveRefs(id, schema['default'], options)
    };
  }

  if (has(schema, '$ref')) {
    return resolveRef(id, schema, options);
  }

  // if there's `allOf`, `merge` each item in list into new object
  if (has(schema, 'allOf')) {
    return schema['allOf'].reduce(
      (res, s, idx) => {
        if (!res.hasResult) {
          return res;
        }

        const resolveResult = recursiveInstantiate(id, s, options);

        if (!resolveResult.hasResult) {
          return res;
        }

        if (
          resolveResult.result === null ||
          typeof resolveResult.result !== 'object' ||
          Array.isArray(resolveResult.result)
        ) {
          return resolveResult;
        }

        return {
          ...res,
          result: merge(res.result, resolveResult.result)
        };
      },
      { hasResult: true, result: {} }
    );
  }

  // if there's `oneOf`, resolve with first variant by default
  if (has(schema, 'oneOf')) {
    return recursiveInstantiate(id, schema['oneOf'][0], options);
  }

  if (has(schema, 'const')) {
    return { hasResult: true, result: schema['const'] };
  }

  if (has(schema, 'enum')) {
    return { hasResult: true, result: schema['enum'][0] };
  }

  switch (schema['type']) {
    // if object, recurse into each property
    case 'object':
      const result = {};
      let r: string[];

      if (has(schema, 'properties')) {
        r = Object.keys(schema['properties']);
        for (const property of r) {
          const hasDefault = has(schema, ['properties', property, 'default']);
          const hasRequired =
            has(schema, ['required']) &&
            schema['required'].indexOf(property) !== -1;
          if (hasDefault || hasRequired) {
            const {
              hasResult,
              result: recursiveResult,
              error
            } = recursiveInstantiate(
              id,
              schema['properties'][property],
              options
            );
            if (hasResult) {
              result[property] = recursiveResult;
            } else {
              return {
                hasResult,
                error
              };
            }
          }
        }
      }

      return {
        hasResult: true,
        result
      };
    // if integer, array, or string, return `default` value
    case 'array':
      const itemsSchema = get(schema, 'items');
      if (
        itemsSchema &&
        !Array.isArray(itemsSchema) &&
        has(schema, 'minItems') &&
        schema['minItems'] > 0
      ) {
        const defaultItemResult = recursiveInstantiate(
          id,
          schema['items'],
          options
        );
        if (defaultItemResult.hasResult) {
          return {
            hasResult: true,
            result: Array.from(Array(schema['minItems'])).map(
              () => defaultItemResult.result
            )
          };
        }
      }

      if (itemsSchema && Array.isArray(itemsSchema)) {
        return itemsSchema.reduce(
          (arrayResult, s) => {
            if (!arrayResult.hasResult) {
              return arrayResult;
            }

            const itemResult = recursiveInstantiate(id, s, options);

            if (itemResult.hasResult) {
              return {
                hasResult: true,
                result: [...arrayResult.result, itemResult.result]
              };
            }

            return {
              hasResult: false,
              error: itemResult.error
            };
          },
          { hasResult: true, result: [] }
        );
      }

      return {
        hasResult: true,
        result: defaultLiteralValue(schema['type'])
      };

    case 'integer':
    case 'number':
    case 'string':
    case 'boolean':
    case 'null':
      return {
        hasResult: true,
        result: defaultLiteralValue(schema['type'])
      };
    default:
      return {
        hasResult: false,
        error: `Unknown type: ${schema['type']}`
      };
  }
}

function buildRef(baseSchemaId: string, schema: any, path: string[]): string {
  const { schemaId } = parseRef(schema.$ref);

  const refPath = path.length ? `/${path.join('/')}` : '';

  return schemaId
    ? `${schema.$ref}${refPath}`
    : `${baseSchemaId}${schema.$ref}${refPath}`;
}

function schemaHasProperRef(schema: any, nextProp: string): boolean {
  return has(schema, '$ref') && !has(schema, nextProp);
}

export function normalizeSchemaRef(
  schemaRef: string,
  options: Options
): string {
  const { schemaId = schemaRef, path } = parseRef(schemaRef);

  const validateFunction = options.ajv.getSchema(schemaId);
  if (!validateFunction) {
    return schemaRef;
  }
  let schema = validateFunction.schema;

  if (schemaHasProperRef(schema, path[0])) {
    return normalizeSchemaRef(buildRef(schemaId, schema, path), options);
  }

  for (let i = 0; i < path.length; ++i) {
    schema = schema[path[i]];
    if (schemaHasProperRef(schema, path[i + 1])) {
      return normalizeSchemaRef(
        buildRef(schemaId, schema, path.slice(i + 1)),
        options
      );
    }
  }

  return schemaRef;
}

interface ParseRefResult {
  schemaId?: string;
  path: string[];
}

function parsePath(refPath: string): string[] {
  if (refPath.indexOf('/') === 0) {
    refPath = refPath.substr(1);
  }
  return refPath
    .split('/')
    .map(prop => prop.replace('~0', '~').replace('~1', '/'));
}

function parseRef(schemaRef: string): ParseRefResult {
  if (schemaRef.indexOf('#') !== -1) {
    const [schemaId, path] = schemaRef.split('#');
    return schemaId
      ? { schemaId, path: parsePath(path) }
      : { path: parsePath(path) };
  } else if (schemaRef.indexOf('/') === 0) {
    return { path: parsePath(schemaRef) };
  } else {
    return { schemaId: schemaRef, path: [] };
  }
}

const instantiate = curry((
  options: Options,
  schemaRef: string
): InstantiateResult => {
  if (!options.ajv) {
    return {
      hasResult: false,
      error: 'options.ajv is required'
    };
  }

  options = merge({}, defaultOptions, options);

  schemaRef = normalizeSchemaRef(schemaRef, options);

  const validateFunction = options.ajv.getSchema(schemaRef);
  if (!validateFunction) {
    return {
      hasResult: false,
      error: `schema not found: ${schemaRef}`
    };
  }

  const { schemaId } = parseRef(schemaRef);

  return recursiveInstantiate(schemaId, validateFunction.schema, options);
});

export default instantiate;
