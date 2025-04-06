/**
 * Mentaura Frontend Integration
 * Script to integrate the Mentaura API with the existing frontend
 */

// Initialize the API client
const api = new MentauraAPI('http://localhost:5000');

// DOM elements for integration
const sendMessageBtn = document.getElementById('send-message');
const userInputField = document.getElementById('user-input');
const conversationHistory = document.getElementById('conversation-history');
const voiceInputBtn = document.getElementById('voice-input');
const imageUploadBtn = document.getElementById('image-upload');
const loginSubmitBtn = document.getElementById('login-submit');
const practiceQuestionsBtn = document.querySelector('.action-card:nth-child(2)');
const newTopicBtn = document.querySelector('.action-card:nth-child(3)');
const learningHistoryBtn = document.querySelector('.action-card:nth-child(4)');

// Check if elements exist before adding event listeners
if (sendMessageBtn && userInputField && conversationHistory) {
    // Text message handling
    sendMessageBtn.addEventListener('click', async function() {
        await sendMessage();
    });
    
    userInputField.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
}

if (voiceInputBtn) {
    // Voice input handling
    voiceInputBtn.addEventListener('click', function() {
        startVoiceRecording();
    });
}

if (imageUploadBtn) {
    // Image upload handling
    imageUploadBtn.addEventListener('click', function() {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*';
        fileInput.click();
        
        fileInput.addEventListener('change', function(e) {
            if (e.target.files && e.target.files[0]) {
                const file = e.target.files[0];
                processImageInput(file);
            }
        });
    });
}

if (loginSubmitBtn) {
    // Login handling
    loginSubmitBtn.addEventListener('click', async function() {
        const usernameInput = document.getElementById('login-username');
        const username = usernameInput.value.trim();
        
        if (username) {
            // For simplicity, we're just storing the username
            // In a real app, you would authenticate with email/password
            localStorage.setItem('mentaura_username', username);
            
            // Mock user ID for now
            const mockUserId = `user_${Date.now()}`;
            api.setUserId(mockUserId);
            
            // Hide modal
            const loginModal = document.getElementById('login-modal');
            if (loginModal) {
                loginModal.style.display = 'none';
            }
            
            // Update UI
            document.getElementById('username').textContent = username;
            document.getElementById('learning-type').textContent = 'Type: Visual Learner';
        }
    });
}

if (practiceQuestionsBtn) {
    // Practice questions handling
    practiceQuestionsBtn.addEventListener('click', async function() {
        // Get current topic from conversation or default to a general topic
        const topic = getCurrentTopicFromConversation() || 'general knowledge';
        
        try {
            const response = await api.generatePracticeQuestions(topic);
            displayPracticeQuestions(response.questions);
        } catch (error) {
            console.error('Error generating practice questions:', error);
            addSystemMessage('Failed to generate practice questions. Please try again later.');
        }
    });
}

if (newTopicBtn) {
    // New topic suggestion handling
    newTopicBtn.addEventListener('click', async function() {
        // Get current topic from conversation or default to a general topic
        const topic = getCurrentTopicFromConversation() || 'general knowledge';
        
        try {
            const response = await api.suggestRelatedTopics(topic);
            addSystemMessage(`Here are some related topics you might want to explore: ${response.suggestions}`);
        } catch (error) {
            console.error('Error suggesting related topics:', error);
            addSystemMessage('Failed to suggest related topics. Please try again later.');
        }
    });
}

if (learningHistoryBtn) {
    // Learning history handling
    learningHistoryBtn.addEventListener('click', async function() {
        try {
            const response = await api.getLearningHistory();
            displayLearningHistory(response.history);
        } catch (error) {
            console.error('Error fetching learning history:', error);
            addSystemMessage('Failed to fetch learning history. Please try again later.');
        }
    });
}

// Helper Functions

/**
 * Sends a message to the AI and displays the response
 */
