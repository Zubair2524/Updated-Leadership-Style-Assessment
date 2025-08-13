// Supabase Configuration
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Global variables
let currentUser = null;
let currentQuestions = [];
let currentQuestionIndex = 0;
let responses = [];
let usedStatementIds = [];

// Page navigation
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    document.getElementById(pageId).classList.add('active');
}

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

async function initializeApp() {
    // Check if user exists in localStorage
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        // Check if user has completed assessment
        const existingUser = await checkExistingUser(currentUser.fullName);
        if (existingUser && existingUser.assessment_completed) {
            // Show results page with existing data
            displayResults(existingUser);
            showPage('results-page');
        } else {
            // Continue to assessment
            startAssessment();
        }
    } else {
        // Show landing page
        showPage('landing-page');
    }
    
    setupEventListeners();
}

function setupEventListeners() {
    // User form submission
    document.getElementById('user-form').addEventListener('submit', handleUserFormSubmit);
    
    // Option buttons
    document.querySelectorAll('.option-btn').forEach(btn => {
        btn.addEventListener('click', handleOptionSelect);
    });
    
    // Certificate generation
    document.getElementById('generate-certificate').addEventListener('click', showCertificate);
    document.getElementById('print-certificate').addEventListener('click', printCertificate);
    
    // Retake assessment
    document.getElementById('retake-assessment').addEventListener('click', retakeAssessment);
    
    // Modal close
    document.querySelector('.close').addEventListener('click', closeCertificateModal);
    
    // Close modal when clicking outside
    window.addEventListener('click', function(event) {
        const modal = document.getElementById('certificate-modal');
        if (event.target === modal) {
            closeCertificateModal();
        }
    });
}

async function handleUserFormSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    currentUser = {
        fullName: formData.get('fullName'),
        city: formData.get('city'),
        team: formData.get('team'),
        designation: formData.get('designation')
    };
    
    // Save user to localStorage
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    
    // Check if user already exists in database
    const existingUser = await checkExistingUser(currentUser.fullName);
    if (existingUser && existingUser.assessment_completed) {
        // Show results page
        displayResults(existingUser);
        showPage('results-page');
    } else {
        // Start new assessment
        startAssessment();
    }
}

async function checkExistingUser(fullName) {
    try {
        const { data, error } = await supabase
            .from('leadership_assessments')
            .select('*')
            .eq('full_name', fullName)
            .single();
        
        if (error && error.code !== 'PGRST116') {
            console.error('Error checking existing user:', error);
            return null;
        }
        
        return data;
    } catch (error) {
        console.error('Error checking existing user:', error);
        return null;
    }
}

function startAssessment() {
    // Generate random questions
    currentQuestions = generateRandomQuestions();
    currentQuestionIndex = 0;
    responses = [];
    
    // Update UI
    document.getElementById('user-name-display').textContent = currentUser.fullName;
    
    // Show first question
    displayQuestion();
    showPage('assessment-page');
}

function generateRandomQuestions() {
    // Ensure we get at least 4 questions from each style (24 total) plus 1 random
    const questionsByStyle = {
        coercive: [],
        authoritative: [],
        affiliative: [],
        democratic: [],
        pacesetting: [],
        coaching: []
    };
    
    // Group statements by style
    LEADERSHIP_STATEMENTS.forEach(statement => {
        questionsByStyle[statement.style].push(statement);
    });
    
    const selectedQuestions = [];
    
    // Select 4 questions from each style
    Object.keys(questionsByStyle).forEach(style => {
        const styleQuestions = questionsByStyle[style];
        const shuffled = [...styleQuestions].sort(() => 0.5 - Math.random());
        selectedQuestions.push(...shuffled.slice(0, 4));
    });
    
    // Add 1 more random question to make 25 total
    const remainingQuestions = LEADERSHIP_STATEMENTS.filter(
        statement => !selectedQuestions.find(q => q.id === statement.id)
    );
    const randomQuestion = remainingQuestions[Math.floor(Math.random() * remainingQuestions.length)];
    selectedQuestions.push(randomQuestion);
    
    // Shuffle the final array
    return selectedQuestions.sort(() => 0.5 - Math.random());
}

function displayQuestion() {
    const question = currentQuestions[currentQuestionIndex];
    
    document.getElementById('question-number').textContent = currentQuestionIndex + 1;
    document.getElementById('question-text').textContent = question.text;
    document.getElementById('progress-text').textContent = `Question ${currentQuestionIndex + 1} of 25`;
    
    // Update progress bar
    const progressPercentage = ((currentQuestionIndex + 1) / 25) * 100;
    document.getElementById('progress-fill').style.width = `${progressPercentage}%`;
    
    // Reset option buttons
    document.querySelectorAll('.option-btn').forEach(btn => {
        btn.classList.remove('selected');
    });
}

function handleOptionSelect(e) {
    const selectedValue = parseInt(e.target.dataset.value);
    const question = currentQuestions[currentQuestionIndex];
    
    // Store response
    responses.push({
        questionId: question.id,
        style: question.style,
        value: selectedValue
    });
    
    // Visual feedback
    document.querySelectorAll('.option-btn').forEach(btn => {
        btn.classList.remove('selected');
    });
    e.target.classList.add('selected');
    
    // Auto-advance after a short delay
    setTimeout(() => {
        currentQuestionIndex++;
        
        if (currentQuestionIndex < currentQuestions.length) {
            displayQuestion();
        } else {
            finishAssessment();
        }
    }, 800);
}

async function finishAssessment() {
    // Calculate scores
    const scores = calculateScores();
    
    // Save to database
    await saveAssessmentResults(scores);
    
    // Display results
    displayResults({
        ...currentUser,
        ...scores,
        assessment_completed: true,
        completed_at: new Date().toISOString()
    });
    
    showPage('results-page');
}

