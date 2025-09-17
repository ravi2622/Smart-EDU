// // server.js
// require('dotenv').config();
// const express = require('express');
// const mongoose = require('mongoose');
// const session = require('express-session');
// const passport = require('passport');
// const flash = require('connect-flash');
// const methodOverride = require('method-override');
// const path = require('path');

// // Import routes
// const authRoutes = require('./routes/auth');
// const dashboardRoutes = require('./routes/dashboard');
// const notesRoutes = require('./routes/notes');
// const quizRoutes = require('./routes/quiz');
// const aiRoutes = require('./routes/ai');
// const forumRoutes = require('./routes/forum');

// // Import passport config
// require('./config/passport')(passport);

// const app = express();

// // Database connection
// mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-education-platform')
//   .then(() => console.log('MongoDB connected'))
//   .catch(err => console.log(err));

// // EJS
// app.use(express.static(path.join(__dirname, 'public')));
// app.set('view engine', 'ejs');

// // Body parser middleware
// app.use(express.urlencoded({ extended: true }));
// app.use(express.json());
// app.use(methodOverride('_method'));

// // Express session
// app.use(session({
//   secret: process.env.SESSION_SECRET || 'secret',
//   resave: true,
//   saveUninitialized: true
// }));

// // Passport middleware
// app.use(passport.initialize());
// app.use(passport.session());

// // Connect flash
// app.use(flash());

// // Global variables
// app.use((req, res, next) => {
//   res.locals.success_msg = req.flash('success_msg');
//   res.locals.error_msg = req.flash('error_msg');
//   res.locals.error = req.flash('error');
//   res.locals.user = req.user || null;
//   next();
// });

// // Routes
// app.use('/', authRoutes);
// app.use('/dashboard', dashboardRoutes);
// app.use('/notes', notesRoutes);
// app.use('/quiz', quizRoutes);
// app.use('/ai', aiRoutes);
// app.use('/forum', forumRoutes);

// // Home route
// app.get('/', (req, res) => {
//   res.render('index');
// });

// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });





// server.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const flash = require('connect-flash');
const methodOverride = require('method-override');
const path = require('path');

// Passport Config
require('./config/passport')(passport);

const app = express();

// --------------------
// Database Connection
// --------------------
mongoose
  .connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-education-platform', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('✅ MongoDB connected'))
  .catch((err) => console.error('❌ MongoDB connection error:', err));

// --------------------
// Middleware
// --------------------

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// View engine
app.set('view engine', 'ejs');

// Body parser
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Method override (for PUT/DELETE via forms)
app.use(methodOverride('_method'));

// Express session
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'supersecretkey',
    resave: false, // better performance
    saveUninitialized: false, // only save when something is stored
  })
);

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Connect flash
app.use(flash());

// Global variables (accessible in all EJS templates)
app.use((req, res, next) => {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.error = req.flash('error'); // passport errors
  res.locals.user = req.user || null;
  next();
});

// --------------------
// Routes
// --------------------
app.use('/', require('./routes/auth'));
app.use('/dashboard', require('./routes/dashboard'));
app.use('/notes', require('./routes/notes'));
app.use('/quiz', require('./routes/quiz'));
app.use('/ai', require('./routes/ai'));
app.use('/forum', require('./routes/forum'));
app.use('/forgot-password', require('./routes/forgotPassword'));

// Home page
app.get('/', (req, res) => {
  res.render('index');
});

// --------------------
// Server Start
// --------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
