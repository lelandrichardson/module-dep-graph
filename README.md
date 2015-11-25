# module-dep-graph

Automatically track a dependency graph of all commonjs modules in an application

## Installation

```bash
npm i module-dep-graph
```

## Usage

Let's say we have the following source code:

```js
// A.js
var B = require('./B');
var C = require('./C');
module.exports = 'I am module A!';
```

```js
// B.js
var C = require('./C');
var D = require('./D');
module.exports = 'I am module B!';
```

```js
// C.js
module.exports = 'I am module C!';
```

```js
// D.js
module.exports = 'I am module D!';
```

In the very first file that your program executes, you will want to load `module-dep-graphs`:

```js
require('module-dep-graphs'); 
```

Then, at any point in the execution of your program, you can dynamically pull the dependency graph
of all commonjs modules:

```js
var A = require('./A');
var deps = require('module-dep-graph');
```

At this point, calling `console.log(deps.graph)` would produce:

```js
{ '/absolute/path/to/A.js':
   { key: '/absolute/path/to/A.js',
     deps: [ Module[B], Module[C] ],
     reverse: [] },
  '/absolute/path/to/B.js':
   { key: '/absolute/path/to/B.js',
     deps: [ Module[C], Module[D] ],
     reverse: [ Module[A] ] },
  '/absolute/path/to/C.js':
   { key: '/absolute/path/to/C.js',
     deps: [],
     reverse: [ Module[B], Module[A] ] },
  '/absolute/path/to/D.js':
   { key: '/absolute/path/to/D.js',
     deps: [],
     reverse: [ Module[B] ] } }
```

Where we see that `deps.graph` is a cyclic graph represented as a set of key-value pairs of the
absolute paths to a module's file, and a node on the graph where each node has:

- `key`: the absolute path of the module's source file
- `deps`: an array of references pointing to the nodes in the graph of each module that this node
directly depends on.
- `reverse`: an array of references pointing to the nodes in the graph that directly depend on that
node. 

Because of the `reverse` array, this graph represents an *undirected* graph of module dependencies.

Additionally, the `module-dep-graph` export provides two helpful methods:

### `.dependentsOf(key)`

Returns an array of keys (absolute paths) for every module that the provided module key is a 
dependency of, both directly and indirectly (through sub-dependencies).  This is done by walking 
the graph using the node's `reverse` property.

```js
deps.dependentsOf(require.resolve('./C'))
// [ '/absolute/path/to/A.js', '/absolute/path/to/B.js' ]
```

### `.dependenciesOf(key)`

Returns an array of keys (absolute paths) for every module that the provided module key depends on,
both directly and indirectly (through sub-dependencies).  This is done by walking the graph using
the node's `deps` property.

```js
deps.dependenciesOf(require.resolve('./A'))
// [ '/absolute/path/to/B.js', '/absolute/path/to/C.js', '/absolute/path/to/D.js' ]
```


## How does it work?

This module works by using Node's internal `module` module, and wrapping some of it's internal 
methods. Namely, the `Module._load` method. Check the source of this repo, as well as the [source
of module](https://github.com/nodejs/node-v0.x-archive/blob/master/lib/module.js) for more insight.

## License

MIT
