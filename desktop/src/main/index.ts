import { app, BrowserWindow, shell, ipcMain, protocol } from 'electron'
import { join } from 'path'
import { initDatabase } from './database'
import { registerIpcHandlers } from './ipc-handlers'
import { startSyncEngine } from './sync-engine'
import { registerLocalCacheProtocol } from './image-cache'
import { createMenu } from './menu'

let mainWindow: BrowserWindow | null = null

const GOT_SINGLE_INSTANCE = app.requestSingleInstanceLock()

if (!GOT_SINGLE_INSTANCE) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
  })
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 600,
    show: false,
    title: 'CardápioPro Desktop',
    icon: join(__dirname, '../../build/icon.png'),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      webSecurity: true
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (!app.isPackaged && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  createMenu(mainWindow)
}

app.whenReady().then(async () => {
  // Register custom protocol for cached images
  protocol.registerSchemesAsPrivileged([
    {
      scheme: 'local-cache',
      privileges: {
        standard: true,
        secure: true,
        supportFetchAPI: true,
        stream: true,
        bypassCSP: false
      }
    }
  ])

  // Initialize local SQLite database
  await initDatabase()
  console.log('[Desktop] Banco de dados local inicializado')

  // Register IPC handlers
  registerIpcHandlers()

  // Setup image cache protocol
  registerLocalCacheProtocol()

  // Create the app window
  createWindow()

  // Start sync engine (background)
  startSyncEngine()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// Expose app paths to renderer via IPC
ipcMain.handle('app:get-path', (_event, name: string) => {
  return app.getPath(name as any)
})

ipcMain.handle('app:get-version', () => {
  return app.getVersion()
})

ipcMain.handle('app:get-is-electron', () => {
  return true
})
