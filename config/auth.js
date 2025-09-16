// config/auth.js
module.exports = {
  ensureAuthenticated: function(req, res, next) {
    if (req.isAuthenticated()) {
      return next();
    }
    req.flash('error_msg', 'Please log in to view that resource');
    res.redirect('/login');
  },
  forwardAuthenticated: function(req, res, next) {
    if (!req.isAuthenticated()) {
      return next();
    }
    res.redirect('/dashboard');      
  },
  ensureTeacher: function(req, res, next) {
    if (req.isAuthenticated() && req.user.role === 'teacher') {
      return next();
    }
    req.flash('error_msg', 'Access denied. Teacher role required.');
    res.redirect('/dashboard');
  }
};
