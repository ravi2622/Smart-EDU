// routes/notes.js
const express = require('express');
const multer = require('multer');
const { ensureAuthenticated, ensureTeacher } = require('../config/auth');
const { storage } = require('../config/cloudinary');
const Note = require('../models/Note');
const router = express.Router();

const upload = multer({ storage });

// Get all notes
router.get('/', ensureAuthenticated, async (req, res) => {
  try {
    const { subject, search } = req.query;
    let query = {};
    
    if (subject && subject !== 'all') {
      query.subject = subject;
    }
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }
    
    const notes = await Note.find(query)
      .populate('uploadedBy', 'name role')
      .sort({ createdAt: -1 });
    
    // Get unique subjects for filter
    const subjects = await Note.distinct('subject');
    
    res.render('notes/index', { notes, subjects, currentSubject: subject, currentSearch: search });
  } catch (error) {
    console.error(error);
    req.flash('error_msg', 'Error loading notes');
    res.redirect('/dashboard');
  }
});

// Upload note form (teachers only)
router.get('/upload', ensureAuthenticated, ensureTeacher, (req, res) => {
  res.render('notes/upload');
});

// Upload note
router.post('/upload', ensureAuthenticated, ensureTeacher, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      req.flash('error_msg', 'Please select a file to upload');
      return res.redirect('/notes/upload');
    }
    
    const { title, subject, description, tags } = req.body;
    const tagsArray = tags ? tags.split(',').map(tag => tag.trim()) : [];
    
    const newNote = new Note({
      title,
      subject,
      description,
      fileUrl: req.file.path,
      fileType: req.file.mimetype,
      fileName: req.file.originalname,
      uploadedBy: req.user._id,
      tags: tagsArray
    });
    
    await newNote.save();
    
    req.flash('success_msg', 'Note uploaded successfully');
    res.redirect('/notes');
  } catch (error) {
    console.error(error);
    req.flash('error_msg', 'Error uploading note');
    res.redirect('/notes/upload');
  }
});

// Download note
router.get('/download/:id', ensureAuthenticated, async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    
    if (!note) {
      req.flash('error_msg', 'Note not found');
      return res.redirect('/notes');
    }
    
    // Increment download count
    note.downloads += 1;
    await note.save();
    
    res.redirect(note.fileUrl);
  } catch (error) {
    console.error(error);
    req.flash('error_msg', 'Error downloading note');
    res.redirect('/notes');
  }
});

// Like note
router.post('/like/:id', ensureAuthenticated, async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    const userId = req.user._id;
    
    if (!note) {
      return res.json({ success: false, error: 'Note not found' });
    }
    
    const likeIndex = note.likes.findIndex(like => like.user.toString() === userId.toString());
    
    if (likeIndex > -1) {
      // Unlike
      note.likes.splice(likeIndex, 1);
    } else {
      // Like
      note.likes.push({ user: userId });
    }
    
    await note.save();
    
    res.json({ 
      success: true, 
      likes: note.likes.length,
      liked: likeIndex === -1
    });
  } catch (error) {
    console.error(error);
    res.json({ success: false, error: 'Error updating like' });
  }
});

module.exports = router;
