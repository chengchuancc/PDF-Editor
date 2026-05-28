import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  openFile: () => ipcRenderer.invoke('dialog:openFile'),
  openMultipleFiles: () => ipcRenderer.invoke('dialog:openMultipleFiles'),
  saveFile: (defaultName) => ipcRenderer.invoke('dialog:saveFile', defaultName),
  writeFile: (filePath, base64Data) => ipcRenderer.invoke('fs:writeFile', filePath, base64Data),
  readFile: (filePath) => ipcRenderer.invoke('fs:readFile', filePath),
  saveImage: (defaultName) => ipcRenderer.invoke('dialog:saveImage', defaultName),
  getPath: (name) => ipcRenderer.invoke('app:getPath', name),

  onFileOpened: (callback) => {
    ipcRenderer.on('file-opened', (_event, data) => callback(data));
  },
  onMenuSave: (callback) => {
    ipcRenderer.on('menu-save', () => callback());
  },
  onMenuSaveAs: (callback) => {
    ipcRenderer.on('menu-save-as', () => callback());
  },
  onMenuPrint: (callback) => {
    ipcRenderer.on('menu-print', () => callback());
  },
  onMenuAbout: (callback) => {
    ipcRenderer.on('menu-about', () => callback());
  },
});
