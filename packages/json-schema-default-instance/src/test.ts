/* run with `npm test` */
import instantiate, { normalizeSchemaRef } from './instantiator';
import test from 'ava';
import Ajv from 'ajv';

const ajv = new Ajv({ verbose: true });

const definitionSchema = {
  description: 'Definitions',
  $id: 'definitions.json',
  definitions: {
    data: {
      description: 'Arbitrary data as hex string',
      type: 'string',
      pattern: '^([a-fA-F0-9]{2})+$',
    },
    header: {
      description: 'Header',
      type: 'object',
      properties: {
        version: {
          type: 'integer',
          minimum: 1,
          maximum: 255,
          default: 2,
        },
        type: {
          description: 'Index',
          type: 'integer',
          minimum: 0,
          maximum: 20,
        },
        length: {
          description: 'Length in bytes',
          type: 'integer',
          minimum: 8,
          maximum: 65535,
          default: 8,
        },
        title: {
          allOf: [{
            $ref: '#/definitions/text'
          }],
          default: 'No Name',
        },
        desc: {
          $ref: '#/definitions/text',
        },
        obj: {
          type: 'object',
          default: {
            objProp: 'text',
          },
        },
      },
      required: [
        'version',
        'type',
      ],
    },
    text: {
      type: 'string',
      default: '',
    },
    someObj: {
      type: 'object',
      properties: {
        someProp: {
          type: 'string',
          default: 'someProp'
        },
        otherProp: {
          $ref: '#/definitions/otherProp'
        }
      },
      required: ['someProp', 'otherProp']
    },
    otherProp: {
      type: 'string',
      default: 'otherProp'
    },
    deepSchema: {
      one: {
        two: {
          three: {
            four: {
              five: {
                six: {
                  seven: {
                    eight: {
                      nine: {
                        ten: {
                          type: 'string',
                          default: 'deepValue'
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
};

const oneOfDefSchema = {
  $id: 'oneOfDefSchema.json',
  oneOf: [{
    type: 'object',
    properties: {
      innerProp1: {
        type: 'string',
        default: 'innerProp'
      }
    },
    required: ['innerProp1']
  }, {
    type: 'object',
    properties: {
      innerProp2: {
        type: 'string',
        default: 'innerProp'
      }
    },
    required: ['innerProp2']
  }]
};

const externalSchema = {
  $id: 'externalSchema.json',
  definitions: {
    external: {
      $ref: 'definitions.json#/definitions/someObj'
    },
    deepSchema: {
      $ref: 'definitions.json#/definitions/deepSchema'
    }
  }
};

const allOfSchema = {
  $id: 'allOfSchema.json',
  allOf: [{
    $ref: '#/definitions/innerObj'
  }, {
    description: 'unknown schema, to be ignored'
  }, {
    $ref: 'definitions.json#/definitions/someObj'
  }],
  definitions: {
    innerObj: {
      type: 'object',
      properties: {
        innerProp: {
          type: 'string',
          default: 'innerProp'
        }
      }
    }
  }
}

const allOfOneOfSchema = {
  $id: 'allOfOneOfSchema.json',
  allOf: [{
    $ref: 'oneOfDefSchema.json'
  }]
}

const oneOfSchema = {
  $id: 'oneOfSchema.json',
  oneOf: [{
    $ref: '#/definitions/one'
  }, {
    $ref: '#/definitions/two'
  }],
  definitions: {
    one: {
      type: 'object',
      properties: {
        a: {
          enum: [1]
        }
      },
      required: ['a']
    },
    two: {
      type: 'object',
      properties: {
        b: {
          enum: [1]
        }
      },
      required: ['b']
    }
  }
}

const messageSchema = {
  description: 'Message',
  $id: 'message.json',
  type: 'object',
  required: [
    'header',
  ],
  properties: {
    header: {
      allOf: [
        {
          $ref: 'definitions.json#/definitions/header',
        },
        {
          type: 'object',
          properties: {
            type: {
              enum: [
                0,
              ],
              default: 0,
            },
          },
        },
      ],
    },
  },
};

const defaultRefSchema = {
  $id: 'defaultRef.json',
  type: 'object',
  required: ['prop'],
  properties: {
    prop: {
      type: 'object',
      default: {
        $ref: '#/definitions/prop',
        innerProp2: {
          $ref: '#/definitions/innerProp',
        },
      },
    },
  },
  definitions: {
    prop: {
      type: 'object',
      default: {
        innerProp1: 'text',
      },
    },
    innerProp: {
      type: 'string',
      default: 'text',
    },
  },
};

// example from https://spacetelescope.github.io/understanding-json-schema/structuring.html
const internalSchema = {
  $id: 'internalSchema',
  definitions: {
    address: {
      type: 'object',
      properties: {
        street_address: { type: 'string', default: '100 Main Street' },
        city: { type: 'string', default: 'New York' },
        state: { type: 'string', default: 'NY' },
      },
      required: ['street_address', 'city', 'state'],
    },
  },
  type: 'object',
  properties: {
    billing_address: { $ref: '#/definitions/address' },
    shipping_address: { $ref: '#/definitions/address' },
  },
  required: ['billing_address', 'shipping_address']
};

const resolveRefSchema = {
  $id: 'resolveRefSchema.json',
  definitions: {
    first: {
      $ref: '#/definitions/second'
    },
    second: {
      title: 'second'
    }
  }
}

const invalidResolveRefSchema = {
  $id: 'invalidResolveRefSchema.json',
  $ref: '#/definitions/first',
  definitions: {
    first: {
      $ref: '#/definitions/second'
    },
    second: {
      title: 'second'
    }
  }
}

const literalValueSchema = {
  $id: 'literalValueSchema.json',
  type: 'object',
  properties: {
    array: { type: 'array' },
    minItemsArray: { type: 'array', minItems: 2, items: { type: 'string' } },
    boolean: { type: 'boolean' },
    number: { type: 'number' },
    integer: { type: 'integer' },
    string: { type: 'string' },
    null: { type: 'null' }
  },
  required: ['array', 'minItemsArray', 'boolean', 'number', 'integer', 'string', 'null']
}

const defaultAddress = {
  street_address: '100 Main Street',
  city: 'New York',
  state: 'NY',
};

ajv.addSchema([
  definitionSchema,
  oneOfDefSchema,
  messageSchema,
  internalSchema,
  defaultRefSchema,
  allOfSchema,
  allOfOneOfSchema,
  oneOfSchema,
  externalSchema,
  resolveRefSchema,
  invalidResolveRefSchema,
  literalValueSchema
]);

const ins = instantiate({ ajv });

test('Should normalize schema ref', t => {
  t.is(
    normalizeSchemaRef('resolveRefSchema.json#/definitions/first', { ajv }),
    'resolveRefSchema.json#/definitions/second'
  );

  t.is(
    normalizeSchemaRef('invalidResolveRefSchema.json#/definitions/first', { ajv }),
    'invalidResolveRefSchema.json#/definitions/second'
  );
});

test('Should return default literal value', t => {
  t.deepEqual(ins('literalValueSchema.json').result, {
    array: [],
    minItemsArray: ['', ''],
    boolean: false,
    number: 0,
    integer: 0,
    string: '',
    null: null
  });
});

test('Should return no result for unknown schema', t => {
  t.is(ins('unknown-schema.json').hasResult, false);
});

test('Correctly resolves external ref', t => {
  t.deepEqual(
    ins('externalSchema.json#/definitions/external').result,
    { someProp: 'someProp', otherProp: 'otherProp' } as any
  );

  t.is(
    ins('externalSchema.json#/definitions/external/properties/someProp').result,
    'someProp'
  );
});

test('Resolve deep schema', t => {
  t.is(ins('definitions.json#/definitions/deepSchema/one/two/three/four/five/six/seven/eight/nine/ten').result, 'deepValue');
});

test('Resolve external deep schema', t => {
  t.is(ins('externalSchema.json#/definitions/deepSchema/one/two/three/four/five/six/seven/eight/nine/ten').result, 'deepValue');
});

test('Resolve first enum value as default', t => {
  ajv.addSchema({
    $id: 'enumSchema.json',
    enum: ['one', 'two', 'three']
  });

  t.is(ins('enumSchema.json').result, 'one');
});

test('Resolve const value as default', t => {
  ajv.addSchema({
    $id: 'constSchema.json',
    const: 'constValue'
  });

  t.is(ins('constSchema.json').result, 'constValue');
});

test('Object defaults resolve correctly', t => {
  ajv.addSchema({
    $id: 'object-defaults.json',
    type: 'object',
    properties: {
      prop: {
        type: 'integer'
      }
    },
    default: {
      prop: 1
    }
  });

  t.deepEqual(ins('object-defaults.json').result, { prop: 1 } as any);
});

test('Object property defaults resolve correctly', t => {
  ajv.addSchema({
    $id: 'object-prop-defaults.json',
    type: 'object',
    properties: {
      prop: {
        type: 'integer',
        default: 1
      }
    }
  });

  t.deepEqual(ins('object-prop-defaults.json').result, { prop: 1 } as any);
});

test('Non-required external defaults resolve correctly', t => {
  ajv.addSchema({
    $id: 'non-req-ext-defaults.json',
    type: 'object',
    properties: {
      prop: {
        $ref: '#/definitions/prop'
      }
    },
    definitions: {
      prop: {
        type: 'integer',
        default: 1
      }
    }
  });

  t.deepEqual(ins('non-req-ext-defaults.json').result, { } as any);
});

test('Required external defaults resolve correctly', t => {
  ajv.addSchema({
    $id: 'req-ext-defaults.json',
    type: 'object',
    properties: {
      prop: {
        $ref: '#/definitions/prop'
      }
    },
    required: ['prop'],
    definitions: {
      prop: {
        type: 'integer',
        default: 1
      }
    }
  });

  t.deepEqual(ins('req-ext-defaults.json').result, { prop: 1 } as any);
});

test('Object default overrides property defaults', t => {
  ajv.addSchema({
    $id: 'override-defaults.json',
    type: 'object',
    properties: {
      prop1: {
        type: 'integer',
        default: 11
      },
      prop2: {
        type: 'integer',
        default: 111
      }
    },
    default: {
      prop1: 1
    }
  });

  t.deepEqual(ins('override-defaults.json').result, { prop1: 1 } as any);
});

test('Instantiate correctly instantiates defaults (externally-referenced schema)', t => {
  const { result } = ins('message.json');
  t.deepEqual(result, {
    header: { version: 2, type: 0, length: 8, title: 'No Name', obj: { objProp: 'text' } },
  } as any);
});

test('Instantiate correctly instantiates defaults (internally-referenced schema)', t => {
  const { result } = ins('internalSchema');
  t.deepEqual(result, { billing_address: defaultAddress, shipping_address: defaultAddress } as any);
});

test('Instantiate resolves refs in default', t => {
  let defaultRef = instantiate({ ajv, resolveDefaultRefs: false }, 'defaultRef.json').result;
  t.deepEqual(defaultRef, { prop: defaultRefSchema.properties.prop.default } as any);

  defaultRef = instantiate({ ajv, resolveDefaultRefs: true }, 'defaultRef.json').result;
  t.deepEqual(defaultRef, { prop: { innerProp1: 'text', innerProp2: 'text' } } as any);
});

test('Instantiate resolves allOf', t => {
  const { result } = ins('allOfSchema.json');

  t.deepEqual(result, {
    innerProp: 'innerProp',
    someProp: 'someProp',
    otherProp: 'otherProp'
  } as any);
});

test('Instantiate resolves allOf oneOf', t => {
  const { result } = ins('allOfOneOfSchema.json');

  t.deepEqual(result, {
    innerProp1: 'innerProp'
  } as any);
});

test('Instantiate resolves oneOf', t => {
  const { result } = ins('oneOfSchema.json');

  t.deepEqual(result, { a: 1 } as any);
});

test('Array items resolve correctly', t => {
  ajv.addSchema({
    $id: 'array-items.json',
    type: 'array',
    items: [
      {
        type: 'string'
      },
      {
        type: 'number'
      },
      {
        type: 'boolean',
        default: true
      }
    ]
  });

  t.deepEqual(ins('array-items.json').result, ['', 0, true] as any);
});

test('allOf object properties are merged', t => {
  ajv.addSchema({
    $id: 'all-of-merge.json',
    allOf: [{
      type: 'object',
      properties: {
        prop: {
          type: 'object',
          properties: {
            a: {
              type: 'string'
            }
          },
          required: ['a']
        }
      },
      required: ['prop']
    }, {
      type: 'object',
      properties: {
        prop: {
          type: 'object',
          properties: {
            b: {
              type: 'string'
            }
          },
          required: ['b']
        }
      },
      required: ['prop']
    }]
  });

  t.deepEqual(ins('all-of-merge.json').result, { prop: { a: '', b: '' }});
});