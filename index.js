var Module = require('module');
var originalLoad = Module._load;
var graph = {};
var stack = [];

function recordDep(node) {
  const parent = stack[stack.length - 1];
  if (!parent) {
    return;
  }
  parent.deps.push(node);
  node.reverse.push(parent);
}

// this is the wrapped require function. It ends up calling the original, but records calls to
// it in a graph.
function load(request, parent, isMain) {
  if (request === 'module-dep-graph') {
    // for convenience, let's not include the dependencies of ourselves.
    return originalLoad(request, parent, isMain)
  }

  var key = Module._resolveFilename(request, parent);
  var node = graph[key];
  var result;
  if (!node) {
    node = {
      key,
      deps: [], // modules this node requires
      reverse: [], // modules that require this node
    };
    graph[key] = node;
    recordDep(node);
    stack.push(node);
    result = originalLoad(request, parent, isMain);
    stack.pop();
  } else {
    recordDep(node);
    result = originalLoad(request, parent, isMain);
  }

  return result;
}

// for a given graph node key, get the keys of all of the nodes that depend on it,
// even if indirectly.
function dependentsOf(key) {
  var deps = {};
  var node = graph[key];
  if (!node) return [];
  var stack = [node];

  while (stack.length) {
    node = stack.pop();
    node.reverse.forEach(n => {
      stack.push(n);
      deps[n.key] = true;
    });
  }

  return Object.keys(deps);
}

// for a given graph node key, get the keys of all of the nodes that it depends on,
// even if indirectly.
function dependenciesOf(key) {
  var deps = {};
  var node = graph[key];
  if (!node) return [];
  var stack = [node];

  while (stack.length) {
    node = stack.pop();
    node.deps.forEach(n => {
      stack.push(n);
      deps[n.key] = true;
    });
  }

  return Object.keys(deps);
}

// Here is where we are doing the dangerous act of mutating `Module._load` and hoping for the best.
Module._load = load;

module.exports = {
  graph,
  dependentsOf,
  dependenciesOf,
};
