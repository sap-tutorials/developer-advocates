#!/usr/bin/env node
/**
 * Snake & Ladder Developer Challenge — Verify Service
 *
 * Usage:
 *   node verify.js <service-url>
 *
 * The service URL is your CAP OData v4 root, e.g.:
 *   node verify.js http://localhost:4004/odata/v4/game
 *   node verify.js https://my-app.cfapps.eu10.hana.ondemand.com/odata/v4/game
 *
 * The script creates a clean game session, walks through every status-flow
 * transition, and reports pass/fail for each check.
 */

const BASE = process.argv[2];
if (!BASE) {
  console.error('Usage: node verify.js <service-url>');
  process.exit(1);
}

const root = BASE.replace(/\/+$/, '');
let passed = 0, total = 0;
const results = [];

async function odata(path, opts = {}) {
  const url = root + path;
  const res = await fetch(url, {
    headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
    ...opts,
  });
  const text = await res.text();
  let body;
  try { body = JSON.parse(text); } catch { body = text; }
  return { status: res.status, body };
}

function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

const TOTAL_CHECKS = 14; // update if checks are added/removed

async function check(label, tag, fn) {
  total++;
  const n = String(total).padStart(2, '0');
  const d = String(TOTAL_CHECKS).padStart(2, '0');
  try {
    await fn();
    passed++;
    results.push({ ok: true, label, tag });
    console.log(`  ✓  ${n}/${d} ${label}`);
  } catch (e) {
    results.push({ ok: false, label, tag, err: e.message });
    console.log(`  ✕  ${n}/${d} ${label}`);
    console.log(`       ${e.message}`);
  }
}

