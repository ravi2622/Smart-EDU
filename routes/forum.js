const express = require("express");
const { ensureAuthenticated } = require("../config/auth");
const Question = require("../models/Question");

const router = express.Router();

/**
 * Forum homepage - list all questions
 */
router.get("/", ensureAuthenticated, async (req, res) => {
  try {
    const questions = await Question.find()
      .populate("askedBy", "name")
      .populate("answers.answeredBy", "name")
      .sort({ createdAt: -1 });

    res.render("forum/index", { user: req.user, questions });
  } catch (err) {
    console.error(err);
    req.flash("error_msg", "Error loading forum");
    res.redirect("/dashboard");
  }
});

/**
 * Ask a new question
 */
router.post("/ask", ensureAuthenticated, async (req, res) => {
  try {
    const { title, content, subject, tags } = req.body;

    if (!title || !content) {
      req.flash("error_msg", "Title and content are required");
      return res.redirect("/forum");
    }

    const newQuestion = new Question({
      title,
      content,
      subject,
      tags: tags ? tags.split(",").map((t) => t.trim()) : [],
      askedBy: req.user._id,
    });

    await newQuestion.save();
    req.flash("success_msg", "Question posted successfully!");
    res.redirect("/forum");
  } catch (err) {
    console.error(err);
    req.flash("error_msg", "Error posting question");
    res.redirect("/forum");
  }
});

/**
 * View single question (detail page)
 */
router.get("/:id", ensureAuthenticated, async (req, res) => {
  try {
    const question = await Question.findById(req.params.id)
      .populate("askedBy", "name")
      .populate("answers.answeredBy", "name");

    if (!question) {
      req.flash("error_msg", "Question not found");
      return res.redirect("/forum");
    }

    // Increment view count
    question.views += 1;
    await question.save();

    res.render("forum/question", { user: req.user, question });
  } catch (err) {
    console.error(err);
    req.flash("error_msg", "Error loading question");
    res.redirect("/forum");
  }
});

/**
 * Answer a question
 */
router.post("/:id/answer", ensureAuthenticated, async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) {
      req.flash("error_msg", "Answer cannot be empty");
      return res.redirect(`/forum/${req.params.id}`);
    }

    const question = await Question.findById(req.params.id);
    if (!question) {
      req.flash("error_msg", "Question not found");
      return res.redirect("/forum");
    }

    question.answers.push({
      content,
      answeredBy: req.user._id,
    });

    await question.save();
    req.flash("success_msg", "Answer submitted successfully!");
    res.redirect(`/forum/${req.params.id}`);
  } catch (err) {
    console.error(err);
    req.flash("error_msg", "Error submitting answer");
    res.redirect(`/forum/${req.params.id}`);
  }
});

/**
 * Upvote / Downvote a question
 */
router.post("/:id/vote", ensureAuthenticated, async (req, res) => {
  try {
    const { action } = req.body; // "up" or "down"
    const question = await Question.findById(req.params.id);

    if (!question) {
      return res.json({ success: false, error: "Question not found" });
    }

    if (action === "up") question.votes += 1;
    if (action === "down") question.votes -= 1;

    await question.save();
    res.json({ success: true, votes: question.votes });
  } catch (err) {
    console.error(err);
    res.json({ success: false, error: "Error voting" });
  }
});

/**
 * Accept an answer
 */
router.post("/:id/answers/:answerId/accept", ensureAuthenticated, async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);

    if (!question) {
      req.flash("error_msg", "Question not found");
      return res.redirect("/forum");
    }

    // Only the asker can accept an answer
    if (question.askedBy.toString() !== req.user._id.toString()) {
      req.flash("error_msg", "You can only accept answers to your own question");
      return res.redirect(`/forum/${req.params.id}`);
    }

    question.answers.forEach((ans) => {
      ans.isAccepted = ans._id.toString() === req.params.answerId;
    });

    await question.save();
    req.flash("success_msg", "Answer marked as accepted");
    res.redirect(`/forum/${req.params.id}`);
  } catch (err) {
    console.error(err);
    req.flash("error_msg", "Error accepting answer");
    res.redirect(`/forum/${req.params.id}`);
  }
});

module.exports = router;
