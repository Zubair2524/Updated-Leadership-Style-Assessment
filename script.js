// Supabase Configuration
const SUPABASE_URL = 'https://nfwuztbyvbasaqbpyojr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5md3V6dGJ5dmJhc2FxYnB5b2pyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwNjQ4NzcsImV4cCI6MjA3MDY0MDg3N30.DhEvb6H9kczxdD1N9_d6DmDkk6_9sUGZfKSFk7hYLdQ';

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
            displayResults(existingUser);
            showPage('results-page');
        } else {
            startAssessment();
        }
    } else {
        showPage('landing-page');
    }
    
    setupEventListeners();
}

function setupEventListeners() {
    document.getElementById('user-form').addEventListener('submit', handleUserFormSubmit);
    document.querySelectorAll('.option-btn').forEach(btn => {
        btn.addEventListener('click', handleOptionSelect);
    });
    document.getElementById('generate-certificate').addEventListener('click', showCertificate);
    document.getElementById('print-certificate').addEventListener('click', printCertificate);
    document.getElementById('retake-assessment').addEventListener('click', retakeAssessment);
    document.querySelector('.close').addEventListener('click', closeCertificateModal);
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
    
    const userData = {
        full_name: currentUser.fullName,
        city: currentUser.city,
        team: currentUser.team,
        designation: currentUser.designation,
        assessment_completed: false
    };
    const userSaved = await saveLeadershipData(userData);
    if (!userSaved) {
        return;
    }
    
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    
    const existingUser = await checkExistingUser(currentUser.fullName);
    if (existingUser && existingUser.assessment_completed) {
        displayResults(existingUser);
        showPage('results-page');
    } else {
        startAssessment();
    }
}

async function checkExistingUser(fullName) {
    try {
        const { data, error } = await supabase
            .from('updated_leadership')
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
    currentQuestions = generateRandomQuestions();
    currentQuestionIndex = 0;
    responses = [];
    
    document.getElementById('user-name-display').textContent = currentUser.fullName;
    displayQuestion();
    showPage('assessment-page');
}

function generateRandomQuestions() {
    const questionsByStyle = {
        coercive: [], authoritative: [], affiliative: [], democratic: [], pacesetting: [], coaching: []
    };
    
    LEADERSHIP_STATEMENTS.forEach(statement => {
        questionsByStyle[statement.style].push(statement);
    });
    
    const selectedQuestions = [];
    
    Object.keys(questionsByStyle).forEach(style => {
        const styleQuestions = questionsByStyle[style];
        const shuffled = [...styleQuestions].sort(() => 0.5 - Math.random());
        selectedQuestions.push(...shuffled.slice(0, 4));
    });
    
    const remainingQuestions = LEADERSHIP_STATEMENTS.filter(
        statement => !selectedQuestions.find(q => q.id === statement.id)
    );
    const randomQuestion = remainingQuestions[Math.floor(Math.random() * remainingQuestions.length)];
    selectedQuestions.push(randomQuestion);
    
    return selectedQuestions.sort(() => 0.5 - Math.random());
}

function displayQuestion() {
    const question = currentQuestions[currentQuestionIndex];
    
    document.getElementById('question-number').textContent = currentQuestionIndex + 1;
    document.getElementById('question-text').textContent = question ? question.text : 'No question available';
    document.getElementById('progress-text').textContent = `Question ${currentQuestionIndex + 1} of 25`;
    
    const progressPercentage = ((currentQuestionIndex + 1) / 25) * 100;
    document.getElementById('progress-fill').style.width = `${progressPercentage}%`;
    
    document.querySelectorAll('.option-btn').forEach(btn => {
        btn.classList.remove('selected');
    });
}

function handleOptionSelect(e) {
    const selectedValue = parseInt(e.target.dataset.value);
    const question = currentQuestions[currentQuestionIndex];
    
    if (question && question.id) {
        responses.push({
            questionId: question.id,
            style: question.style,
            value: selectedValue
        });
        
        document.querySelectorAll('.option-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
        e.target.classList.add('selected');
        
        setTimeout(() => {
            currentQuestionIndex++;
            if (currentQuestionIndex < currentQuestions.length) {
                displayQuestion();
            } else {
                finishAssessment();
            }
        }, 800);
    } else {
        console.error('Invalid question at index:', currentQuestionIndex);
    }
}

async function finishAssessment() {
    const scores = calculateScores();
    
    const assessmentData = {
        full_name: currentUser.fullName,
        ...scores,
        assessment_completed: true,
        completed_at: new Date().toISOString()
    };
    const saved = await saveLeadershipData(assessmentData);
    if (!saved) {
        return;
    }
    
    displayResults({
        ...currentUser,
        ...scores,
        assessment_completed: true,
        completed_at: new Date().toISOString()
    });
    
    showPage('results-page');
}

function calculateScores() {
    const styleScores = { coercive: 0, authoritative: 0, affiliative: 0, democratic: 0, pacesetting: 0, coaching: 0 };
    const styleCounts = { coercive: 0, authoritative: 0, affiliative: 0, democratic: 0, pacesetting: 0, coaching: 0 };
    
    responses.forEach(response => {
        styleScores[response.style] += response.value;
        styleCounts[response.style]++;
    });
    
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

async function saveLeadershipData(data) {
    try {
        const { data: result, error } = await supabase
            .from('updated_leadership')
            .upsert([data], { onConflict: 'full_name' });
        
        if (error) {
            console.error('Error saving leadership data:', error.message);
            alert('Failed to save data. Please try again.');
            return false;
        }
        console.log('Leadership data saved successfully:', result);
        return true;
    } catch (error) {
        console.error('Error saving leadership data:', error.message);
        alert('An unexpected error occurred. Please try again.');
        return false;
    }
}

function displayResults(userData) {
    document.getElementById('results-user-name').textContent = userData.full_name || userData.fullName;
    
    const primaryStyleInfo = LEADERSHIP_STYLES[userData.primary_style];
    document.getElementById('primary-style-name').textContent = primaryStyleInfo.name;
    document.getElementById('primary-style-percentage').textContent = `${userData[userData.primary_style + '_score']}%`;
    document.getElementById('primary-style-description').textContent = primaryStyleInfo.description;
    
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
    
    document.getElementById('cert-name').textContent = userData.full_name || userData.fullName;
    document.getElementById('cert-style').textContent = primaryStyleInfo.name + ' Leadership';
    document.getElementById('cert-score').textContent = userData[userData.primary_style + '_score'];
    document.getElementById('cert-date').textContent = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    document.getElementById('certificate-modal').style.display = 'block';
}

function printCertificate() {
    window.print();
}

function closeCertificateModal() {
    document.getElementById('certificate-modal').style.display = 'none';
}

function retakeAssessment() {
    currentUser = null;
    currentQuestions = [];
    currentQuestionIndex = 0;
    responses = [];
    usedStatementIds = [];
    
    localStorage.removeItem('currentUser');
    
    showPage('landing-page');
    document.getElementById('user-form').reset();
}

function getCurrentUserData() {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        const user = JSON.parse(savedUser);
        return {
            full_name: user.fullName,
            city: user.city,
            team: user.team,
            designation: user.designation,
            primary_style: 'authoritative',
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
