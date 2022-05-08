let path = require('path');
let fs = require('fs');
let hash = require('./hash');

let DIRS = {};

const separatorRegExp = new RegExp(`\\${path.sep}`, 'g');

// optimized: remember root dir for all child dirs
function findModuleRoot(filename) {
  if (!filename) {
    return null;
  }
  let dir = path.dirname(filename);
  if (DIRS[dir]) {
    return DIRS[dir];
  }
  if (fs.existsSync(path.join(dir, 'package.json'))) {
    DIRS[dir] = dir;
    return dir;
  } else if (dir !== filename) {
    let rootdir = findModuleRoot(dir);
    if (rootdir) DIRS[dir] = rootdir;
    return rootdir;
  } else {
    return null;
  }
}

function getFileHash(filename, code) {
  const moduleRoot = findModuleRoot(filename);

  const filePath =
    moduleRoot &&
    path.relative(moduleRoot, filename).replace(separatorRegExp, '/');
  const moduleName =
    moduleRoot &&
    JSON.parse(fs.readFileSync(path.join(moduleRoot, 'package.json'))).name;

  const stuffToHash = filePath ? moduleName + filePath : moduleName + code;

  return hash(stuffToHash);
}

function findParent(node, level) {
  for (let i = level - 1; i >= 0; i--) {
    node = node.parent;
    if (!node) return null;
  }

  return node;
}

function findParentOfType(node, nodeType, level) {
  for (let i = level - 1; i >= 0; i--) {
    node = node.parent;
    if (!node) return null;
  }

  return node.type === nodeType ? node : null;
}

function getFirstChildValue(node, nodeType, source) {
  let child = node.firstChild;
  if (!child || child.type !== nodeType) {
    return null;
  }
  return source.substr(child.startIndex, child.endIndex - child.startIndex);
}

function getChildValue(node, index, nodeType, source) {
  let child = node.children[index];
  if (!child || child.type !== nodeType) {
    return null;
  }
  return source.substr(child.startIndex, child.endIndex - child.startIndex);
}

function getValue(node, source) {
  return source.substr(node.startIndex, node.endIndex - node.startIndex);
}

function getName(node, source) {
  let parent = findParent(node, 3);
  // console.log(findParent(node, 1)?.type, findParent(node, 2)?.type, findParent(node, 3)?.type,
  //   findParent(node, 4)?.type, findParent(node, 5)?.type, findParent(node, 6)?.type, findParent(node, 7)?.type);

  const nodeTypes = [
    'variable_declarator',
    'assignment_expression',
    'pair',
    'public_field_definition',
  ];

  while (
    nodeTypes.indexOf(parent.type) === -1 &&
    parent.type === 'ternary_expression'
  ) {
    parent = parent.parent;
  }

  while (parent.type === 'assignment_expression') {
    parent = parent.parent;
  }

  if (parent) {
    switch (parent.type) {
      case 'variable_declarator':
        return getFirstChildValue(parent, 'identifier', source);
      case 'expression_statement':
        return getFirstChildValue(parent.firstChild, 'identifier', source);
      case 'pair':
        return getFirstChildValue(parent, 'property_identifier', source);
      case 'public_field_definition':
        if (parent.firstChild.type === 'static') {
          return getChildValue(parent, 1, 'property_identifier', source);
        }
    }
  }

  return null;
}

function prefixLeadingDigit(str) {
  return str[0] >= '0' && str[0] <= '9' ? 'sc-' + str : str;
}

function getOption(opts, name, defaultValue = true) {
  return opts[name] == null ? defaultValue : opts[name];
}

function getBlockName(filename, meaninglessFileNames) {
  const name = path.basename(filename, path.extname(filename));

  return meaninglessFileNames.includes(name)
    ? path.basename(path.dirname(filename))
    : name;
}

