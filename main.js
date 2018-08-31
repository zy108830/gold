const {ipcMain, app, Menu, BrowserWindow, Tray} = require('electron')
const path = require('path')
const axios = require('axios')
let mainWindow
let appIcon = null
//不在dock上显示icon
app.dock.hide();
ipcMain.on('put-in-tray', (event) => {
	//初始化appIcon
	const iconPath = path.join(__dirname, 'logo.jpg')
	appIcon = new Tray(iconPath)
	const contextMenu = Menu.buildFromTemplate([{
		label: '退出',
		click: () => {
			event.sender.send('tray-removed')
		}
	}])
	appIcon.setToolTip('软银投资的黄金特色理财平台')
	appIcon.setTitle('查询中...')
	appIcon.setContextMenu(contextMenu)
	//更新appIcon的title
	setInterval(() => {
		axios.post('https://www.g-banker.com/price/query', {
			"queryFlag": 3
		}).then((response) => {
			let price = response['data']['data']['realtime_price']
			price = (price / 100).toFixed(2).toString();
			appIcon.setTitle(price)
		}).catch((error) => {
			console.log(error)
		})
	}, 3000)
})
ipcMain.on('remove-tray', () => {
	appIcon.destroy()
	app.quit()
})

function ready() {
	mainWindow = new BrowserWindow({width: 800, height: 600, show: false})
	mainWindow.loadFile('index.html')
	mainWindow.on('closed', function () {
		mainWindow = null
	})
}

app.on('ready', ready)
app.on('window-all-closed', function () {
	if (process.platform !== 'darwin') {
		app.quit()
	}
	if (appIcon) {
		appIcon.destroy()
	}
})