const { contextBridge: i, ipcRenderer: o } = require("electron");
i.exposeInMainWorld("electronAPI", {
  // File System Operations (Replacing direct 'fs' imports)
  saveFile: (e, n) => o.invoke("save-file", e, n),
  readFile: (e) => o.invoke("read-file", e),
  fileExists: (e) => o.invoke("file-exists", e),
  getAppPath: () => o.invoke("get-app-path"),
  // Listeners for Menu actions triggered in the Main Process
  onNewDocument: (e) => o.on("new", e),
  onForkDocument: (e) => o.on("forkDocument", e),
  onOpenFromClipboard: (e) => o.on("openFromClipboard", (n, r) => e(r)),
  onShareToClipboard: (e) => o.on("shareToClipboard", e),
  // Sending data back to the Main Process clipboard
  shareToClipboardResult: (e) => o.send("shareToClipboardResult", e)
});
