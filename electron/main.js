import { app, BrowserWindow, ipcMain, dialog, Menu, shell } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;
let isDev = false;

try {
  const isDevMod = await import('electron-is-dev');
  isDev = isDevMod.default;
} catch {
  isDev = !app.isPackaged;
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 12, y: 12 },
    backgroundColor: '#1e1e1e',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true,
    },
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }

  mainWindow.on('closed', () => { mainWindow = null; });
}

app.whenReady().then(() => {
  createWindow();
  buildMenu();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

function buildMenu() {
  const template = [
    {
      label: 'PDF Editor',
      submenu: [
        { label: '关于 PDF Editor', click: () => mainWindow?.webContents.send('menu-about') },
        { type: 'separator' },
        { role: 'quit' },
      ],
    },
    {
      label: '文件',
      submenu: [
        { label: '打开 PDF', accelerator: 'CmdOrCtrl+O', click: () => handleOpenFile() },
        { label: '保存', accelerator: 'CmdOrCtrl+S', click: () => mainWindow?.webContents.send('menu-save') },
        { label: '另存为', accelerator: 'CmdOrCtrl+Shift+S', click: () => mainWindow?.webContents.send('menu-save-as') },
        { type: 'separator' },
        { label: '打印', accelerator: 'CmdOrCtrl+P', click: () => mainWindow?.webContents.send('menu-print') },
      ],
    },
    {
      label: '编辑',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' },
      ],
    },
    {
      label: '视图',
      submenu: [
        { role: 'reload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

async function handleOpenFile() {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [{ name: 'PDF Files', extensions: ['pdf'] }],
  });
  if (!result.canceled && result.filePaths.length > 0) {
    const filePath = result.filePaths[0];
    const data = fs.readFileSync(filePath);
    const base64 = data.toString('base64');
    mainWindow?.webContents.send('file-opened', { data: base64, fileName: path.basename(filePath), filePath });
  }
}

ipcMain.handle('dialog:openFile', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [{ name: 'PDF Files', extensions: ['pdf'] }],
  });
  if (!result.canceled && result.filePaths.length > 0) {
    const filePath = result.filePaths[0];
    const data = fs.readFileSync(filePath);
    return { data: data.toString('base64'), fileName: path.basename(filePath), filePath };
  }
  return null;
});

ipcMain.handle('dialog:openMultipleFiles', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile', 'multiSelections'],
    filters: [{ name: 'PDF Files', extensions: ['pdf'] }],
  });
  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths.map((fp) => ({
      data: fs.readFileSync(fp).toString('base64'),
      fileName: path.basename(fp),
      filePath: fp,
    }));
  }
  return null;
});

ipcMain.handle('dialog:saveFile', async (_event, defaultName) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    defaultPath: defaultName || 'document.pdf',
    filters: [{ name: 'PDF Files', extensions: ['pdf'] }],
  });
  return result.canceled ? null : result.filePath;
});

ipcMain.handle('fs:writeFile', async (_event, filePath, base64Data) => {
  fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));
  return true;
});

ipcMain.handle('fs:readFile', async (_event, filePath) => {
  const data = fs.readFileSync(filePath);
  return data.toString('base64');
});

ipcMain.handle('dialog:saveImage', async (_event, defaultName) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    defaultPath: defaultName || 'page.png',
    filters: [
      { name: 'PNG', extensions: ['png'] },
      { name: 'JPEG', extensions: ['jpg', 'jpeg'] },
    ],
  });
  return result.canceled ? null : result.filePath;
});

ipcMain.handle('app:getPath', async (_event, name) => {
  return app.getPath(name);
});
