import { app, BrowserWindow, dialog, ipcMain, IpcMain, IpcMainEvent } from "electron";
import * as fs from "fs";
import * as path from "path";

let mainWindow: Electron.BrowserWindow;

function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    fullscreen: true,
    webPreferences: {
      nodeIntegration: true,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  // and load the index.html of the app.
  mainWindow.loadFile(path.join(__dirname, "../index.html"));

  mainWindow.webContents.on("new-window", (event: Event, url, frameName, disposition, options, additionalFeatures) => {
    if (frameName === "modal") {
      // open window as modal
      Object.assign(options, {
        modal: true,
        parent: mainWindow,
        width: 300,
        titleBarStyle: "hidden",
        frame: true,
        height: 100
      });
      return new BrowserWindow(options);
    }
  })

  ipcMain.on("showFolderDialog", (event: IpcMainEvent) => {
    let fileSelectionPromise = dialog.showOpenDialog({properties: ["openFile", "openDirectory", "multiSelections"]});
    fileSelectionPromise.then(function(obj) {
        event.sender.send("selectedfolders", obj.filePaths);
        let cumfileslist = obj.filePaths.map((filePath, index)=>{
          return fs.readdirSync(filePath, {withFileTypes: true})
                   .filter(dirent=>!dirent.isDirectory())
                   .map(dirent=>filePath + "/" + dirent.name);
        }).reduce((filesacc, files) => {
            filesacc = filesacc.concat(files);
            return filesacc;
        }).every((absolutefilepath, index, array) => {
          let stats:fs.Stats = fs.statSync(absolutefilepath);
          event.sender.send("fileslist", path.basename(absolutefilepath), stats);
          return true;
        });
    });
  });

  // Open the DevTools.
  mainWindow.webContents.openDevTools();

  // Emitted when the window is closed.
  mainWindow.on("closed", () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
  });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", createWindow);

// Quit when all windows are closed.
app.on("window-all-closed", () => {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  // On OS X it"s common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow();
  }
});

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.
