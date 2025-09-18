// // models/User.js
// const mongoose = require('mongoose');
// const bcrypt = require('bcryptjs');

// const UserSchema = new mongoose.Schema({
//   name: {
//     type: String,
//     required: true
//   },
//   email: {
//     type: String,
//     required: true,
//     unique: true
//   },
//   password: {
//     type: String,
//     required: true
//   },
//   role: {
//     type: String,
//     enum: ['student', 'teacher'],
//     default: 'student'
//   },
//   profile: {
//     grade: String,
//     subjects: [String],
//     bio: String,
//     avatar: String
//   },
//   progress: [{
//     subject: String,
//     topicsCompleted: [String],
//     totalTopics: Number,
//     percentage: {
//       type: Number,
//       default: 0
//     }
//   }],
//   quizScores: [{
//     quizId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: 'Quiz'
//     },
//     score: Number,
//     maxScore: Number,
//     percentage: Number,
//     completedAt: {
//       type: Date,
//       default: Date.now
//     }
//   }],
//   studyPlan: {
//     generated: {
//       type: Date,
//       default: null
//     },
//     examDate: Date,
//     subjects: [String],
//     dailyHours: Number,
//     plan: [{
//       date: Date,
//       tasks: [String],
//       subject: String,
//       completed: {
//         type: Boolean,
//         default: false
//       }
//     }]
//   }
// }, {
//   timestamps: true
// });

// // Hash password before saving
// UserSchema.pre('save', async function(next) {
//   if (!this.isModified('password')) return next();

//   const salt = await bcrypt.genSalt(10);
//   this.password = await bcrypt.hash(this.password, salt);
//   next();
// });

// // Compare password method
// UserSchema.methods.comparePassword = async function(candidatePassword) {
//   return await bcrypt.compare(candidatePassword, this.password);
// };

// module.exports = mongoose.model('User', UserSchema);

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["student", "teacher"],
      default: "student",
    },
    profile: {
      grade: String,
      subjects: [String],
      bio: String,
      avatar: String,
    },
    progress: [
      {
        subject: String,
        topicsCompleted: [String],
        totalTopics: { type: Number, default: 0 },
        percentage: { type: Number, default: 0 },
      },
    ],
    quizScores: [
      {
        quizId: { type: mongoose.Schema.Types.ObjectId, ref: "Quiz" },
        score: Number,
        maxScore: Number,
        percentage: Number,
        completedAt: { type: Date, default: Date.now },
      },
    ],
    studyPlan: {
      generated: { type: Date, default: null },
      examDate: Date,
      subjects: [String],
      dailyHours: Number,
      plan: [
        {
          date: Date,
          tasks: [String],
          subject: String,
          completed: { type: Boolean, default: false },
        },
      ],
    },
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    // optional extra fields if you want leaderboard/engagement later
    engagement: {
      notesDownloaded: { type: Number, default: 0 },
      notesLiked: { type: Number, default: 0 },
      quizzesAttempted: { type: Number, default: 0 },
    },
    badges: [
      {
        name: String,
        earnedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

// --------------------
// Middleware
// --------------------

// Hash password before saving
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// --------------------
// Instance Methods
// --------------------

// Compare password method
UserSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Update progress percentages
UserSchema.methods.updateProgress = function () {
  if (!this.progress) return;

  this.progress.forEach((p) => {
    if (p.totalTopics && p.totalTopics > 0) {
      p.percentage = Math.round(
        (p.topicsCompleted.length / p.totalTopics) * 100
      );
    } else {
      p.percentage = p.topicsCompleted.length ? 100 : 0;
    }
  });
};

module.exports = mongoose.model("User", UserSchema);