async function sendMessage() {
    const message = userInputField.value.trim();
    if (!message) return;
    
    // Create and append user message
    addUserMessage(message);
    
    // Clear input field
    userInputField.value = '';
    
    // Show typing indicator
    const typingIndicator = addTypingIndicator();
    
    try {
        // Call API
        const response = await api.processText(message, {
            generateSpeech: true
        });
        
        // Remove typing indicator
        if (typingIndicator) {
            conversationHistory.removeChild(typingIndicator);
        }
        
        // Add AI response
        addAIMessage(response.text, response.audio);
        
    } catch (error) {
        console.error('Error processing message:', error);
        
        // Remove typing indicator
        if (typingIndicator) {
            conversationHistory.removeChild(typingIndicator);
        }
        
        // Add error message
        addSystemMessage('Sorry, I encountered an error processing your message. Please try again.');
    }
}

/**
 * Starts voice recording for speech input
 */
function startVoiceRecording() {
    // Check if browser supports getUserMedia
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert('Your browser does not support audio recording');
        return;
    }
    
    // Show recording indicator
    addSystemMessage('Recording... Speak now');
    
    // Get audio stream
    navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
            // Create media recorder
            const mediaRecorder = new MediaRecorder(stream);
            const audioChunks = [];
            
            // Add recording indicator UI
            const recordingIndicator = document.createElement('div');
            recordingIndicator.className = 'recording-indicator';
            recordingIndicator.innerHTML = '<i class="fas fa-microphone"></i> Recording...';
            document.body.appendChild(recordingIndicator);
            
            // Set up event handlers
            mediaRecorder.addEventListener('dataavailable', event => {
                audioChunks.push(event.data);
            });
            
            mediaRecorder.addEventListener('stop', async () => {
                // Remove recording indicator
                if (recordingIndicator) {
                    document.body.removeChild(recordingIndicator);
                }
                
                // Convert audio chunks to blob
                const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
                
                // Convert blob to base64
                const reader = new FileReader();
                reader.onloadend = async () => {
                    const base64Audio = reader.result.split(',')[1];
                    
                    // Process audio with API
                    processVoiceInput(base64Audio);
                };
                reader.readAsDataURL(audioBlob);
                
                // Stop all tracks
                stream.getTracks().forEach(track => track.stop());
            });
            
            // Start recording
            mediaRecorder.start();
            
            // Stop recording after 5 seconds
            setTimeout(() => {
                if (mediaRecorder.state !== 'inactive') {
                    mediaRecorder.stop();
                }
            }, 5000);
        })
        .catch(error => {
            console.error('Error accessing microphone:', error);
            addSystemMessage('Failed to access microphone. Please check permissions.');
        });
}

/**
 * Processes voice input
 * @param {string} base64Audio - Base64 encoded audio
 */
async function processVoiceInput(base64Audio) {
    // Show typing indicator
    const typingIndicator = addTypingIndicator();
    
    try {
        // Call API
        const response = await api.processVoice(base64Audio);
        
        // Remove typing indicator
        if (typingIndicator) {
            conversationHistory.removeChild(typingIndicator);
        }
        
        // Add user message with transcribed text
        addUserMessage(response.transcribed);
        
        // Add AI response
        addAIMessage(response.text, response.audio);
        
    } catch (error) {
        console.error('Error processing voice input:', error);
        
        // Remove typing indicator
        if (typingIndicator) {
            conversationHistory.removeChild(typingIndicator);
        }
        
        // Add error message
        addSystemMessage('Sorry, I encountered an error processing your voice input. Please try again.');
    }
}

/**
 * Processes image input
 * @param {File} file - Image file
 */
