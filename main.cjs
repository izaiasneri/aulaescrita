const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow () {
  const win = new BrowserWindow({
    width: 1280,
    height: 720,
    title: "AulaEscrita - Prof. Izaias Neri",
    autoHideMenuBar: true, // Esconde a barra de menus padrão do Windows
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  // Carrega a pasta dist que geramos no Vite
  win.loadFile(path.join(__dirname, 'dist', 'index.html'));
  
  // Já abre a janela maximizada, perfeita para gravar a aula
  win.maximize();
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});