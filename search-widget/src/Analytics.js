// Sets up Google Analytics

const GA_TRACKING_ID = 'UA-82810279-4';
const GA_CLIENT_ID = "4FB5D5BF-B582-41AD-9BDF-1EC789AE6544";
const BASE_PARAMS = `v=1&tid=${GA_TRACKING_ID}&cid=${GA_CLIENT_ID}`;

class Analytics {

  sendPageView(pageName) {
    const params = BASE_PARAMS + `&t=pageview&dp=%2F${pageName}&dh=find.and.replace.io`;
  }
  
  sendEvent(eventName, eventCategory, eventAction) {
    const params = BASE_PARAMS + `&t=event&ec=${eventCategory}&ea=${eventCategory}`;
  }

  /**
   * Reports the event to Google Analytics
   */
  _sendRequest(message) {
    try {
      let request = new XMLHttpRequest();
      const hitType = "event";
      let message =
        "v=1&tid=" + GA_TRACKING_ID + "&cid= " + GA_CLIENT_ID +
        "&ds=widget&t="+ hitType+"&ec=AAA&ea=" + aType;
  
      request.open("POST", "https://www.google-analytics.com/collect", true);
      request.send(message);
    } catch (e) {
      this._log("Error sending report to Google Analytics.\n" + e);
    }
  }
}
