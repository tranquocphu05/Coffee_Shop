// const mongoose = require("mongoose");
// require("dotenv").config();

// mongoose.connect(process.env.MONGOOSE_URL).catch((err) => {
//   console.log("Error connecting to database");
//   console.log(err.message);
// });

// module.exports = { mongoose };

const mongoose = require("mongoose");
require("dotenv").config();

mongoose.connect(process.env.MONGODB_URL_ATLAS).catch((err) => {
  console.log("Error connecting to database");
  console.log(err.message);
});

module.exports = { mongoose };
