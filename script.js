/* ==========================================
   SQL REVISION PLATFORM - JAVASCRIPT
   All Functionality and State Management
   ========================================== */

// ==================== STATE MANAGEMENT ====================

// Global State
const AppState = {
    questions: [],
    stats: {
        attempted: 0,
        correct: 0,
        wrong: 0,
        bookmarks: [],
        attemptedQuestions: {},
        topicStats: {},
        lastOpened: null,
        studyStreak: 0,
        totalTimeSpent: 0,
    },
    currentQuestion: null,
    practiceFiltered: [],
    testMode: {
        active: false,
        questions: [],
        currentIndex: 0,
        answers: {},
        startTime: null,
        timerInterval: null,
    },
    settings: {
        darkMode: true,
        fontSize: 16,
        shuffleQuestions: true,
        shuffleOptions: true,
        showTimer: true,
        showExplanation: true,
        revisionMode: false,
        enableSounds: false,
    },
};

// ==================== INITIALIZATION ====================

document.addEventListener('DOMContentLoaded', async () => {
    // Load questions from JSON
    await loadQuestions();
    
    // Load state from LocalStorage or initialize defaults
    loadState();
    
    // Setup event listeners
    setupEventListeners();
    
    // Initialize UI
    populateTopicsFilter();
    updateHomePageStats();
    renderTopics();
    
    // Set dark mode
    if (AppState.settings.darkMode) {
        document.body.classList.add('dark-mode');
    }
});

// ==================== DATA LOADING ====================

/**
 * Load questions from questions.json
 */
async function loadQuestions() {
    try {
        const response = await fetch('questions.json');
        AppState.questions = await response.json();
        console.log(`Loaded ${AppState.questions.length} questions`);
    } catch (error) {
        console.error('Error loading questions:', error);
        AppState.questions = getDefaultQuestions();
    }
}

/**
 * Load state from LocalStorage
 */
function loadState() {
    const savedState = localStorage.getItem('sqlmaster_state');
    if (savedState) {
        try {
            const parsed = JSON.parse(savedState);
            AppState.stats = { ...AppState.stats, ...parsed.stats };
            AppState.settings = { ...AppState.settings, ...parsed.settings };
        } catch (error) {
            console.error('Error loading state:', error);
        }
    } else {
        // First time user - initialize from defaults
        initializeDefaultProgress();
    }
}

/**
 * Initialize default progress
 */
function initializeDefaultProgress() {
    // Initialize topics stats
    const topics = [...new Set(AppState.questions.map(q => q.topic))];
    topics.forEach(topic => {
        AppState.stats.topicStats[topic] = {
            attempted: 0,
            correct: 0,
            accuracy: 0,
        };
    });
}

/**
 * Save state to LocalStorage
 */
function saveState() {
    const state = {
        stats: AppState.stats,
        settings: AppState.settings,
    };
    localStorage.setItem('sqlmaster_state', JSON.stringify(state));
}

// ==================== EVENT LISTENERS ====================

function setupEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = link.getAttribute('data-page');
            navigatePage(page);
        });
    });

    // Mobile menu toggle
    document.querySelector('.mobile-toggle')?.addEventListener('click', () => {
        document.querySelector('.nav-menu').classList.toggle('open');
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyboardShortcuts);
}

/**
 * Handle keyboard shortcuts
 */
function handleKeyboardShortcuts(e) {
    if (AppState.testMode.active) {
        if (e.key === 'ArrowRight') {
            nextTestQuestion();
        } else if (e.key === 'ArrowLeft') {
            previousTestQuestion();
        } else if (e.key === '1' || e.key === '2' || e.key === '3' || e.key === '4') {
            selectOption(parseInt(e.key) - 1);
        }
    }
}

// ==================== NAVIGATION ====================

/**
 * Navigate to different pages
 */
function navigatePage(page) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(p => {
        p.classList.remove('active');
    });

    // Show selected page
    document.getElementById(page).classList.add('active');

    // Update nav links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('data-page') === page) {
            link.classList.add('active');
        }
    });

    // Update content based on page
    if (page === 'home') {
        updateHomePageStats();
        renderRecentActivity();
    } else if (page === 'analytics') {
        renderAnalytics();
    } else if (page === 'bookmarks') {
        renderBookmarks();
    } else if (page === 'topics') {
        renderTopics();
    }

    // Scroll to top
    window.scrollTo(0, 0);
}

// ==================== HOME PAGE ====================

/**
 * Update home page statistics
 */
function updateHomePageStats() {
    const total = Object.keys(AppState.stats.attemptedQuestions).length;
    const correct = AppState.stats.correct || 0;
    const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

    document.getElementById('stat-attempted').textContent = total;
    document.getElementById('stat-correct').textContent = accuracy + '%';
    document.getElementById('stat-streak').textContent = AppState.stats.studyStreak;
    document.getElementById('stat-bookmarks').textContent = AppState.stats.bookmarks.length;
}

