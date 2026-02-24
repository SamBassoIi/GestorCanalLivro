const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    salvarDados: (dados) => ipcRenderer.send('save-data', dados),
    carregarDados: () => ipcRenderer.invoke('load-data')
});