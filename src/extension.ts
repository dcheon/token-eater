import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { spritesMarkup } from './sprites';
import { levelProgress, Progress, STAGES } from './leveling';

type PetState = 'idle' | 'typing' | 'working' | 'digesting';

/** Approx. context size (tokens) at which Claude Code triggers auto-compact. */
const AUTOCOMPACT_TOKENS = 160000;
/** The pet gets fat once the context reaches 80% of the auto-compact point. */
const FAT_THRESHOLD = AUTOCOMPACT_TOKENS * 0.8;
/** How long the "digesting" (post-compact) animation lingers. */
const DIGEST_MS = 5000;
/** globalState key holding lifetime XP. */
const XP_KEY = 'tokenEater.totalXp';
/** Don't hit globalState on every 800ms tick. */
const SAVE_DEBOUNCE_MS = 5000;

interface MonitorInfo {
  /** Current context size in tokens = how much "food" is in the belly. */
  food: number;
  /** Tokens newly eaten since the last tick — this is what earns XP. */
  xpGained: number;
  working: boolean;
  digesting: boolean;
  fat: boolean;
}

export function activate(context: vscode.ExtensionContext) {
  const provider = new PetViewProvider(context.extensionUri);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(PetViewProvider.viewType, provider, {
      webviewOptions: { retainContextWhenHidden: true },
    })
  );

  // --- shared state ---
  let userTyping = false;
  let claudeWorking = false;
  let digesting = false;
  let fat = false;
  let food = 0;
  /** Lifetime tokens eaten. Survives restarts; never shrinks on compaction. */
  let totalXp = context.globalState.get<number>(XP_KEY, 0);
  let lastStageId = levelProgress(totalXp).stage.id;
  let typingTimer: NodeJS.Timeout | undefined;
  let saveTimer: NodeJS.Timeout | undefined;

  const saveXpSoon = () => {
    if (saveTimer) {
      return;
    }
    saveTimer = setTimeout(() => {
      saveTimer = undefined;
      void context.globalState.update(XP_KEY, totalXp);
    }, SAVE_DEBOUNCE_MS);
  };

  const render = () => {
    const state: PetState = digesting
      ? 'digesting'
      : claudeWorking
      ? 'working'
      : userTyping
      ? 'typing'
      : 'idle';
    provider.update(state, food, fat, levelProgress(totalXp));
  };

  /** Announce a change of form — the milestone worth interrupting for. */
  const checkEvolution = () => {
    const progress = levelProgress(totalXp);
    if (progress.stage.id === lastStageId) {
      return;
    }
    lastStageId = progress.stage.id;
    void vscode.window.showInformationMessage(
      `Lv ${progress.level}! The pet evolved into ${progress.stage.name}!`
    );
  };

  // --- detect the user typing ---
  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument((e) => {
      // ignore output/log panels and non-file changes
      if (e.document.uri.scheme !== 'file') {
        return;
      }
      // If Claude Code is currently working, this file change was almost
      // certainly made by Claude editing files — not the user typing.
      // Priority: Claude working > user typing > idle.
      if (claudeWorking) {
        return;
      }
      userTyping = true;
      render();
      if (typingTimer) {
        clearTimeout(typingTimer);
      }
      typingTimer = setTimeout(() => {
        userTyping = false;
        render();
      }, 1200);
    })
  );

  // --- detect Claude Code working via the session transcripts ---
  const monitor = new ClaudeMonitor((info) => {
    food = info.food;
    claudeWorking = info.working;
    digesting = info.digesting;
    fat = info.fat;
    if (info.xpGained > 0) {
      totalXp += info.xpGained;
      saveXpSoon();
      checkEvolution();
    }
    render();
  });
  monitor.start();

  context.subscriptions.push({
    dispose: () => {
      monitor.stop();
      if (saveTimer) {
        clearTimeout(saveTimer);
      }
      void context.globalState.update(XP_KEY, totalXp);
    },
  });

  /** Wipe lifetime XP and current food back to 0, dropping the pet back to
   *  Lv 0 slime. Reachable from the command palette and from the "..." menu
   *  next to the view title. */
  const reset = async () => {
    const yes = 'Reset';
    const answer = await vscode.window.showWarningMessage(
      "This resets the pet's level, all-time XP, and current food to 0, dropping it back to Lv 0 Slime.",
      { modal: true },
      yes
    );
    if (answer !== yes) {
      return;
    }
    totalXp = 0;
    lastStageId = levelProgress(0).stage.id;
    food = 0;
    fat = false;
    digesting = false;
    monitor.resetFood();
    await context.globalState.update(XP_KEY, 0);
    render();
  };

  context.subscriptions.push(vscode.commands.registerCommand('tokenEater.reset', reset));

  render();
}

