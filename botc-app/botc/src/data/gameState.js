import { ROLES } from './roles.js';

// ─── State shape ────────────────────────────────────────────────────────────
const DEFAULT_STATE = {
  gameId: null,
  phase: 'setup',        // setup | firstNight | day | night | ended
  day: 0,
  players: [],           // { id, name, roleId, alive, drunk, poisoned, protected, nominated, voted }
  script: [],            // array of roleIds in use
  log: [],               // { time, text, type }
  nightOrder: [],        // computed
  nightStep: 0,
  winner: null,          // 'good' | 'evil'
};

let _state = { ...DEFAULT_STATE };
let _listeners = [];

// ─── Subscribe / notify ──────────────────────────────────────────────────────
export function subscribe(fn) {
  _listeners.push(fn);
  return () => { _listeners = _listeners.filter(l => l !== fn); };
}

function notify() {
  _listeners.forEach(fn => fn({ ..._state }));
  persist();
}

// ─── Persist to localStorage ─────────────────────────────────────────────────
function persist() {
  try {
    localStorage.setItem('botc_state', JSON.stringify(_state));
  } catch {}
}

export function loadPersistedState() {
  try {
    const raw = localStorage.getItem('botc_state');
    if (raw) {
      _state = { ...DEFAULT_STATE, ...JSON.parse(raw) };
      notify();
    }
  } catch {}
}

// ─── Getters ─────────────────────────────────────────────────────────────────
export function getState() { return { ..._state }; }
export function getPlayers() { return [..._state.players]; }
export function getLivePlayers() { return _state.players.filter(p => p.alive); }
export function getDeadPlayers() { return _state.players.filter(p => !p.alive); }

// ─── Setup actions ────────────────────────────────────────────────────────────
export function newGame() {
  const id = Math.random().toString(36).substr(2, 8).toUpperCase();
  _state = { ...DEFAULT_STATE, gameId: id };
  addLog('Nueva partida iniciada.', 'system');
  notify();
  return id;
}

export function setScript(roleIds) {
  _state.script = roleIds;
  notify();
}

export function setPlayers(names) {
  _state.players = names.map((name, i) => ({
    id: `p${i}`,
    name,
    roleId: null,
    alive: true,
    drunk: false,
    poisoned: false,
    protected: false,
    nominated: false,
    voted: false,
    ghost_votes: 1,
  }));
  notify();
}

export function assignRole(playerId, roleId) {
  _state.players = _state.players.map(p =>
    p.id === playerId ? { ...p, roleId } : p
  );
  notify();
}

export function shuffleRoles() {
  const available = [..._state.script];
  const players = [..._state.players];
  // Fisher-Yates
  for (let i = available.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [available[i], available[j]] = [available[j], available[i]];
  }
  _state.players = players.map((p, i) => ({
    ...p,
    roleId: available[i] || null
  }));
  addLog('Roles asignados aleatoriamente.', 'system');
  notify();
}

// ─── Phase control ─────────────────────────────────────────────────────────
export function startGame() {
  _state.phase = 'firstNight';
  _state.day = 0;
  _state.nightStep = 0;
  _state.nightOrder = computeNightOrder('first');
  addLog('¡La partida comienza! Primera noche.', 'phase');
  notify();
}

export function advanceNightStep() {
  if (_state.nightStep < _state.nightOrder.length - 1) {
    _state.nightStep++;
    notify();
  }
}

export function prevNightStep() {
  if (_state.nightStep > 0) {
    _state.nightStep--;
    notify();
  }
}

export function startDay() {
  _state.phase = 'day';
  _state.day++;
  // Reset daily flags
  _state.players = _state.players.map(p => ({ ...p, nominated: false, voted: false, protected: false }));
  addLog(`☀️ Día ${_state.day} comienza.`, 'phase');
  notify();
}

export function startNight() {
  _state.phase = 'night';
  _state.nightStep = 0;
  _state.nightOrder = computeNightOrder('other');
  addLog(`🌙 Noche ${_state.day + 1} comienza.`, 'phase');
  notify();
}

export function endGame(winner) {
  _state.phase = 'ended';
  _state.winner = winner;
  addLog(`🏆 ¡${winner === 'good' ? 'El Bien' : 'El Mal'} gana!`, 'result');
  notify();
}

