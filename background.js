var starredTabs = {};

function updateIcon(info) {
	var tabID = info.tabId.toString();
	var starred = starredTabs[tabID];
	chrome.browserAction.setIcon({ path: starred ? "image/starred.png" : "image/unstarred.png" });
	chrome.browserAction.setTitle({ title: starred ? "Unstar current tab" : "Star current tab" });
}

function toggleStar(tab) {
	var tabID = tab.id.toString();
	starredTabs[tabID] = !starredTabs[tabID];
	updateIcon({ tabId: tab.id, windowId: tab.windowId });
}

function iniTab(tab) {
	starredTabs[tab.id.toString()] = false;
	updateIcon({ tabId: tab.id, windowId: tab.windowId });
}

chrome.tabs.onCreated.addListener(iniTab);
chrome.tabs.onActivated.addListener(updateIcon);
chrome.browserAction.onClicked.addListener(toggleStar);

// close all unstarred tabs
chrome.commands.onCommand.addListener(function(command){
	if(command == "close-unstarred")
	{
		chrome.tabs.getAllInWindow(null, function(tabs){
	    for (var i = 0; i < tabs.length; i++)
	    {
	    	var tabID = tabs[i].id.toString();
	    	if(!starredTabs[tabID]){
	    		chrome.tabs.remove(tabs[i].id);
	    	}
	    }});
	}
	else if(command == "toggle-star")
	{
		chrome.tabs.query({ currentWindow: true, active: true }, function(tabs) {
			toggleStar(tabs[0]);
		});
	}
});