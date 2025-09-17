const express = require('express');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const User = require('../models/User');

const router = express.Router();

// Setup Ethereal transporter
const transporter = nodemailer.createTransport({
  host: "smtp.ethereal.email",
  port: 587,
  secure: false, // TLS
  auth: {
    user: process.env.EMAIL_USER, // your Ethereal user
    pass: process.env.EMAIL_PASS  // your Ethereal password
  }
});

// Forgot Password Page
router.get('/', (req, res) => {
  res.render('forgot-password');
});

// Handle Forgot Password (Generate Token + Send Email)
router.post('/', async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });

    if (!user) {
      req.flash('error_msg', 'No account with that email found');
      return res.redirect('/forgot-password');
    }

    // Generate reset token
    const token = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    // Create reset URL
    const resetURL = `http://${req.headers.host}/forgot-password/reset/${token}`;

    // Send email via Ethereal
    const info = await transporter.sendMail({
      from: `"Smart EDU" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: "Password Reset - Smart EDU",
      html: `
        <p>Hello ${user.name || "Student"},</p>
        <p>You requested a password reset. Click the link below:</p>
        <a href="${resetURL}">${resetURL}</a>
        <p>If you did not request this, ignore this email.</p>
      `
    });

    console.log("Password reset email sent. Preview URL:", nodemailer.getTestMessageUrl(info));

    req.flash('success_msg', 'Password reset link sent. (Check console for Ethereal preview URL)');
    res.redirect('/forgot-password');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error processing request');
    res.redirect('/forgot-password');
  }
});

// Reset Password Page
router.get('/reset/:token', async (req, res) => {
  try {
    const user = await User.findOne({
      resetPasswordToken: req.params.token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      req.flash('error_msg', 'Password reset token is invalid or has expired');
      return res.redirect('/forgot-password');
    }

    res.render('reset-password', { token: req.params.token });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error loading reset page');
    res.redirect('/forgot-password');
  }
});

// Handle Reset Password
router.post('/reset/:token', async (req, res) => {
  const { password, password2 } = req.body;
  try {
    const user = await User.findOne({
      resetPasswordToken: req.params.token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      req.flash('error_msg', 'Password reset token is invalid or expired');
      return res.redirect('/forgot-password');
    }

    if (password !== password2) {
      req.flash('error_msg', 'Passwords do not match');
      return res.redirect(`/forgot-password/reset/${req.params.token}`);
    }

    // Update password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    req.flash('success_msg', 'Password has been reset. You can now log in.');
    res.redirect('/login');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error resetting password');
    res.redirect('/forgot-password');
  }
});

module.exports = router;
