const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const path = require('path');

const accountSid = "AC8e87ebf0e117a6f0ae5fb5ccfe43a755";
const authToken ="75eddcb9d8e442e7c5a896589b9175b5";
const client = require('twilio')(accountSid, authToken);

app.use(bodyParser.json());

// Define route for the home page
app.get('/', (req, res) => {
  // Serve an HTML file as the home page
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/sendLocation', (req, res) => {
  const { latitude, longitude } = req.body;

  // Generate Google Maps link
  const googleMapsURL = `https://www.google.com/maps?q=${latitude},${longitude}`;

  // Send Twilio message with Google Maps link as the body
  client.messages
    .create({
      body: `Emergency situation! Location: ${googleMapsURL}`,
      from: '+12052878837',
      to: '+919896912271'
    })
    .then(message => {
      console.log('Twilio message sent:', message);
      res.status(200).send('Location received and Twilio message sent!');
    })
    .catch(error => {
      console.error('Failed to send Twilio message:', error);
      res.status(500).send('Failed to send Twilio message');
    });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