export function deactivate() {}

/**
 * The context size (prompt tokens) for a turn: input + both cache buckets.
 * Output tokens are excluded — they aren't part of the prompt/context window.
 */
function contextTokens(usage: any): number {
  return (
    (usage.input_tokens || 0) +
    (usage.cache_read_input_tokens || 0) +
    (usage.cache_creation_input_tokens || 0)
  );
}

/**
 * Tokens this turn actually *consumed*, which is what feeds the pet's XP.
 * Cache reads are excluded: they re-send context already paid for on an earlier
 * turn, so counting them would inflate XP by the whole transcript every turn.
 */
function newTokens(usage: any): number {
  return (
    (usage.input_tokens || 0) +
    (usage.cache_creation_input_tokens || 0) +
    (usage.output_tokens || 0)
  );
}

/**
 * Watches ~/.claude/projects/ transcript files. When the newest .jsonl grows,
 * Claude Code is actively working; parses the `usage` fields to track both the
 * current context size and the tokens newly eaten.
 */
class ClaudeMonitor {
  private timer: NodeJS.Timeout | undefined;
  private readonly projectsDir = path.join(os.homedir(), '.claude', 'projects');
  private readonly offsets = new Map<string, number>();
  /** Current context size in tokens = the pet's "food in the belly". */
  private currentContext = 0;
  private prevContext = 0;
  /** Timestamp of the last detected compaction (drives the digest state). */
  private compactedAt = 0;
  /** Message ids already counted toward XP, so a re-read can't double-count. */
  private countedIds = new Set<string>();

  constructor(private readonly onUpdate: (info: MonitorInfo) => void) {}

  start() {
    this.timer = setInterval(() => this.tick(), 800);
  }

