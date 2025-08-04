"use strict";
/*
Special thanks to the author of the vscode wal theme for the inspiration and the
code https://github.com/dlasagno/vscode-wal-theme I managed to make it work
somehow, but I'm not sure if it's the best way to do it.
- khing
*/
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const chokidar = __importStar(require("chokidar"));
const fs = __importStar(require("fs"));
const os = __importStar(require("os"));
const path = __importStar(require("path"));
const vscode = __importStar(require("vscode"));
const walCachePath = path.join(os.homedir(), '.cache', 'hyde', 'wallbash', 'code.json');
const targetPath = path.join(__dirname, '..', 'themes', 'wallbash.json');
const XDG_CONFIG_HOME = process.env.XDG_CONFIG_HOME || path.join(os.homedir(), '.config');
let autoUpdateWatcher = null;
function activate(context) {
    // Register the update command
    let disposable = vscode.commands.registerCommand('wallBash.reload', () => enforceWallbashTheme(true), populateColorThemes);
    context.subscriptions.push(disposable);
    // Ensure the directory for walCachePath exists
    const walCacheDir = path.dirname(walCachePath);
    if (!fs.existsSync(walCacheDir)) {
        fs.mkdirSync(walCacheDir, { recursive: true });
    }
    // Handle missing cache
    if (!fs.existsSync(walCachePath)) {
        fs.copyFile(targetPath, walCachePath, (err) => {
            if (err) {
                vscode.window.showErrorMessage(`Failed to initilize cache: ${err}`);
            }
        });
    }
    initializeWallTemplates(vscode.workspace.getConfiguration().get('wallBash.enableThemeMode') ??
        false);
    // Start the auto update if enabled
    if (vscode.workspace.getConfiguration().get('wallBash.autoUpdate')) {
        enforceWallbashTheme();
        populateColorThemes();
        autoUpdateWatcher = autoUpdate();
    }
    // Toggle the auto update in real time when changing the extension
    // configuration
    vscode.workspace.onDidChangeConfiguration(event => {
        initializeWallTemplates(vscode.workspace.getConfiguration().get('wallBash.enableThemeMode') ??
            false);
        if (event.affectsConfiguration('wallBash.autoUpdate')) {
            if (vscode.workspace.getConfiguration().get('wallBash.autoUpdate')) {
                if (autoUpdateWatcher === null) {
                    autoUpdateWatcher = autoUpdate();
                }
            }
            else if (autoUpdateWatcher !== null) {
                autoUpdateWatcher.close();
                autoUpdateWatcher = null;
            }
        }
    });
}
/**
 * Deactivates the extension
 * Closes the watcher if active
 */
function deactivate() {
    // Close the watcher if active
    if (autoUpdateWatcher !== null) {
        autoUpdateWatcher.close();
    }
}
/**
 * Enforces the Wallbash theme
 */
function enforceWallbashTheme(force = false) {
    const currentTheme = vscode.workspace.getConfiguration('workbench')
        .get('colorTheme') ??
        undefined;
    if ((currentTheme !== 'Wallbash' && force) || !currentTheme ||
        currentTheme === '') {
        vscode.workspace.getConfiguration('workbench')
            .update('colorTheme', 'Wallbash', vscode.ConfigurationTarget.Global)
            .then(() => {
            // vscode.window.showInformationMessage('Color theme updated to
            // Wallbash');
            console.log('Color theme updated to Wallbash');
        }, (err) => {
            // Handle the error
            vscode.window.showErrorMessage(`Failed to set color theme: ${err}`);
        });
    }
}
/**
 * Populates the color themes from the wal color palette
 */
function populateColorThemes() {
    // Basically will copy from cache to targetPath
    fs.copyFile(walCachePath, targetPath, (err) => {
        if (err) {
            vscode.window.showErrorMessage(`Failed to copy the color palette: ${err}`);
        }
    });
    enforceWallbashTheme();
}
/**
 * Initializes the wallbash templates
 * @param enableThemeMode Whether to enable the theme mode
 */
function initializeWallTemplates(enableThemeMode) {
    // This is use for Old Hyprdots
    const td = fs.existsSync(path.join(XDG_CONFIG_HOME, 'hyde', 'wallbash', 'theme')) ?
        'theme' :
        'Wall-Dcol';
    const ad = fs.existsSync(path.join(XDG_CONFIG_HOME, 'hyde', 'wallbash', 'theme')) ?
        'theme' :
        'Wall-Ways';
    const templateSource = path.join(__dirname, '..', 'wallbash', 'code.dcol');
    const wallWaysDir = path.join(XDG_CONFIG_HOME, 'hyde', 'wallbash', ad);
    const wallDcolDir = path.join(XDG_CONFIG_HOME, 'hyde', 'wallbash', td);
    if (enableThemeMode) {
        console.log('Theme Mode enabled');
        if (vscode.workspace.getConfiguration().get('wallbash.debug')) {
            vscode.window.showInformationMessage('Theme Mode enabled\nPlease refresh Theme manually');
        }
        if (!fs.existsSync(wallDcolDir)) {
            vscode.window.showInformationMessage('Wall-Dcol directory does not exist!\n Is HyDE installed?');
            return;
        }
        fs.copyFile(templateSource, path.join(wallDcolDir, 'code.dcol'), (err) => {
            if (err) {
                vscode.window.showErrorMessage(`Failed to copy the template: ${err}`);
            }
        });
        if (fs.existsSync(path.join(wallWaysDir, 'code.dcol'))) {
            fs.unlink(path.join(wallWaysDir, 'code.dcol'), (err) => {
                if (err) {
                    vscode.window.showErrorMessage(`Failed to remove the file: ${err}`);
                }
            });
        }
    }
    else {
        console.log('Dynamic Wallpaper Mode enabled');
        if (vscode.workspace.getConfiguration().get('wallbash.debug')) {
            vscode.window.showInformationMessage('Dynamic Mode enabled\nPlease refresh Theme/Wallpaper manually');
        }
        if (!fs.existsSync(wallWaysDir)) {
            vscode.window.showInformationMessage('Wall-Ways directory does not exist!\n Is HyDE installed?');
            return;
        }
        fs.copyFile(templateSource, path.join(wallWaysDir, 'code.dcol'), (err) => {
            if (err) {
                vscode.window.showErrorMessage(`Failed to copy the template: ${err}`);
            }
        });
        if (fs.existsSync(path.join(wallDcolDir, 'code.dcol'))) {
            fs.unlink(path.join(wallDcolDir, 'code.dcol'), (err) => {
                if (err) {
                    vscode.window.showErrorMessage(`Failed to remove the file: ${err}`);
                }
            });
        }
    }
}
/**
 * Automatically updates the theme when the color palette changes
 * @returns The watcher for the color palette
 */
function autoUpdate() {
    // Watch for changes in the color palette of wal
    return chokidar.watch(walCachePath, { persistent: true }).on('change', () => {
        console.log('Detected change in wal color palette');
        fs.readFile(walCachePath, 'utf8', (err, data) => {
            if (err) {
                vscode.window.showErrorMessage(`Failed to read the color palette: ${err}`);
                return;
            }
            // Check if the data contains the pattern <wallbash_*>
            const pattern = /<wallbash_[^>]+>/;
            if (!pattern.test(data)) {
                populateColorThemes();
            }
            else {
                console.log('Dumb copy');
            }
        });
    });
}
//# sourceMappingURL=extension.js.map