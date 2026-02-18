const { app, BrowserWindow } = require('electron');
const path = require('path');

app.setPath('userData', path.join(__dirname, 'deepflex-cache'));

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    backgroundColor: '#1a1a1a',
    show: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  const indexPath = path.join(__dirname, 'apps', 'desktop-ui', 'index.html');

  win.loadFile(indexPath).catch(err => {
    console.error("DeepFlex Error: UI file not found at", indexPath, err);
  });

  win.once('ready-to-show', () => {
    console.log("✅ DeepFlex Desktop UI Ready");
    win.show();
  });

  win.webContents.openDevTools();
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});