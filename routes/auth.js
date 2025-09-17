// // routes/auth.js
// const express = require('express');
// const passport = require('passport');
// const { body, validationResult } = require('express-validator');
// const { forwardAuthenticated } = require('../config/auth');
// const User = require('../models/User');
// const router = express.Router();

// // Login Page
// router.get('/login', forwardAuthenticated, (req, res) => {
//   res.render('login');
// });

// // Register Page
// router.get('/register', forwardAuthenticated, (req, res) => {
//   res.render('register');
// });

// // Register
// router.post('/register', [
//   body('name').notEmpty().withMessage('Name is required'),
//   body('email').isEmail().withMessage('Please enter a valid email'),
//   body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
//   body('password2').custom((value, { req }) => {
//     if (value !== req.body.password) {
//       throw new Error('Passwords do not match');
//     }
//     return true;
//   })
// ], async (req, res) => {
//   const errors = validationResult(req);
  
//   if (!errors.isEmpty()) {
//     return res.render('register', {
//       errors: errors.array(),
//       name: req.body.name,
//       email: req.body.email,
//       role: req.body.role
//     });
//   }

//   const { name, email, password, role } = req.body;

//   try {
//     const existingUser = await User.findOne({ email });
    
//     if (existingUser) {
//       return res.render('register', {
//         error_msg: 'Email already exists',
//         name, email, role
//       });
//     }

//     const newUser = new User({
//       name,
//       email,
//       password,
//       role: role || 'student'
//     });

//     await newUser.save();
    
//     req.flash('success_msg', 'You are now registered and can log in');
//     res.redirect('/login');
//   } catch (error) {
//     console.error(error);
//     res.render('register', {
//       error_msg: 'Something went wrong',
//       name, email, role
//     });
//   }
// });

// // Login
// router.post('/login', (req, res, next) => {
//   passport.authenticate('local', {
//     successRedirect: '/dashboard',
//     failureRedirect: '/login',
//     failureFlash: true
//   })(req, res, next);
// });

// // Logout
// router.get('/logout', (req, res) => {
//   req.logout((err) => {
//     if (err) {
//       return next(err);
//     }
//     req.flash('success_msg', 'You are logged out');
//     res.redirect('/login');
//   });
// });

// module.exports = router;


const express = require("express");
const passport = require("passport");
const { body, validationResult } = require("express-validator");
const { forwardAuthenticated } = require("../config/auth");
const User = require("../models/User");

const router = express.Router();

/**
 * Login page
 */
router.get("/login", forwardAuthenticated, (req, res) => {
  res.render("login", { error_msg: null, success_msg: req.flash("success_msg") });
});

/**
 * Register page
 */
router.get("/register", forwardAuthenticated, (req, res) => {
  res.render("register", { errors: [], name: "", email: "", role: "student" });
});

/**
 * Handle register form
 */
router.post(
  "/register",
  [
    body("name").notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Please enter a valid email"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
    body("password2").custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error("Passwords do not match");
      }
      return true;
    }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    const { name, email, password, role } = req.body;

    if (!errors.isEmpty()) {
      return res.render("register", {
        errors: errors.array(),
        name,
        email,
        role,
      });
    }

    try {
      const existingUser = await User.findOne({ email });

      if (existingUser) {
        return res.render("register", {
          errors: [{ msg: "Email already exists" }],
          name,
          email,
          role,
        });
      }

      const newUser = new User({
        name,
        email,
        password,
        role: role || "student",
      });

      await newUser.save();

      req.flash("success_msg", "You are now registered and can log in");
      res.redirect("/login");
    } catch (error) {
      console.error(error);
      res.render("register", {
        errors: [{ msg: "Something went wrong, please try again" }],
        name,
        email,
        role,
      });
    }
  }
);

/**
 * Handle login
 */
router.post("/login", (req, res, next) => {
  passport.authenticate("local", {
    successRedirect: "/dashboard",
    failureRedirect: "/login",
    failureFlash: true,
  })(req, res, next);
});

/**
 * Logout user
 */
router.get("/logout", (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    req.flash("success_msg", "You are logged out");
    res.redirect("/login");
  });
});

module.exports = router;
