var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
var cors = require("cors");

var indexRouter = require("./routes/index");
var usersRouter = require("./routes/users");
var apisRouter = require("./routes/api");

var app = express();

// Trust proxy để hỗ trợ ngrok và reverse proxy
// Cho phép đọc x-forwarded-* headers
app.set('trust proxy', true);

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

// CORS middleware - cho phép request từ mobile app
app.use(cors({
  origin: '*', // Cho phép tất cả origin (trong production nên giới hạn)
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Forwarded-For', 'X-Forwarded-Proto', 'X-Forwarded-Host'],
  credentials: true
}));

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use("/", indexRouter);
app.use("/users", usersRouter);
app.use("/api", apisRouter);

module.exports = app;
