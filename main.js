const {ipcMain, app, Menu, BrowserWindow, Tray} = require('electron')
const path = require('path')
const axios = require('axios')
const moment=require('moment')
let mainWindow=null//浏览器窗口
let appIcon = null//系统托盘
let should_query=true;//是否有必要查询，例如非交易日只查询一次就行了
//不在dock上显示icon
if (process.platform == 'darwin') {
	app.dock.hide();
}

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
	updateGoldPrice();
	//更新appIcon的title
})
ipcMain.on('remove-tray', () => {
	appIcon.destroy()
	app.quit()
})

app.on('ready', ready)
app.on('window-all-closed', function () {
	if (process.platform !== 'darwin') {
		app.quit()
	}
	if (appIcon) {
		appIcon.destroy()
	}
})

function ready() {
	mainWindow = new BrowserWindow({width: 800, height: 600, show: false})
	mainWindow.loadFile('index.html')
	mainWindow.on('closed', function () {
		mainWindow = null
	})
}

function updateGoldPrice() {
	if(should_query){
		console.log('发起行情查询请求');
		axios.post('https://www.g-banker.com/price/query', {
			"queryFlag": 3
		}).then((response) => {
			let price = response['data']['data']['realtime_price']
			price = (price / 100).toFixed(2).toString();
			appIcon.setTitle(price)
		}).catch((error) => {
			console.log(error)
		})
	}
	setTimeout(function () {
		should_query=shouldQuery();
		updateGoldPrice();
	},3000)
}

function shouldQuery() {
	var date=new moment();
	var dayOfWeek=date.day()
	var hourOfDay=date.hour()
	var minuteOfHour=date.minute()
	var should=true;
	switch (dayOfWeek){
		case 0:
			should=false
			break;
		case 1:
			should= (hourOfDay>=9 && hourOfDay <=23)
			break;
		case 2:
		case 3:
		case 4:
		case 5:
			should= (hourOfDay>=0 && hourOfDay<2) || (hourOfDay==2 && minuteOfHour<=30) || (hourOfDay>=9 && hourOfDay <=23)
		case 6:
			should= (hourOfDay>=0 && hourOfDay<2) || (hourOfDay==2 && minuteOfHour<=30)
			break;
	}
	return should;
}