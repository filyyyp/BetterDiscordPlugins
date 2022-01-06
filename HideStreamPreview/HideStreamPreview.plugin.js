/**
 * @name HideStreamPreview
 * @author blurrpy
 * @description Hide your own stream preview in multistream calls.
 * @version 0.0.6
 * @authorLink https://github.com/danegottwald
 * @website https://github.com/danegottwald
 * @donate https://www.paypal.com/paypalme/danegottwald
 * @source https://raw.githubusercontent.com/danegottwald/BetterDiscordPlugins/main/HideStreamPreview/HideStreamPreview.plugin.js
 */

const fs = require("fs");
const path = require("path");
const request = require("request");

const config = {
    "info": {
        "name": "HideStreamPreview",
        "authors": [{
            "name": "blurrpy",
            "discord_id": "154401402263699457",
            "github_username": "danegottwald"
        }],
        "version": "0.0.6",
        "description": "Hide your own stream preview when screen sharing with multiple users",
        "github": "https://github.com/danegottwald",
        "github_raw": "https://raw.githubusercontent.com/danegottwald/BetterDiscordPlugins/main/HideStreamPreview/HideStreamPreview.plugin.js"
    },
    "changelog": [
        { "title": "Updates!", "items": ["Removed deprecated DiscordAPI use", "Bug fixes"] },
    ],
    "main": "HideStreamPreview.js"
};

var settings = {
    "showWhenLowStreams": {
        "title": "Show Own Stream At Low Stream Count (1-2 streams)",
        "description": "Display stream preview until 3 streams are active",
        "value": true
    },
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

    return class HideStreamPreview extends Plugin {
        load() {
        }

        unload() {
        }

        onStart() {
            // Check for Plugin Updates
            PluginUpdater.checkForUpdate(this.getName(), this.getVersion(), "https://raw.githubusercontent.com/danegottwald/BetterDiscordPlugins/main/HideStreamPreview/HideStreamPreview.plugin.js");

            // Load Settings from Config on Startup
            Object.entries(PluginUtilities.loadData("HideStreamPreview", "settings", {})).forEach(([setting, value]) => {
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
                            PluginUtilities.saveSettings("HideStreamPreview", { [setting]: val });
                        }
                    )
                );
            });

            return panel.getElement();
        }

        // Hide stream preview when the wrapper for the video tiles is targeted
        observer(e) {
            if (e.target.tagName == "DIV" && e.target.className.includes("previewWrapper")) {
                this._hideStreamPreview();

                if (this._isFulscreeen()) {
                    this._changeSizeOfStreams();
                    this._setNamesVisibility();
                    this._fix4costreamMash();
                }
            }
        }

        _hideStreamPreview() {
            // Get username/nickname
            let username = UserNameResolver.getName(SelectedGuildStore.getGuildId(), SelectedChannelStore.getChannelId(), UserStore.getUser(UserInfoStore.getId()));

            // Only hide stream preview if there are three or more streams OR if setting is false
            if (!settings["showWhenLowStreams"]["value"] || StreamStore.getAllActiveStreams().length >= 3) {
                // Grab the 'span' element that refers to the current user
                let element = Array.from(document.getElementsByTagName('span')).find(span =>
                    (span.textContent == username && span.className.includes("overlayTitleText"))
                )
                // Locate the parent div container for the stream tile
                while (element && !element.classList.contains("tile-kezkfV")) {
                    element = element.parentElement;
                }
                // Hide the element if it exists
                if (element != null) {
                    element.style.display = "none";
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
