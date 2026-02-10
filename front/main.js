const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false, // Pour éviter les blocages de scripts locaux
    },
  });

  // On utilise le chemin relatif exact par rapport à l'emplacement de main.js
  const indexPath = path.join(__dirname, 'dist', 'front', 'browser', 'index.html');
  console.log('Tentative de chargement de :', indexPath);

  win.loadURL(`file://${path.join(__dirname, 'dist/front/browser/index.html')}`);

  // Force l'ouverture de la console pour voir l'erreur si c'est toujours blanc
  win.webContents.openDevTools();
}

app.whenReady().then(createWindow);
