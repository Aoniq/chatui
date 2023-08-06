const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const http = require('http');
const socketIO = require('socket.io');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
let mysql = require('mysql2')
let pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'Bakugan%10',
  database: 'chatui',
  connectionLimit: 100
})

const indexRouter = require('./routes/index');
const authRouter = require('./routes/auth');
const chatRouter = require('./routes/chat');
const apiRouter = require('./routes/api')

const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Configure the MySQL session store
const sessionStore = new MySQLStore({
  expiration: 86400000, // 1 day in milliseconds
  endConnectionOnClose: true,
  createDatabaseTable: true,
  schema: {
    tableName: 'sessions',
    columnNames: {
      session_id: 'session_id',
      expires: 'expires',
      data: 'data'
    }
  }
}, pool);

const sessionMiddleware = session({
  secret: 'your_secret_key',
  resave: true,
  saveUninitialized: true,
  store: sessionStore,
  cookie: {
    maxAge: 86400000 // 1 day in milliseconds
  }
})

app.use(sessionMiddleware);

app.use('/', indexRouter);
app.use('/auth', authRouter);
app.use('/api', apiRouter)
const server = http.createServer(app);
const io = socketIO(server);

// Pass the session middleware to socket.io


io.engine.use(sessionMiddleware);

// Pass the io instance to the chat router
app.use('/chat', chatRouter(io));

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`App listening on port ${port}`);
});
