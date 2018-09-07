// try {
// 	require('electron-reloader')(module);
// } catch (err) {}
const {ipcMain, app, Menu, BrowserWindow, Tray} = require('electron')
const path = require('path')
const axios = require('axios')
const moment = require('moment')
let mainWindow = null//浏览器窗口
let appIcon = null//系统托盘
let should_query = true;//是否有必要查询，例如非交易日只查询一次就行了
let contextMenu = null;
let query_result_list = [];
let quit_app = false;
//不在dock上显示icon
if (process.platform == 'darwin') {
	app.dock.hide();
}

function initTray() {
	const iconPath = path.join(__dirname, 'logo.jpg')
	appIcon = new Tray(iconPath)
	appIcon.setToolTip('软银投资的黄金特色理财平台')
	appIcon.setTitle('查询中...')
	appIcon.on('click', (event) => {
		initWindow();
	});
	appIcon.on('right-click', (event) => {
		if (!contextMenu) {
			contextMenu = Menu.buildFromTemplate([
				{
					label: '退出',
					click: () => {
						quit_app = true
						app.quit();
					}
				}
			]);
		}
		appIcon.popUpContextMenu(contextMenu)
	})
	updateGoldPrice();
}

function initWindow() {
	if (!mainWindow) {
		mainWindow = new BrowserWindow({
			title: '黄金钱包',
			width: 800,
			height: 300,
			resizable: true,
			useContentSize: true,
			autoHideMenuBar:true
		})
		mainWindow.loadFile('index.html')
	} else {
		mainWindow.show()
	}
	mainWindow.on('closed', () => {
		mainWindow = null;
	})
	mainWindow.on('close', (event) => {
		if (!quit_app) {
			mainWindow.hide();
			event.preventDefault();
			return false;
		}
	})
}

function updateGoldPrice() {
	if (should_query) {
		axios.post('https://www.g-banker.com/price/query', {
			"queryFlag": 3
		}).then((response) => {
			let price = response['data']['data']['realtime_price']
			price = (price / 100).toFixed(2).toString();
			appIcon.setTitle(price)
			query_result_list.push({
				'time': (new Date()).getTime(),
				'price': parseFloat(price)
			})
		}).catch((error) => {
			console.log(error)
		})
	}
	setTimeout(function () {
		should_query = shouldQuery();
		updateGoldPrice();
	}, 3000)
}

function shouldQuery() {
	var date = new moment();
	var dayOfWeek = date.day()
	var hourOfDay = date.hour()
	var minuteOfHour = date.minute()
	var should = true;
	switch (dayOfWeek) {
		case 0:
			should = false
			break;
		case 1:
			should = (hourOfDay >= 9 && hourOfDay <= 23)
			break;
		case 2:
		case 3:
		case 4:
		case 5:
			should = (hourOfDay >= 0 && hourOfDay < 2) || (hourOfDay == 2 && minuteOfHour <= 30) || (hourOfDay >= 9 && hourOfDay <= 23)
			break;
		case 6:
			should = (hourOfDay >= 0 && hourOfDay < 2) || (hourOfDay == 2 && minuteOfHour <= 30)
			break;
	}
	return should;
}

app.on('ready', () => {
	initTray();
})
//阻止事件默认行为，避免直接退出托盘
app.on('window-all-closed', () => {
	return false;
})
ipcMain.on('get-query-result-list', (event) => {
	event.sender.send('return-query-result-list', query_result_list)
})