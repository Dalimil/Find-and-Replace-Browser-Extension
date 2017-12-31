// Google Analytics

import Storage from './Storage';
import Logger from './Logger';
import ConnectionApi from './ConnectionApi';

class Analytics {
  constructor() {
    this.GA_TRACKING_ID = 'UA-82810279-4';
    this.ANALYTICS_URL = "https://www.google-analytics.com/collect";

    ConnectionApi.addResponseHandler(msg => {
      if (msg.analytics) {
        let pageType = msg.analytics.domain || '';
        if (msg.analytics.isExtensionPage) {
          pageType = '(extension-page)-' + pageType;
        } else if (msg.analytics.isLocalFilePage) {
          pageType = '(local-file)';
        }
        this.sendEvent('domain', `domain-${pageType}`);
      }
    });
  }

  getBaseParams_(clientId) {
    return `v=1&tid=${this.GA_TRACKING_ID}&cid=${clientId}`;
  }

  sendPageView(pageName) {
    this.sendRequest_(`t=pageview&dp=%2F${pageName}&dh=find.and.replace.io`);
  }
  
  sendEvent(eventCategory, eventAction) {
    this.sendRequest_(`t=event&ec=${eventCategory}&ea=${eventAction}`);
  }

  /**
   * Reports the event to Google Analytics
   */
  sendRequest_(additionalParams) {
    Promise.all([
      Storage.isAnalyticsEnabled(),
      Storage.getClientId()
    ]).then(([analyticsEnabled, clientId]) => {
      if (!analyticsEnabled) {
        Logger.log("Blocked Analytics: " + additionalParams);
        return;
      }
      const params = this.getBaseParams_(clientId) + "&" + additionalParams;
      fetch(this.ANALYTICS_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
        },
        body: params
      }).then(() => {
        Logger.log("Analytics sent: ", additionalParams);
      }).catch(e => { /* Fail silently */ });
    });
  }
}

const MyAnalytics = new Analytics();
export default MyAnalytics;
