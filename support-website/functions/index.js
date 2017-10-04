// The Cloud Functions for Firebase SDK to create Cloud Functions and setup triggers.
const functions = require('firebase-functions');

// The Firebase Admin SDK to access the Firebase Realtime Database. 
const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);

// Inserts feedback message into our real time database
function submitFeedback(endpointRef, feedbackMessage) {
  if (!feedbackMessage) {
    return Promise.resolve(400);
  }
  return admin.database().ref(endpointRef).push({
    message: feedbackMessage,
    timestamp: Date.now(),
    timedate: new Date().toLocaleString()
  })
  .then(() => 200);
}

exports.submitUninstallFeedback = functions.https.onRequest((req, res) => {
  const statusPromise = submitFeedback('/feedback/uninstall', JSON.parse(req.body).feedback);
  statusPromise.then(status => {
    res.status(status).end();
  });
});

exports.submitGeneralFeedback = functions.https.onRequest((req, res) => {
  const statusPromise = submitFeedback('/feedback/general', JSON.parse(req.body).feedback);
  statusPromise.then(status => {
    res.status(status).end();
  });
});

