// Shared team whiteboard. tldraw draws; the document lives in D1 via
// /api/board, the same way the pad does. One person's edits autosave; others
// pick them up every 15 seconds. If two people save at once, the second save
// gets the first person's board and re-applies its own changes on top.
import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { Tldraw, getSnapshot, type Editor, type TLRecord } from 'tldraw';
import 'tldraw/tldraw.css';

type Row = { body: string; updated_by: string | null; updated_at: string | null };
type Changes = { put: Map<string, TLRecord>; removed: Set<string> };

const status = document.querySelector('.board-status')!;
const when = (iso: string) => new Date(iso).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
const say = (text: string, warn = false) => { status.textContent = text; status.classList.toggle('warn', warn); };
const savedLine = (by: string | null, at: string | null) =>
  by && at ? `Saved · last edit by ${by}, ${when(at)}` : 'Empty board. Start drawing.';

let editor: Editor;
let base: string | null = null;
let pending: Changes = { put: new Map(), removed: new Set() };
let saving = false;
let again = false;
let timer: number | undefined;
const hasPending = () => pending.put.size > 0 || pending.removed.size > 0;

const documentIds = () => editor.store.allRecords().filter((r) => editor.store.scopedTypes.document.has(r.typeName)).map((r) => r.id);

// Replace the board's document with a saved one, without counting it as a local edit.
function applyRemote(body: string) {
  const records = body ? Object.values(JSON.parse(body).store as Record<string, TLRecord>) : [];
  const keep = new Set(records.map((r) => r.id));
  editor.store.mergeRemoteChanges(() => {
    const gone = documentIds().filter((id) => !keep.has(id));
    if (gone.length) editor.store.remove(gone as TLRecord['id'][]);
    if (records.length) editor.store.put(records);
  });
}

// Put local changes back on top of someone else's board.
function reapply(c: Changes) {
  editor.store.mergeRemoteChanges(() => {
    const removed = [...c.removed].filter((id) => editor.store.has(id as TLRecord['id']));
    if (removed.length) editor.store.remove(removed as TLRecord['id'][]);
    if (c.put.size) editor.store.put([...c.put.values()]);
  });
}

function merge(a: Changes, b: Changes): Changes {
  const out: Changes = { put: new Map(a.put), removed: new Set(a.removed) };
  for (const id of b.removed) { out.put.delete(id); out.removed.add(id); }
  for (const [id, r] of b.put) { out.removed.delete(id); out.put.set(id, r); }
  return out;
}

async function save(force = false, keep = false): Promise<void> {
  if (!force && !hasPending()) return;
  if (saving) { again = true; return; }
  saving = true;
  const sent = pending;
  pending = { put: new Map(), removed: new Set() };
  say('Saving…');
  try {
    const body = JSON.stringify(getSnapshot(editor.store).document);
    const res = await fetch('/api/board', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body, base, keep }),
    });
    if (res.status === 409) {
      const { current } = (await res.json()) as { current: Row };
      applyRemote(current.body);
      const mine = merge(sent, pending);
      reapply(mine);
      pending = mine;
      base = current.updated_at;
      say(`${current.updated_by} saved at the same time. Their changes are in, yours are back on top. Saving…`, true);
      again = true;
      return;
    }
    if (!res.ok) {
      pending = merge(sent, pending);
      const err = await res.json().catch(() => ({}));
      say(err.error === 'The board is full.' ? 'Not saved: the board is too big. Delete some things, or start a new board.' : 'Not saved. Are you still signed in? Reload the page.', true);
      return;
    }
    const row = (await res.json()) as Row;
    base = row.updated_at;
    say(savedLine(row.updated_by, row.updated_at));
  } catch {
    pending = merge(sent, pending);
    say('Not saved. Check your connection.', true);
  } finally {
    saving = false;
    if (again) { again = false; window.setTimeout(() => save(), 300); }
  }
}

