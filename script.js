(function() {

  var __active_context_menu__ = null;
  var contextMenuId = "contextMenuId";

  function svg2pngCreateContextMenu() {
    chrome.contextMenus.create({
      id:       contextMenuId,
      title:    "Save as png",
      contexts: ["page", "link"],
      onclick:  function(info, tab) {
        chrome.tabs.sendMessage(tab.id, "svg2pngDidClick");
      },
    });
  }

  function svg2pngActivateContextMenu() {
    chrome.contextMenus.update(
      contextMenuId,
      {
        enabled: true,
      }
    );
  }

  function svg2pngDeactivateContextMenu() {
    chrome.contextMenus.update(
      contextMenuId,
      {
        enabled: false,
      }
    );
  }

  function svg2pngRemoveContextMenu() {
    chrome.contextMenus.remove(contextMenuId);
  }

  chrome.extension.onMessage.addListener(
    function(request, sender, sendResponse) {
      if (request == "onSVGDOMContentLoaded") {
        svg2pngCreateContextMenu();
      }
      // if (request == "onSVGMouseDown") {
      //   console.log('enabled');
      //   svg2pngActivateContextMenu();
      // } else if (request == "onOtherElMouseDown") {
      //   console.log('disabled');
      //   svg2pngDeactivateContextMenu();
      // } else {
      //   sendResponse({});
      // }
    }
  );

})();
