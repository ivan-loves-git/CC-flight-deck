const { app, BrowserWindow, shell, nativeImage } = require('electron');
const { spawn } = require('child_process');
const path = require('path');
const http = require('http');

// Set app name
app.name = 'Claude FD';

let mainWindow;
let nextProcess;

const isDev = !app.isPackaged;
const PORT = 3000;

// Check if Next.js server is ready
function waitForServer(url, timeout = 30000) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    const check = () => {
      http.get(url, (res) => {
        if (res.statusCode === 200) {
          resolve();
        } else {
          retry();
        }
      }).on('error', retry);
    };

    const retry = () => {
      if (Date.now() - startTime > timeout) {
        reject(new Error('Server timeout'));
      } else {
        setTimeout(check, 500);
      }
    };

    check();
  });
}

// Check if server is already running
function isServerRunning() {
  return new Promise((resolve) => {
    http.get(`http://localhost:${PORT}`, () => resolve(true))
      .on('error', () => resolve(false));
  });
}

// Start Next.js server
async function startNextServer() {
  // Check if already running
  const running = await isServerRunning();
  if (running) {
    console.log('Next.js server already running');
    return;
  }

  const projectRoot = isDev
    ? path.join(__dirname, '..')
    : path.join(process.resourcesPath, 'app');

  nextProcess = spawn('npm', ['run', 'dev'], {
    cwd: projectRoot,
    shell: true,
    env: { ...process.env, PORT: PORT.toString() }
  });

  nextProcess.stdout.on('data', (data) => {
    try {
      process.stdout.write(`Next.js: ${data}`);
    } catch (e) {
      // Ignore write errors when pipe is closed
    }
  });

  nextProcess.stderr.on('data', (data) => {
    try {
      process.stderr.write(`Next.js Error: ${data}`);
    } catch (e) {
      // Ignore write errors when pipe is closed
    }
  });
}

function createWindow() {
  // Get icon path
  const iconPath = isDev
    ? path.join(__dirname, '..', 'assets', 'icon.icns')
    : path.join(process.resourcesPath, 'assets', 'icon.icns');

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    title: 'Claude FD',
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 15, y: 15 },
    icon: iconPath,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    show: false,
    backgroundColor: '#0a0a0a',
  });

  // Set dock icon on macOS
  if (process.platform === 'darwin' && app.dock) {
    const dockIcon = nativeImage.createFromPath(iconPath);
    if (!dockIcon.isEmpty()) {
      app.dock.setIcon(dockIcon);
    }
  }

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Open external links in browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  return mainWindow;
}

app.whenReady().then(async () => {
  // Set dock icon immediately on macOS (use PNG for better compatibility)
  if (process.platform === 'darwin' && app.dock) {
    const iconPath = path.join(__dirname, '..', 'assets', 'icon.png');
    const dockIcon = nativeImage.createFromPath(iconPath);
    console.log('Setting dock icon from:', iconPath, 'isEmpty:', dockIcon.isEmpty());
    if (!dockIcon.isEmpty()) {
      app.dock.setIcon(dockIcon);
    }
  }

  // Start Next.js server
  await startNextServer();

  // Create window
  const win = createWindow();

  // Wait for server and load
  try {
    await waitForServer(`http://localhost:${PORT}`);
    win.loadURL(`http://localhost:${PORT}`);
  } catch (err) {
    console.error('Failed to start server:', err);
    win.loadURL(`data:text/html,<h1>Failed to start server</h1><p>${err.message}</p>`);
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  // Kill Next.js server
  if (nextProcess) {
    nextProcess.kill();
  }
});