async function processImageInput(file) {
    // Check if file is an image
    if (!file.type.startsWith('image/')) {
        addSystemMessage('Please select an image file.');
        return;
    }
    
    // Show typing indicator
    const typingIndicator = addTypingIndicator();
    
    // Add image preview
    const reader = new FileReader();
    reader.onload = function(e) {
        const imagePreview = document.createElement('div');
        imagePreview.className = 'message user-message';
        imagePreview.innerHTML = `
            <div class="avatar">
                <i class="fas fa-user"></i>
            </div>
            <div class="message-content">
                <img src="${e.target.result}" alt="User uploaded image" style="max-width: 300px; max-height: 200px;">
            </div>
        `;
        conversationHistory.appendChild(imagePreview);
        conversationHistory.scrollTop = conversationHistory.scrollHeight;
    };
    reader.readAsDataURL(file);
    
    // Convert image to base64
    const base64Reader = new FileReader();
    base64Reader.onloadend = async () => {
        const base64Image = base64Reader.result.split(',')[1];
        
        try {
            // Call API
            const response = await api.processImage(base64Image);
            
            // Remove typing indicator
            if (typingIndicator) {
                conversationHistory.removeChild(typingIndicator);
            }
            
            // Add AI response
            addAIMessage(response.text, response.audio);
            
        } catch (error) {
            console.error('Error processing image input:', error);
            
            // Remove typing indicator
            if (typingIndicator) {
                conversationHistory.removeChild(typingIndicator);
            }
            
            // Add error message
            addSystemMessage('Sorry, I encountered an error processing your image. Please try again.');
        }
    };
    base64Reader.readAsDataURL(file);
}

/**
 * Adds a user message to the conversation
 * @param {string} message - User message
 */
function addUserMessage(message) {
    const userMessageElement = document.createElement('div');
    userMessageElement.className = 'message user-message';
    userMessageElement.innerHTML = `
        <div class="avatar">
            <i class="fas fa-user"></i>
        </div>
        <div class="message-content">
            <p>${message}</p>
        </div>
    `;
    conversationHistory.appendChild(userMessageElement);
    conversationHistory.scrollTop = conversationHistory.scrollHeight;
}

/**
 * Adds an AI message to the conversation
 * @param {string} message - AI message
 * @param {string} audioBase64 - Base64 encoded audio
 */
function addAIMessage(message, audioBase64) {
    const aiMessageElement = document.createElement('div');
    aiMessageElement.className = 'message ai-message';
    
    let audioHtml = '';
    if (audioBase64) {
        const audioSrc = `data:audio/mp3;base64,${audioBase64}`;
        audioHtml = `
            <div class="audio-controls">
                <audio controls>
                    <source src="${audioSrc}" type="audio/mp3">
                    Your browser does not support the audio element.
                </audio>
            </div>
        `;
    }
    
    aiMessageElement.innerHTML = `
        <div class="avatar">
            <i class="fas fa-robot"></i>
        </div>
        <div class="message-content">
            <p>${message}</p>
            ${audioHtml}
        </div>
    `;
    conversationHistory.appendChild(aiMessageElement);
    conversationHistory.scrollTop = conversationHistory.scrollHeight;
    
    // Auto-play audio if available
    if (audioBase64) {
        const audio = aiMessageElement.querySelector('audio');
        if (audio) {
            audio.play().catch(e => console.log('Auto-play prevented by browser', e));
        }
    }
}

/**
 * Adds a system message to the conversation
 * @param {string} message - System message
 */
function addSystemMessage(message) {
    const systemMessageElement = document.createElement('div');
    systemMessageElement.className = 'message system-message';
    systemMessageElement.innerHTML = `
        <div class="avatar">
            <i class="fas fa-info-circle"></i>
        </div>
        <div class="message-content">
            <p>${message}</p>
        </div>
    `;
    conversationHistory.appendChild(systemMessageElement);
    conversationHistory.scrollTop = conversationHistory.scrollHeight;
}

/**
 * Adds a typing indicator to the conversation
 * @returns {HTMLElement} - The typing indicator element
 */
function addTypingIndicator() {
    const typingIndicator = document.createElement('div');
    typingIndicator.className = 'message ai-message typing-indicator';
    typingIndicator.innerHTML = `
        <div class="avatar">
            <i class="fas fa-robot"></i>
        </div>
        <div class="message-content">
            <div class="typing-dots">
                <span></span>
                <span></span>
                <span></span>
            </div>
        </div>
    `;
    conversationHistory.appendChild(typingIndicator);
    conversationHistory.scrollTop = conversationHistory.scrollHeight;
    return typingIndicator;
}

