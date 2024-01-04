const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const User = require("./models/user");
require("dotenv").config();
const bcrypt = require("bcrypt");
const cookieParser = require("cookie-parser");
const app = express();
app.use(express.json());
const mongoose = require("mongoose");
const userRoutes = require("./routes/userRoutes");
app.use("/user", userRoutes);
app.use(cookieParser());
// Access the environment variables
const username = process.env.DB_USERNAME;
const password = process.env.DB_PASSWORD;
const databaseName = process.env.DATABASE_NAME;

const uri = `mongodb+srv://${username}:${password}@cluster0.umdhume.mongodb.net/${databaseName}?retryWrites=true&w=majority`;

mongoose
  .connect(uri)
  .then(() => {
    console.log("Connected to MongoDB Atlas");
  })
  .catch((err) => {
    console.error("Error connecting to MongoDB Atlas:", err);
  });

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});
app.get("/signin", (req, res) => {
  res.sendFile(path.join(__dirname, "signin.html"));
});
app.get("/about", (req, res) => {
  res.sendFile(path.join(__dirname, "about.html"));
});

app.get("/signup", (req, res) => {
  res.sendFile(path.join(__dirname, "signup.html"));
});

// Middleware function to check authentication
const checkAuth = (req, res, next) => {
  // Check if the userId cookie exists
  if (req.cookies.userId) {
    return next(); // Proceed to the next middleware or route handler
  } else {
    // If the userId cookie doesn't exist, the user is not authenticated
    return res.status(401).json({ error: "Unauthorized: User not logged in" });
  }
};

// Dashboard route that requires authentication
app.get("/dashboard", checkAuth, (req, res) => {
  // If the checkAuth middleware allows access, render the dashboard page or perform necessary actions
  res.sendFile(path.join(__dirname, "dashboard.html"));
});

// Signup Route
app.post("/signup", async (req, res) => {
  const { username, password, name } = req.body;

  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: "Username already exists" });
    }
    const user = new User({ username, password, name });
    await user.save();
    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    
    console.error("Error:", error);
    res.status(500).json({ error: "Failed to register user" });
  }
});
//signin route
app.post("/signin", async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ error: "Invalid username or password" });
    } 
    // Delete existing userId cookie if it exists
    res.clearCookie("userId");

    const oneYearInSeconds = 365 * 24 * 60 * 60; 
    const expirationDate = new Date(Date.now() + oneYearInSeconds * 1000); // Convert seconds to milliseconds
    // Set the new cookie with an expiration time of one year
    res.cookie("userId", user._id.toString(), { 
      expires: expirationDate, 
      path: '/' // Set the path of the cookie to root ('/') for site-wide access
    });
    
    console.log("Cookie Set:", user._id.toString()); // Log the user ID after setting the cookie

    res.status(200).json({ message: "Login successful" });
  } catch (error) {
    console.error("Error during authentication:", error);
    res.status(500).json({ error: "Failed to authenticate" });
  }
});


app.post('/sendLocation', async (req, res) => {
  const { message,latitude, longitude, userId } = req.body; // Assuming userId is provided in the request

  try {
    // Fetch user details from the database based on userId
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).send('User not found');
    }

    const userMobileNumber = `+91${user.mobileNumber}`;
    const userName = user.name;

    // Generate Google Maps link
    const googleMapsURL = `https://www.google.com/maps?q=${latitude},${longitude}`;

    // Send Twilio message with Google Maps link as the body to the user's mobile number
    const accountSid = process.env.ACCOUNT_SID;
    const authToken = process.env.AUTH_TOKEN;
    const client = require('twilio')(accountSid, authToken);

    client.messages
      .create({
        body: `Emergency situation for ${userName}! ${message} Location: ${googleMapsURL}`,
        from: '+12052878837',
        to: userMobileNumber, 
      })
      .then((message) => {
        console.log('Twilio message sent:', message);
        res.status(200).send('Location received, and Twilio message sent!');
      })
      .catch((error) => {
        console.error('Failed to send Twilio message:', error);
        res.status(500).send('Failed to send Twilio message');
      });
  } catch (error) {
    console.error('Error fetching user details:', error);
    res.status(500).send('Error fetching user details');
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