/**
 * Render recent activity
 */
function renderRecentActivity() {
    const list = document.getElementById('recent-activity-list');
    
    if (AppState.stats.attemptedQuestions && Object.keys(AppState.stats.attemptedQuestions).length > 0) {
        const recent = Object.entries(AppState.stats.attemptedQuestions)
            .sort((a, b) => new Date(b[1].timestamp) - new Date(a[1].timestamp))
            .slice(0, 5);

        list.innerHTML = recent.map(([qId, attempt]) => {
            const question = AppState.questions.find(q => q.id == qId);
            return `
                <div class="activity-item">
                    <div>
                        <strong>${question?.topic || 'Unknown'}</strong>
                        <p>${question?.question.substring(0, 60)}...</p>
                        <div class="activity-time">${new Date(attempt.timestamp).toLocaleString()}</div>
                    </div>
                    <span>${attempt.correct ? '✓' : '✗'}</span>
                </div>
            `;
        }).join('');
    } else {
        list.innerHTML = '<p class="no-data">No activity yet. Start practicing!</p>';
    }
}

/**
 * Continue learning from last question
 */
function continueLearning() {
    if (AppState.stats.lastOpened) {
        navigatePage('practice');
        setTimeout(() => {
            const question = AppState.questions.find(q => q.id == AppState.stats.lastOpened);
            if (question) {
                displayQuestion(question);
            }
        }, 100);
    }
}

// ==================== PRACTICE MODE ====================

/**
 * Apply filters and show practice questions
 */
function applyPracticeFilters() {
    const difficultyFilters = [];
    if (document.getElementById('filter-easy').checked) difficultyFilters.push('Easy');
    if (document.getElementById('filter-medium').checked) difficultyFilters.push('Medium');
    if (document.getElementById('filter-hard').checked) difficultyFilters.push('Hard');

    const statusFilters = [];
    if (document.getElementById('filter-bookmarked').checked) statusFilters.push('bookmarked');
    if (document.getElementById('filter-attempted').checked) statusFilters.push('attempted');
    if (document.getElementById('filter-unattempted').checked) statusFilters.push('unattempted');

    const topicFilter = document.getElementById('practice-topic-filter').value;
    const searchTerm = document.getElementById('practice-search').value.toLowerCase();

    AppState.practiceFiltered = AppState.questions.filter(q => {
        // Difficulty filter
        if (difficultyFilters.length > 0 && !difficultyFilters.includes(q.difficulty)) {
            return false;
        }

        // Topic filter
        if (topicFilter && q.topic !== topicFilter) {
            return false;
        }

        // Search filter
        if (searchTerm && !q.question.toLowerCase().includes(searchTerm)) {
            return false;
        }

        // Status filter
        if (statusFilters.length > 0) {
            const attempted = AppState.stats.attemptedQuestions[q.id];
            const isBookmarked = AppState.stats.bookmarks.includes(q.id);

            let matches = false;
            if (statusFilters.includes('bookmarked') && isBookmarked) matches = true;
            if (statusFilters.includes('attempted') && attempted) matches = true;
            if (statusFilters.includes('unattempted') && !attempted) matches = true;

            if (statusFilters.length > 0 && !matches) return false;
        }

        return true;
    });

    renderPracticeQuestions();
}

/**
 * Reset practice filters
 */
function resetPracticeFilters() {
    document.getElementById('filter-easy').checked = false;
    document.getElementById('filter-medium').checked = false;
    document.getElementById('filter-hard').checked = false;
    document.getElementById('filter-bookmarked').checked = false;
    document.getElementById('filter-attempted').checked = false;
    document.getElementById('filter-unattempted').checked = false;
    document.getElementById('practice-topic-filter').value = '';
    document.getElementById('practice-search').value = '';
    
    AppState.practiceFiltered = [];
    document.getElementById('practice-question-area').innerHTML =
        '<p class="no-data">Select filters and click a question to start</p>';
}

/**
 * Render practice questions list
 */
