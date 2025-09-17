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
        totalTopics: Number,
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
  },
  { timestamps: true }
);

// Hash password before saving
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
UserSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("User", UserSchema);
