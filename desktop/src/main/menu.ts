import { Menu, app, shell, BrowserWindow } from 'electron'

export function createMenu(window: BrowserWindow): void {
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: 'CardápioPro',
      submenu: [
        { label: 'Sobre CardápioPro', click: () => window.webContents.send('menu:about') },
        { type: 'separator' },
        { label: 'Preferências...', accelerator: 'CmdOrCtrl+,', click: () => window.webContents.send('menu:settings') },
        { type: 'separator' },
        { label: 'Serviços', role: 'services' },
        { type: 'separator' },
        { label: 'Ocultar CardápioPro', role: 'hide' },
        { label: 'Ocultar Outros', role: 'hideOthers' },
        { label: 'Mostrar Tudo', role: 'unhide' },
        { type: 'separator' },
        { label: 'Sair', role: 'quit' },
      ]
    },
    {
      label: 'Arquivo',
      submenu: [
        { label: 'Novo Pedido', accelerator: 'CmdOrCtrl+N', click: () => window.webContents.send('menu:new-order') },
        { label: 'Novo Produto', accelerator: 'CmdOrCtrl+Shift+N', click: () => window.webContents.send('menu:new-product') },
        { type: 'separator' },
        { label: 'Sincronizar Agora', accelerator: 'CmdOrCtrl+Shift+S', click: () => window.webContents.send('menu:sync') },
        { type: 'separator' },
        { label: 'Fechar', role: 'close' },
      ]
    },
    {
      label: 'Editar',
      submenu: [
        { role: 'undo', label: 'Desfazer' },
        { role: 'redo', label: 'Refazer' },
        { type: 'separator' },
        { role: 'cut', label: 'Recortar' },
        { role: 'copy', label: 'Copiar' },
        { role: 'paste', label: 'Colar' },
        { role: 'selectAll', label: 'Selecionar Tudo' },
      ]
    },
    {
      label: 'Exibir',
      submenu: [
        { role: 'reload', label: 'Recarregar' },
        { role: 'forceReload', label: 'Forçar Recarregamento' },
        { role: 'toggleDevTools', label: 'Ferramentas do Desenvolvedor' },
        { type: 'separator' },
        { role: 'resetZoom', label: 'Redefinir Zoom' },
        { role: 'zoomIn', label: 'Aumentar Zoom' },
        { role: 'zoomOut', label: 'Diminuir Zoom' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: 'Tela Cheia' },
      ]
    },
    {
      label: 'Janela',
      submenu: [
        { role: 'minimize', label: 'Minimizar' },
        { role: 'zoom', label: 'Zoom' },
        { type: 'separator' },
        { role: 'front', label: 'Trazer para Frente' },
      ]
    },
    {
      label: 'Ajuda',
      submenu: [
        { label: 'CardápioPro na Web', click: () => shell.openExternal('https://cardapiopro.com') },
        { label: 'Documentação', click: () => shell.openExternal('https://cardapiopro.com/docs') },
        { type: 'separator' },
        { label: 'Reportar Bug', click: () => shell.openExternal('https://github.com/cardapiopro/cardapiopro/issues') },
      ]
    }
  ]

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}