function getDisplayName(cursor, opts, source) {
  const componentName = getName(cursor.currentNode, source);
  if (opts.fileName && opts.path) {
    const blockName = getBlockName(opts.path, opts.meaninglessFileNames);
    if (blockName === componentName) {
      return componentName;
    }
    return componentName
      ? prefixLeadingDigit(blockName) + '__' + componentName
      : prefixLeadingDigit(blockName);
  } else {
    return componentName;
  }
}

function traverse(cursor, cb, level = 0) {
  while (true) {
    if (cb(cursor, level) !== false) {
      // go to next node
      if (cursor.gotoFirstChild()) {
        traverse(cursor, cb, level + 1);
        cursor.gotoParent();
      }
    }
    if (!cursor.gotoNextSibling()) break;
  }
}

function pushCode(out, source, start, end, lastIndex) {
  if (start > lastIndex) {
    out.push(source.substr(lastIndex, end - lastIndex));
  } else {
    out.push(source.substr(start, end - start));
  }
  return end;
}

function parseConfig(node, source) {
  let config = {};
  for (let child of node.children) {
    if (child.type === 'pair') {
      let key = getValue(child.firstChild, source);
      let value = getValue(child.children[2], source);
      config[key] = value;
    }
  }
  return config;
}

function createConfig(opts, cmpIdPrefix, cmpIdIndex, displayName, config) {
  let props = [];
  if (opts.ssr) {
    props.push("componentId: '" + cmpIdPrefix + '-' + cmpIdIndex + "'");
  }
  if (opts.displayName && displayName) {
    props.push("displayName: '" + displayName + "'");
  }
  if (config) {
    Object.entries(config).forEach(([key, value]) =>
      props.push(key + ': ' + value)
    );
  }
  return '.withConfig({ ' + props.join(', ') + ' })';
}

function findConfigNode(node, source) {
  while (node) {
    if (node.lastChild && node.lastChild.type === 'property_identifier' && getValue(node.lastChild, source) === 'withConfig') {
      return node;
    }
    node = node.firstChild;
  }
}

function isStyledNode(node, styledIds, styledIdsWithDefault) {
  let text = node.text;
  if (node.type === 'identifier' && styledIds.indexOf(text) !== -1) {
    return true;
  }
  if (node.type === 'member_expression' && node.firstChild && styledIdsWithDefault.indexOf(node.firstChild.text) !== -1) {
    if (node.lastChild.text === 'default') {
      return true;
    }
  }
  return false;
}

function findStyledNode(node, source, styledIds, styledIdsWithDefault) {
  while(node) {
    if (isStyledNode(node, styledIds, styledIdsWithDefault)) {
      return node;
    }

    node = node.firstChild;
  }
}

function isQuotedString(quoted, str) {
  return quoted === '"' + str + '"' || quoted === "'" + str + "'";
}