  /** Zero out the belly (food) display. The *next* transcript update still
   *  reflects the real, live context size — this just clears what's shown now. */
  resetFood() {
    this.currentContext = 0;
    this.prevContext = 0;
    this.compactedAt = 0;
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = undefined;
    }
  }

  private tick() {
    const now = Date.now();
    const newest = this.findNewestJsonl();
    let working = false;
    let xpGained = 0;

    if (newest) {
      try {
        const stat = fs.statSync(newest);

        // 1) Update how full the belly is (current context), detect compaction,
        //    and collect the tokens newly eaten since the last tick.
        xpGained = this.updateContext(newest, stat.size);

        // 2) Decide whether Claude is *currently* working by inspecting the
        //    last conversation entry. Runs for the whole duration of Claude's
        //    turn (start → stop). A stale transcript never counts.
        const fresh = now - stat.mtimeMs < 5 * 60 * 1000;
        if (fresh) {
          const last = this.readLastConversationEntry(newest, stat.size);
          working = this.entryMeansWorking(last);
        }
      } catch {
        // ignore transient fs errors
      }
    }

    const digesting = now - this.compactedAt < DIGEST_MS;
    const fat = this.currentContext >= FAT_THRESHOLD;
    this.onUpdate({ food: this.currentContext, xpGained, working, digesting, fat });
  }

  /**
   * Track the latest turn's context size and detect compaction.
   * A compaction shows up either as a summary line, or as a sudden large drop
   * in context size on the next turn.
   *
   * Returns the tokens newly eaten (XP earned) by the lines just read.
   */
  private updateContext(file: string, size: number): number {
    const offset = this.offsets.get(file);
    if (offset === undefined) {
      // First sighting: seed the belly from the tail so fatness shows at once.
      // History is *not* awarded as XP — only what the pet eats from now on.
      this.offsets.set(file, size);
      this.seedContextFromTail(file, size);
      return 0;
    }
    if (size < offset) {
      // File rotated / truncated.
      this.offsets.set(file, size);
      return 0;
    }
    if (size === offset) {
      return 0;
    }

    const { latestContext, sawSummary, gained, newOffset } = this.readNew(file, offset, size);
    this.offsets.set(file, newOffset);

    if (sawSummary) {
      // Compaction just happened: pet is digesting; drop the belly right away.
      this.compactedAt = Date.now();
      this.currentContext = Math.round(this.currentContext * 0.3);
      this.prevContext = this.currentContext;
    }

    if (latestContext !== undefined) {
      // A big drop between turns also means a compaction occurred.
      if (this.prevContext > 20000 && latestContext < this.prevContext * 0.6) {
        this.compactedAt = Date.now();
      }
      this.currentContext = latestContext;
      this.prevContext = latestContext;
    }

    return gained;
  }

  /** Scan the tail once at startup to seed the current context size. */
  private seedContextFromTail(file: string, size: number) {
    const lines = this.readTailLines(file, size, 65536);
    if (!lines) {
      return;
    }
    for (let i = lines.length - 1; i >= 0; i--) {
      const trimmed = lines[i].trim();
      if (!trimmed) {
        continue;
      }
      try {
        const usage = JSON.parse(trimmed)?.message?.usage;
        if (usage) {
          this.currentContext = contextTokens(usage);
          this.prevContext = this.currentContext;
          return;
        }
      } catch {
        // skip partial / non-JSON
      }
    }
  }

  /**
   * Read the tail of the transcript and return the last real conversation
   * entry (a `user` or `assistant` message), skipping system/summary lines.
   */
  private readLastConversationEntry(file: string, size: number): any {
    const lines = this.readTailLines(file, size, 32768);
    if (!lines) {
      return undefined;
    }
    for (let i = lines.length - 1; i >= 0; i--) {
      const trimmed = lines[i].trim();
      if (!trimmed) {
        continue;
      }
      try {
        const obj = JSON.parse(trimmed);
        if (obj && (obj.type === 'user' || obj.type === 'assistant')) {
          return obj;
        }
      } catch {
        // partial (the first sliced line) or non-JSON — skip
      }
    }
    return undefined;
  }

  /** Read up to `maxBytes` from the end of the file, split into lines. */
  private readTailLines(file: string, size: number, maxBytes: number): string[] | undefined {
    const readLen = Math.min(size, maxBytes);
    if (readLen <= 0) {
      return undefined;
    }
    const from = size - readLen;
    const fd = fs.openSync(file, 'r');
    try {
      const buf = Buffer.alloc(readLen);
      fs.readSync(fd, buf, 0, readLen, from);
      return buf.toString('utf8').split('\n');
    } finally {
      fs.closeSync(fd);
    }
  }

  /**
   * Claude is "working" when the conversation is mid-turn:
   *  - last entry is a user message / tool_result → Claude is about to respond
   *  - last entry is an assistant message whose stop_reason is NOT end_turn
   *    (e.g. "tool_use") → Claude will keep going
   * When the last assistant message ended the turn, Claude is done → stop.
   */
  private entryMeansWorking(obj: any): boolean {
    if (!obj) {
      return false;
    }
    if (obj.type === 'assistant') {
      const stop = obj?.message?.stop_reason;
      if (stop === 'end_turn' || stop === 'stop_sequence' || stop === 'max_tokens') {
        return false;
      }
      return true;
    }
    if (obj.type === 'user') {
      return true;
    }
    return false;
  }

  /** Guard against unbounded growth of the XP dedupe set. */
  private markCounted(id: string): boolean {
    if (this.countedIds.has(id)) {
      return false;
    }
    if (this.countedIds.size > 2000) {
      this.countedIds.clear();
    }
    this.countedIds.add(id);
    return true;
  }

  /**
   * Read bytes [from, to), only up to the last complete line. Returns the most
   * recent turn's context size, the tokens newly eaten, and whether a
   * compaction summary was seen.
   */
  private readNew(
    file: string,
    from: number,
    to: number
  ): {
    latestContext: number | undefined;
    sawSummary: boolean;
    gained: number;
    newOffset: number;
  } {
    const len = to - from;
    let buf: Buffer;
    const fd = fs.openSync(file, 'r');
    try {
      buf = Buffer.alloc(len);
      fs.readSync(fd, buf, 0, len, from);
    } finally {
      fs.closeSync(fd);
    }

    const lastNl = buf.lastIndexOf(0x0a);
    if (lastNl === -1) {
      // No complete line yet; wait for more.
      return { latestContext: undefined, sawSummary: false, gained: 0, newOffset: from };
    }

    const text = buf.subarray(0, lastNl).toString('utf8');
    let latestContext: number | undefined;
    let sawSummary = false;
    let gained = 0;
    for (const line of text.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed) {
        continue;
      }
      try {
        const obj = JSON.parse(trimmed);
        if (obj?.type === 'summary' || obj?.isCompactSummary || obj?.message?.isCompactSummary) {
          sawSummary = true;
        }
        const usage = obj?.message?.usage;
        if (usage) {
          latestContext = contextTokens(usage);
          const id = obj?.message?.id;
          if (typeof id !== 'string' || this.markCounted(id)) {
            gained += newTokens(usage);
          }
        }
      } catch {
        // partial / non-JSON line, skip
      }
    }
    return { latestContext, sawSummary, gained, newOffset: from + lastNl + 1 };
  }

  /** Recursively find the most recently modified .jsonl transcript. */
  private findNewestJsonl(): string | undefined {
    let newest: string | undefined;
    let newestMtime = 0;

    const walk = (dir: string) => {
      let entries: fs.Dirent[];
      try {
        entries = fs.readdirSync(dir, { withFileTypes: true });
      } catch {
        return;
      }
      for (const entry of entries) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          walk(full);
        } else if (entry.isFile() && entry.name.endsWith('.jsonl')) {
          try {
            const m = fs.statSync(full).mtimeMs;
            if (m > newestMtime) {
              newestMtime = m;
              newest = full;
            }
          } catch {
            // ignore
          }
        }
      }
    };

    walk(this.projectsDir);
    return newest;
  }
}

