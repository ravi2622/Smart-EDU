// routes/quiz.js
const express = require('express');
const { ensureAuthenticated, ensureTeacher } = require('../config/auth');
const Quiz = require('../models/Quiz');
const User = require('../models/User');
const router = express.Router();

// Get all quizzes
router.get('/', ensureAuthenticated, async (req, res) => {
  try {
    const { subject, difficulty } = req.query;
    let query = { isPublic: true };
    
    if (subject && subject !== 'all') {
      query.subject = subject;
    }
    
    if (difficulty && difficulty !== 'all') {
      query.difficulty = difficulty;
    }
    
    const quizzes = await Quiz.find(query)
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });
    
    // Get unique subjects for filter
    const subjects = await Quiz.distinct('subject');
    
    res.render('quiz/index', { quizzes, subjects, currentSubject: subject, currentDifficulty: difficulty });
  } catch (error) {
    console.error(error);
    req.flash('error_msg', 'Error loading quizzes');
    res.redirect('/dashboard');
  }
});

// Create quiz form (teachers only)
router.get('/create', ensureAuthenticated, ensureTeacher, (req, res) => {
  res.render('quiz/create');
});

// Create quiz
router.post('/create', ensureAuthenticated, ensureTeacher, async (req, res) => {
  try {
    const { title, subject, description, timeLimit, difficulty, questions } = req.body;
    
    // Parse questions from form data
    const parsedQuestions = [];
    if (questions && Array.isArray(questions)) {
      for (let q of questions) {
        if (q.question && q.options && q.options.length >= 2) {
          parsedQuestions.push({
            question: q.question,
            options: q.options.map((option, index) => ({
              text: option,
              isCorrect: q.correctAnswer == index
            })),
            explanation: q.explanation || ''
          });
        }
      }
    }
    
    const newQuiz = new Quiz({
      title,
      subject,
      description,
      timeLimit: parseInt(timeLimit) || 30,
      difficulty: difficulty || 'medium',
      questions: parsedQuestions,
      createdBy: req.user._id
    });
    
    await newQuiz.save();
    
    req.flash('success_msg', 'Quiz created successfully');
    res.redirect('/quiz');
  } catch (error) {
    console.error(error);
    req.flash('error_msg', 'Error creating quiz');
    res.redirect('/quiz/create');
  }
});

// Take quiz
router.get('/take/:id', ensureAuthenticated, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id)
      .populate('createdBy', 'name');
    
    if (!quiz) {
      req.flash('error_msg', 'Quiz not found');
      return res.redirect('/quiz');
    }
    
    // Check if user already attempted
    const existingAttempt = quiz.attempts.find(
      attempt => attempt.user.toString() === req.user._id.toString()
    );
    
    res.render('quiz/take', { quiz, existingAttempt });
  } catch (error) {
    console.error(error);
    req.flash('error_msg', 'Error loading quiz');
    res.redirect('/quiz');
  }
});

// Submit quiz
router.post('/submit/:id', ensureAuthenticated, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    const { answers } = req.body;
    
    if (!quiz) {
      return res.json({ success: false, error: 'Quiz not found' });
    }
    
    // Calculate score
    let score = 0;
    const answerArray = Array.isArray(answers) ? answers : Object.values(answers);
    
    quiz.questions.forEach((question, index) => {
      const selectedOption = parseInt(answerArray[index]);
      if (!isNaN(selectedOption) && question.options[selectedOption] && question.options[selectedOption].isCorrect) {
        score++;
      }
    });
    
    const percentage = Math.round((score / quiz.questions.length) * 100);
    
    // Save attempt
    const attempt = {
      user: req.user._id,
      score,
      answers: answerArray.map(a => parseInt(a)),
      completedAt: new Date()
    };
    
    // Remove existing attempt if any
    quiz.attempts = quiz.attempts.filter(
      a => a.user.toString() !== req.user._id.toString()
    );
    
    quiz.attempts.push(attempt);
    await quiz.save();
    
    // Update user's quiz scores
    const user = await User.findById(req.user._id);
    
    // Remove existing score for this quiz
    user.quizScores = user.quizScores.filter(
      qs => qs.quizId.toString() !== quiz._id.toString()
    );
    
    user.quizScores.push({
      quizId: quiz._id,
      score,
      maxScore: quiz.questions.length,
      percentage,
      completedAt: new Date()
    });
    
    await user.save();
    
    res.json({ 
      success: true, 
      score, 
      maxScore: quiz.questions.length, 
      percentage,
      redirect: `/quiz/result/${quiz._id}`
    });
  } catch (error) {
    console.error(error);
    res.json({ success: false, error: 'Error submitting quiz' });
  }
});

// Quiz results
router.get('/result/:id', ensureAuthenticated, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id)
      .populate('createdBy', 'name');
    
    if (!quiz) {
      req.flash('error_msg', 'Quiz not found');
      return res.redirect('/quiz');
    }
    
    const userAttempt = quiz.attempts.find(
      attempt => attempt.user.toString() === req.user._id.toString()
    );
    
    if (!userAttempt) {
      req.flash('error_msg', 'No attempt found for this quiz');
      return res.redirect('/quiz');
    }
    
    res.render('quiz/result', { quiz, attempt: userAttempt });
  } catch (error) {
    console.error(error);
    req.flash('error_msg', 'Error loading results');
    res.redirect('/quiz');
  }
});

module.exports = router;