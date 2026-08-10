---
parser: v2
author_name: DJ Adams
author_profile: https://github.com/qmacro
auto_validation: false
primary_tag: software-product-function>sap-cloud-application-programming-model
tags: [ software-product>sap-business-technology-platform, topic>cloud, tutorial>beginner ]
time: 15
---

# Get an introduction to the cds REPL

<!-- description --> Get to know the cds REPL.

## You will learn

- What the cds REPL is
- How to invoke it
- How to get started within it

## Prerequisites

You will need a development environment for CAP Node.js. See the tutorial [Set
up a self-contained development environment for CAP
Node.js](https://developers.sap.com/tutorials/cap-self-contained-dev-env.html)
The assumptions in this tutorial are based on option 1 or option 2 in that
tutorial, in that you have a VS Code (or GitHub Codespace) environment based on
the foundation repository used in the setup described there, which also means
that your starting directory will be `/workspaces/cap-nodejs-dev-env`. If you
have your own CAP Node.js development environment setup, then please make the
appropriate adjustments where necessary.

## Intro

In any language or development environment, having a REPL is a superpower, and
it pays to embrace it and be at least a little familiar with it. CAP as a whole
is built on solid foundations and practices that have matured over the decades,
and the REPL is part of that, first appearing in the 1960's and initially
popularized in the LISP and LISP-derivative language communities.

Node.js has a REPL, and it is upon this REPL that the cds REPL is based. In
this exercise, we'll explore the cds REPL.

---

### Set up a host project

It's always better to explore the cds REPL in the context of an existing CAP
project, with its CDS model and some data. We'll use a cut down version of the
classic Northwind service called "Northbreeze". That service is available in
the repository <https://github.com/SAP-samples/odata-dd-server>.

👉 Clone the repository:

```bash
git clone https://github.com/SAP-samples/odata-dd-server
```

👉 Now open the `northbreeze/` directory within the cloned repository in a new
VS Code / Codespace window:

```bash
code odata-dd-server/northbreeze/
```

### Briefly explore the Node.js REPL

As the cds REPL is based on the Node.js REPL, let's start by briefly exploring
the Node.js REPL, then move into the cds REPL.

👉 Start a Node.js REPL:

```bash
node
```

You should be presented with a simple prompt like this:

```log
Welcome to Node.js v24.18.0.
Type ".help" for more information.
>
```

👉 To honor one of the pivotal moments in the birth of personal computing, enter
this expression at the prompt:

```javascript
2 + 2
```

👉 Ask for help:

```javascript
.help
```

which should present a list of REPL commands like this:

```log
.break    Sometimes you get stuck, this gets you out
.clear    Alias for .break
.editor   Enter editor mode
.exit     Exit the REPL
.help     Print this help message
.load     Load JS from a file into the REPL session
.save     Save all evaluated commands in this REPL session to a file
```

👉 Exit the Node.js REPL using `Ctrl-D`.

### Start the cds REPL

Now it's time to switch to the cds REPL, and we'll see that it is indeed based
on the Node.js REPL.

👉 Start the cds REPL:

```bash
cds repl
```

> This can be shortened to `cds r`.

This time, the prompt should look something like this:

```log
Welcome to cds repl v10.0.4
>
```

👉 At the prompt, try the `.help` command again, whereupon there should be
extra commands shown:

```log
.break     Sometimes you get stuck, this gets you out
.clear     Alias for .break
.editor    Enter editor mode
.exit      Exit the REPL
.help      Print this help message
.inspect   Sets options for util.inspect, e.g. `.inspect .depth=1`.
.load      Load JS from a file into the REPL session
.ql        Switch to cql repl mode, evaluating cql queries
.run       Runs a cds server from a given CAP project folder, or module name like @capire/bookshop.
.save      Save all evaluated commands in this REPL session to a file
```

There are cds REPL specific commands `.inspect`, `.run` and `.ql`.

### Explore with .inspect

The `.inspect` command is useful for examining large and / or complex data
structures, of which there are plenty in any given application or service, both
from the data model perspective but also from the runtime perspective.

👉 First, try to look at the entire CDS facade, which is available in the `cds`
variable:

```javascript
cds
```

There's a very large amount of output that is produced, by default:

```javascript
cds {
  _events: {},
  _eventsCount: 0,
  _maxListeners: undefined,
  model: undefined,
  db: undefined,
  cli: { command: 'repl', argv: [], options: { run: undefined } },
  root: '/work/gh/github.com/SAP-samples/cap-tour-hands-on/proj-03',
  services: {},
  extend: [Function (anonymous)],
  home: '/home/dj/.npm-packages/lib/node_modules/@sap/cds-dk/node_modules/@sap/cds',
  version: '9.9.1',
  parse: [Function: exports] {
    cdl: [Function: cdl],
    cql: [Function: cql],
    path: [Function: path],
    expr: [Function: expr],
    xpr: [Function (anonymous)],
    ref: [Function (anonymous)],
    properties: [Function (anonymous)],
    yaml: [Function (anonymous)],
    csv: [Function (anonymous)],
    json: [Function (anonymous)],
    ttl: [Function (anonymous)],
    _select: [Function (anonymous)]
  },
  utils: <ref *3> {
    path: <ref *2> {
      resolve: [Function: resolve],
      normalize: [Function: normalize],
      isAbsolute: [Function: isAbsolute],
      join: [Function: join],
      relative: [Function: relative],
      toNamespacedPath: [Function: toNamespacedPath],

      ... (many many more lines)
```

We can use regular JavaScript facilities to try to deal with this, such as
`Object.keys(cds)` but this is a little cumbersome and doesn't give us enough
information. Using `.inspect` is ideal.

👉 Try it:

```javascript
.inspect cds
```

The output produced is more concise and readable:

```javascript
cds: cds {
  _events: [Object: null prototype] {},
  _eventsCount: 0,
  _maxListeners: undefined,
  model: undefined,
  db: undefined,
  cli: [Object],
  root: '/work/gh/github.com/SAP-samples/cap-tour-hands-on/proj-03',
  services: {},
  extend: [Function (anonymous)],
  home: '/home/dj/.npm-packages/lib/node_modules/@sap/cds-dk/node_modules/@sap/cds',
  version: '9.9.1',
  parse: [Function],
  utils: [Object],
  Symbol(shapeMode): false,
  Symbol(kCapture): false
}
```

> The output "volume" from `.inspect` can also be controlled with `.depth` too.

### Start a CAP server with .run

With `.run` we can have a CAP server started up for us in the cds REPL.

👉 Try that now at the cds REPL prompt, specifying the current directory (which
should be `northbreeze/`), like this:

```javascript
.run .
```

In addition to the normal CAP server log output, you should see something like
this:

```log
------------------------------------------------------------------------
Following variables are made available in your repl's global context:

from cds.entities: {
  Products,
  Categories,
  Suppliers,
}

from cds.services: {
  db,
  Main,
}

Simply type e.g. Main in the prompt to use the respective objects.
```

These are convenience variables that help us to get started in our model and
runtime explorations.

> This `.run` facility is so useful, it's also available as an option to the
> `cds repl` command itself. For example, the equivalent would be `cds repl
> --run .` (or `cds r -r .` for short).

👉 At the prompt, explore these variables and what they represent, noticing the
different object types (`SQLiteService`, `entity`, and so on).

### Try out some queries

The cds REPL is a great place to explore the data model, the data itself, and
the services available to us. A key component here is the concept of a query,
which we express in CQL, either directly, or indirectly.

👉 At the prompt, let's start with a simple query expressed indirectly via the
REST-style API, and the `db` object you examined in the previous step:

```javascript
await db.get(Products).where({ProductName:'Chai'})
```

> Remember that here, as more generally in a Node.js context, almost everything
is asynchronous, hence the need for `await`.

This should produce something like this:

```javascript
[
  {
    ProductID: 1,
    ProductName: 'Chai',
    QuantityPerUnit: '10 boxes x 20 bags',
    UnitPrice: '18',
    Category_CategoryID: 1,
    Supplier_SupplierID: 1,
    UnitsInStock: 39,
    UnitsOnOrder: 0,
    ReorderLevel: 10,
    Discontinued: false
  }
]
```

👉 Try that same query now more directly expressed in CQL, using a tagged
template string construction, which should produce the same result:

```javascript
await cds.ql `select from ${Products} where ProductName = 'Chai'`
```

There's a convenient "cql" mode in the cds REPL where we can express such
CQL statements more cleanly and directly.

👉 Switch into this mode:

```javascript
.ql
```

whereupon the prompt should change to:

```log
cql>
```

In this prompt, enter this CQL statement directly:

```log
select from Products where ProductName = 'Chai'
```

Again, the same output (an array of a single product object) is produced.

👉 Switch back to the regular (Node.js-based JavaScript) cds REPL mode now:

```javascript
.js
```

### Wrap-up and further info

This tutorial just scratches the surface of the cds REPL and what can be done.
Remember that a REPL gives you direct and low level access to a running system,
which can be invaluable for exploration, diagnosis, debugging, introspection
and more.

For further info, refer to these resources:

- The article [How to use the Node.js
  REPL](https://nodejs.org/learn/command-line/how-to-use-the-nodejs-repl) is a
  good overview of the Node.js REPL
- The [MITS ALTAIR
  BASIC](https://deramp.com/downloads/mfe_archive/010-S100%20Computers%20and%20Boards/00-MITS/40-Software/BASIC/Altair%20BASIC%203.0/Documentation/Altair_8800_BASIC_Reference_Manual_1975.pdf)
  manual has a reference to `2 + 2` which Microsoft co-founder Paul Allen typed
  in to show MITS's Ed Roberts that their BASIC interpreter worked
- The [CQL](https://cap.cloud.sap/docs/cds/cql) section of Capire has a wealth
  of information
- The [REST-style
  API](https://cap.cloud.sap/docs/node.js/core-services#rest-style-api) is one
  of a number of ways to query
