/**
 * @name MaximalizeStreamPreview
 * @author filyyyp
 * @description Maximalize stream previews when screen sharing with multiple users
 * @version 1.0.0
 * @authorLink https://github.com/filyyyp
 * @website https://github.com/filyyyp
 * @donate https://www.paypal.com/paypalme/filyyyp
 * @source https://raw.githubusercontent.com/filyyyp/BetterDiscordPlugins/main/MaximalizeStreamPreview/MaximalizeStreamPreview.plugin.js
 */

const fs = require("fs");
const path = require("path");
const request = require("request");

const config = {
    "info": {
        "name": "MaximalizeStreamPreview",
        "authors": [{
            "name": "filyyyp",
            "discord_id": "502542771186565120",
            "github_username": "filyyyp"
        }],
        "version": "1.0.0",
        "description": "Maximalize stream previews when screen sharing with multiple users.",
        "github": "https://github.com/filyyyp",
        "github_raw": "https://raw.githubusercontent.com/filyyyp/BetterDiscordPlugins/main/MaximalizeStreamPreview/MaximalizeStreamPreview.plugin.js"
    },
    "changelog": [
        { "title": "Updates!", "items": ["Release", ""] },
    ],
    "main": "MaximalizeStreamPreview.js"
};

var settings = {
    "setNamesVisibility": {
        "title": "Show pernamently names of streamers",
        "description": "Showing names of streamers pernamently, with red color and bigger font. Work only in fullscreen.",
        "value": true
    },
    "changeSizesOfstreams": {
        "title": "Change sizes of streams",
        "description": "Change sizes of stream windows, up to 4 streams. Work only in fullscreen",
        "value": true
    }
}

module.exports = !global.ZeresPluginLibrary ? class {
    constructor() {
        this._config = config;
    }

    load() {
        BdApi.showConfirmationModal("Library plugin is needed",
            `ZeresPluginLibrary is missing. Please click Download Now to install it.`, {
            confirmText: "Download",
            cancelText: "Cancel",
            onConfirm: () => {
                request.get("https://rauenzi.github.io/BDPluginLibrary/release/0PluginLibrary.plugin.js", (error, response, body) => {
                    if (error) {
                        return electron.shell.openExternal("https://github.com/rauenzi/BDPluginLibrary");
                    }
                    fs.writeFileSync(path.join(BdApi.Plugins.folder, "0PluginLibrary.plugin.js"), body);
                });
            }
        });

        BdApi.showConfirmationModal("Library plugin is needed",
        `HideStreamPreview is missing. Please click Download Now to install it.`, {
        confirmText: "Download",
        cancelText: "Cancel",
        onConfirm: () => {
            request.get("https://raw.githubusercontent.com/danegottwald/BetterDiscordPlugins/main/HideStreamPreview/HideStreamPreview.plugin.js", (error, response, body) => {
                if (error) {
                    return electron.shell.openExternal("https://github.com/rauenzi/BDPluginLibrary");
                }
                fs.writeFileSync(path.join(BdApi.Plugins.folder, "HideStreamPreview.plugin.js"), body);
            });
        }
    });
    }

    start() { }

    stop() { }

} : (([Plugin, Library]) => {
    const {
        DiscordModules: { UserInfoStore, SelectedGuildStore, SelectedChannelStore, StreamStore, UserNameResolver, UserStore },
        Settings,
        PluginUpdater,
        PluginUtilities,
    } = Library;

    return class MaximalizeStreamPreview extends Plugin {
        load() {
        }

        unload() {
        }

        onStart() {
            // Check for Plugin Updates
            PluginUpdater.checkForUpdate(this.getName(), this.getVersion(), "https://raw.githubusercontent.com/filyyyp/BetterDiscordPlugins/main/MaximalizeStreamPreview/MaximalizeStreamPreview.plugin.js");

            // Load Settings from Config on Startup
            Object.entries(PluginUtilities.loadData("MaximalizeStreamPreview", "settings", {})).forEach(([setting, value]) => {
                settings[setting]["value"] = value
            });
        }

        onStop() {
        }

        getSettingsPanel() {
            // Dynamically create settings panel depending on the keys in the 'settings' dictionary
            var panel = new Settings.SettingPanel();
            Object.entries(settings).forEach(([setting, content]) => {
                panel.append(
                    new Settings.Switch(
                        content["title"], content["description"], content["value"],
                        (val) => {
                            settings[setting]["value"] = val;
                            PluginUtilities.saveSettings("MaximalizeStreamPreview", { [setting]: val });
                        }
                    )
                );
            });

            return panel.getElement();
        }

        // Hide stream preview when the wrapper for the video tiles is targeted
        observer(e) {
            if (e.target.tagName == "DIV" && e.target.className.includes("previewWrapper")) {

                if (this._isFulscreeen()) {
                    this._changeSizeOfStreams();
                    this._setNamesVisibility();
                    this._fix4costreamMash();
                }
            }
        }

        _changeSizeOfStreams() {
            if (!settings["changeSizesOfstreams"]["value"]) {
                return;
            }

            let numberOfStreams = document.getElementsByClassName("tile-kezkfV").length - 1;
            let sizeOfStreamWindow;
            switch (numberOfStreams) {
                case 2:
                case 3:
                case 4:
                    sizeOfStreamWindow = this.calculateScreenWidthSize();
                    break;
                default:
                    return;
            }

            document.getElementsByClassName('listItems-1uJgMC')[0].style.inset = 0;

            [...document.getElementsByClassName("tile-kezkfV")].forEach(s => {
                if (s.style) {
                    s.style.display == 'none' ? '' : s.width('' + sizeOfStreamWindow + 'px');
                }
            });
        }

        /**
         * Calculation of maximal size of stream windows
         * @returns width of stream window
         */
        calculateScreenWidthSize() {
            let sizeOfStreamWindowWidth = window.screen.width / 2;
            let sizeOfStreamWindowHeight = sizeOfStreamWindowWidth / (16 / 9);
            if (sizeOfStreamWindowHeight <= window.screen.height / 2) {
                return sizeOfStreamWindowWidth;
            } 
            //Non standart resolution (non 16:9)
            else {
                return (window.screen.height / 2) * (16 / 9);
            }
        }

        _fix4costreamMash() {
            if(StreamStore.getAllActiveStreams().length == 5){
                if(Array.from(document.getElementsByClassName('row-22hXsA'))[0].childElementCount == 3){
                    let h = Array.from(document.getElementsByClassName('tile-kezkfV'));
                    h[h.length-1].after(h[0]);
                }  
            }
        }

        _setNamesVisibility() {
            if (!settings["setNamesVisibility"]["value"]) {
                return;
            }


            [...document.getElementsByClassName("overlayTitle-8IcS01")].forEach(s => {
                if (s.style) {
                    s.style.opacity = 1
                }
            });

            [...document.getElementsByClassName("overlayTitleText-2mmQzi")].forEach(s => {
                if (s.style) {
                    s.style.color = 'red';
                    s.style.fontSize = '1.3rem';
                    s.opacity = 1
                }
            });
        }

        _isFulscreeen() {
            return window.innerHeight == screen.height;
        }
    };

})(global.ZeresPluginLibrary.buildPlugin(config));
