// routes/ai.js
const express = require("express");
const axios = require("axios");
const { ensureAuthenticated } = require("../config/auth");
const User = require("../models/User");
const Note = require("../models/Note");
const Quiz = require("../models/Quiz");

const router = express.Router();

/**
 * AI Study Plan Generator (GET form page)
 */
router.get("/study-plan", ensureAuthenticated, (req, res) => {
  res.render("ai/study-plan", { user: req.user });
});

/**
 * AI Study Plan Generator (POST to call AI API)
 */
router.post("/study-plan", ensureAuthenticated, async (req, res) => {
  const { subject, examDate, dailyHours } = req.body;

  try {
    // Example AI call (you can swap API provider)
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a study planner assistant.",
          },
          {
            role: "user",
            content: `Generate a ${subject} study plan. Exam date: ${examDate}. Study time per day: ${dailyHours} hours.`,
          },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const studyPlan = response.data.choices[0].message.content;

    res.render("ai/study-plan-result", {
      user: req.user,
      subject,
      studyPlan,
    });
  } catch (error) {
    console.error(error.message);
    req.flash("error_msg", "Error generating study plan");
    res.redirect("/ai/study-plan");
  }
});

module.exports = router;