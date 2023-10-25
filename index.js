const express = require("express");
const app = express();
require("dotenv").config();
const cors = require("cors");
const mongoose = require("mongoose");
const fileUpload = require("express-fileupload");
const admin = require("./routes/Admin");
const student = require("./routes/Student");
const auth = require("./routes/Auth");
const faculty = require("./routes/Faculty");

const PORT = 3000;

const url = process.env.API;
// const fs = require("fs");
// const path = require("path");

app.use(
  cors({
    // origin: "http://localhost:5173",
    // origin:'*',
    origin: "https://information-technology.netlify.app",
    methods: ["POST", "GET", "DELETE", "PUT","HEAD","PATCH"],
    credentials: true,
    optionSuccessStatus: 200,
  })
);

// Create a temporary directory if it doesn't exist
// const tempDirectory = path.join(__dirname, "temp"); // Use an absolute path
// if (!fs.existsSync(tempDirectory)) {
//   fs.mkdirSync(tempDirectory);
// }

app.use(express.json());

// app.use(
//   fileUpload({
//     useTempFiles: false, // Disable writing to disk (use memory storage)
//   })
// );

const options = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
};

mongoose
  .connect(url, options)
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.error("Error connecting to MongoDB:", err);
  });

app.use("/api/v1", admin);
app.use("/api/v2", student);
app.use("/api/v3", auth);
app.use("/api/v4", faculty);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