/**
 * Extracts the current topic from the conversation
 * @returns {string|null} - The current topic or null if not found
 */
function getCurrentTopicFromConversation() {
    // Simple heuristic to determine the current topic from conversation
    // In a real app, you would use NLP or track the topic explicitly
    const messages = conversationHistory.querySelectorAll('.message-content p');
    if (messages.length === 0) return null;
    
    // Check the last few messages
    const lastMessages = Array.from(messages).slice(-3);
    
    // Common topic keywords
    const topicKeywords = [
        'math', 'mathematics', 'algebra', 'calculus', 'geometry',
        'physics', 'chemistry', 'biology', 'science',
        'programming', 'coding', 'computer science',
        'history', 'geography', 'literature', 'language',
        'economy', 'politics', 'philosophy'
    ];
    
    // Check for topic keywords in messages
    for (const message of lastMessages) {
        const text = message.textContent.toLowerCase();
        for (const keyword of topicKeywords) {
            if (text.includes(keyword)) {
                return keyword;
            }
        }
    }
    
    return null;
}

/**
 * Displays practice questions
 * @param {Array} questions - Array of practice questions
 */
function displayPracticeQuestions(questions) {
    // Create a modal for practice questions
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'practice-questions-modal';
    
    // Generate HTML for questions
    let questionsHtml = '';
    questions.forEach((question, index) => {
        questionsHtml += `
            <div class="question">
                <h4>Question ${index + 1}</h4>
                <p>${question.question}</p>
                <input type="text" class="answer-input" data-question-id="${index}" placeholder="Your answer">
                <button class="check-answer-btn" data-question-id="${index}">Check Answer</button>
                <div class="answer-feedback" id="feedback-${index}"></div>
            </div>
        `;
    });
    
    // Set modal content
    modal.innerHTML = `
        <div class="modal-content">
            <h2>Practice Questions</h2>
            <div class="practice-questions">
                ${questionsHtml}
            </div>
            <button id="close-practice-questions">Close</button>
        </div>
    `;
    
    // Add modal to DOM
    document.body.appendChild(modal);
    
    // Show modal
    modal.style.display = 'block';
    
    // Add event listeners
    modal.querySelector('#close-practice-questions').addEventListener('click', () => {
        document.body.removeChild(modal);
    });
    
    // Add event listeners for check answer buttons
    const checkAnswerBtns = modal.querySelectorAll('.check-answer-btn');
    checkAnswerBtns.forEach(btn => {
        btn.addEventListener('click', async () => {
            const questionId = btn.getAttribute('data-question-id');
            const questionObj = questions[questionId];
            const userAnswer = modal.querySelector(`.answer-input[data-question-id="${questionId}"]`).value;
            const feedbackElement = modal.querySelector(`#feedback-${questionId}`);
            
            try {
                const response = await api.evaluateAnswer(
                    questionObj.question,
                    userAnswer,
                    questionObj.answer
                );
                
                feedbackElement.innerHTML = `
                    <div class="${response.isCorrect ? 'correct-answer' : 'incorrect-answer'}">
                        <p>${response.isCorrect ? 'Correct!' : 'Incorrect!'}</p>
                        <p>Correct answer: ${response.correctAnswer}</p>
                        <p>${response.explanation}</p>
                    </div>
                `;
            } catch (error) {
                console.error('Error evaluating answer:', error);
                feedbackElement.innerHTML = `
                    <div class="error">
                        <p>Failed to evaluate answer. Please try again.</p>
                    </div>
                `;
            }
        });
    });
}

/**
 * Displays learning history
 * @param {Array} history - Array of learning history items
 */
