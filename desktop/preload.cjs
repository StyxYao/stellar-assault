'use strict';
const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('desktopBridge', {
  toggleFullscreen: () => ipcRenderer.invoke('window:toggle-fullscreen'),
  isFullscreen: () => ipcRenderer.invoke('window:is-fullscreen'),
  quit: () => ipcRenderer.invoke('app:quit'),
  copyText: (text) => ipcRenderer.invoke('clipboard:write', text),
  save: {
    load: () => ipcRenderer.invoke('save:load'),
    write: (data) => ipcRenderer.invoke('save:write', data)
  }
});