function calculateScores() {
    const styleScores = {
        coercive: 0,
        authoritative: 0,
        affiliative: 0,
        democratic: 0,
        pacesetting: 0,
        coaching: 0
    };
    
    const styleCounts = {
        coercive: 0,
        authoritative: 0,
        affiliative: 0,
        democratic: 0,
        pacesetting: 0,
        coaching: 0
    };
    
    // Sum scores by style
    responses.forEach(response => {
        styleScores[response.style] += response.value;
        styleCounts[response.style]++;
    });
    
    // Calculate averages and percentages
    const stylePercentages = {};
    let maxScore = 0;
    let primaryStyle = '';
    
    Object.keys(styleScores).forEach(style => {
        if (styleCounts[style] > 0) {
            const average = styleScores[style] / styleCounts[style];
            const percentage = (average / 5) * 100;
            stylePercentages[style] = Math.round(percentage);
            
            if (percentage > maxScore) {
                maxScore = percentage;
                primaryStyle = style;
            }
        } else {
            stylePercentages[style] = 0;
        }
    });
    
    return {
        primary_style: primaryStyle,
        coercive_score: stylePercentages.coercive,
        authoritative_score: stylePercentages.authoritative,
        affiliative_score: stylePercentages.affiliative,
        democratic_score: stylePercentages.democratic,
        pacesetting_score: stylePercentages.pacesetting,
        coaching_score: stylePercentages.coaching
    };
}

async function saveAssessmentResults(scores) {
    try {
        const assessmentData = {
            full_name: currentUser.fullName,
            city: currentUser.city,
            team: currentUser.team,
            designation: currentUser.designation,
            primary_style: scores.primary_style,
            coercive_score: scores.coercive_score,
            authoritative_score: scores.authoritative_score,
            affiliative_score: scores.affiliative_score,
            democratic_score: scores.democratic_score,
            pacesetting_score: scores.pacesetting_score,
            coaching_score: scores.coaching_score,
            assessment_completed: true,
            completed_at: new Date().toISOString()
        };
        
        const { data, error } = await supabase
            .from('leadership_assessments')
            .upsert(assessmentData, { onConflict: 'full_name' });
        
        if (error) {
            console.error('Error saving assessment results:', error);
        }
    } catch (error) {
        console.error('Error saving assessment results:', error);
    }
}

function displayResults(userData) {
    // Update user name
    document.getElementById('results-user-name').textContent = userData.full_name || userData.fullName;
    
    // Display primary style
    const primaryStyleInfo = LEADERSHIP_STYLES[userData.primary_style];
    document.getElementById('primary-style-name').textContent = primaryStyleInfo.name;
    document.getElementById('primary-style-percentage').textContent = `${userData[userData.primary_style + '_score']}%`;
    document.getElementById('primary-style-description').textContent = primaryStyleInfo.description;
    
    // Display all styles
    const stylesGrid = document.getElementById('styles-grid');
    stylesGrid.innerHTML = '';
    
    Object.keys(LEADERSHIP_STYLES).forEach(styleKey => {
        const style = LEADERSHIP_STYLES[styleKey];
        const score = userData[styleKey + '_score'];
        
        const styleItem = document.createElement('div');
        styleItem.className = 'style-item';
        styleItem.innerHTML = `
            <h4>${style.name}</h4>
            <div class="style-score">${score}%</div>
            <div class="style-bar">
                <div class="style-bar-fill" style="width: ${score}%"></div>
            </div>
            <div class="style-desc">${style.description.substring(0, 100)}...</div>
        `;
        
        stylesGrid.appendChild(styleItem);
    });
    
    // Display development tips
    const developmentContent = document.getElementById('development-content');
    const primaryStyleTips = LEADERSHIP_STYLES[userData.primary_style].tips;
    developmentContent.innerHTML = `
        <ul>
            ${primaryStyleTips.map(tip => `<li>${tip}</li>`).join('')}
        </ul>
    `;
}

function showCertificate() {
    const userData = getCurrentUserData();
    const primaryStyleInfo = LEADERSHIP_STYLES[userData.primary_style];
    
    // Update certificate content
    document.getElementById('cert-name').textContent = userData.full_name || userData.fullName;
    document.getElementById('cert-style').textContent = primaryStyleInfo.name + ' Leadership';
    document.getElementById('cert-score').textContent = userData[userData.primary_style + '_score'];
    document.getElementById('cert-date').textContent = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    // Show modal
    document.getElementById('certificate-modal').style.display = 'block';
}

function printCertificate() {
    window.print();
}

function closeCertificateModal() {
    document.getElementById('certificate-modal').style.display = 'none';
}

function retakeAssessment() {
    // Clear current data
    currentUser = null;
    currentQuestions = [];
    currentQuestionIndex = 0;
    responses = [];
    usedStatementIds = [];
    
    // Clear localStorage
    localStorage.removeItem('currentUser');
    
    // Show landing page
    showPage('landing-page');
    
    // Reset form
    document.getElementById('user-form').reset();
}

function getCurrentUserData() {
    // This would normally come from the database, but for demo purposes
    // we'll construct it from current session data
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        const user = JSON.parse(savedUser);
        // Add mock scores for demo
        return {
            full_name: user.fullName,
            city: user.city,
            team: user.team,
            designation: user.designation,
            primary_style: 'authoritative', // This would come from actual calculation
            coercive_score: 65,
            authoritative_score: 85,
            affiliative_score: 70,
            democratic_score: 75,
            pacesetting_score: 60,
            coaching_score: 80
        };
    }
    return null;
}