---
parser: v2
author_name: DJ Adams
author_profile: https://github.com/qmacro
auto_validation: false
primary_tag: software-product-function>sap-cloud-application-programming-model
tags: [ software-product>sap-business-technology-platform, topic>cloud, tutorial>beginner ]
time: 15
---

# Add MCP capabilities to a CAP service

<!-- description --> Learn how easy it is to add an MCP server to your CAP service.

## You will learn

- Understand what the Model Context Protocol is
- How to add MCP server capabilities to your CAP service
- What the high level protocol flow looks like

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

You will also need a coding agent with MCP capabilities. OpenCode is what we
will use for this tutorial. Install it in your self-contained development
environment with `npm install --global opencode-ai`.

## Intro

Put extremely simply, large Language Models (LLMs) can think (in a
next-token-prediction kind of way) but not act, not cause things to happen in
the world beyond its own model. There's a parallel with purely function
languages like Haskell, which interacts with the outside world via monads.

In the context of LLMs, the equivalent of monads is the Model Control Protocol
(MCP). This is a protocol that provides a unifying layer between LLMs and all
sorts of services that can provide information and offer a wide range of
facilities.

In CAP, MCP is just another protocol, and through CAP's "magic made simple"
approach, extremely straightforward to configure.

> At the time of writing, the MCP adapter in CAP is in beta status.

---

### Set up a simple CAP service

To have something to which we can add MCP capabilities, let's set up a very
simple CAP project with a basic "books" oriented service. Conveniently there's
the `tiny-sample` facet which we can use.

👉 Create a new CAP project using this facet, plus the `nodejs` facet:

```bash
cds init --add tiny-sample,nodejs cap-add-mcp-capabilities
```

> We're adding the `nodejs` facet so that we have a `package.json` file,
> as we'll be installing a package with `npm` later.

👉 Now open the new `cap-add-mcp-capabilities/` directory in a new VS Code /
Codespace window:

```shell
code cap-add-mcp-capabilities/
```

This should place you and any new terminal session in the new
`cap-add-mcp-capabilities/` directory.

There's a simple `CatalogService` with a single `Books` entity, for which
there are a handful of records. Let's have a quick look.

👉 Start the server with `cds watch`, which should cause log lines as shown
below to be emitted:

```log
[cds] - loaded model from 1 file(s):
 
  srv/cat-service.cds

[cds] - using bindings from: { registry: '~/.cds-services.json' }
[cds] - connect to db > sqlite { database: ':memory:' }
  > init from db/data/CatalogService.Books.csv 
/> successfully deployed to in-memory database. 

[cds] - serving CatalogService {
  at: [ '/odata/v4/catalog' ],
  decl: 'srv/cat-service.cds:1'
}
[cds] - server listening on { url: 'http://localhost:4004' }
```

> The path on which `CatalogService` is served - `/odata/v4/catalog` - indicates
> that this is OData v4.

👉 Check out the data by visiting
<http://localhost:4004/odata/v4/catalog/Books>, which should show something
like this (you may want to use a JSON formatter extension in your browser to
see the representation formatted nicely):

```json
{
  "@odata.context": "$metadata#Books",
  "value": [
    {
      "ID": 1,
      "title": "Wuthering Heights",
      "author": "Emily Brontë"
    },
    {
      "ID": 2,
      "title": "Jane Eyre",
      "author": "Charlotte Brontë"
    },
    {
      "ID": 3,
      "title": "The Raven",
      "author": "Edgar Allen Poe"
    },
    {
      "ID": 4,
      "title": "Eleonora",
      "author": "Edgar Allen Poe"
    },
    {
      "ID": 5,
      "title": "Catweazle",
      "author": "Richard Carpenter"
    }
  ]
}
```

### Examine and extend the CDS model

The CDS model is very simple and defined in a single file, `srv/cat-service.cds`:

```cds
@odata
service CatalogService {
  entity Books {
    key ID     : Integer;
        title  : String;
        author : String;
  }
}
```

Note the `@odata` annotation, an explicit declaration that we want this service
to be served with the OData v4 protocol (which is the default behavior anyway).

The separation of layers here, with the service definition being only loosely
coupled to the protocol, means that it can be served with different protocols
too.

Add an `@mcp` annotation like this:

```cds
@mcp
@odata
service CatalogService {
  entity Books {
    key ID     : Integer;
        title  : String;
        author : String;
  }
}
```

👉 Assuming that the CAP server is still running, notice that in the new log
records that are emitted, nothing has changed.

This is because the implementation of MCP capabilities is provided by the MCP
adapter plugin `@cap-js/mcp`, which isn't installed.

### Install the MCP adapter plugin

Let's address that now.

👉 First, stop the CAP server (with `Ctrl-C`), then install the MCP adapter:

```bash
npm install @cap-js/mcp
```

👉 Now, restart the CAP server, this time asking for more detailed log output
for the MCP adapter too:

```bash
DEBUG=mcp cds watch
```

Extra information appears, including:

```log
[mcp] - Adapter initialized { service: 'CatalogService' }
[cds] - serving CatalogService {
  at: [ '/odata/v4/catalog', '/mcp/catalog' ],
  decl: 'srv/cat-service.cds:2'
}
[mcp] - registering MCP services: [ 'CatalogService' ]
[mcp] - Written OpenCode config to: /home/node/.config/opencode/opencode.json
```

