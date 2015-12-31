/**
 * Add a listener on install that matches page states, only running the actions
 * array if the URL matches our desired GOLD Schedule URL
 *  - result: displays the icon in address bar to indicate script is active
 */
chrome.runtime.onInstalled.addListener(function() {
    chrome.declarativeContent.onPageChanged.removeRules(undefined, function() {
        chrome.declarativeContent.onPageChanged.addRules([{
            conditions: [
                new chrome.declarativeContent.PageStateMatcher({
                    pageUrl: {
                      urlEquals: 'https://my.sa.ucsb.edu/gold/StudentSchedule.aspx'
                    }
                })
            ],
            actions: [new chrome.declarativeContent.ShowPageAction()]
        }]);
    });
});
