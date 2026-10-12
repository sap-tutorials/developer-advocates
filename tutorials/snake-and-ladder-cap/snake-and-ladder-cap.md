---
parser: v2
author_name: Ajay Soreng
author_profile: https://github.com/ajaysoreng
auto_validation: true
primary_tag: software-product-function>sap-cloud-application-programming-model
tags: [ software-product>sap-business-technology-platform, topic>cloud, tutorial>intermediate ]
time: 60
---

# Create a Snake & Ladder game using SAP Cloud Application Programming Model

<!-- description --> Build a fully functional multiplayer Snake & Ladder game as a CAP Node.js service, powered by CAP Status Flows (`@flow.status`) for automatic state machine validation and transitions — no custom validation code required.

## You will learn

- How `@flow.status` turns a CDS entity into a state machine
- How `@from` and `@to` annotations enforce valid state transitions (HTTP 409 on violation)
- How `$flow.previous` restores a prior state without storing it yourself
- How to implement multiplayer turn rotation with CAP in-process events
- How to expose CAP actions as MCP tools for AI-driven gameplay

## Prerequisites

- Node.js 22 or later ([download](https://nodejs.org))
- VS Code ([download](https://code.visualstudio.com))
- SAP CDS Language Support extension ([`sapse.vscode-cds`](https://marketplace.visualstudio.com/items?itemName=sapse.vscode-cds)) installed in VS Code

## Intro

Snake & Ladder is a perfect model for a state machine: every player position is a **state**, and every move, snake bite, and ladder climb is a **transition**. CAP's `@flow.status` feature maps directly to this model.

In this tutorial you build the complete backend engine for a multiplayer Snake & Ladder game — a real CAP Node.js service with entities, status flows, event-driven turn rotation, and an AI-accessible MCP server. The game uses a classic 10×10 board with 9 ladders, 3 single-headed snakes, and 3 double-headed snakes (where two head squares share one tail).

By the end you will have:

- A running CAP service at `http://localhost:4004`
- A multiplayer game engine enforcing turn order and state transitions automatically
- A board UI you can open in a browser and play
- An MCP server that lets an AI assistant roll dice and narrate turns

### Set up the development environment

Make sure you have the three prerequisites above installed. Then install the CAP development toolkit globally:

```shell
npm install -g @sap/cds-dk
```

Verify the installation:

```shell
cds v
```

You should see `@sap/cds-dk` at 10.x. Now initialise your CAP project:

```shell
cds init snake-ladder --nodejs
cd snake-ladder
```

> **Remove `"type": "module"` before continuing.** `cds init --nodejs` adds `"type": "module"` to `package.json`, which switches Node.js to ES module mode. The handlers in this tutorial use CommonJS `require()` — if you skip this step the server crashes at startup with `require is not defined in ES module scope`. Open `package.json`, delete the `"type": "module"` line, and save the file *now*, before running `npm install`.

```shell
npm install
npm install @sap/cds@latest @cap-js/sqlite@latest
```

Open the `snake-ladder` folder in VS Code:

```shell
code .
```

Your project structure should look like this (the generator also adds `app/`, `.vscode/`, `.gitignore`, and `readme.md` — you can ignore those):

```text
snake-ladder/
  app/
  db/
  srv/
  package.json
```

### Model the board entities

Create `db/schema.cds` with the CDS data model. The centrepiece is the `TurnStatus` enum — a five-state machine that controls what each player can do on their turn.

```cds
namespace snakeladder;

// ── Status enum — the heart of the state machine ─────────────────────────
type TurnStatus : String enum {
  Waiting;    // Sitting out — waiting for the current player to finish
  Playing;    // Active turn — roll the dice!
  Moving;     // Dice rolled, token moving — confirm or handle special square
  Blocked;    // Hit a double-headed snake — skip next turn
  Finished;   // Reached square 100 and won
}

// ── Board square — pre-loaded with snake/ladder destinations ──────────────
entity BoardSquares {
  key square      : Integer;        // 1–100
      snakeTo     : Integer;        // 0 if no snake on this square
      ladderTo    : Integer;        // 0 if no ladder on this square
      isDoubleHead: Boolean default false;  // true = double-headed snake mouth
}

// ── Game session ──────────────────────────────────────────────────────────
entity GameSessions {
  key ID          : UUID;
      name        : String(100);
      @cds.on.insert: $now
      createdAt   : Timestamp;
      startedAt   : Timestamp;
      finishedAt  : Timestamp;
      winner      : Association to Players;
}

// ── Player — one row per player per session ───────────────────────────────
entity Players {
  key ID            : UUID;
      session       : Association to GameSessions;
      name          : String(100);
      position      : Integer default 1;      // current square (1–100)
      turnStatus    : TurnStatus default #Waiting;
      turnOrder     : Integer;                // 1 = goes first
      lastRoll      : Integer;                // last dice result
      prevPosition  : Integer default 1;      // position before last roll
      lastEventType : String(20);             // normal | ladder | snake | doubleSnake
}
```

> **Why `@flow.status` is declared in the service, not the schema:** `@flow.status` is a service-layer concern — it controls which HTTP actions are allowed based on current status. The db schema just stores the field. The annotation goes on the service projection in the next step.

> **Field naming convention:** In CDS, entity names are PascalCase (`Players`, `GameSessions`) and element names are camelCase (`turnStatus`, `turnOrder`). Notice `turnStatus` is camelCase even though its type `TurnStatus` is PascalCase.

### Define the service and bound actions

Create `srv/game-service.cds`. The `@flow.status` annotation goes on the **service projection** — this is where CAP intercepts HTTP requests and enforces state transitions.

```cds
using { snakeladder } from '../db/schema';

service GameService {

  entity GameSessions as projection on snakeladder.GameSessions;

  @flow.status: turnStatus
  @cds.redirection.target          // canonical projection of Players — see the MCP step
  entity Players as projection on snakeladder.Players {
    *,
    @readonly position,
    @readonly turnStatus
  }
  actions {

    // ── Waiting → Playing ──────────────────────────────────────────────────
    @from: [ #Waiting ]
    @to: #Playing
    action startTurn();

    // ── Playing → Moving ───────────────────────────────────────────────────
    @from: [ #Playing ]
    @to: #Moving
    action rollDice() returns { roll: Integer; position: Integer; event: String; };

    // ── Moving → Waiting ───────────────────────────────────────────────────
    @from: [ #Moving ]
    @to: #Waiting
    action confirmMove();

    // ── Moving → Blocked (double-headed snake) ─────────────────────────────
    @from: [ #Moving ]
    @to: #Blocked
    action blockPlayer();

    // ── Blocked → previous state ───────────────────────────────────────────
    @from: [ #Blocked ]
    @to: $flow.previous
    action unblockPlayer();

    // ── Moving → Finished ──────────────────────────────────────────────────
    @from: [ #Moving ]
    @to: #Finished
    action winGame();
  }

  entity BoardSquares as projection on snakeladder.BoardSquares;

  // ── Domain events ─────────────────────────────────────────────────────────
  event BoardEvent {
    playerID : UUID;
    type     : String;    // 'ladder' | 'snake' | 'doubleSnake'
    ![from]  : Integer;   // 'from' is a CDS reserved word — escape with ![]
    ![to]    : Integer;
  }

  event GameWon {
    playerID  : UUID;
    sessionID : UUID;
  }
}
```

**What CAP does automatically with `@from` / `@to`:**

Before your handler runs, CAP checks the player's current `turnStatus` against the `@from` list. If the status does not match, it returns:

```http
HTTP/1.1 409 Conflict
{
  "error": {
    "code": "INVALID_FLOW_TRANSITION_SINGLE",
    "message": "Action \"rollDice\" requires \"turnStatus\" to be \"[\"Playing\"]\"."
  }
}
```

No custom validation code. No `if (status !== 'Playing') throw ...`. The annotation enforces it.

After your handler returns without throwing, CAP automatically updates `turnStatus` to the `@to` value.

> **`$flow.previous`** is a special target used by `unblockPlayer`. Instead of a fixed state, it restores whatever state the player was in *before* they transitioned to `#Blocked`. CAP tracks this in the background — you don't need a `previousStatus` field.

> **`@readonly` on service projection:** Placing `@readonly` here means OData/REST clients cannot directly PATCH `position` or `turnStatus`. They can only change these values by calling the proper bound actions. Your handler code (using `UPDATE`) is not affected — `@readonly` only applies to inbound HTTP writes.

### Load the board data

Create `db/data/snakeladder-GameSessions.csv`:

```csv
ID,name,createdAt,startedAt,finishedAt,winner_ID
a1b2c3d4-0001-0000-0000-000000000000,Demo Game,,,
```

Create `db/data/snakeladder-BoardSquares.csv` with all 100 squares. The board has 9 ladders, 3 single-headed snakes, and 3 double-headed snakes. Double-headed snake heads have `isDoubleHead: true` — two head squares share one tail:

```csv
square,snakeTo,ladderTo,isDoubleHead
1,0,0,false
2,0,38,false
3,0,0,false
4,0,0,false
5,0,0,false
6,0,0,false
7,0,0,false
8,0,31,false
9,0,0,false
10,0,0,false
11,0,0,false
12,0,0,false
13,0,0,false
14,0,0,false
15,0,26,false
16,0,0,false
17,0,0,false
18,0,0,false
19,0,0,false
20,0,0,false
21,0,42,false
22,0,0,false
23,0,0,false
24,0,0,false
25,0,0,false
26,0,0,false
27,0,0,false
28,0,84,false
29,0,0,false
30,0,0,false
31,0,0,false
32,0,0,false
33,0,0,false
34,0,0,false
35,0,0,false
36,0,44,false
37,0,0,false
38,0,0,false
39,0,0,false
40,3,0,true
41,0,0,false
42,0,0,false
43,18,0,false
44,0,0,false
45,0,0,false
46,0,0,false
47,3,0,true
48,0,0,false
49,0,0,false
50,0,0,false
51,0,67,false
52,0,0,false
53,0,0,false
54,34,0,true
55,0,0,false
56,0,0,false
57,0,0,false
58,0,0,false
59,0,0,false
60,0,0,false
61,0,0,false
62,0,0,false
63,34,0,true
64,0,0,false
65,0,0,false
66,0,0,false
67,0,0,false
68,0,0,false
69,0,0,false
70,0,0,false
71,0,91,false
72,50,0,true
73,0,0,false
74,0,0,false
75,0,0,false
76,20,0,false
77,0,0,false
78,0,98,false
79,0,0,false
80,0,0,false
81,0,0,false
82,0,0,false
83,0,0,false
84,0,0,false
85,0,0,false
86,0,0,false
87,0,0,false
88,0,0,false
89,50,0,true
90,0,0,false
91,0,0,false
92,0,0,false
93,0,0,false
94,0,0,false
95,0,0,false
96,0,0,false
97,0,0,false
98,0,0,false
99,7,0,false
100,0,0,false
```

> **Double-headed snake pairs:** Squares 40+47 → tail 3; squares 54+63 → tail 34; squares 72+89 → tail 50. Landing on either head sends you to the shared tail.

Now start the service:

```shell
cds watch
```

You should see: `serving GameService { at: '/odata/v4/game' }`.

> **Service path:** CAP derives the OData path from the service name. `GameService` maps to `/odata/v4/game` (lowercase, "Service" suffix stripped). Use this path for all OData requests.

Open `http://localhost:4004` and verify `GameService` appears with `GameSessions`, `Players`, and `BoardSquares` endpoints.

Test that the board data loaded correctly:

```
GET http://localhost:4004/odata/v4/game/BoardSquares?$filter=snakeTo gt 0
```

You should receive exactly 9 rows — the 9 snake-head squares (3 single-headed + 6 double-headed).

### Generate HTTP request files to test your endpoints

Typing OData URLs by hand gets tedious — especially `POST` requests with a full JSON body. CAP can generate a ready-to-run request file for your service with a single command:

```shell
cds add http
```

This creates `test/http/GameService.http` with one request per **entity** (`GET`, `POST`, `PATCH`, `DELETE`), pre-filled with sample values, plus a request for each **unbound** action or function. The file uses the [REST Client](https://marketplace.visualstudio.com/items?itemName=humao.rest-client) format (abridged excerpt):

```http
@server=http://localhost:4004
@username=alice
@password=

# @name BoardSquares_GET
GET {{server}}/odata/v4/game/BoardSquares
Authorization: Basic {{username}}:{{password}}

# @name Players_POST
POST {{server}}/odata/v4/game/Players
Content-Type: application/json
Authorization: Basic {{username}}:{{password}}

{
  "name": "sample",
  "turnOrder": 1
}
```

> Each request in the real file is separated by a `###` line followed by a `# @name` label — that is the REST Client request-separator syntax, not a tutorial heading.

> **Bound actions are not generated.** `cds add http` only writes requests for entities and *unbound* actions. Every action in this game — `startTurn`, `rollDice`, `confirmMove`, `blockPlayer`, `unblockPlayer` — is *bound* to an entity, so none of them appear in the file. You call a bound action with a `POST` to the entity's key path. Create a player with the generated `Players_POST` request first, then add a request like this to the file yourself (paste in the `ID` the create returned):
>
> ```http
> # @name rollDice
> POST {{server}}/odata/v4/game/Players(ID=<paste-a-player-id>)/rollDice
> Content-Type: application/json
> Authorization: Basic {{username}}:{{password}}
>
> {}
> ```

> **Install the REST Client extension** ([`humao.rest-client`](https://marketplace.visualstudio.com/items?itemName=humao.rest-client)) to run these requests directly in VS Code. A **Send Request** link appears above each request — click it to fire the request and see the response in a split pane. The `alice` user with an empty password matches CAP's mocked authentication, so no real credentials are needed.

**Test a sample endpoint:** with `cds watch` running, open `test/http/GameService.http` and click **Send Request** above the `BoardSquares_GET` request. You should get all 100 board squares back — the same result as the manual `GET` above, now one click away.

You will reuse this file throughout the rest of the tutorial: use the generated `GameSessions_POST` and `Players_POST` requests to create a game and its players, and the bound-action template above to drive turns. After adding more entities in later steps, re-run `cds add http` to refresh the file. (Once you add the MCP protocol near the end, the generator also writes a second set of requests under the `/mcp/game` path — ignore those for REST testing and keep using the `/odata/v4/game` requests.)

### Implement the dice roll handler

Create `srv/game-service.js`. This file provides the JavaScript implementation for your CDS-declared actions. Start with just the `rollDice` handler — it contains the core game logic.

```js
const cds = require('@sap/cds')

module.exports = class GameService extends cds.ApplicationService {
  async init() {

    const { Players, BoardSquares, TurnLog } = this.entities // TurnLog used in the multiplayer step

    // ── startTurn ─────────────────────────────────────────────────────────
    // @from: [#Waiting] → @to: #Playing
    // No business logic needed — the @flow.status annotations do all the work.
    this.on('startTurn', 'Players', async (req) => {
      // Intentionally empty.
    })

    // ── rollDice ──────────────────────────────────────────────────────────
    // @from: [#Playing] → @to: #Moving
    this.on('rollDice', 'Players', async (req) => {
      const player = await SELECT.one.from(Players).where({ ID: req.params[0].ID })
      if (!player) return req.reject(404, 'Player not found')

      const roll = Math.ceil(Math.random() * 6)
      const newPosition = player.position + roll

      // Can't overshoot square 100 — must land exactly
      if (newPosition > 100) {
        const needed = 100 - player.position
        return req.reject(409, `Need exactly ${needed} to finish. Rolled ${roll}. No move.`)
      }

      // Resolve snake or ladder on the landing square
      const square = await SELECT.one.from(BoardSquares).where({ square: newPosition })
      let finalPosition = newPosition
      let event = null

      if (square?.ladderTo) {
        finalPosition = square.ladderTo
        event = { type: 'ladder', from: newPosition, to: finalPosition }
      } else if (square?.snakeTo) {
        finalPosition = square.snakeTo
        event = square.isDoubleHead
          ? { type: 'doubleSnake', from: newPosition, to: finalPosition }
          : { type: 'snake', from: newPosition, to: finalPosition }
      }

      // Persist position, last roll, and pre-move state for TurnLog
      await UPDATE(Players)
        .set({
          position: finalPosition,
          lastRoll: roll,
          prevPosition: player.position,
          lastEventType: event?.type ?? 'normal'
        })
        .where({ ID: player.ID })

      // Emit domain event so subscribers can react
      if (event) await this.emit('BoardEvent', { playerID: player.ID, ...event })

      // Use req.reply() — not return — to pin the response before CAP's
      // @flow.status after-handler runs. A plain return gets cleared by the
      // flow machinery, producing HTTP 204 instead of the expected 200 + body.
      req.reply({ roll, position: finalPosition, event: event?.type ?? 'normal' })
    })

    return super.init()
  }
}
```

**Test the state machine:**

Start `cds watch`. Create a player via the Fiori UI at `http://localhost:4004` or with a POST request:

```http
POST http://localhost:4004/odata/v4/game/Players
Content-Type: application/json
{
  "session_ID": "a1b2c3d4-0001-0000-0000-000000000000",
  "name": "Test Player",
  "turnOrder": 1
}
```

Set the player to `Playing`:

```http
POST http://localhost:4004/odata/v4/game/Players(<player-id>)/startTurn
Content-Type: application/json
{}
```

Roll the dice:

```http
POST http://localhost:4004/odata/v4/game/Players(<player-id>)/rollDice
Content-Type: application/json
{}
```

Expected response:

```json
{
  "roll": 4,
  "position": 38,
  "event": "ladder"
}
```

The `position` field is the **final square after any snake or ladder** — so if you rolled onto a ladder, `position` already shows the top of the ladder.

**Prove the 409 rejection:**

Without calling `confirmMove`, call `rollDice` again. CAP returns:

```json
{
  "error": {
    "code": "INVALID_FLOW_TRANSITION_SINGLE",
    "message": "Action \"rollDice\" requires \"turnStatus\" to be \"[\"Playing\"]\"."
  }
}
```

This is the `@from: [#Playing]` annotation at work. Your handler code never ran — CAP rejected the request before it reached you.

### Complete the remaining handlers

Add these handlers to `srv/game-service.js`, **before** the `return super.init()` line. (You will add the `confirmMove` handler later, in the turn-rotation step, once there is more than one player to hand the turn to.)

```js
    // ── blockPlayer ───────────────────────────────────────────────────────
    // @from: [#Moving] → @to: #Blocked
    // Called when a player lands on a double-headed snake head.
    this.on('blockPlayer', 'Players', async (req) => {
      // The position was already set by rollDice.
      // This action just transitions state — CAP handles @to: #Blocked.
      req.info('Player is blocked and will skip their next turn.')
    })

    // ── unblockPlayer ─────────────────────────────────────────────────────
    // @from: [#Blocked] → @to: $flow.previous
    // $flow.previous restores the status before the transition to #Blocked.
    this.on('unblockPlayer', 'Players', async (req) => {
      // CAP's $flow.previous does the work — no code needed here.
    })

    // ── winGame ───────────────────────────────────────────────────────────
    // @from: [#Moving] → @to: #Finished
    this.on('winGame', 'Players', async (req) => {
      const player = await SELECT.one.from(Players).where({ ID: req.params[0].ID })
      if (!player) return req.reject(404, 'Player not found')

      await UPDATE('snakeladder.GameSessions')
        .set({
          finishedAt: new Date().toISOString(),
          winner_ID: player.ID
        })
        .where({ ID: player.session_ID })

      await this.emit('GameWon', { playerID: player.ID, sessionID: player.session_ID })
    })
```

**Test `$flow.previous`:**

Position a player at square 88 (one roll from square 89, a double-headed snake head):

> **Note:** `position` is `@readonly` in the service projection. To set it for testing, temporarily remove `@readonly` from `position` in `srv/game-service.cds` and save — `cds watch` restarts automatically. PATCH the player, then restore `@readonly` and save again (another automatic restart).

```http
PATCH http://localhost:4004/odata/v4/game/Players(<player-id>)
Content-Type: application/json
{ "position": 88 }
```

Start a turn and roll. If you roll 1, you land on square 89 (a double-headed snake head). Your `position` moves to 50. The `event` field in the response is `"doubleSnake"`.

Now call `blockPlayer` — the player's `turnStatus` becomes `"Blocked"`. Call `unblockPlayer` — the status returns to `"Moving"` automatically. That is `$flow.previous` at work: CAP restored the state the player had before the transition to `#Blocked`.

### Add multiplayer and session state

So far, `GameSessions` has no state machine — you can't tell whether a game is waiting for players or in progress. Add a `SessionStatus` enum and a second `@flow.status` annotation.

**Update `db/schema.cds`** — add the `SessionStatus` enum and update `GameSessions`:

```cds
type SessionStatus : String enum {
  Lobby;       // Session created, accepting players
  InProgress;  // Game running — turns are active
  Complete;    // A player has reached square 100
}

entity GameSessions {
  key ID            : UUID;
      name          : String(100);
      @cds.on.insert: $now
      createdAt     : Timestamp;
      startedAt     : Timestamp;
      finishedAt    : Timestamp;
      winner        : Association to Players;
      sessionStatus : SessionStatus default #Lobby;
}
```

**Add `TurnLog` entity** to `db/schema.cds` (records every move):

```cds
entity TurnLog {
  key ID          : UUID;
      session     : Association to GameSessions;
      player      : Association to Players;
      turnNumber  : Integer;
      diceRoll    : Integer;
      fromSquare  : Integer;
      toSquare    : Integer;
      eventType   : String(20);   // normal | ladder | snake | doubleSnake | win | blocked
      timestamp   : Timestamp;
}
```

**Update `srv/game-service.cds`** — replace the plain `GameSessions` projection with a flow-annotated one, and add `TurnLog` and `TurnComplete`:

```cds
@flow.status: sessionStatus
entity GameSessions as projection on snakeladder.GameSessions {
  *,
  @readonly sessionStatus
}
actions {

  @from: [ #Lobby ]
  @to: #InProgress
  action startGame();

  @from: [ #InProgress ]
  @to: #Complete
  action endGame();
}

entity TurnLog as projection on snakeladder.TurnLog;

event TurnComplete {
  sessionID    : UUID;
  playerID     : UUID;
  nextPlayerID : UUID;
  turnNumber   : Integer;
}
```

You now have **two independent state machines** in one service:

| Entity | Field | States | Purpose |
|---|---|---|---|
| `GameSessions` | `sessionStatus` | Lobby → InProgress → Complete | Game lifecycle |
| `Players` | `turnStatus` | Waiting → Playing → Moving → Blocked / Finished | Per-player turn |

### Implement turn rotation

Add the `startGame` and `endGame` handlers, and the full `confirmMove` handler (which drives turn rotation).

**Add to `srv/game-service.js`** (before `return super.init()`):

```js
    // ── startGame ─────────────────────────────────────────────────────────
    // @from: [#Lobby] → @to: #InProgress
    this.on('startGame', 'GameSessions', async (req) => {
      const sessionID = req.params[0].ID

      const players = await SELECT.from(Players)
        .where({ session_ID: sessionID })
        .orderBy('turnOrder')

      if (players.length < 2)
        return req.reject(400, 'A game needs at least 2 players to start.')

      // First player in turn order becomes Playing
      await UPDATE(Players)
        .set({ turnStatus: 'Playing' })
        .where({ ID: players[0].ID })

      await UPDATE('snakeladder.GameSessions')
        .set({ startedAt: new Date().toISOString() })
        .where({ ID: sessionID })
    })

    // ── endGame ───────────────────────────────────────────────────────────
    // @from: [#InProgress] → @to: #Complete
    this.on('endGame', 'GameSessions', async (req) => {
      await UPDATE('snakeladder.GameSessions')
        .set({ finishedAt: new Date().toISOString() })
        .where({ ID: req.params[0].ID })
    })

    // ── confirmMove ───────────────────────────────────────────────────────
    // @from: [#Moving] → @to: #Waiting — advances the turn to the next player
    // @from: [#Moving] → @to: #Waiting
    this.on('confirmMove', 'Players', async (req) => {
      const player = await SELECT.one.from(Players).where({ ID: req.params[0].ID })
      if (!player) return req.reject(404, 'Player not found')

      // Delegate to winGame if player reached square 100
      if (player.position === 100) {
        await this.send({ event: 'winGame', entity: 'Players', params: [{ ID: player.ID }] })
        return
      }

      // Write TurnLog entry
      const [{ n: count }] = await SELECT`count(*) as n`
        .from(TurnLog).where({ session_ID: player.session_ID })
      const turnNumber = (count || 0) + 1

      await INSERT.into(TurnLog).entries({
        ID: cds.utils.uuid(),
        session_ID: player.session_ID,
        player_ID:  player.ID,
        turnNumber,
        diceRoll:   player.lastRoll,
        fromSquare: player.prevPosition,
        toSquare:   player.position,
        eventType:  player.lastEventType ?? 'normal',
        timestamp:  new Date().toISOString()
      })

      // Find next player in turn order, skipping Finished players
      const players = await SELECT.from(Players)
        .where({ session_ID: player.session_ID }).orderBy('turnOrder')

      const idx = players.findIndex(p => p.ID === player.ID)
      let nextIdx = (idx + 1) % players.length
      let guard = 0
      while (players[nextIdx].turnStatus === 'Finished' && guard++ < players.length)
        nextIdx = (nextIdx + 1) % players.length

      const next = players[nextIdx]

      await this.emit('TurnComplete', {
        sessionID:    player.session_ID,
        playerID:     player.ID,
        nextPlayerID: next.ID,
        turnNumber
      })

      // Activate next player directly
      await UPDATE(Players).set({ turnStatus: 'Playing' }).where({ ID: next.ID })
    })
```

> **`this.send()` object form:** When delegating to a bound entity action from inside a handler, always use the object form: `this.send({ event, entity, params })`. The string form `this.send('winGame', {...})` puts `{...}` into `req.data`, not `req.params`, so `req.params[0].ID` in the target handler will be `undefined`.

**Test multiplayer:**

```http
POST http://localhost:4004/odata/v4/game/GameSessions
Content-Type: application/json
{ "name": "My First Multiplayer Game" }
```

```http
POST http://localhost:4004/odata/v4/game/Players
Content-Type: application/json
{ "session_ID": "<session-id>", "name": "Alice", "turnOrder": 1 }
```

```http
POST http://localhost:4004/odata/v4/game/Players
Content-Type: application/json
{ "session_ID": "<session-id>", "name": "Bob", "turnOrder": 2 }
```

```http
POST http://localhost:4004/odata/v4/game/GameSessions(<session-id>)/startGame
Content-Type: application/json
{}
```

Alice should now be `"Playing"`, Bob `"Waiting"`. Roll for Alice and call `confirmMove` — Bob should automatically become `"Playing"`.

### Wire up CAP events

The `TurnComplete` event was emitted by `confirmMove` in the previous step. Add a subscriber that logs the handoff.

Add to `srv/game-service.js` (before `return super.init()`):

```js
    // ── TurnComplete subscriber ───────────────────────────────────────────
    // this.after() on a custom event receives (_results, req).
    // The first argument is undefined (events have no return value).
    // Access the payload via req.data.
    this.after('TurnComplete', async (_results, req) => {
      const { sessionID, nextPlayerID, turnNumber } = req.data
      console.log(`[Turn ${turnNumber}] session=${sessionID} → next player=${nextPlayerID}`)
    })
```

> **CDS 10 event handler signature:** In CDS 10, `this.after()` for custom in-process events receives `(_results, req)` where the first argument is `undefined`. The payload is in `req.data`. Using `{ data }` destructuring as the first argument (a common mistake) will result in `data` being `undefined`.

After saving, `cds watch` auto-restarts. Run a full turn cycle — after `confirmMove` you should see the console log line appear.

### Expose MCP tools

The CAP MCP server exposes your service as tools that any MCP-compatible AI assistant can call — letting the AI roll dice, query board state, and narrate turns.

**Install:**

```shell
npm add @cap-js/mcp
```

**Annotate `srv/game-service.cds`** — add `@mcp` and `@protocol` to the service declaration, add descriptions, and add unbound wrapper functions:

```cds
/**
 * Snake & Ladder Game Service.
 * Players take turns rolling dice across a 10×10 board.
 * Snakes send players back; ladders advance them. First to square 100 wins.
 */
@mcp
@protocol: ['odata-v4', 'mcp']
@title: 'Snake & Ladder Game'
service GameService {
  // ... (keep all existing entity and action definitions unchanged)

  // ── MCP-callable unbound functions ────────────────────────────────────
  /** Start a game session. Requires a Lobby session with ≥ 2 players. */
  function mcpStartGame(sessionID: UUID) returns String;

  /** Roll the dice for the current Playing player. */
  function mcpRollDice(playerID: UUID) returns { roll: Integer; position: Integer; event: String; };

  /** Confirm a move and rotate the turn to the next player. */
  function mcpConfirmMove(playerID: UUID) returns String;

  /** Current board state — all player positions and statuses for a session. */
  function mcpBoardState(sessionID: UUID) returns array of {
    name: String; position: Integer; turnStatus: String; lastRoll: Integer;
  };

  /** All 100 squares with snake and ladder destinations. */
  function mcpBoardMap() returns array of {
    square: Integer; snakeTo: Integer; ladderTo: Integer; isDoubleHead: Boolean;
  };

  /** Live view of all player positions — filterable by session_ID. */
  @readonly
  entity BoardState as select from snakeladder.Players {
    key ID,
    name, position, turnStatus, lastRoll,
    session.ID   as session_ID : UUID,
    session.name as sessionName
  };
}
```

> **`@protocol: ['odata-v4', 'mcp']` is required.** Without it, adding `@mcp` drops the OData endpoint. Always include both protocols.

> **Why `@cds.redirection.target` on `Players`:** `BoardState` is a *second* projection of `snakeladder.Players` in this service. That makes the associations pointing at `Players` (`GameSessions.winner`, `TurnLog.player`) ambiguous — CAP can't tell whether they should redirect to `Players` or `BoardState`. The `@cds.redirection.target` annotation you added to the `Players` projection earlier marks it as the canonical target, resolving the ambiguity. Without it, compilation fails.

**Add unbound function handlers** to `srv/game-service.js` (before `return super.init()`):

```js
    this.on('mcpStartGame', async (req) => {
      await this.send({ event: 'startGame', entity: 'GameSessions', params: [{ ID: req.data.sessionID }] })
      return `Game started for session ${req.data.sessionID}`
    })
    this.on('mcpRollDice', async (req) => {
      return await this.send({ event: 'rollDice', entity: 'Players', params: [{ ID: req.data.playerID }] })
    })
    this.on('mcpConfirmMove', async (req) => {
      await this.send({ event: 'confirmMove', entity: 'Players', params: [{ ID: req.data.playerID }] })
      return `Move confirmed for player ${req.data.playerID}`
    })
    this.on('mcpBoardState', async (req) => {
      return await SELECT.from(Players)
        .where({ session_ID: req.data.sessionID })
        .columns('name', 'position', 'turnStatus', 'lastRoll')
        .orderBy('turnOrder')
    })
    this.on('mcpBoardMap', async () => SELECT.from(BoardSquares).orderBy('square'))
```

**Enable `per_action_tool`** in `package.json` — this gives each MCP function its own callable tool:

```json
{
  "cds": {
    "mcp": { "per_action_tool": true }
  }
}
```

**Restart `cds watch`.** Look for:

```
serving GameService {
  at: [ '/odata/v4/game', '/mcp/game' ],
```

The MCP server is live at `http://localhost:4004/mcp/game`. It exposes 7 tools: `describe`, `query`, `mcpStartGame`, `mcpRollDice`, `mcpConfirmMove`, `mcpBoardState`, `mcpBoardMap`.

**Test with MCP Inspector:**

Run MCP Inspector in a second terminal (while `cds watch` is still running in the first):

```shell
npx @modelcontextprotocol/inspector --server-url http://localhost:4004/mcp/game --transport http
```

MCP Inspector opens at `http://localhost:5173` in your browser, already pointed at your streamable-HTTP endpoint. You should see the **Tools** tab listing all 7 tools.

**Verify each MCP function:**

1. Select `mcpBoardMap` → click **Run** → confirm you receive 100 square entries
2. Select `mcpBoardState`, enter your session ID in the `sessionID` parameter → confirm you see player positions
3. Select `mcpRollDice`, enter a Playing player's ID → confirm you receive `{ roll, position, event }`

> **If MCP Inspector is not available globally:** the `npx` command above downloads and runs it on demand — no global install needed.

> **Prefer the command line?** MCP Inspector also has a CLI mode. Because the endpoint is streamable HTTP, you must pass `--transport http` explicitly (without it the CLI errors with `Transport type not specified`):
>
> ```shell
> npx @modelcontextprotocol/inspector --cli http://localhost:4004/mcp/game --transport http --method tools/list
> ```

### Connect the board UI and verify your implementation

A ready-made board UI (`board.html`), its board image (`board.png`), and a verification script (`verify.js`) are included in this tutorial's files.

**Download the board UI files.** Download these three files (right-click each link and choose **Save Link As…**):

- [board.html](https://raw.githubusercontent.com/sap-tutorials/Tutorials/master/tutorials/snake-and-ladder-cap/board.html) — the single-page board UI
- [board.png](https://raw.githubusercontent.com/sap-tutorials/Tutorials/master/tutorials/snake-and-ladder-cap/board.png) — the pre-rendered board image
- [verify.js](https://raw.githubusercontent.com/sap-tutorials/Tutorials/master/tutorials/snake-and-ladder-cap/verify.js) — the 14-check verification script

**Serve the board UI from CAP to avoid CORS errors.** The board UI runs in the browser and fetches data from `http://localhost:4004`. If you open the HTML file straight from disk (a `file://` URL) — or through a separate preview server such as VS Code's Live Preview — the browser blocks those requests with a **CORS error**, because the page's origin differs from the service's origin. The clean fix is to let CAP serve the UI itself: anything placed in the project's `app/` folder is served at the server root, so the page and the OData service share the same origin and no CORS configuration is needed.

Place `board.html` and `board.png` in the project's `app/` folder, and `verify.js` in the project root:

```shell
cp <download-folder>/board.html app/board.html
cp <download-folder>/board.png  app/board.png
cp <download-folder>/verify.js  .
```

> `board.html` loads `board.png` with a relative path, so both files must sit side by side in `app/`. `verify.js` is a Node.js script you run from the terminal (not served to the browser), so it stays in the project root.

> If you are working remotely, use the VS Code Explorer to drag the downloaded files into place.

> **Wait for the reload before verifying.** Copying files into the project triggers `cds watch` to restart, and because the database runs in-memory that restart resets all data. Watch the terminal until you see `server listening on ...` again before running the board UI or the script below — if you run `verify.js` while the server is still restarting, a check can fail with `fetch failed` even though your code is correct. If that happens, just run it again once the server has settled.

**Run the board UI:**

With `cds watch` still running, open <http://localhost:4004/board.html> in a browser. Because CAP serves the page from the same origin as the OData service, it connects without any CORS errors. The **OData Service Root** field is already filled with `http://localhost:4004/odata/v4/game` — click **Connect**, then **+ New Game** to create a session, add two players, and start the game. You should see your player tokens on the board.

**Run the verification script:**

```shell
node verify.js http://localhost:4004/odata/v4/game
```

The script runs 14 automated checks against your service:

| Check | What it validates |
|---|---|
| 1 | Service reachable (`GET /$metadata` returns 200) |
| 2 | BoardSquares loaded (exactly 100 rows) |
| 3 | Snake squares present (at least one `snakeTo > 0`) |
| 4 | Ladder squares present (at least one `ladderTo > 0`) |
| 5 | Double-headed snake squares (at least 6 `isDoubleHead: true`) |
| 6 | Create GameSession (`POST /GameSessions` returns 201) |
| 7 | Create Player 1 |
| 8 | Create Player 2 |
| 9 | `startGame` works (`sessionStatus: InProgress`) |
| 10 | First player is Playing after `startGame` |
| 11 | Wrong-state rejection (`rollDice` on `#Waiting` player returns HTTP 409) |
| 12 | `rollDice` works (returns `roll` 1–6, status → Moving) |
| 13 | Turn rotation (`confirmMove` makes Player 2 `Playing`) |
| 14 | `$flow.previous` (`blockPlayer` → `#Blocked`; `unblockPlayer` → previous status) |

All 14 checks must pass. If any fail, the script prints which check failed and what was expected vs. received.

### Test your knowledge — where the state machine lives

Your service is complete and verified. The remaining steps check your understanding of the CAP status-flow concepts you used along the way. Start with where a state machine is declared.

In the service, `@flow.status: turnStatus` is placed on the `Players` projection, while `@flow.status: sessionStatus` is placed on `GameSessions` — each entity carries its own.

### Test your knowledge — the `@from` guard

Every bound action lists the states it may run from, e.g. `@from: [ #Moving ]` on `confirmMove`. CAP checks the current status against that list before your handler code runs.

### Test your knowledge — rejected transitions

You called `rollDice` twice in a row (without `confirmMove` between them). The second call was rejected automatically, because the player was no longer in the `#Playing` state that `rollDice` requires.

### Test your knowledge — automatic `@to` updates

Notice that your `startTurn` handler is intentionally empty, and your `rollDice` handler never assigns `turnStatus` — yet the status still advances after each call.

### Test your knowledge — `$flow.previous`

`unblockPlayer` is annotated `@to: $flow.previous`. After `blockPlayer` moves a player to `#Blocked`, `unblockPlayer` restores the earlier status.

### Test your knowledge — two independent state machines

Your service runs two state machines at once: `Players.turnStatus` (`Waiting → Playing → Moving → Blocked / Finished`) and `GameSessions.sessionStatus` (`Lobby → InProgress → Complete`). They advance independently.

### Test your knowledge — `@readonly` and bound actions

On the `Players` projection, both `position` and `turnStatus` are annotated `@readonly`.

### Test your knowledge — the verify script

The `verify.js` script runs 14 automated checks against your service. One of them proves that CAP rejects an action called from the wrong state.

### Keep playing and learning

You now have a complete, verified Snake & Ladder engine built on CAP Status Flows. Here are two ways to take it further.

**Play the SAP Community Devtoberfest 2026 game.** Based on the framework and implementation you just finished in the Devtoberfest Snake & Ladder game with just some more features. Play with SAP Developer Advocate bots or invite a friend in the community and play remotely — scan the QR code or open [https://url.sap/metpgf](https://url.sap/metpgf).

![Devtoberfest Snake & Ladder game QR code](devtoberfest-game-qr.png)

**Try the July Developer Challenge.** This tutorial grew out of the **July 2026 SAP Developer Challenge — Snake & Ladder with SAP CAP Status Transition**, where participants drove the same game with Claude Code and other MCP clients. Read the challenge write-up and give it a go: [July Developer Challenge: Snake & Ladder with SAP CAP Status Transition](https://community.sap.com/t5/sap-cap-blog-posts/july-developer-challenge-snake-amp-ladder-with-sap-cap-status-transition/ba-p/14429486).
