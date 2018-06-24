const functions = require('firebase-functions');
const stripe = require('stripe')(functions.config().keys.webhooks);
const admin = require('firebase-admin');

admin.initializeApp();
const endpointSecret = functions.config().keys.signing;

exports.events = functions.https.onRequest((request, response) => {

  let sig = request.headers["stripe-signature"];

  try {
    
    let event = stripe.webhooks.constructEvent(request.rawBody, sig, endpointSecret); // Validate the request
    
    return admin.database().ref('/events').push(event) // Add the event to the database
      .then((snapshot) => {
        // Return a successful response to acknowledge the event was processed successfully
        return response.json({ received: true, ref: snapshot.ref.toString() });
      })
      .catch((err) => {
        console.error(err) // Catch any errors saving to the database
        return response.status(500).end();
      });
  }
  catch (err) {
    return response.status(400).end(); // Signing signature failure, return an error 400
  }
  
});

exports.exampleDatabaseTrigger = functions.database.ref('/events/{eventId}').onCreate((snapshot, context) => {
  return console.log({
    eventId: context.params.eventId,
    data: snapshot.val()
  });
});
