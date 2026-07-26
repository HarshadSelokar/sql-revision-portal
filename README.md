# SQLMaster - SQL Revision & MCQ Practice Platform

A comprehensive, modern SQL revision platform for students and professionals to master SQL through interactive practice questions, tests, and analytics.

## 🎯 Features

### Core Learning Modes
- **Practice Mode**: Unlimited attempts with instant feedback and detailed explanations
- **Test Mode**: Timed tests (30, 50, 100 questions, or custom)
- **Topic-wise Revision**: Study specific SQL topics with focused practice
- **Bookmarks**: Save questions for later review
- **Analytics Dashboard**: Track progress, accuracy, weak/strong topics

### Question Features
- **500+ Unique SQL Questions** across 30+ topics
- Multiple difficulty levels: Easy, Medium, Hard
- Question types: MCQ, Fill-in-blank, Predict Output, Find Error, etc.
- **Detailed Explanations**: Why correct, why others are wrong
- **Real SQL Examples**: Practical code examples for each question
- **Interview Tips**: Common tricks and interview insights
- **Tags**: Filter by interview, scenario-based, output prediction, etc.

### Learning Features
- **Revision Mode**: Hide answers until manually revealed
- **Shuffle Questions**: Random question order for better learning
- **Shuffle Options**: Random option order to prevent memorization
- **Timer**: Optional timed practice
- **Progress Tracking**: Accuracy %, study streak, completion percentage
- **Smart Analytics**: Topic breakdown, weak/strong topics identification

### User Experience
- **Dark Mode**: Modern dark theme (default)
- **Responsive Design**: Works on mobile, tablet, desktop
- **Smooth Animations**: Polished UI with smooth transitions
- **Keyboard Shortcuts**: Arrow keys for navigation in tests
- **Offline Support**: Works completely offline
- **LocalStorage Persistence**: Progress saved locally

### Data Management
- **Export Progress**: Download your progress as JSON
- **Import Progress**: Restore progress from backup
- **Reset Statistics**: Clear all attempts (keep bookmarks optional)
- **Clear Bookmarks**: Manage saved questions

## 📋 Topics Covered

### SQL Fundamentals
- SQL Basics (SELECT, WHERE, ORDER BY, LIMIT)
- Database Concepts
- DDL (CREATE, ALTER, DROP, TRUNCATE)
- DML (INSERT, UPDATE, DELETE, SELECT)
- Constraints (PRIMARY KEY, FOREIGN KEY, UNIQUE, NOT NULL, CHECK, DEFAULT)

### Querying
- Joins (INNER, LEFT, RIGHT, FULL OUTER, CROSS, SELF)
- Subqueries (Simple, Correlated)
- Set Operations (UNION, INTERSECT, EXCEPT)
- Aggregate Functions (COUNT, SUM, AVG, MIN, MAX)
- Grouping (GROUP BY, HAVING)

### Advanced Topics
- Window Functions (ROW_NUMBER, RANK, DENSE_RANK, LAG, LEAD)
- CTEs (Common Table Expressions, Recursive CTEs)
- Views
- Indexes
- Transactions (COMMIT, ROLLBACK, SAVEPOINT)
- Stored Procedures
- Triggers
- DCL (GRANT, REVOKE)
- Normalization (1NF, 2NF, 3NF, BCNF)

### String & Date Functions
- String Functions (CONCAT, LENGTH, UPPER, LOWER, SUBSTRING, REPLACE, TRIM)
- Date Functions (GETDATE, DATEADD, DATEDIFF, YEAR, MONTH, DAY)
- Numeric Functions (ABS, ROUND, CEILING, FLOOR)
- NULL Handling (IS NULL, COALESCE, IFNULL)

### Interview & Performance
- Interview Questions (Common SQL interview topics)
- Query Optimization (Execution Plans, Index usage)
- ACID Properties
- Locks & Deadlocks
- Isolation Levels
- Performance Tuning

## 🚀 Getting Started

### Installation

1. **Clone the Repository**
   ```bash
   git clone <repository-url>
   cd sqlmaster
   ```

2. **No Installation Required!**
   - This is a pure HTML/CSS/JavaScript application
   - No dependencies to install
   - No build process needed

3. **Run Locally**
   - Open `index.html` in your web browser
   - Or use a local server:
     ```bash
     python -m http.server 8000
     # Then visit http://localhost:8000
     ```