async function run() {
  console.log(`\n🐍 Snake & Ladder Verify Service`);
  console.log(`   Target: ${root}\n`);

  // ── Check 1: Service reachable ────────────────────────────────────────────
  await check('Service reachable', 'metadata', async () => {
    const { status } = await odata('/$metadata');
    if (status !== 200) throw new Error(`Expected 200, got ${status}`);
  });

  // ── Check 2: BoardSquares loaded ──────────────────────────────────────────
  await check('BoardSquares entity has 100 squares', 'schema', async () => {
    const { status, body } = await odata('/BoardSquares?$count=true');
    if (status !== 200) throw new Error(`Expected 200, got ${status}`);
    const count = body['@odata.count'] ?? (body.value || []).length;
    if (count < 100) throw new Error(`Expected 100 squares, got ${count}`);
  });

  // ── Check 3: Snakes present ───────────────────────────────────────────────
  await check('Snake squares present', 'logic', async () => {
    const { status, body } = await odata('/BoardSquares?$filter=snakeTo gt 0');
    if (status !== 200) throw new Error(`Expected 200, got ${status}`);
    if (!(body.value || []).length) throw new Error('No snake squares found');
  });

  // ── Check 4: Ladders present ──────────────────────────────────────────────
  await check('Ladder squares present', 'logic', async () => {
    const { status, body } = await odata('/BoardSquares?$filter=ladderTo gt 0');
    if (status !== 200) throw new Error(`Expected 200, got ${status}`);
    if (!(body.value || []).length) throw new Error('No ladder squares found');
  });

  // ── Check 5: Double-headed snake squares ──────────────────────────────────
  await check('Double-headed snake squares present', 'schema', async () => {
    const { status, body } = await odata('/BoardSquares?$filter=isDoubleHead eq true');
    if (status !== 200) throw new Error(`Expected 200, got ${status}`);
    if ((body.value || []).length < 6) throw new Error('Expected at least 6 double-head squares (3 pairs)');
  });

  // ── Set up test session ───────────────────────────────────────────────────
  const sessionID = uuid();
  const player1ID = uuid();
  const player2ID = uuid();

  await check('Create GameSession', 'entity', async () => {
    const { status } = await odata('/GameSessions', {
      method: 'POST',
      body: JSON.stringify({ ID: sessionID, name: 'Verify Session' }),
    });
    if (status !== 201) throw new Error(`Expected 201, got ${status}`);
  });

  await check('Create Player 1', 'entity', async () => {
    const { status } = await odata('/Players', {
      method: 'POST',
      body: JSON.stringify({ ID: player1ID, session_ID: sessionID, name: 'Verify_Alice', turnOrder: 1 }),
    });
    if (status !== 201) throw new Error(`Expected 201, got ${status}`);
  });

  await check('Create Player 2', 'entity', async () => {
    const { status } = await odata('/Players', {
      method: 'POST',
      body: JSON.stringify({ ID: player2ID, session_ID: sessionID, name: 'Verify_Bob', turnOrder: 2 }),
    });
    if (status !== 201) throw new Error(`Expected 201, got ${status}`);
  });

  // ── Check 8: startGame ────────────────────────────────────────────────────
  await check('startGame → SessionStatus: InProgress', '@to: #InProgress', async () => {
    const { status } = await odata(`/GameSessions(ID=${sessionID})/startGame`, {
      method: 'POST', body: '{}',
    });
    if (status !== 200 && status !== 204) throw new Error(`Expected 200/204, got ${status}`);
    const { body } = await odata(`/GameSessions(ID=${sessionID})`);
    if (body.sessionStatus !== 'InProgress') throw new Error(`Expected InProgress, got ${body.sessionStatus}`);
  });

  // ── Check 9: First player is Playing ─────────────────────────────────────
  await check('After startGame: first player is Playing', '@flow.status', async () => {
    const { body } = await odata(`/Players(ID=${player1ID})`);
    if (body.turnStatus !== 'Playing') throw new Error(`Expected Playing, got ${body.turnStatus}`);
  });

  // ── Check 10: 409 on wrong state ──────────────────────────────────────────
  await check('rollDice on Waiting player returns 409', '@from check', async () => {
    const { status } = await odata(`/Players(ID=${player2ID})/rollDice`, {
      method: 'POST', body: '{}',
    });
    if (status !== 409) throw new Error(`Expected 409, got ${status}`);
  });

  // ── Check 11: rollDice works ──────────────────────────────────────────────
  await check('rollDice → TurnStatus: Moving, returns integer', '@to: #Moving', async () => {
    const { status, body } = await odata(`/Players(ID=${player1ID})/rollDice`, {
      method: 'POST', body: '{}',
    });
    if (status !== 200) throw new Error(`Expected 200, got ${status}`);
    if (typeof body.roll !== 'number' || body.roll < 1 || body.roll > 6)
      throw new Error(`Expected dice 1-6 in 'roll' field, got ${JSON.stringify(body)}`);
    const { body: p } = await odata(`/Players(ID=${player1ID})`);
    if (p.turnStatus !== 'Moving') throw new Error(`Expected Moving, got ${p.turnStatus}`);
  });

  // ── Check 12: Turn rotation ───────────────────────────────────────────────
  await check('confirmMove → turn rotates to Player 2', 'events', async () => {
    const { status } = await odata(`/Players(ID=${player1ID})/confirmMove`, {
      method: 'POST', body: '{}',
    });
    if (status !== 200 && status !== 204) throw new Error(`Expected 200/204, got ${status}`);
    const { body: p2 } = await odata(`/Players(ID=${player2ID})`);
    if (p2.turnStatus !== 'Playing') throw new Error(`Expected Player 2 Playing, got ${p2.turnStatus}`);
  });

  // ── Check 13: $flow.previous (block/unblock) ──────────────────────────────
  await check('blockPlayer → Blocked; unblockPlayer → $flow.previous', '$flow.previous', async () => {
    // Get p2 into Moving state
    await odata(`/Players(ID=${player2ID})/rollDice`, { method:'POST', body:'{}' });
    const { status: bs } = await odata(`/Players(ID=${player2ID})/blockPlayer`, { method:'POST', body:'{}' });
    if (bs !== 200 && bs !== 204) throw new Error(`blockPlayer returned ${bs}`);
    const { body: blocked } = await odata(`/Players(ID=${player2ID})`);
    if (blocked.turnStatus !== 'Blocked') throw new Error(`Expected Blocked, got ${blocked.turnStatus}`);
    // Unblock
    const { status: us } = await odata(`/Players(ID=${player2ID})/unblockPlayer`, { method:'POST', body:'{}' });
    if (us !== 200 && us !== 204) throw new Error(`unblockPlayer returned ${us}`);
    const { body: restored } = await odata(`/Players(ID=${player2ID})`);
    if (restored.turnStatus === 'Blocked') throw new Error('Status still Blocked after unblockPlayer');
  });

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log(`\n${'─'.repeat(50)}`);
  if (passed === total) {
    console.log(`\n  All ${total} checks passed. 🏆 Your Snake & Ladder service is working correctly!\n`);
  } else {
    console.log(`\n  ${passed}/${total} checks passed.\n`);
    console.log('  Fix the failing checks and run again.\n');
    process.exit(1);
  }
}

run().catch(e => { console.error(e); process.exit(1); });
