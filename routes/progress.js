// routes/progress.js
const express = require("express");
const router = express.Router();
const { ensureAuthenticated } = require("../config/auth");
const User = require("../models/User");

// --------------------
// Utility: Update Progress Percentage
// --------------------
function recalcProgress(user) {
  user.progress.forEach((p) => {
    if (p.totalTopics && p.totalTopics > 0) {
      p.percentage = Math.round(
        (p.topicsCompleted.length / p.totalTopics) * 100
      );
    } else {
      p.percentage = 0;
    }
  });
  return user;
}

// --------------------
// GET: User Dashboard (Progress Overview)
// --------------------
router.get("/", ensureAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate(
      "quizScores.quizId"
    );

    recalcProgress(user);
    await user.save();

    res.render("progress/index", {
      user,
      progress: user.progress,
      quizScores: user.quizScores,
      studyPlan: user.studyPlan,
    });
  } catch (err) {
    console.error(err);
    req.flash("error_msg", "Error loading progress dashboard");
    res.redirect("/dashboard");
  }
});

// --------------------
// POST: Update Progress
// --------------------
router.post("/update", ensureAuthenticated, async (req, res) => {
  try {
    const { subject, topic, totalTopics } = req.body;
    const user = await User.findById(req.user._id);

    let subjectProgress = user.progress.find((p) => p.subject === subject);

    if (!subjectProgress) {
      subjectProgress = {
        subject,
        topicsCompleted: [],
        totalTopics: totalTopics || 0,
        percentage: 0,
      };
      user.progress.push(subjectProgress);
    }

    if (!subjectProgress.topicsCompleted.includes(topic)) {
      subjectProgress.topicsCompleted.push(topic);
    }

    if (totalTopics) subjectProgress.totalTopics = totalTopics;

    recalcProgress(user);
    await user.save();

    res.json({ success: true, progress: subjectProgress });
  } catch (err) {
    console.error(err);
    res.json({ success: false, error: "Failed to update progress" });
  }
});

// --------------------
// GET: Leaderboard
// --------------------
router.get("/leaderboard", ensureAuthenticated, async (req, res) => {
  try {
    const users = await User.find().select("name progress").lean();

    users.forEach((u) => {
      let total = 0;
      let subjects = 0;
      u.progress.forEach((p) => {
        total += p.percentage;
        subjects++;
      });
      u.totalProgress = subjects ? Math.round(total / subjects) : 0;
    });

    const leaderboard = users.sort(
      (a, b) => b.totalProgress - a.totalProgress
    );

    res.render("progress/leaderboard", { leaderboard });
  } catch (err) {
    console.error(err);
    req.flash("error_msg", "Error loading leaderboard");
    res.redirect("/progress");
  }
});

// --------------------
// GET: Study Plan
// --------------------
router.get("/studyplan", ensureAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.render("progress/studyplan", { studyPlan: user.studyPlan });
  } catch (err) {
    console.error(err);
    req.flash("error_msg", "Error loading study plan");
    res.redirect("/progress");
  }
});

// --------------------
// GET: Study Plan
// --------------------
router.get("/studyplan/generate", ensureAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.render("progress/generate", { studyPlan: user.studyPlan });
  } catch (err) {
    console.error(err);
    req.flash("error_msg", "Error loading study plan");
    res.redirect("/progress/studyplan");
  }
});

// --------------------
// POST: Generate Study Plan
// --------------------
router.post("/studyplan/generate", ensureAuthenticated, async (req, res) => {
  try {
    const { examDate, subjects, dailyHours } = req.body;
    const parsedSubjects =
      typeof subjects === "string" ? JSON.parse(subjects) : subjects;

    const user = await User.findById(req.user._id);

    const days = Math.ceil(
      (new Date(examDate) - new Date()) / (1000 * 60 * 60 * 24)
    );

    let plan = [];
    let currentDate = new Date();

    // evenly distribute tasks
    for (let i = 0; i < days; i++) {
      parsedSubjects.forEach((subject) => {
        plan.push({
          date: new Date(currentDate.getTime() + i * 24 * 60 * 60 * 1000),
          subject,
          tasks: [`Study ${subject} - Topic ${i + 1}`],
          completed: false,
        });
      });
    }

    user.studyPlan = {
      examDate,
      subjects: parsedSubjects,
      dailyHours,
      plan,
      generated: new Date(),
    };

    await user.save();
    req.flash("success_msg", "Study plan generated!");
    res.redirect("/progress/studyplan");
  } catch (err) {
    console.error(err);
    req.flash("error_msg", "Failed to generate study plan");
    res.redirect("/progress/studyplan");
  }
});

// --------------------
// POST: Mark Study Task Complete
// --------------------
router.post("/studyplan/complete", ensureAuthenticated, async (req, res) => {
  try {
    const { date, subject, task } = req.body;
    const user = await User.findById(req.user._id);

    user.studyPlan.plan.forEach((day) => {
      if (day.date.toISOString().slice(0, 10) === date && day.subject === subject) {
        const taskIndex = day.tasks.indexOf(task);
        if (taskIndex !== -1) {
          day.completed = true;
        }
      }
    });

    await user.save();
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.json({ success: false, error: "Failed to update study plan" });
  }
});

module.exports = router;
