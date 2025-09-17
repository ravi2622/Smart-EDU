// routes/notes.js
const express = require("express");
const multer = require("multer");
const { ensureAuthenticated, ensureTeacher } = require("../config/auth");
const { storage } = require("../config/cloudinary");
const Note = require("../models/Note");

const router = express.Router();
const upload = multer({ storage });

// ---------------------
// GET: All Notes
// ---------------------
router.get("/", ensureAuthenticated, async (req, res) => {
  try {
    const { subject, search } = req.query;
    let query = {};

    // Filter by subject
    if (subject && subject !== "all") {
      query.subject = subject;
    }

    // Search by title, description, or tags
    if (search) {
      const regex = new RegExp(search, "i");
      query.$or = [
        { title: regex },
        { description: regex },
        { tags: { $in: [regex] } },
      ];
    }

    const notes = await Note.find(query)
      .populate("uploadedBy", "name role")
      .sort({ createdAt: -1 });

    const subjects = await Note.distinct("subject");

    res.render("notes/index", {
      notes,
      subjects,
      currentSubject: subject || "all",
      currentSearch: search || "",
    });
  } catch (err) {
    console.error("Error loading notes:", err);
    req.flash("error_msg", "Unable to load notes.");
    res.redirect("/dashboard");
  }
});

// ---------------------
// GET: Upload Form (Teachers only)
// ---------------------
router.get("/upload", ensureAuthenticated, ensureTeacher, (req, res) => {
  res.render("notes/upload");
});

// ---------------------
// POST: Upload a Note
// ---------------------
router.post(
  "/upload",
  ensureAuthenticated,
  ensureTeacher,
  upload.single("file"),
  async (req, res) => {
    try {
      if (!req.file) {
        req.flash("error_msg", "Please select a file to upload.");
        return res.redirect("/notes/upload");
      }

      const { title, subject, description, tags } = req.body;
      const tagsArray = tags ? tags.split(",").map((t) => t.trim()) : [];

      const newNote = new Note({
        title,
        subject,
        description,
        fileUrl: req.file.path,
        fileType: req.file.mimetype,
        fileName: req.file.originalname,
        uploadedBy: req.user._id,
        tags: tagsArray,
      });

      await newNote.save();

      req.flash("success_msg", "Note uploaded successfully.");
      res.redirect("/notes");
    } catch (err) {
      console.error("Error uploading note:", err);
      req.flash("error_msg", "Error uploading note.");
      res.redirect("/notes/upload");
    }
  }
);

// ---------------------
// GET: Download Note
// ---------------------
router.get("/download/:id", ensureAuthenticated, async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) {
      req.flash("error_msg", "Note not found.");
      return res.redirect("/notes");
    }

    note.downloads += 1;
    await note.save();

    res.redirect(note.fileUrl);
  } catch (err) {
    console.error("Error downloading note:", err);
    req.flash("error_msg", "Error downloading note.");
    res.redirect("/notes");
  }
});

// ---------------------
// POST: Like/Unlike Note
// ---------------------
router.post("/like/:id", ensureAuthenticated, async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) {
      return res.json({ success: false, error: "Note not found" });
    }

    const userId = req.user._id.toString();
    const alreadyLiked = note.likes.some(
      (like) => like.user.toString() === userId
    );

    if (alreadyLiked) {
      note.likes = note.likes.filter(
        (like) => like.user.toString() !== userId
      );
    } else {
      note.likes.push({ user: req.user._id });
    }

    await note.save();

    res.json({
      success: true,
      likes: note.likes.length,
      liked: !alreadyLiked,
    });
  } catch (err) {
    console.error("Error updating like:", err);
    res.json({ success: false, error: "Error updating like" });
  }
});

module.exports = router;
