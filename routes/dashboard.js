// // routes/dashboard.js
// const express = require('express');
// const { ensureAuthenticated } = require('../config/auth');
// const User = require('../models/User');
// const Note = require('../models/Note');
// const Quiz = require('../models/Quiz');
// const Question = require('../models/Question');
// const router = express.Router();

// // Dashboard
// router.get('/', ensureAuthenticated, async (req, res) => {
//   try {
//     const userId = req.user._id;
    
//     // Get user's progress
//     const user = await User.findById(userId).populate('quizScores.quizId');
    
//     // Get recent notes
//     const recentNotes = await Note.find()
//       .populate('uploadedBy', 'name')
//       .sort({ createdAt: -1 })
//       .limit(5);
    
//     // Get available quizzes
//     const availableQuizzes = await Quiz.find({ isPublic: true })
//       .populate('createdBy', 'name')
//       .sort({ createdAt: -1 })
//       .limit(5);
    
//     // Get recent forum questions
//     const recentQuestions = await Question.find()
//       .populate('askedBy', 'name')
//       .sort({ createdAt: -1 })
//       .limit(5);
    
//     // Calculate overall progress
//     let overallProgress = 0;
//     if (user.progress.length > 0) {
//       const totalPercentage = user.progress.reduce((sum, prog) => sum + prog.percentage, 0);
//       overallProgress = Math.round(totalPercentage / user.progress.length);
//     }
    
//     res.render('dashboard', {
//       user,
//       recentNotes,
//       availableQuizzes,
//       recentQuestions,
//       overallProgress
//     });
//   } catch (error) {
//     console.error(error);
//     req.flash('error_msg', 'Error loading dashboard');
//     res.redirect('/');
//   }
// });

// // Profile
// router.get('/profile', ensureAuthenticated, (req, res) => {
//   res.render('profile', { user: req.user });
// });

// // Update Profile
// router.post('/profile', ensureAuthenticated, async (req, res) => {
//   try {
//     const { name, grade, subjects, bio } = req.body;
//     const subjectsArray = subjects ? subjects.split(',').map(s => s.trim()) : [];
    
//     await User.findByIdAndUpdate(req.user._id, {
//       name,
//       'profile.grade': grade,
//       'profile.subjects': subjectsArray,
//       'profile.bio': bio
//     });
    
//     req.flash('success_msg', 'Profile updated successfully');
//     res.redirect('/dashboard/profile');
//   } catch (error) {
//     console.error(error);
//     req.flash('error_msg', 'Error updating profile');
//     res.redirect('/dashboard/profile');
//   }
// });

// // Update Progress
// router.post('/progress', ensureAuthenticated, async (req, res) => {
//   try {
//     const { subject, topic, action } = req.body;
//     const user = await User.findById(req.user._id);
    
//     let subjectProgress = user.progress.find(p => p.subject === subject);
    
//     if (!subjectProgress) {
//       subjectProgress = {
//         subject,
//         topicsCompleted: [],
//         totalTopics: 10, // Default, can be made dynamic
//         percentage: 0
//       };
//       user.progress.push(subjectProgress);
//     }
    
//     if (action === 'complete' && !subjectProgress.topicsCompleted.includes(topic)) {
//       subjectProgress.topicsCompleted.push(topic);
//     } else if (action === 'uncomplete') {
//       subjectProgress.topicsCompleted = subjectProgress.topicsCompleted.filter(t => t !== topic);
//     }
    
//     subjectProgress.percentage = Math.round((subjectProgress.topicsCompleted.length / subjectProgress.totalTopics) * 100);
    
//     await user.save();
    
//     res.json({ success: true, percentage: subjectProgress.percentage });
//   } catch (error) {
//     console.error(error);
//     res.json({ success: false, error: 'Error updating progress' });
//   }
// });

// module.exports = router;






const express = require('express');
const { ensureAuthenticated } = require('../config/auth');
const User = require('../models/User');
const Note = require('../models/Note');
const Quiz = require('../models/Quiz');
const Question = require('../models/Question');

const router = express.Router();

/**
 * @desc   Dashboard - show recent activity + progress
 * @route  GET /dashboard
 */
router.get('/', ensureAuthenticated, async (req, res) => {
  try {
    const userId = req.user._id;

    // Get user with populated quiz scores
    const user = await User.findById(userId).populate('quizScores.quizId');

    if (!user) {
      req.flash('error_msg', 'User not found');
      return res.redirect('/');
    }

    // Fetch recent data
    const [recentNotes, availableQuizzes, recentQuestions] = await Promise.all([
      Note.find().populate('uploadedBy', 'name').sort({ createdAt: -1 }).limit(5),
      Quiz.find({ isPublic: true }).populate('createdBy', 'name').sort({ createdAt: -1 }).limit(5),
      Question.find().populate('askedBy', 'name').sort({ createdAt: -1 }).limit(5)
    ]);

    // Calculate overall progress
    let overallProgress = 0;
    if (user.progress && user.progress.length > 0) {
      const totalPercentage = user.progress.reduce((sum, prog) => sum + prog.percentage, 0);
      overallProgress = Math.round(totalPercentage / user.progress.length);
    }

    res.render('dashboard', {
      user,
      recentNotes,
      availableQuizzes,
      recentQuestions,
      overallProgress
    });
  } catch (error) {
    console.error('Dashboard Error:', error);
    req.flash('error_msg', 'Error loading dashboard');
    res.redirect('/');
  }
});

/**
 * @desc   Profile page
 * @route  GET /dashboard/profile
 */
router.get('/profile', ensureAuthenticated, (req, res) => {
  res.render('profile', { user: req.user });
});

/**
 * @desc   Update profile
 * @route  POST /dashboard/profile
 */
router.post('/profile', ensureAuthenticated, async (req, res) => {
  try {
    const { name, grade, subjects, bio } = req.body;
    const subjectsArray = subjects ? subjects.split(',').map(s => s.trim()) : [];

    await User.findByIdAndUpdate(req.user._id, {
      name,
      'profile.grade': grade,
      'profile.subjects': subjectsArray,
      'profile.bio': bio
    });

    req.flash('success_msg', 'Profile updated successfully');
    res.redirect('/dashboard/profile');
  } catch (error) {
    console.error('Profile Update Error:', error);
    req.flash('error_msg', 'Error updating profile');
    res.redirect('/dashboard/profile');
  }
});

/**
 * @desc   Update progress (AJAX endpoint)
 * @route  POST /dashboard/progress
 */
router.post('/progress', ensureAuthenticated, async (req, res) => {
  try {
    const { subject, topic, action } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) return res.json({ success: false, error: 'User not found' });

    let subjectProgress = user.progress.find(p => p.subject === subject);

    if (!subjectProgress) {
      subjectProgress = {
        subject,
        topicsCompleted: [],
        totalTopics: 10, // Default, can be replaced with dynamic topic count
        percentage: 0
      };
      user.progress.push(subjectProgress);
    }

    if (action === 'complete' && !subjectProgress.topicsCompleted.includes(topic)) {
      subjectProgress.topicsCompleted.push(topic);
    } else if (action === 'uncomplete') {
      subjectProgress.topicsCompleted = subjectProgress.topicsCompleted.filter(t => t !== topic);
    }

    subjectProgress.percentage = Math.round(
      (subjectProgress.topicsCompleted.length / subjectProgress.totalTopics) * 100
    );

    await user.save();

    res.json({ success: true, percentage: subjectProgress.percentage });
  } catch (error) {
    console.error('Progress Update Error:', error);
    res.json({ success: false, error: 'Error updating progress' });
  }
});

module.exports = router;