function renderPracticeQuestions() {
    const container = document.getElementById('practice-question-area');

    if (AppState.practiceFiltered.length === 0) {
        container.innerHTML = '<p class="no-data">No questions match your filters</p>';
        return;
    }

    const questions = AppState.settings.shuffleQuestions
        ? [...AppState.practiceFiltered].sort(() => Math.random() - 0.5)
        : AppState.practiceFiltered;

    container.innerHTML = `
        <div class="questions-list">
            ${questions.map((q, idx) => {
                const attempted = AppState.stats.attemptedQuestions[q.id];
                const isBookmarked = AppState.stats.bookmarks.includes(q.id);
                
                return `
                    <div class="question-item" onclick="displayQuestion(${q.id})">
                        <div class="question-item-text">
                            <strong>Q${idx + 1}. ${q.question.substring(0, 80)}...</strong>
                        </div>
                        <div class="question-item-meta">
                            <span class="question-item-badge">${q.difficulty}</span>
                            <span class="question-item-badge">${q.topic}</span>
                            ${attempted ? `
                                <div class="question-item-status status-attempted">
                                    ${attempted.correct ? '✓' : '✗'}
                                </div>
                            ` : `
                                <div class="question-item-status status-unattempted"></div>
                            `}
                            ${isBookmarked ? '<span style="color: #f59e0b;">🔖</span>' : ''}
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

/**
 * Toggle revision mode
 */
function toggleRevisionMode() {
    AppState.settings.revisionMode = document.getElementById('revision-mode').checked;
    saveState();
}

/**
 * Display a question in modal
 */
function displayQuestion(questionId) {
    const question = AppState.questions.find(q => q.id == questionId);
    if (!question) return;

    AppState.currentQuestion = question;
    AppState.stats.lastOpened = questionId;
    saveState();

    const modal = document.getElementById('question-modal');
    
    // Set question details
    document.getElementById('modal-q-id').textContent = `Q${question.id}`;
    document.getElementById('modal-q-difficulty').textContent = question.difficulty;
    document.getElementById('modal-q-topic').textContent = question.topic;
    document.getElementById('modal-question-text').textContent = question.question;
    document.getElementById('modal-question-type').textContent = question.type || 'MCQ';

    // Render options - get stored shuffle seed or create new one
    let shuffleKey = `shuffle_${question.id}`;
    let optionIndices = JSON.parse(sessionStorage.getItem(shuffleKey));
    
    if (!optionIndices) {
        optionIndices = Array.from({ length: question.options.length }, (_, i) => i);
        if (AppState.settings.shuffleOptions) {
            optionIndices.sort(() => Math.random() - 0.5);
        }
        sessionStorage.setItem(shuffleKey, JSON.stringify(optionIndices));
    }
    
    const options = optionIndices.map(i => question.options[i]);

    const optionsContainer = document.getElementById('modal-options-container');
    optionsContainer.innerHTML = options.map((opt, displayIdx) => {
        const originalIdx = optionIndices[displayIdx];
        const attempted = AppState.stats.attemptedQuestions[question.id];
        const isSelected = attempted?.selectedOption === originalIdx;
        const isCorrect = originalIdx === question.correct;
        const showCorrect = attempted && !AppState.settings.revisionMode;

        let classes = 'option';
        if (isSelected) classes += ' selected';
        if (showCorrect && isCorrect) classes += ' correct';
        if (showCorrect && isSelected && !isCorrect) classes += ' incorrect';

        return `
            <div class="option ${classes}" onclick="selectAnswerOption(${question.id}, ${originalIdx})">
                <span class="option-letter">${String.fromCharCode(65 + displayIdx)}.</span>
                ${opt}
            </div>
        `;
    }).join('');

    // Show/hide reveal button
    const revealBtn = document.getElementById('reveal-answer-btn');
    if (AppState.settings.revisionMode && !AppState.stats.attemptedQuestions[question.id]) {
        revealBtn.style.display = 'inline-flex';
    } else {
        revealBtn.style.display = 'none';
    }

    // Show explanation if answered
    const attempted = AppState.stats.attemptedQuestions[question.id];
    if (attempted && !AppState.settings.revisionMode) {
        showExplanation(question, attempted.selectedOption);
    }

    // Update bookmark button
    const bookmarkBtn = document.getElementById('bookmark-btn');
    if (AppState.stats.bookmarks.includes(question.id)) {
        bookmarkBtn.textContent = '🔖';
    } else {
        bookmarkBtn.textContent = '🔖';
    }

    // Show modal
    modal.classList.remove('hidden');
}

/**
 * Select an answer option
 */
function selectAnswerOption(questionId, optionIdx) {
    const question = AppState.questions.find(q => q.id == questionId);
    if (!question) return;

    const isCorrect = optionIdx === question.correct;

    // Record answer
    AppState.stats.attemptedQuestions[question.id] = {
        selectedOption: optionIdx,
        correct: isCorrect,
        timestamp: new Date().toISOString(),
    };

    // Update statistics
    if (!AppState.stats.attemptedQuestions[question.id].wasCountedBefore) {
        if (isCorrect) {
            AppState.stats.correct++;
        } else {
            AppState.stats.wrong++;
        }
        AppState.stats.attemptedQuestions[question.id].wasCountedBefore = true;

        // Update topic stats
        if (!AppState.stats.topicStats[question.topic]) {
            AppState.stats.topicStats[question.topic] = { attempted: 0, correct: 0 };
        }
        AppState.stats.topicStats[question.topic].attempted++;
        if (isCorrect) {
            AppState.stats.topicStats[question.topic].correct++;
        }
    }

    saveState();

    // Update UI
    displayQuestion(question.id);

    // Play sound if enabled
    if (AppState.settings.enableSounds) {
        playSound(isCorrect ? 'correct' : 'incorrect');
    }

    // Show explanation
    if (!AppState.settings.revisionMode) {
        showExplanation(question, optionIdx);
    }
}

/**
 * Show explanation for a question
 */
function showExplanation(question, selectedIdx) {
    const section = document.getElementById('explanation-section');
    section.style.display = 'block';

    const isCorrect = selectedIdx === question.correct;
    document.getElementById('explanation-text').innerHTML = `
        <strong>${isCorrect ? '✓ Correct!' : '✗ Incorrect'}</strong><br><br>
        ${question.explanation}
    `;

    // Show example if exists
    if (question.example) {
        document.getElementById('example-section').style.display = 'block';
        document.getElementById('example-code').textContent = question.example;
    }

    // Show interview tip if exists
    if (question.interviewTip) {
        document.getElementById('trick-section').style.display = 'block';
        document.getElementById('trick-text').textContent = question.interviewTip;
    }
}

/**
 * Reveal answer in revision mode
 */
function revealAnswer() {
    const question = AppState.currentQuestion;
    if (!question) return;

    // Mark as attempted
    AppState.stats.attemptedQuestions[question.id] = {
        selectedOption: question.correct,
        correct: true,
        timestamp: new Date().toISOString(),
        revealed: true,
    };

    saveState();
    displayQuestion(question.id);
}

/**
 * Navigate to next question
 */
function nextQuestion() {
    if (!AppState.currentQuestion) return;

    const currentIndex = AppState.practiceFiltered.findIndex(q => q.id === AppState.currentQuestion.id);
    if (currentIndex < AppState.practiceFiltered.length - 1) {
        displayQuestion(AppState.practiceFiltered[currentIndex + 1].id);
    }
}

/**
 * Navigate to previous question
 */
function previousQuestion() {
    if (!AppState.currentQuestion) return;

    const currentIndex = AppState.practiceFiltered.findIndex(q => q.id === AppState.currentQuestion.id);
    if (currentIndex > 0) {
        displayQuestion(AppState.practiceFiltered[currentIndex - 1].id);
    }
}

/**
 * Navigate to random question
 */
function randomQuestion() {
    if (AppState.practiceFiltered.length === 0) return;
    const random = AppState.practiceFiltered[Math.floor(Math.random() * AppState.practiceFiltered.length)];
    displayQuestion(random.id);
}

/**
 * Toggle bookmark for current question
 */
function toggleBookmark() {
    if (!AppState.currentQuestion) return;

    const qId = AppState.currentQuestion.id;
    const index = AppState.stats.bookmarks.indexOf(qId);

    if (index > -1) {
        AppState.stats.bookmarks.splice(index, 1);
    } else {
        AppState.stats.bookmarks.push(qId);
    }

    saveState();
    displayQuestion(qId);
}

/**
 * Report a question
 */
function reportQuestion() {
    if (!AppState.currentQuestion) return;
    alert(`Question #${AppState.currentQuestion.id} reported successfully. Thank you for your feedback!`);
}

/**
 * Close question modal
 */
function closeQuestionModal() {
    document.getElementById('question-modal').classList.add('hidden');
    AppState.currentQuestion = null;
    // Clear shuffle seeds when closing modal to allow fresh shuffle on next open
    Object.keys(sessionStorage).forEach(key => {
        if (key.startsWith('shuffle_')) {
            sessionStorage.removeItem(key);
        }
    });
}

// ==================== TEST MODE ====================

/**
 * Start a test with specified question count
 */
function startTest(count) {
    const questions = [...AppState.questions]
        .sort(() => Math.random() - 0.5)
        .slice(0, count);

    AppState.testMode = {
        active: true,
        questions,
        currentIndex: 0,
        answers: {},
        startTime: Date.now(),
        timerInterval: null,
    };

    // Hide setup, show test
    document.getElementById('test-setup').style.display = 'none';
    document.getElementById('test-container').classList.remove('hidden');
    document.getElementById('test-result').classList.add('hidden');

    // Start timer if enabled
    if (document.getElementById('test-show-timer').checked) {
        startTestTimer();
    }

    renderTestQuestion();
}

/**
 * Start test timer
 */
function startTestTimer() {
    const durationMinutes = (AppState.testMode.questions.length / 2); // ~30 sec per question
    let remainingSeconds = Math.floor(durationMinutes * 60);

    AppState.testMode.timerInterval = setInterval(() => {
        remainingSeconds--;

        const minutes = Math.floor(remainingSeconds / 60);
        const seconds = remainingSeconds % 60;
        const timerElement = document.getElementById('test-timer-display');

        if (timerElement) {
            timerElement.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

            if (remainingSeconds <= 60) {
                timerElement.classList.add('critical');
            } else if (remainingSeconds <= 300) {
                timerElement.classList.add('warning');
            }
        }

        if (remainingSeconds <= 0) {
            clearInterval(AppState.testMode.timerInterval);
            endTest();
        }
    }, 1000);
}

/**
 * Render current test question
 */
function renderTestQuestion() {
    const container = document.getElementById('test-container');
    const question = AppState.testMode.questions[AppState.testMode.currentIndex];

    if (!question) {
        endTest();
        return;
    }

    const options = [...question.options];
    
    container.innerHTML = `
        <div class="test-header">
            <div>
                <div class="test-progress">Question ${AppState.testMode.currentIndex + 1} of ${AppState.testMode.questions.length}</div>
                <div style="margin-top: 10px; background: var(--bg-primary); height: 6px; border-radius: 3px; overflow: hidden;">
                    <div style="background: linear-gradient(90deg, var(--primary), var(--accent)); height: 100%; width: ${((AppState.testMode.currentIndex + 1) / AppState.testMode.questions.length) * 100}%;"></div>
                </div>
            </div>
            ${document.getElementById('test-show-timer').checked ? `
                <div class="test-timer-display" id="test-timer-display">00:00</div>
            ` : ''}
        </div>

        <div class="question-body">
            <p class="question-text">${question.question}</p>
            <div class="options-container">
                ${options.map((opt, idx) => `
                    <div class="option ${AppState.testMode.answers[question.id] === idx ? 'selected' : ''}" 
                         onclick="selectTestOption(${question.id}, ${idx})">
                        <span class="option-letter">${String.fromCharCode(65 + idx)}.</span>
                        ${opt}
                    </div>
                `).join('')}
            </div>
        </div>

        <div class="test-actions">
            ${AppState.testMode.currentIndex > 0 ? `
                <button class="btn btn-secondary" onclick="previousTestQuestion()">← Previous</button>
            ` : ''}
            ${document.getElementById('test-allow-skip').checked ? `
                <button class="btn btn-secondary" onclick="skipTestQuestion()">Skip</button>
            ` : ''}
            ${AppState.testMode.currentIndex < AppState.testMode.questions.length - 1 ? `
                <button class="btn btn-primary" onclick="nextTestQuestion()">Next →</button>
            ` : `
                <button class="btn btn-primary" onclick="endTest()">Submit Test</button>
            `}
        </div>
    `;
}

/**
 * Select option in test
 */
function selectTestOption(questionId, optionIdx) {
    AppState.testMode.answers[questionId] = optionIdx;
    // Re-render to show selection highlight
    renderTestQuestion();
}

/**
 * Skip test question
 */
function skipTestQuestion() {
    if (AppState.testMode.currentIndex < AppState.testMode.questions.length - 1) {
        AppState.testMode.currentIndex++;
        renderTestQuestion();
    }
}

/**
 * Next test question
 */
function nextTestQuestion() {
    if (AppState.testMode.currentIndex < AppState.testMode.questions.length - 1) {
        AppState.testMode.currentIndex++;
        renderTestQuestion();
    }
}

/**
 * Previous test question
 */
function previousTestQuestion() {
    if (AppState.testMode.currentIndex > 0) {
        AppState.testMode.currentIndex--;
        renderTestQuestion();
    }
}

/**
 * End test and show results
 */
function endTest() {
    if (AppState.testMode.timerInterval) {
        clearInterval(AppState.testMode.timerInterval);
    }

    // Calculate score
    let correct = 0;
    let wrong = 0;

    AppState.testMode.questions.forEach(question => {
        const selected = AppState.testMode.answers[question.id];
        if (selected !== undefined) {
            if (selected === question.correct) {
                correct++;
            } else {
                wrong--;
                if (document.getElementById('test-negative-marking').checked) {
                    correct -= 0.25;
                }
            }
        }
    });

    const accuracy = Math.round((correct / AppState.testMode.questions.length) * 100);
    const timeSpent = Math.round((Date.now() - AppState.testMode.startTime) / 1000);

    // Save test results
    AppState.testMode.questions.forEach(question => {
        const selected = AppState.testMode.answers[question.id];
        if (selected !== undefined) {
            AppState.stats.attemptedQuestions[question.id] = {
                selectedOption: selected,
                correct: selected === question.correct,
                timestamp: new Date().toISOString(),
                testMode: true,
            };

            if (!AppState.stats.topicStats[question.topic]) {
                AppState.stats.topicStats[question.topic] = { attempted: 0, correct: 0 };
            }
            AppState.stats.topicStats[question.topic].attempted++;
            if (selected === question.correct) {
                AppState.stats.topicStats[question.topic].correct++;
            }
        }
    });

    AppState.stats.totalTimeSpent += timeSpent;
    saveState();

    // Show results
    const resultContainer = document.getElementById('test-result');
    resultContainer.innerHTML = `
        <div class="result-grade">${accuracy}%</div>
        <div class="result-message">${accuracy >= 80 ? '🎉 Excellent!' : accuracy >= 60 ? '👍 Good!' : '📚 Keep Learning'}</div>

        <div class="result-stats">
            <div class="result-stat">
                <div class="result-stat-value">${correct}</div>
                <div class="result-stat-label">Correct</div>
            </div>
            <div class="result-stat">
                <div class="result-stat-value">${wrong}</div>
                <div class="result-stat-label">Wrong</div>
            </div>
            <div class="result-stat">
                <div class="result-stat-value">${AppState.testMode.questions.length - correct - wrong}</div>
                <div class="result-stat-label">Skipped</div>
            </div>
            <div class="result-stat">
                <div class="result-stat-value">${Math.floor(timeSpent / 60)}:${String(timeSpent % 60).padStart(2, '0')}</div>
                <div class="result-stat-label">Time</div>
            </div>
        </div>

        <div class="result-recommendation">
            <strong>Recommendation:</strong><br>
            ${accuracy >= 80 
                ? "You've mastered this topic! Try a harder difficulty or move to the next topic."
                : accuracy >= 60
                ? "Good progress! Review the topics where you made mistakes and try again."
                : "Review the fundamentals and practice more questions in these topics."}
        </div>

        <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; margin-top: 30px;">
            <button class="btn btn-primary" onclick="navigatePage('home')">Back to Home</button>
            <button class="btn btn-secondary" onclick="navigatePage('practice')">Practice More</button>
            <button class="btn btn-secondary" onclick="location.reload()">Restart Test</button>
        </div>
    `;

    document.getElementById('test-container').classList.add('hidden');
    resultContainer.classList.remove('hidden');
    AppState.testMode.active = false;
    
    // Clear shuffle seeds
    Object.keys(sessionStorage).forEach(key => {
        if (key.startsWith('shuffle_')) {
            sessionStorage.removeItem(key);
        }
    });
}

// ==================== TOPICS ====================

/**
 * Render topics page
 */
function renderTopics() {
    const topics = [...new Set(AppState.questions.map(q => q.topic))];
    const grid = document.getElementById('topics-grid');

    grid.innerHTML = topics.map(topic => {
        const count = AppState.questions.filter(q => q.topic === topic).length;
        const topicStats = AppState.stats.topicStats[topic] || { attempted: 0, correct: 0 };
        const accuracy = topicStats.attempted > 0 
            ? Math.round((topicStats.correct / topicStats.attempted) * 100)
            : 0;

        return `
            <div class="topic-card" onclick="viewTopicDetail('${topic}')">
                <div class="topic-icon">${getTopicIcon(topic)}</div>
                <div class="topic-name">${topic}</div>
                <div class="topic-count">${count} Questions</div>
                <div style="color: var(--primary); font-size: 12px; margin-top: 8px;">
                    ${topicStats.attempted > 0 ? `Accuracy: ${accuracy}%` : 'Not started'}
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Get icon for topic
 */
function getTopicIcon(topic) {
    const icons = {
        'SQL Basics': '🔰',
        'Joins': '🔗',
        'Functions': '⚙️',
        'Aggregates': '📊',
        'Subqueries': '🎯',
        'Windows': '🪟',
        'Normalization': '📋',
        'Transactions': '🔄',
        'Indexing': '🔍',
        'Performance': '⚡',
    };
    return icons[topic] || '📝';
}

/**
 * View topic details
 */
function viewTopicDetail(topic) {
    const topicQuestions = AppState.questions.filter(q => q.topic === topic);
    const detail = document.getElementById('topic-detail');

    document.getElementById('topics-grid').style.display = 'none';
    detail.classList.remove('hidden');

    detail.innerHTML = `
        <div class="topic-detail-header">
            <div class="topic-detail-title">${topic}</div>
            <button class="back-btn" onclick="backToTopics()">← Back</button>
        </div>

        <div class="questions-list">
            ${topicQuestions.map((q, idx) => {
                const attempted = AppState.stats.attemptedQuestions[q.id];
                return `
                    <div class="question-item" onclick="displayQuestion(${q.id})">
                        <div class="question-item-text">
                            <strong>Q${idx + 1}. ${q.question.substring(0, 80)}...</strong>
                        </div>
                        <div class="question-item-meta">
                            <span class="question-item-badge">${q.difficulty}</span>
                            ${attempted ? `
                                <div class="question-item-status status-attempted">
                                    ${attempted.correct ? '✓' : '✗'}
                                </div>
                            ` : `
                                <div class="question-item-status status-unattempted"></div>
                            `}
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

/**
 * Back to topics list
 */
function backToTopics() {
    document.getElementById('topics-grid').style.display = 'grid';
    document.getElementById('topic-detail').classList.add('hidden');
}

// ==================== BOOKMARKS ====================

/**
 * Render bookmarks page
 */
function renderBookmarks() {
    const container = document.getElementById('bookmarks-list');
    const filter = document.querySelector('.filter-btn.active')?.getAttribute('data-filter') || 'all';

    let questions = AppState.stats.bookmarks
        .map(id => AppState.questions.find(q => q.id == id))
        .filter(q => q !== undefined);

    if (filter === 'correct') {
        questions = questions.filter(q => AppState.stats.attemptedQuestions[q.id]?.correct);
    } else if (filter === 'wrong') {
        questions = questions.filter(q => AppState.stats.attemptedQuestions[q.id] && !AppState.stats.attemptedQuestions[q.id].correct);
    } else if (filter === 'unattempted') {
        questions = questions.filter(q => !AppState.stats.attemptedQuestions[q.id]);
    }

    if (questions.length === 0) {
        container.innerHTML = '<p class="no-data">No bookmarks in this category</p>';
        return;
    }

    container.innerHTML = `
        <div class="questions-list">
            ${questions.map((q, idx) => {
                const attempted = AppState.stats.attemptedQuestions[q.id];
                return `
                    <div class="question-item" onclick="displayQuestion(${q.id})">
                        <div class="question-item-text">
                            <strong>Q${idx + 1}. ${q.question.substring(0, 80)}...</strong>
                        </div>
                        <div class="question-item-meta">
                            <span class="question-item-badge">${q.difficulty}</span>
                            <span class="question-item-badge">${q.topic}</span>
                            ${attempted ? `
                                <div class="question-item-status status-attempted">
                                    ${attempted.correct ? '✓' : '✗'}
                                </div>
                            ` : `
                                <div class="question-item-status status-unattempted"></div>
                            `}
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

/**
 * Filter bookmarks
 */
function filterBookmarks(type) {
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    event.target.setAttribute('data-filter', type);
    renderBookmarks();
}

// ==================== ANALYTICS ====================

/**
 * Render analytics page
 */
function renderAnalytics() {
    // Overall stats
    const total = Object.keys(AppState.stats.attemptedQuestions).length;
    const correct = AppState.stats.correct || 0;
    const wrong = AppState.stats.wrong || 0;
    const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
    const completion = Math.round((total / AppState.questions.length) * 100);
    const hours = Math.floor(AppState.stats.totalTimeSpent / 3600);

    document.getElementById('analytics-total').textContent = total;
    document.getElementById('analytics-correct').textContent = correct;
    document.getElementById('analytics-wrong').textContent = wrong;
    document.getElementById('analytics-accuracy').textContent = accuracy + '%';
    document.getElementById('analytics-time').textContent = hours + 'h';
    document.getElementById('analytics-completion').textContent = completion + '%';

    // Topic accuracy
    const topicContainer = document.getElementById('topic-accuracy-chart');
    topicContainer.innerHTML = `
        <div class="breakdown-list">
            ${Object.entries(AppState.stats.topicStats)
                .filter(([_, stats]) => stats.attempted > 0)
                .sort((a, b) => (b[1].correct / b[1].attempted) - (a[1].correct / a[1].attempted))
                .map(([topic, stats]) => {
                    const topicAccuracy = Math.round((stats.correct / stats.attempted) * 100);
                    return `
                        <div class="breakdown-item">
                            <div class="breakdown-label">${topic}</div>
                            <div class="breakdown-bar">
                                <div class="breakdown-fill" style="width: ${topicAccuracy}%"></div>
                            </div>
                            <div class="breakdown-value">${topicAccuracy}%</div>
                        </div>
                    `;
                }).join('')}
        </div>
    `;

    // Difficulty breakdown
    const difficultyStats = {};
    AppState.questions.forEach(q => {
        if (!difficultyStats[q.difficulty]) {
            difficultyStats[q.difficulty] = { total: 0, correct: 0 };
        }
        difficultyStats[q.difficulty].total++;

        const attempted = AppState.stats.attemptedQuestions[q.id];
        if (attempted?.correct) {
            difficultyStats[q.difficulty].correct++;
        }
    });

    document.getElementById('difficulty-breakdown').innerHTML = `
        <div class="breakdown-list">
            ${Object.entries(difficultyStats).map(([diff, stats]) => {
                const acc = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
                return `
                    <div class="breakdown-item">
                        <div class="breakdown-label">${diff}</div>
                        <div class="breakdown-bar">
                            <div class="breakdown-fill" style="width: ${acc}%"></div>
                        </div>
                        <div class="breakdown-value">${stats.correct}/${stats.total}</div>
                    </div>
                `;
            }).join('')}
        </div>
    `;

    // Weak topics (accuracy < 60%)
    const weakTopics = Object.entries(AppState.stats.topicStats)
        .filter(([_, stats]) => stats.attempted > 0 && (stats.correct / stats.attempted) < 0.6)
        .sort((a, b) => (a[1].correct / a[1].attempted) - (b[1].correct / b[1].attempted))
        .slice(0, 5);

    document.getElementById('weak-topics').innerHTML = weakTopics.length === 0
        ? '<p style="color: var(--text-secondary);">No weak topics</p>'
        : weakTopics.map(([topic, stats]) => {
            const acc = Math.round((stats.correct / stats.attempted) * 100);
            return `
                <div class="topic-item">
                    <div class="topic-item-name">${topic}</div>
                    <div class="topic-item-accuracy" style="color: var(--error);">${acc}%</div>
                </div>
            `;
        }).join('');

    // Strong topics (accuracy >= 80%)
    const strongTopics = Object.entries(AppState.stats.topicStats)
        .filter(([_, stats]) => stats.attempted > 0 && (stats.correct / stats.attempted) >= 0.8)
        .sort((a, b) => (b[1].correct / b[1].attempted) - (a[1].correct / a[1].attempted))
        .slice(0, 5);

    document.getElementById('strong-topics').innerHTML = strongTopics.length === 0
        ? '<p style="color: var(--text-secondary);">No strong topics yet</p>'
        : strongTopics.map(([topic, stats]) => {
            const acc = Math.round((stats.correct / stats.attempted) * 100);
            return `
                <div class="topic-item">
                    <div class="topic-item-name">${topic}</div>
                    <div class="topic-item-accuracy" style="color: var(--success);">${acc}%</div>
                </div>
            `;
        }).join('');
}

// ==================== SETTINGS ====================

/**
 * Change font size
 */
function changeFontSize(size) {
    AppState.settings.fontSize = size;
    document.body.style.fontSize = size + 'px';
    document.getElementById('font-size-display').textContent = size + 'px';
    saveState();
}

/**
 * Toggle dark mode
 */
function toggleDarkMode() {
    AppState.settings.darkMode = document.getElementById('dark-mode-setting').checked;
    if (AppState.settings.darkMode) {
        document.body.classList.add('dark-mode');
    } else {
        document.body.classList.remove('dark-mode');
    }
    saveState();
}

/**
 * Export progress
 */
function exportProgress() {
    const data = {
        stats: AppState.stats,
        settings: AppState.settings,
        exportDate: new Date().toISOString(),
    };

    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sqlmaster_progress_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);

    alert('Progress exported successfully!');
}

/**
 * Import progress
 */
function importProgress() {
    const input = document.getElementById('import-file') || document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target.result);
                AppState.stats = data.stats;
                AppState.settings = data.settings;
                saveState();
                alert('Progress imported successfully!');
                location.reload();
            } catch (error) {
                alert('Error importing file. Please check the file format.');
            }
        };
        reader.readAsText(file);
    };
    input.click();
}

/**
 * Reset statistics
 */
function resetStatistics() {
    if (confirm('Are you sure? This will reset all your statistics but keep bookmarks.')) {
        AppState.stats.attempted = 0;
        AppState.stats.correct = 0;
        AppState.stats.wrong = 0;
        AppState.stats.attemptedQuestions = {};
        AppState.stats.topicStats = {};
        AppState.stats.totalTimeSpent = 0;
        initializeDefaultProgress();
        saveState();
        alert('Statistics reset successfully!');
        location.reload();
    }
}

/**
 * Clear bookmarks
 */
function clearBookmarks() {
    if (confirm('Are you sure? This will remove all bookmarks.')) {
        AppState.stats.bookmarks = [];
        saveState();
        alert('Bookmarks cleared successfully!');
    }
}

// ==================== UTILITIES ====================

/**
 * Populate topics filter dropdown
 */
function populateTopicsFilter() {
    const select = document.getElementById('practice-topic-filter');
    const topics = [...new Set(AppState.questions.map(q => q.topic))].sort();

    topics.forEach(topic => {
        const option = document.createElement('option');
        option.value = topic;
        option.textContent = topic;
        select.appendChild(option);
    });
}

/**
 * Play sound effect
 */
function playSound(type) {
    // Using Web Audio API for simple beep sounds
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();

    oscillator.connect(gain);
    gain.connect(audioContext.destination);

    if (type === 'correct') {
        oscillator.frequency.value = 800;
        gain.gain.setValueAtTime(0.3, audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
    } else {
        oscillator.frequency.value = 400;
        gain.gain.setValueAtTime(0.2, audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
    }
}

/**
 * Get default questions (fallback)
 */
function getDefaultQuestions() {
    // This will be replaced by questions.json, but provides fallback
    return [];
}

// ==================== INITIALIZATION ON LOAD ====================

// Initialize with default settings
window.addEventListener('load', () => {
    document.getElementById('dark-mode-setting').checked = AppState.settings.darkMode;
    document.getElementById('font-size-control').value = AppState.settings.fontSize;
    document.getElementById('font-size-display').textContent = AppState.settings.fontSize + 'px';
});