// Pick up other people's saves while you're not mid-edit.
async function poll() {
  if (document.visibilityState !== 'visible' || saving || hasPending()) return;
  const res = await fetch('/api/board?meta=1').catch(() => null);
  if (!res?.ok) return;
  const meta = (await res.json()) as Omit<Row, 'body'>;
  if (meta.updated_at === base) return;
  const full = await fetch('/api/board').catch(() => null);
  if (!full?.ok || saving || hasPending()) return;
  const row = (await full.json()) as Row;
  applyRemote(row.body);
  base = row.updated_at;
  say(savedLine(row.updated_by, row.updated_at));
}

async function start(ed: Editor) {
  editor = ed;
  const res = await fetch('/api/board');
  if (res.status === 401) {
    const me = await fetch('/api/me').then((r) => r.json()).catch(() => null);
    say(me?.signedIn ? 'You’re signed in, but not on the list yet. Ask Sarah or Amber to add you.' : 'This board is only for signed-in people.', true);
    ed.updateInstanceState({ isReadonly: true });
    return;
  }
  if (!res.ok) { say('Couldn’t load the board.', true); return; }
  const row = (await res.json()) as Row;
  try {
    if (row.body) applyRemote(row.body);
  } catch {
    say('The saved board couldn’t be opened. Use History to restore an earlier version.', true);
    setupHistory();
    return;
  }
  editor.clearHistory();
  base = row.updated_at;
  say(savedLine(row.updated_by, row.updated_at));
  if (row.body) editor.zoomToFit({ animation: { duration: 0 } });

  editor.store.listen(({ changes }) => {
    const c: Changes = { put: new Map(), removed: new Set() };
    for (const r of Object.values(changes.added)) c.put.set(r.id, r);
    for (const [, r] of Object.values(changes.updated)) c.put.set(r.id, r);
    for (const r of Object.values(changes.removed)) c.removed.add(r.id);
    pending = merge(pending, c);
    say('Editing…');
    clearTimeout(timer);
    timer = window.setTimeout(() => save(), 1500);
  }, { source: 'user', scope: 'document' });

  window.setInterval(poll, 15_000);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') save(); else poll(); });
  window.addEventListener('beforeunload', (e) => { if (hasPending() || saving) { save(); e.preventDefault(); } });
  setupHistory();
}

// History: list kept versions and restore one. Restoring is an ordinary save,
// so the board it replaces is itself kept.
function setupHistory() {
  const toggle = document.querySelector<HTMLButtonElement>('.hist-toggle')!;
  const hist = document.querySelector<HTMLElement>('.hist')!;
  const list = hist.querySelector('.hist-list')!;
  toggle.hidden = false;

  async function load() {
    list.textContent = '';
    const res = await fetch('/api/board/versions');
    if (!res.ok) { list.textContent = 'Couldn’t load the history.'; return; }
    const { versions } = (await res.json()) as { versions: { id: number; shapes: number; saved_by: string | null; saved_at: string }[] };
    if (!versions.length) { list.textContent = 'No earlier versions yet.'; return; }
    for (const v of versions) {
      const li = document.createElement('li');
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = `${when(v.saved_at)}${v.saved_by ? ` · ${v.saved_by}` : ''} · ${v.shapes} ${v.shapes === 1 ? 'shape' : 'shapes'}`;
      b.addEventListener('click', async () => {
        if (!confirm(`Restore the board from ${when(v.saved_at)}? The current board will be kept in the history.`)) return;
        const r = await fetch(`/api/board/versions/${v.id}`);
        if (!r.ok) return say('Couldn’t load that version.', true);
        const { body } = (await r.json()) as { body: string };
        applyRemote(body);
        pending = { put: new Map(), removed: new Set() };
        await save(true, true);
        toggle.click();
      });
      li.append(b);
      list.append(li);
    }
  }

  toggle.addEventListener('click', () => {
    const open = hist.hidden;
    hist.hidden = !open;
    toggle.setAttribute('aria-expanded', String(open));
    toggle.textContent = open ? 'Close history' : 'History';
    if (open) load();
  });
}

createRoot(document.getElementById('board')!).render(
  createElement(Tldraw, {
    onMount: (ed: Editor) => { start(ed); },
    // No uploads yet: pasted images would be stored inside the board and
    // quickly hit the 2 MB limit. Add an R2-backed asset store to allow them.
    acceptedImageMimeTypes: [],
    acceptedVideoMimeTypes: [],
  }),
);