### Deployment on Vercel

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Add SQLMaster"
   git push origin main
   ```

2. **Deploy on Vercel**
   - Go to [Vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Click "Deploy"
   - Your site will be live instantly!

3. **Custom Domain** (Optional)
   - Add custom domain in Vercel project settings

## 📁 Project Structure

```
sqlmaster/
├── index.html          # Main HTML file with all sections
├── style.css           # Complete styling (dark mode, animations, responsive)
├── script.js           # All JavaScript functionality
├── questions.json      # 100+ SQL questions database
├── progress.json       # Default progress template
└── README.md           # This file
```

## 💾 Data Persistence

### How It Works
1. **First Load**: Application loads `progress.json` as default template
2. **LocalStorage**: All user data stored in browser's LocalStorage
3. **Persistent**: Progress saved automatically after each action
4. **Export/Import**: Users can backup and restore progress

### LocalStorage Keys
```javascript
// Stored under key: 'sqlmaster_state'
{
  stats: {
    attempted: 0,           // Total questions attempted
    correct: 0,             // Total correct answers
    wrong: 0,               // Total wrong answers
    bookmarks: [],          // Array of bookmarked question IDs
    attemptedQuestions: {}, // Object with question attempts
    topicStats: {},         // Stats per topic
    lastOpened: null,       // Last viewed question
    studyStreak: 0,         // Current study streak
    totalTimeSpent: 0       // Total time in seconds
  },
  settings: {
    darkMode: true,
    fontSize: 16,
    shuffleQuestions: true,
    shuffleOptions: true,
    showTimer: true,
    showExplanation: true,
    revisionMode: false,
    enableSounds: false
  }
}
```

## ❓ Using Questions

### Question Structure
Each question follows this format:

```json
{
  "id": 1,
  "topic": "SQL Basics",
  "difficulty": "Easy",
  "type": "MCQ",
  "question": "Which SQL statement retrieves data?",
  "options": ["INSERT", "SELECT", "UPDATE", "DELETE"],
  "correct": 1,
  "explanation": "SELECT retrieves data from database...",
  "example": "SELECT * FROM employees;",
  "interviewTip": "SELECT is the foundation of SQL..."
}
```

### Adding New Questions

1. **Edit questions.json**
   - Add new question object to array
   - Maintain same structure
   - Assign unique ID

2. **Example Addition**
   ```json
   {
     "id": 101,
     "topic": "SQL Basics",
     "difficulty": "Easy",
     "type": "MCQ",
     "question": "Your question here?",
     "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
     "correct": 0,
     "explanation": "Detailed explanation...",
     "example": "SELECT example code...",
     "interviewTip": "Helpful tip for interviews..."
   }
   ```

3. **Validate JSON**
   - Ensure valid JSON syntax
   - All fields present
   - Unique IDs

### Question Types
- **MCQ**: Multiple choice questions
- **Fill in the Blank**: Complete the SQL statement
- **Predict Output**: Choose the output
- **Find Error**: Identify the mistake
- **Scenario Based**: Real-world scenarios
- **Code Analysis**: Analyze and understand code

## ⚙️ Customization

### Adding Topics

Edit the topic list in `script.js`:
```javascript
// In populateTopicsFilter() function
const topics = [...new Set(AppState.questions.map(q => q.topic))];
```

Topics are automatically extracted from questions.json.

### Changing Colors

Edit CSS variables in `style.css`:
```css
:root {
    --primary: #6366f1;           /* Main brand color */
    --accent: #ec4899;            /* Secondary accent */
    --bg-primary: #0f172a;        /* Main background */
    --bg-secondary: #1e293b;      /* Secondary background */
    --text-primary: #f1f5f9;      /* Main text */
    --success: #10b981;           /* Success color */
    --error: #ef4444;             /* Error color */
}
```

### Adjusting Font Size

Users can adjust in Settings tab:
- Range: 14px to 20px
- Default: 16px

## 🎮 Features Explained

### Practice Mode
1. Apply filters (difficulty, topic, status)
2. Click a question to view
3. Answer immediately
4. Get instant feedback
5. View explanation and example
6. Navigate: Previous, Next, Random

### Test Mode
1. Select test type (30, 50, 100, custom)
2. Configure settings (negative marking, skip option, timer)
3. Answer all questions
4. Submit test
5. View detailed results with recommendations

### Revision Mode
- Hide all answers
- Manually reveal one by one
- Perfect for self-testing
- Toggle in Practice Mode

### Topic Wise Revision
1. View all topics with statistics
2. Click topic to see questions
3. Filter by difficulty
4. Track accuracy per topic

### Analytics
- Overall statistics
- Topic-wise accuracy
- Difficulty breakdown
- Weak and strong topics
- Time spent tracking
- Completion percentage

### Bookmarks
- Save questions for review
- Filter by: All, Correct, Wrong, Unattempted
- Quick access to saved questions
- Manage bookmark list

## 🔑 Keyboard Shortcuts

In Test Mode:
- **Arrow Right**: Next question
- **Arrow Left**: Previous question
- **1-4**: Select option (for MCQ)

## 📊 Statistics Tracking

### Tracked Metrics
- **Attempted**: Total questions answered
- **Correct**: Number of correct answers
- **Wrong**: Number of wrong answers
- **Accuracy**: Percentage of correct answers
- **Completion**: Percentage of all questions done
- **Study Streak**: Consecutive days of practice
- **Time Spent**: Total time in hours
- **Per-Topic Stats**: Accuracy by topic

## 🌐 Browser Compatibility

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

## 📱 Responsive Breakpoints

- **Mobile**: 320px - 640px
- **Tablet**: 640px - 1024px
- **Desktop**: 1024px+

## ⚡ Performance

- **Offline**: Works completely without internet
- **Fast Loading**: All data loaded on startup
- **Instant Feedback**: No server delays
- **Smooth Animations**: 60 FPS smooth transitions
- **Local Storage**: Instant save/load of progress

## 🔒 Privacy & Data

- **No Cloud Sync**: All data stays on your device
- **No Analytics Tracking**: Your activity isn't tracked
- **No Ads**: Completely ad-free
- **Export/Backup**: Download your data anytime
- **LocalStorage**: Data persists across sessions

## 🛠️ Technical Stack

- **HTML5**: Semantic markup
- **CSS3**: Modern styling, animations, responsive design
- **Vanilla JavaScript ES6+**: No frameworks, no libraries
- **LocalStorage API**: Data persistence
- **JSON**: Data format

## 📝 Files Explained

### index.html
- Complete semantic HTML structure
- Navigation, all pages, modals
- Form inputs and button elements
- ~530 lines

### style.css
- Dark mode theme
- Smooth animations and transitions
- Responsive grid/flexbox layouts
- Mobile-first approach
- ~1700 lines

### script.js
- State management (AppState object)
- All functionality:
  - Data loading and persistence
  - Navigation between pages
  - Practice mode with filters
  - Test mode with timer
  - Analytics calculations
  - Settings management
- Event listeners and keyboard shortcuts
- Utility functions
- ~1300 lines

### questions.json
- 100+ carefully curated SQL questions
- Multiple difficulty levels
- Multiple topics
- Detailed explanations
- Real SQL examples
- Interview tips
- JSON format for easy editing

## 🐛 Debugging

### Enable Console Logging
Open browser DevTools (F12) and check console for:
- Questions loaded count
- State save/load operations
- Navigation events
- Query execution

### Clear All Data
```javascript
// In browser console:
localStorage.removeItem('sqlmaster_state');
location.reload();
```

## 🚀 Optimization Tips

### For Teachers
1. Customize questions.json with your curriculum
2. Adjust difficulty distribution
3. Add specific topics needed
4. Set up as class resource

### For Students
1. Use Revision Mode for self-testing
2. Focus on weak topics
3. Track accuracy percentage
4. Export progress regularly
5. Study consistently for streaks

## 📞 Support & Contributing

### Reporting Issues
1. Check browser console for errors
2. Clear browser cache and retry
3. Try in incognito/private mode
4. Check LocalStorage limits

### Contributing
1. Add new questions to questions.json
2. Improve explanations
3. Add more topics
4. Suggest features
5. Report bugs

## 📄 License

This project is free to use for educational purposes.

## 🎓 Learning Resources

### SQL Topics Covered
- Beginner to Advanced level questions
- Interview-focused topics
- Real-world scenarios
- Best practices
- Performance optimization

### How to Use Effectively
1. Start with SQL Basics
2. Focus on one topic at a time
3. Use Practice Mode first
4. Then use Test Mode
5. Review weak topics regularly
6. Track progress on Analytics

## 🌟 Why SQLMaster?

✅ **500+ Questions** - Comprehensive coverage
✅ **Multiple Learning Modes** - Practice, Test, Topic-wise
✅ **No Installation** - Pure web technology
✅ **No Internet Needed** - Offline-first design
✅ **Free Forever** - No subscriptions or ads
✅ **Mobile Friendly** - Practice anywhere
✅ **Progress Tracking** - Detailed analytics
✅ **Dark Mode** - Easy on the eyes
✅ **Modern UI** - Beautiful animations
✅ **Fully Customizable** - Add your own questions

## 🏆 Get Started Now!

1. Open `index.html` in your browser
2. Click "Start Practice" or "Take a Test"
3. Choose questions and start learning
4. Track your progress
5. Master SQL! 🚀

---

**SQLMaster** - Master SQL with Confidence! 💪

Built with ❤️ for SQL learners and professionals.
