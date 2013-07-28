// "if a tab is starred?" lookup
// tab id -> boolean
var starredTabs = {};
// "what's the url for this tab?" lookup
// useful because after tabs are removed, their urls are no longer accessible
// tab id -> url string
var tabToUrl = {};
// "is a url previously starred?" lookup
// Note: only saves on window close, not tab close
// urls string -> boolean
var urls = {};

// update the icon according to starredTabs
function updateIcon(info) {
    chrome.tabs.get(info.tabId, function(tab) {
        // if url gets starred elsewhere, should reflect star status without the need to update(refresh)
        if(typeof urls[tab.url] != "undefined" && urls[tab.url]) {
            starredTabs[tab.id.toString()] = true;
            //console.log("Tab has url " + tab.url + " and star status is " + starredTabs[tab.id.toString()]);
        };
        var starred = starredTabs[info.tabId.toString()];
        // update icon and title
        if (typeof starred != "undefined" && starred) {
            chrome.browserAction.setIcon({ path: "image/starred.png" });
            chrome.browserAction.setTitle({ title: "Unstar current tab" });
        }
        else {
            chrome.browserAction.setIcon({ path: "image/unstarred.png" });
            chrome.browserAction.setTitle({ title: "Star current tab" });
        }
    });
}

// toggle star status of given tab
function toggleStar(tab) {
	var tabId = tab.id.toString();
    starredTabs[tabId] = !starredTabs[tabId];
    if(!starredTabs[tabId]) {
        delete urls[tab.url];
    }
    else {
        urls[tab.url] = true;
    }
    chrome.storage.local.set({"saved-urls": urls}, null);
    updateIcon({ tabId: tab.id, windowId: tab.windowId });
}

// initialize tab, default is unstarred except if url is saved
function iniTab(tab) {
	chrome.tabs.get(tab.id, function(tab) {
		var tabId = tab.id.toString();
		if(typeof urls[tab.url] != "undefined" && urls[tab.url]) {
			starredTabs[tabId] = true;
		}
		else {
			starredTabs[tabId] = false;
		}
	});
    chrome.storage.local.set({"saved-urls": {} });
    // chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    //     var tab = tabs[0];
    //     updateIcon({ tabId: tab.id, windowId: tab.windowId });
    // });
}

// if window is closing, save url of starred tabs into storage
function saveStarred(tabId, info) {
    var url = tabToUrl[tabId.toString()];
    if (info.isWindowClosing && starredTabs[tabId]) {
        if (typeof url != "undefined") {
            urls[url] = true;
            chrome.storage.local.set({"saved-urls": urls}, null);
        }	
    }
    else {
        delete urls[url];
        chrome.storage.local.set({"saved-urls": urls}, null);
    }
}

// update the tab to url lookup once a tab finishes loading
function updateTab(tabId, changeInfo, tab) {
    if (typeof tab.url != "undefined") {
        if (tab.url == "chrome://newtab" || typeof tab.url == "undefined") {
            starredTabs[tabId.toString()] = false;
        }
        else if (changeInfo.status == "complete") {
            tabToUrl[tabId.toString()] = tab.url;
            updateIcon({ tabId: tab.id, windowId: tab.windowId });
        }
    }
}

// update icon upon window focus change
function updateWindowFocusChange(windowId) {
    chrome.tabs.query({ windowId: windowId, active: true }, function(tabs) {
        var tab = tabs[0];
        updateIcon({ tabId: tab.id, windowId: tab.windowId });
    });
}

// load storage data to urls
function loadUrlsFromStorage() {
    chrome.storage.local.get("saved-urls", function(resultUrls) {
        if (typeof resultUrls["save-urls"] != "undefined")
            urls = resultUrls["saved-urls"];
    });
}

// save urls to storage when window is closing
function saveUrlsOnWindowClosing(windowId) {
    chrome.storage.local.set({"saved-urls": urls}, null);
}

// react to keyboard shortcuts
function handleCommands(command) {
    if (command == "close-unstarred") {
        chrome.tabs.query({ currentWindow: true }, function (tabs) {
            for (var i = 0; i < tabs.length; i++) {
                var tabId = tabs[i].id.toString();
                if (!starredTabs[tabId]) {
                    chrome.tabs.remove(tabs[i].id);
                }
            }
        });
    }
    else if (command == "toggle-star") {
        chrome.tabs.query({
            currentWindow: true,
            active: true
        }, function (tabs) {
            toggleStar(tabs[0]);
        });
    }
}

loadUrlsFromStorage();
// tab level
chrome.tabs.onCreated.addListener(iniTab);
chrome.tabs.onActivated.addListener(updateIcon);
chrome.tabs.onUpdated.addListener(updateTab);
chrome.tabs.onRemoved.addListener(saveStarred);

// window level
chrome.windows.onFocusChanged.addListener(updateWindowFocusChange);
chrome.windows.onRemoved.addListener(saveUrlsOnWindowClosing);

// functionality
chrome.browserAction.onClicked.addListener(toggleStar);
chrome.commands.onCommand.addListener(handleCommands);