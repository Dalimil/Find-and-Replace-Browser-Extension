// Sets up Google Analytics

class Analytics {
  constructor() {
    this.GA_TRACKING_ID = 'UA-82810279-4';
    this.GA_CLIENT_ID = "4FB5D5BF-B582-41AD-9BDF-1EC789AE6544"; //todo
    this.BASE_PARAMS = `v=1&tid=${GA_TRACKING_ID}&cid=${GA_CLIENT_ID}`;
    this.ANALYTICS_URL = "https://www.google-analytics.com/collect";
  }

  sendPageView(pageName) {
    const params = this.BASE_PARAMS + `&t=pageview&dp=%2F${pageName}&dh=${window.document.location.origin}`;
    this.sendRequest_(params);
  }
  
  sendEvent(eventCategory, eventAction) {
    const params = this.BASE_PARAMS + `&t=event&ec=${eventCategory}&ea=${eventAction}`;
    this.sendRequest_(params);
  }

  /**
   * Reports the event to Google Analytics
   */
  sendRequest_(message) {
    fetch(this.ANALYTICS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
      },
      body: message
    }).then(d => {
      console.log("done");
    }).catch(e => {
      console.log("aaaaaaa", e);
    });
  }
}

export default Analytics;
