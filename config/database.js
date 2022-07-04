const mongoose = require("mongoose");

exports.connect = () => {
  // Connecting to the database
  mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost/kiddiepad')
    .then(() => {
      console.log("Successfully connected to database");
    })
    .catch((error) => {
      console.log("database connection failed. exiting now...");
      console.error(error);
      process.exit(1);
    });
};