module.exports = function traverseAndPrint(cursor, opts) {
  let out = [];
  let lastIndex = 0;
  let source = opts.source;

  let namespace = opts.namespace ? opts.namespace + '__' : '';
  let cmpIdPrefix = namespace + 'sc-' + getFileHash(opts.path, source);
  let cmpIdIndex = 0;

  let styledIds = ['styled'];
  let styledIdsWithDefault = [];

  let possibleStyledFound = false;

  function reset(cursor) {
    while(cursor.gotoParent()) {}
    possibleStyledFound = false;
    out = [];
    lastIndex = 0;
  }

  traverse(cursor, (cursor, level) => {
    let nodeType = cursor.nodeType;
    let name = cursor.currentFieldName;
    let start = cursor.startIndex;
    let end = cursor.endIndex;

    if (nodeType === 'type_arguments') return false;

    if (nodeType === 'import_statement') {
      let importNode = cursor.currentNode;
      let [_, clauseNode, fromNode, pathNode] = importNode.children;

      if (clauseNode.type === 'type' || clauseNode.type === 'typeof' || fromNode.type !== 'from' || pathNode.type !== 'string') return false;

      if (!isQuotedString(pathNode.text, 'styled-components')) return false;

      if (clauseNode.firstChild.type === 'identifier') {
        let text = clauseNode.firstChild.text;
        if (styledIds.indexOf(text) === -1) {
          styledIds.push(text);
          if (possibleStyledFound) {
            reset(cursor);
            return;
          }
        }
      }

      if (clauseNode.firstChild.type === 'named_imports') {
        let specifiers = clauseNode.firstChild.descendantsOfType('import_specifier');
        for (let s of specifiers) {
          if (s.firstChild.text === 'default' && s.child(1) && s.child(1).type === 'as') {
            let text = s.lastChild.text;
            if (styledIds.indexOf(text) === -1) {
              styledIds.push(text);
              if (possibleStyledFound) {
                reset(cursor);
                return;
              }
            }
            break;          
          }
        }
      }

      return false;
    }

    if (nodeType === 'identifier' && cursor.nodeText === 'require') {
      let declaratorNode = cursor.currentNode.closest('variable_declarator');
      if (!declaratorNode) return false;

      let pathNode = cursor.currentNode.parent.lastChild.child(1);

      if (!isQuotedString(pathNode.text, 'styled-components')) return false;

      let propNode = declaratorNode.descendantsOfType('property_identifier')[0];
      let isDefault = propNode && propNode.text === 'default';

      let idNode = declaratorNode.descendantsOfType('identifier')[0];

      if (idNode) {
        if (isDefault) {
          styledIds.push(idNode.text);
        } else {
          styledIdsWithDefault.push(idNode.text);
        }
      }

      return false;
    }

    // usecase: styled.div

    if (nodeType === 'member_expression' && name === 'function') {
      possibleStyledFound = true;
      if (cursor.gotoFirstChild()) {
        let styledNode = findStyledNode(cursor.currentNode, source, styledIds, styledIdsWithDefault);
        if (styledNode) {
            let displayName = getDisplayName(cursor, opts, source);
            lastIndex = pushCode(out, source, start, end, lastIndex);
            out.push(
              createConfig(opts, cmpIdPrefix, cmpIdIndex++, displayName)
            );
        }
      }
      cursor.gotoParent();
      return false;
    }

    if (nodeType === 'call_expression' && name === 'function') {
      possibleStyledFound = true;
      if (cursor.gotoFirstChild()) {
        // usecase: styled.div.attrs(...) OR styled.div.withConfig(...)

        if (
          cursor.nodeType === 'member_expression' &&
          cursor.currentFieldName === 'function'
        ) {
          let styledNode = findStyledNode(cursor.currentNode, source, styledIds, styledIdsWithDefault);
          if (styledNode) {
            let node = cursor.currentNode.parent;

            let configNode = findConfigNode(node, source);
            let config;

            if (configNode) {
              let configArgumentsNode = configNode.parent.lastChild;
              config = parseConfig(
                configArgumentsNode.children[1],
                source
              );

              pushCode(out, source, start, configNode.firstChild.endIndex, lastIndex);

              pushCode(out, source, configArgumentsNode.endIndex, end, configArgumentsNode.endIndex);
              lastIndex = end;
            } else {
              lastIndex = pushCode(out, source, start, end, lastIndex);
            }

            let displayName = getDisplayName(cursor, opts, source);
            out.push(
              createConfig(opts, cmpIdPrefix, cmpIdIndex++, displayName, config)
            );
          }
        }

        // usecase: styled(...)

        if (
          cursor.nodeType === 'identifier' &&
          cursor.currentFieldName === 'function'
        ) {
          if (isStyledNode(cursor.currentNode, styledIds, styledIdsWithDefault)) {
            let displayName = getDisplayName(cursor, opts, source);
            lastIndex = pushCode(out, source, start, end, lastIndex);
            out.push(
              createConfig(opts, cmpIdPrefix, cmpIdIndex++, displayName)
            );
          }
        }
      }
      cursor.gotoParent();
      return false;
    }
  });

  if (source.length > lastIndex) {
    out.push(source.substr(lastIndex));
  }

  return out.join('');
};