// ─── Player actions ──────────────────────────────────────────────────────────
export function killPlayer(playerId, reason = '') {
  const p = _state.players.find(p => p.id === playerId);
  if (!p) return;
  _state.players = _state.players.map(pl =>
    pl.id === playerId ? { ...pl, alive: false } : pl
  );
  addLog(`💀 ${p.name} ha muerto${reason ? ' — ' + reason : ''}.`, 'death');
  notify();
}

export function revivePlayer(playerId) {
  const p = _state.players.find(p => p.id === playerId);
  if (!p) return;
  _state.players = _state.players.map(pl =>
    pl.id === playerId ? { ...pl, alive: true } : pl
  );
  addLog(`✨ ${p.name} ha revivido.`, 'event');
  notify();
}

export function toggleDrunk(playerId) {
  const p = _state.players.find(p => p.id === playerId);
  if (!p) return;
  _state.players = _state.players.map(pl =>
    pl.id === playerId ? { ...pl, drunk: !pl.drunk } : pl
  );
  addLog(`🍺 ${p.name} ${p.drunk ? 'ya no está' : 'está'} borracho/a.`, 'event');
  notify();
}

export function togglePoisoned(playerId) {
  const p = _state.players.find(p => p.id === playerId);
  if (!p) return;
  _state.players = _state.players.map(pl =>
    pl.id === playerId ? { ...pl, poisoned: !pl.poisoned } : pl
  );
  addLog(`☠️ ${p.name} ${p.poisoned ? 'ya no está' : 'está'} envenenado/a.`, 'event');
  notify();
}

export function toggleProtected(playerId) {
  _state.players = _state.players.map(pl =>
    pl.id === playerId ? { ...pl, protected: !pl.protected } : pl
  );
  notify();
}

export function nominatePlayer(playerId) {
  _state.players = _state.players.map(pl =>
    pl.id === playerId ? { ...pl, nominated: true } : pl
  );
  const p = _state.players.find(p => p.id === playerId);
  addLog(`📣 ${p?.name} ha sido nominado/a.`, 'nomination');
  notify();
}

export function executePlayer(playerId) {
  const p = _state.players.find(p => p.id === playerId);
  if (!p) return;
  _state.players = _state.players.map(pl =>
    pl.id === playerId ? { ...pl, alive: false, nominated: false } : pl
  );
  addLog(`⚖️ ${p.name} ha sido ejecutado/a.`, 'execution');
  notify();
}

export function swapRoles(p1id, p2id) {
  const p1 = _state.players.find(p => p.id === p1id);
  const p2 = _state.players.find(p => p.id === p2id);
  if (!p1 || !p2) return;
  _state.players = _state.players.map(pl => {
    if (pl.id === p1id) return { ...pl, roleId: p2.roleId };
    if (pl.id === p2id) return { ...pl, roleId: p1.roleId };
    return pl;
  });
  addLog(`🔄 ${p1.name} y ${p2.name} han intercambiado roles.`, 'event');
  notify();
}

// ─── Log ─────────────────────────────────────────────────────────────────────
export function addLog(text, type = 'info') {
  _state.log = [{
    id: Date.now() + Math.random(),
    time: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
    text,
    type
  }, ..._state.log].slice(0, 200);
  notify();
}

// ─── Night order computation ─────────────────────────────────────────────────
function computeNightOrder(which) {
  const scriptRoles = ROLES.filter(r => _state.script.includes(r.id));
  const key = which === 'first' ? 'firstNight' : 'otherNight';
  return scriptRoles
    .filter(r => r[key] > 0)
    .sort((a, b) => a[key] - b[key])
    .map(r => ({
      roleId: r.id,
      roleName: r.name,
      icon: r.icon,
      team: r.team,
      ability: r.ability,
      players: _state.players.filter(p => p.roleId === r.id && p.alive)
    }));
}

// ─── QR token ────────────────────────────────────────────────────────────────
export function generatePlayerToken(playerId) {
  const p = _state.players.find(p => p.id === playerId);
  if (!p) return null;
  const data = {
    gid: _state.gameId,
    pid: playerId,
    name: p.name,
    roleId: p.roleId,
    ts: Date.now()
  };
  return btoa(JSON.stringify(data));
}