function displayLearningHistory(history) {
    // Create a modal for learning history
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'learning-history-modal';
    
    // Group history by date
    const groupedHistory = {};
    history.forEach(item => {
        const date = new Date(item.timestamp).toLocaleDateString();
        if (!groupedHistory[date]) {
            groupedHistory[date] = [];
        }
        groupedHistory[date].push(item);
    });
    
    // Generate HTML for history
    let historyHtml = '';
    for (const date in groupedHistory) {
        historyHtml += `<h3>${date}</h3><ul>`;
        groupedHistory[date].forEach(item => {
            let itemHtml = '';
            switch (item.type) {
                case 'learning-session':
                    itemHtml = `<li>Learned about <strong>${item.topic}</strong> ${item.subtopic ? `(${item.subtopic})` : ''}</li>`;
                    break;
                case 'practice-questions':
                    itemHtml = `<li>Practiced <strong>${item.topic}</strong> questions</li>`;
                    break;
                case 'game-session':
                    itemHtml = `<li>Played <strong>${item.game}</strong> game</li>`;
                    break;
                default:
                    itemHtml = `<li>${item.type.replace('-', ' ')}</li>`;
            }
            historyHtml += itemHtml;
        });
        historyHtml += '</ul>';
    }
    
    // Set modal content
    modal.innerHTML = `
        <div class="modal-content">
            <h2>Learning History</h2>
            <div class="learning-history">
                ${historyHtml || '<p>No learning history found.</p>'}
            </div>
            <button id="close-learning-history">Close</button>
        </div>
    `;
    
    // Add modal to DOM
    document.body.appendChild(modal);
    
    // Show modal
    modal.style.display = 'block';
    
    // Add event listener
    modal.querySelector('#close-learning-history').addEventListener('click', () => {
        document.body.removeChild(modal);
    });
}

// Mentaura Backend Integration

// Global variables to track service status
let backendAvailable = false;
let userLoggedIn = false;

// Initialize when the document is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log("Integration.js loaded");
    checkBackendStatus();
    checkLoginStatus();
});

// Check if the backend server is available
async function checkBackendStatus() {
    try {
        const response = await fetch('http://localhost:5000/health', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });
        
        backendAvailable = response.ok;
        updateStatusIndicator(backendAvailable);
        console.log(`Backend status: ${backendAvailable ? 'Available' : 'Unavailable'}`);
        
        // If backend is available, check services
        if (backendAvailable) {
            checkBackendServices();
        }
        
        return backendAvailable;
    } catch (error) {
        console.log('Backend server not available:', error);
        backendAvailable = false;
        updateStatusIndicator(false);
        return false;
    }
}

// Check what services are available on the backend
async function checkBackendServices() {
    try {
        const response = await fetch('http://localhost:5000/api/services', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });
        
        if (response.ok) {
            const services = await response.json();
            console.log('Available services:', services);
        }
    } catch (error) {
        console.log('Error checking services:', error);
    }
}

// Check if user is logged in
function checkLoginStatus() {
    const user = localStorage.getItem('mentaura_user');
    userLoggedIn = !!user;
    
    // Update UI based on login status
    if (userLoggedIn) {
        const userData = JSON.parse(user);
        console.log('User logged in:', userData);
        
        // Update username display if on dashboard
        const usernameElement = document.getElementById('username');
        if (usernameElement) {
            usernameElement.textContent = userData.name || userData.email.split('@')[0];
        }
    }
    
    return userLoggedIn;
}

// Add a visual indicator for backend status
function updateStatusIndicator(isOnline) {
    let statusIndicator = document.getElementById('server-status');
    
    if (!statusIndicator) {
        statusIndicator = document.createElement('div');
        statusIndicator.id = 'server-status';
        statusIndicator.style.position = 'fixed';
        statusIndicator.style.bottom = '10px';
        statusIndicator.style.right = '10px';
        statusIndicator.style.padding = '5px 10px';
        statusIndicator.style.borderRadius = '5px';
        statusIndicator.style.fontSize = '12px';
        statusIndicator.style.fontWeight = 'bold';
        statusIndicator.style.zIndex = '1000';
        document.body.appendChild(statusIndicator);
    }
    
    if (isOnline) {
        statusIndicator.style.backgroundColor = '#4CAF50';
        statusIndicator.style.color = 'white';
        statusIndicator.textContent = 'Server Online';
    } else {
        statusIndicator.style.backgroundColor = '#F44336';
        statusIndicator.style.color = 'white';
        statusIndicator.textContent = 'Server Offline';
    }
} 