Remember that MCP servers provide a unified layer to all sorts of services,
and speak a simple protocol to enable discovery and usage. Here, we see:

- the MCP server being served at `/mcp/catalog`
- the `CatalogService` being registered with that MCP server

> The terms 'adapter' and 'server' are effectively interchangeable here.

CAP's developer-focused local-first approach also applies here, where we also
see:

- the MCP server is automatically registered to OpenCode, one of two
  (currently) supported coding agents (the other is Claude Code)

If we were to take a look at the OpenCode configuration at this point, which is
in `~/.config/opencode/opencode.json`, we'd see this, which is what was written
by the MCP adapter:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "cds:CatalogService": {
      "type": "remote",
      "url": "http://localhost:4004/mcp/catalog",
      "headers": {
        "Authorization": "Basic YWxpY2U6"
      },
      "enabled": true
    }
  }
}
```

This is referred to in CAP parlance as "autowiring".

### Take a peek at the MCP protocol

The Model Context Protocol is based on JSON-RPC, a remote-procedure call
style request/response design that is transport-independent; here, HTTP
is used (as a transport protocol rather than an application protocol).

👉 Request the MCP resource at <http://localhost:4004/mcp/catalog>, whereupon
you'll see something like this:

```json
{
  "jsonrpc": "2.0",
  "error": {
    "code": -32000,
    "message": "Method not allowed."
  },
  "id": null
}
```

Much of the protocol is done via HTTP POST requests, hence this error, but at
least we can see some sort of response, which is all we need to see for now.

Examining the protocol at the JSON-RPC level is best done with a specialized
inspector, which is beyond the scope of this tutorial.

### Start OpenCode and examine what is displayed

👉 While the CAP server is still running in one shell window, open another
shell window and launch OpenCode:

```shell
opencode
```

Note that because of the autowiring, OpenCode knows about the MCP server that
you now have running as part of the CAP server - you can see this in the status
bar where something similar to this will be displayed:

```text
1 MCP /status
```

👉 Use the `/status` command to see a bit more information, which should appear
like this:

```text
Status

1 MCP Servers
• cds:CatalogService Connected
```

👉 In addition, take a look at the log output from the CAP server, where you
should see something like this:

```log
[mcp] - Registered tool { tool: 'describe', service: 'CatalogService' }
[mcp] - Registered generic tool { tool: 'query', service: 'CatalogService' }
```

Based on an initial request by the MCP client built into OpenCode, the MCP
server has replied with information on two key facilities relating to the
`CatalogService` service: `describe` and `query`.

### Try out a query

Now that OpenCode is connected to the MCP server that is providing a unified
layer to the `CatalogService` service with its `Books` entity, it's time to try
something out.

👉 Enter this question:

```text
what books are authored by Edgar Allen Poe?
```

👉 Observe what is logged in the MCP component of the CAP server:

```log
[mcp] - describe { service: 'CatalogService', entities: [ 'Books' ] }
...
[mcp] - query {
  service: 'CatalogService',
  cql: "SELECT title from Books where author = 'Edgar Allen Poe'"
}
```

What has happened is that the MCP client component of OpenCode has:

- `describe`: requested a detailed description of the service and entity
- `query`: sent a query written in CQL to the MCP server, which has facilitated
  a compilation and execution of that query with the CAP service and returned
  the result

This flow is shown in OpenCode, as well as the response:

```text
+ Thought: 564ms
The user is asking about books authored by Edgar Allen Poe.
Let me use the CatalogService to query for this.
First, let me describe the data model.

* cds_CatalogService_describe 
* cds_CatalogService_query
  [cql=SELECT title from Books where author = 'Edgar Allen Poe']

- The Raven
- Eleonora
```

Here's a screenshot of what it might look like:

![VS Code screenshot showing the CAP server log output, the CDS model, and
OpenCode](vs-code-screenshot.png)

You've just wired up your first combination of CAP service, MCP adapter
(server) and MCP client, and put it to use. Well done!

### Wrap-up and further info

- The Capire topic [Model Context Protocol
  Adapter](https://cap.cloud.sap/docs/guides/protocols/mcp) is definitely worth
  digging into
- An overview of the [Monad](https://wiki.haskell.org/Monad) on the Haskell
  Wiki
- The [cds add](https://cap.cloud.sap/docs/tools/cds-cli#cds-add) section of
  Capire has an overview of the facets available
- Learn about how the CDS plugin mechanism works in the three part series [CAP
  Nodejs
  plugins](https://qmacro.org/blog/posts/2024/12/30/cap-node-js-plugins/)
- More on [JSON-RPC](https://en.wikipedia.org/wiki/JSON-RPC)
- There's a section on [Autowired MCP
  Clients](https://cap.cloud.sap/docs/guides/protocols/mcp#autowired-mcp-clients)
  in Capire

To answer the question, you may wish to refer to [how Basic Authentication
details are
encoded](https://en.wikipedia.org/wiki/Basic_access_authentication), and to
keep in mind the [pre-defined mock
users](https://cap.cloud.sap/docs/node.js/authentication#mock-users) that exist
for the default authentication strategy (which is `mocked`) when running
non-productively.