class PetViewProvider implements vscode.WebviewViewProvider {
  static readonly viewType = 'tokenEater.petView';

  private view?: vscode.WebviewView;
  private state: PetState = 'idle';
  private food = 0;
  private fat = false;
  private progress: Progress = levelProgress(0);

  constructor(private readonly extensionUri: vscode.Uri) {}

  resolveWebviewView(view: vscode.WebviewView) {
    this.view = view;
    view.webview.options = {
      enableScripts: true,
      localResourceRoots: [this.extensionUri],
    };
    view.webview.html = this.getHtml(view.webview);
    this.post();
  }

  update(state: PetState, food: number, fat: boolean, progress: Progress) {
    this.state = state;
    this.food = food;
    this.fat = fat;
    this.progress = progress;
    this.post();
  }

  private post() {
    const p = this.progress;
    this.view?.webview.postMessage({
      type: 'update',
      state: this.state,
      food: this.food,
      fat: this.fat,
      level: p.level,
      xp: p.xp,
      xpIntoLevel: p.xpIntoLevel,
      xpForNext: p.xpForNext,
      ratio: p.ratio,
      stage: { id: p.stage.id, name: p.stage.name, sprite: p.stage.sprite },
      evolvesAt: p.evolvesAt,
      // Full evolution ladder, sent along so the webview can figure out which
      // stage each *intermediate* level belongs to when animating a multi-
      // level jump (levelProgress() only tells us the final stage).
      stages: STAGES.map((s) => ({ id: s.id, name: s.name, sprite: s.sprite, minLevel: s.minLevel })),
    });
  }

  private getHtml(webview: vscode.Webview): string {
    const nonce = getNonce();
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionUri, 'media', 'style.css')
    );
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionUri, 'media', 'main.js')
    );

    return /* html */ `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="Content-Security-Policy"
    content="default-src 'none'; img-src ${webview.cspSource}; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link href="${styleUri}" rel="stylesheet" />
  <title>Token Eater</title>
</head>
<body>
  <div class="stage">
    <div class="ground"></div>
    <div id="pet" class="pet pet--idle pet--stage-slime pet--sprite-slime">
      <div class="zzz" aria-hidden="true"><span>z</span><span>z</span><span>z</span></div>
      <div class="bowl" aria-hidden="true">🥣</div>
      <div class="ball" aria-hidden="true">🎾</div>
      ${spritesMarkup()}
    </div>
    <div id="burst" class="burst" aria-hidden="true"></div>
  </div>

  <div class="hud">
    <div id="status" class="status">Sleeping...</div>

    <div class="level-row">
      <span id="level" class="level-badge">Lv 0</span>
      <span id="stageName" class="stage-name">Slime</span>
    </div>
    <div class="xpbar" role="progressbar"><div id="xpFill" class="xpbar__fill"></div></div>
    <div id="xpText" class="xp-text">0 / 0 XP</div>

    <div class="token-row">
      <span class="token-label">Food</span>
      <span id="tokens" class="token-value">0 token</span>
    </div>
  </div>

  <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
  }
}

function getNonce(): string {
  let text = '';
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return text;
}
