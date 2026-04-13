import { app as h, ipcMain as b, clipboard as C, BrowserWindow as k, Menu as V } from "electron";
import m from "node:path";
import v from "node:fs";
import R from "fs";
import x from "path";
import Y from "os";
import L from "crypto";
function S(e) {
  return e && e.__esModule && Object.prototype.hasOwnProperty.call(e, "default") ? e.default : e;
}
var d = { exports: {} };
const K = "16.6.1", P = {
  version: K
}, D = R, y = x, j = Y, F = L, U = P, O = U.version, q = /(?:^|^)\s*(?:export\s+)?([\w.-]+)(?:\s*=\s*?|:\s+?)(\s*'(?:\\'|[^'])*'|\s*"(?:\\"|[^"])*"|\s*`(?:\\`|[^`])*`|[^#\r\n]+)?\s*(?:#.*)?(?:$|$)/mg;
function M(e) {
  const r = {};
  let t = e.toString();
  t = t.replace(/\r\n?/mg, `
`);
  let n;
  for (; (n = q.exec(t)) != null; ) {
    const s = n[1];
    let o = n[2] || "";
    o = o.trim();
    const a = o[0];
    o = o.replace(/^(['"`])([\s\S]*)\1$/mg, "$2"), a === '"' && (o = o.replace(/\\n/g, `
`), o = o.replace(/\\r/g, "\r")), r[s] = o;
  }
  return r;
}
function B(e) {
  e = e || {};
  const r = $(e);
  e.path = r;
  const t = c.configDotenv(e);
  if (!t.parsed) {
    const a = new Error(`MISSING_DATA: Cannot parse ${r} for an unknown reason`);
    throw a.code = "MISSING_DATA", a;
  }
  const n = I(e).split(","), s = n.length;
  let o;
  for (let a = 0; a < s; a++)
    try {
      const l = n[a].trim(), u = J(t, l);
      o = c.decrypt(u.ciphertext, u.key);
      break;
    } catch (l) {
      if (a + 1 >= s)
        throw l;
    }
  return c.parse(o);
}
function G(e) {
  console.log(`[dotenv@${O}][WARN] ${e}`);
}
function E(e) {
  console.log(`[dotenv@${O}][DEBUG] ${e}`);
}
function T(e) {
  console.log(`[dotenv@${O}] ${e}`);
}
function I(e) {
  return e && e.DOTENV_KEY && e.DOTENV_KEY.length > 0 ? e.DOTENV_KEY : process.env.DOTENV_KEY && process.env.DOTENV_KEY.length > 0 ? process.env.DOTENV_KEY : "";
}
function J(e, r) {
  let t;
  try {
    t = new URL(r);
  } catch (l) {
    if (l.code === "ERR_INVALID_URL") {
      const u = new Error("INVALID_DOTENV_KEY: Wrong format. Must be in valid uri format like dotenv://:key_1234@dotenvx.com/vault/.env.vault?environment=development");
      throw u.code = "INVALID_DOTENV_KEY", u;
    }
    throw l;
  }
  const n = t.password;
  if (!n) {
    const l = new Error("INVALID_DOTENV_KEY: Missing key part");
    throw l.code = "INVALID_DOTENV_KEY", l;
  }
  const s = t.searchParams.get("environment");
  if (!s) {
    const l = new Error("INVALID_DOTENV_KEY: Missing environment part");
    throw l.code = "INVALID_DOTENV_KEY", l;
  }
  const o = `DOTENV_VAULT_${s.toUpperCase()}`, a = e.parsed[o];
  if (!a) {
    const l = new Error(`NOT_FOUND_DOTENV_ENVIRONMENT: Cannot locate environment ${o} in your .env.vault file.`);
    throw l.code = "NOT_FOUND_DOTENV_ENVIRONMENT", l;
  }
  return { ciphertext: a, key: n };
}
function $(e) {
  let r = null;
  if (e && e.path && e.path.length > 0)
    if (Array.isArray(e.path))
      for (const t of e.path)
        D.existsSync(t) && (r = t.endsWith(".vault") ? t : `${t}.vault`);
    else
      r = e.path.endsWith(".vault") ? e.path : `${e.path}.vault`;
  else
    r = y.resolve(process.cwd(), ".env.vault");
  return D.existsSync(r) ? r : null;
}
function w(e) {
  return e[0] === "~" ? y.join(j.homedir(), e.slice(1)) : e;
}
function Q(e) {
  const r = !!(e && e.debug), t = e && "quiet" in e ? e.quiet : !0;
  (r || !t) && T("Loading env from encrypted .env.vault");
  const n = c._parseVault(e);
  let s = process.env;
  return e && e.processEnv != null && (s = e.processEnv), c.populate(s, n, e), { parsed: n };
}
function H(e) {
  const r = y.resolve(process.cwd(), ".env");
  let t = "utf8";
  const n = !!(e && e.debug), s = e && "quiet" in e ? e.quiet : !0;
  e && e.encoding ? t = e.encoding : n && E("No encoding is specified. UTF-8 is used by default");
  let o = [r];
  if (e && e.path)
    if (!Array.isArray(e.path))
      o = [w(e.path)];
    else {
      o = [];
      for (const p of e.path)
        o.push(w(p));
    }
  let a;
  const l = {};
  for (const p of o)
    try {
      const i = c.parse(D.readFileSync(p, { encoding: t }));
      c.populate(l, i, e);
    } catch (i) {
      n && E(`Failed to load ${p} ${i.message}`), a = i;
    }
  let u = process.env;
  if (e && e.processEnv != null && (u = e.processEnv), c.populate(u, l, e), n || !s) {
    const p = Object.keys(l).length, i = [];
    for (const N of o)
      try {
        const _ = y.relative(process.cwd(), N);
        i.push(_);
      } catch (_) {
        n && E(`Failed to load ${N} ${_.message}`), a = _;
      }
    T(`injecting env (${p}) from ${i.join(",")}`);
  }
  return a ? { parsed: l, error: a } : { parsed: l };
}
function X(e) {
  if (I(e).length === 0)
    return c.configDotenv(e);
  const r = $(e);
  return r ? c._configVault(e) : (G(`You set DOTENV_KEY but you are missing a .env.vault file at ${r}. Did you forget to build it?`), c.configDotenv(e));
}
function z(e, r) {
  const t = Buffer.from(r.slice(-64), "hex");
  let n = Buffer.from(e, "base64");
  const s = n.subarray(0, 12), o = n.subarray(-16);
  n = n.subarray(12, -16);
  try {
    const a = F.createDecipheriv("aes-256-gcm", t, s);
    return a.setAuthTag(o), `${a.update(n)}${a.final()}`;
  } catch (a) {
    const l = a instanceof RangeError, u = a.message === "Invalid key length", p = a.message === "Unsupported state or unable to authenticate data";
    if (l || u) {
      const i = new Error("INVALID_DOTENV_KEY: It must be 64 characters long (or more)");
      throw i.code = "INVALID_DOTENV_KEY", i;
    } else if (p) {
      const i = new Error("DECRYPTION_FAILED: Please check your DOTENV_KEY");
      throw i.code = "DECRYPTION_FAILED", i;
    } else
      throw a;
  }
}
function W(e, r, t = {}) {
  const n = !!(t && t.debug), s = !!(t && t.override);
  if (typeof r != "object") {
    const o = new Error("OBJECT_REQUIRED: Please check the processEnv argument being passed to populate");
    throw o.code = "OBJECT_REQUIRED", o;
  }
  for (const o of Object.keys(r))
    Object.prototype.hasOwnProperty.call(e, o) ? (s === !0 && (e[o] = r[o]), n && E(s === !0 ? `"${o}" is already defined and WAS overwritten` : `"${o}" is already defined and was NOT overwritten`)) : e[o] = r[o];
}
const c = {
  configDotenv: H,
  _configVault: Q,
  _parseVault: B,
  config: X,
  decrypt: z,
  parse: M,
  populate: W
};
d.exports.configDotenv = c.configDotenv;
d.exports._configVault = c._configVault;
d.exports._parseVault = c._parseVault;
d.exports.config = c.config;
d.exports.decrypt = c.decrypt;
d.exports.parse = c.parse;
d.exports.populate = c.populate;
d.exports = c;
var Z = d.exports;
const ee = /* @__PURE__ */ S(Z);
ee.config();
let f;
const g = process.env.SAVE_DIR || m.join(h.getPath("documents"), "Trellis");
v.existsSync(g) || v.mkdirSync(g, { recursive: !0 });
const A = async () => {
  f = new k({
    width: 1100,
    height: 800,
    title: "-",
    webPreferences: {
      // Modern security constraints
      nodeIntegration: !1,
      contextIsolation: !0,
      preload: m.join(__dirname, "preload.js")
    }
  });
  const e = [
    {
      label: "Document",
      submenu: [
        {
          label: "New",
          accelerator: "CmdOrCtrl+N",
          click: () => {
            f.webContents.send("new");
          }
        },
        {
          label: "Open from Clipboard",
          accelerator: "CmdOrCtrl+O",
          click: () => {
            f.webContents.send("openFromClipboard", C.readText());
          }
        },
        {
          label: "Share to Clipboard",
          accelerator: "CmdOrCtrl+H",
          click: () => {
            f.webContents.send("shareToClipboard");
          }
        },
        {
          label: "Fork",
          accelerator: "CmdOrCtrl+Y",
          click: () => {
            f.webContents.send("forkDocument");
          }
        },
        { type: "separator" }
      ]
    },
    {
      label: "Edit",
      submenu: [
        { label: "Cut", accelerator: "CmdOrCtrl+X", role: "cut" },
        { label: "Copy", accelerator: "CmdOrCtrl+C", role: "copy" },
        { label: "Paste", accelerator: "CmdOrCtrl+V", role: "paste" },
        { label: "Select All", accelerator: "CmdOrCtrl+A", role: "selectAll" }
      ]
    },
    {
      label: "Dev",
      submenu: [
        {
          label: "Refresh",
          accelerator: "CmdOrCtrl+R",
          click: (t, n) => {
            n == null || n.webContents.reload();
          }
        },
        {
          label: "Open Inspector",
          accelerator: "CmdOrCtrl+Option+I",
          click: (t, n) => {
            n == null || n.webContents.toggleDevTools();
          }
        }
      ]
    }
  ];
  process.platform === "darwin" && e.unshift({
    label: h.getName(),
    submenu: [{ role: "about" }, { role: "quit" }]
  });
  const r = V.buildFromTemplate(e);
  V.setApplicationMenu(r), process.env.VITE_DEV_SERVER_URL ? f.loadURL(process.env.VITE_DEV_SERVER_URL) : f.loadFile(m.join(__dirname, "../dist/index.html")), f.on("closed", () => {
    f = null;
  });
};
b.on("shareToClipboardResult", (e, r) => {
  C.writeText(r);
});
b.handle("save-file", async (e, r, t) => {
  const n = m.join(g, r);
  return await v.promises.writeFile(n, t), !0;
});
b.handle("read-file", async (e, r) => {
  const t = m.join(g, r);
  return v.existsSync(t) ? await v.promises.readFile(t, "utf-8") : null;
});
b.handle("file-exists", (e, r) => {
  const t = m.join(g, r);
  return v.existsSync(t);
});
h.on("ready", A);
h.on("window-all-closed", () => {
  process.platform !== "darwin" && h.quit();
});
h.on("activate", () => {
  f === null && A();
});
