/**
 * Mentaura API Client
 * Provides interface for communicating with the Mentaura AI backend
 */
class MentauraAPI {
    constructor() {
        this.baseUrl = "http://localhost:5000";
        this.isServerConnected = false;
        this.userId = null;
        this.userLearningType = null;
        this.apiURL = 'https://api.mentaura.com';
        this.apiKey = '';
        this.userInfo = {};
        this.messageHistory = [];
        this.maxHistoryLength = 20;
        this.serverAvailable = null; // null means unknown, true/false means checked
        this.lastServerCheck = 0;
        this.SERVER_CHECK_INTERVAL = 60000; // 1 minute
        this.checkServer();
        this.loadUserInfo();
    }

    // Load user information from localStorage
    loadUserInfo(userInfo) {
        try {
            const userData = JSON.parse(localStorage.getItem('mentaura_user'));
            if (userData) {
                this.userId = userData.username || userData.email?.split('@')[0];
                this.userLearningType = userData.learningType || 'Personal Growth';
                console.log(`Loaded user: ${this.userId}, Learning type: ${this.userLearningType}`);
            }
            this.userInfo = userInfo || userData || {};
        } catch (error) {
            console.error('Error loading user data:', error);
        }
    }

    async checkServer() {
        try {
            const response = await fetch(`${this.baseUrl}/health`, { 
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });
            this.isServerConnected = response.ok;
            
            // Update localStorage with connection status
            if (response.ok) {
                const userData = JSON.parse(localStorage.getItem('mentaura_user') || '{}');
                userData.isOnline = true;
                localStorage.setItem('mentaura_user', JSON.stringify(userData));
            }
            
            console.log(`Server connection: ${this.isServerConnected ? 'Connected' : 'Not connected'}`);
            return this.isServerConnected;
        } catch (error) {
            this.isServerConnected = false;
            console.log('Server not available, using fallback responses');
            
            // Update localStorage with connection status
            const userData = JSON.parse(localStorage.getItem('mentaura_user') || '{}');
            userData.isOnline = false;
            localStorage.setItem('mentaura_user', JSON.stringify(userData));
            
            return false;
        }
    }

    /**
     * Process text from the user and get a response from the Mentaura AI
     * @param {string} text - The user's input text
     * @param {Object} options - Additional options for processing
     * @param {boolean} options.generateEmotionalSpeech - Whether to generate emotional speech metadata
     * @param {boolean} options.generateImages - Whether to generate images for learning content
     * @param {boolean} options.generateNotes - Whether to generate structured notes
     * @param {boolean} options.evaluateUnderstanding - Whether to prepare for evaluation questions
     * @returns {Promise<Object>} - Promise resolving to the AI response
     */
    async processText(text, options = {}) {
        this.addMessage('user', text);
        
        // Determine the context based on message history
        const context = this.getContextFromHistory();
        
        // If offline or server is not available, use fallback
        if (!navigator.onLine || !(await this.checkServer())) {
            console.log('Using fallback response due to offline status or server unavailable');
            const response = this.getFallbackResponse(text);
            this.addMessage('ai', response);
            return {
                text: response,
                isOnline: false,
                emotion: 'neutral'
            };
        }
        
        try {
            // Prepare the request with user info and context
            const requestData = {
                text: text,
                user_info: this.userInfo,
                context: context,
                options: options || {}
            };
            
            // Make the API request
            const response = await fetch(`${this.apiURL}/process`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify(requestData)
            });
            
            if (!response.ok) {
                throw new Error(`API request failed with status ${response.status}`);
            }
            
            const data = await response.json();
            this.addMessage('ai', data.response);
            
            // Process and enhance the response based on options
            const enhancedResponse = this.enhanceResponse(data, text, options);
            
            return enhancedResponse;
        } catch (error) {
            console.error('Error processing text:', error);
            
            // Use fallback in case of error
            const fallbackResponse = this.getFallbackResponse(text);
            this.addMessage('ai', fallbackResponse);
            
            return {
                text: fallbackResponse,
                isOnline: true,
                error: error.message,
                emotion: 'concerned'
            };
        }
    }

    /**
     * Enhance the AI response with additional features based on options
     * @param {Object} data - The raw response data from the API
     * @param {string} userText - The original user input
     * @param {Object} options - The processing options
     * @returns {Object} - The enhanced response
     */
    enhanceResponse(data, userText, options) {
        let enhancedResponse = {
            text: data.response,
            isOnline: true,
            emotion: 'neutral'
        };
        
        // Add emotional metadata if requested
        if (options.generateEmotionalSpeech) {
            enhancedResponse.emotion = this.detectResponseEmotion(data.response);
        }
        
        // Generate notes for learning content if requested
        if (options.generateNotes) {
            const isLearningContent = this.isLearningContent(userText, data.response);
            
            if (isLearningContent) {
                enhancedResponse.notes = this.generateStructuredNotes(data.response);
                
                // Extract main topics for potential evaluation questions
                enhancedResponse.topics = this.extractTopics(data.response);
            }
        }
        
        // Generate placeholder images if requested
        if (options.generateImages) {
            const isLearningContent = this.isLearningContent(userText, data.response);
            
            if (isLearningContent) {
                enhancedResponse.images = this.generatePlaceholderImages(data.response);
            }
        }
        
        return enhancedResponse;
    }

    /**
     * Detect the emotional tone of a response
     * @param {string} text - The response text
     * @returns {string} - The detected emotion
     */
    detectResponseEmotion(text) {
        // Basic emotion detection based on content and punctuation
        const lowerText = text.toLowerCase();
        
        // Detect excitement
        if (text.includes('!') && 
            (lowerText.includes('amazing') || 
             lowerText.includes('excellent') || 
             lowerText.includes('fantastic') ||
             lowerText.includes('great job'))) {
            return 'excited';
        }
        
        // Detect happiness
        if (lowerText.includes('glad') || 
            lowerText.includes('happy to') || 
            lowerText.includes('wonderful')) {
            return 'happy';
        }
        
        // Detect curiosity
        if (text.includes('?') && 
            (lowerText.includes('curious') || 
             lowerText.includes('interesting') || 
             lowerText.includes('wonder'))) {
            return 'curious';
        }
        
        // Detect concern
        if (lowerText.includes('careful') || 
            lowerText.includes('caution') || 
            lowerText.includes('important to note')) {
            return 'concerned';
        }
        
        // Detect thoughtfulness
        if (lowerText.includes('consider') || 
            lowerText.includes('reflect') || 
            lowerText.includes('think about')) {
            return 'thoughtful';
        }
        
        // Detect sympathy
        if (lowerText.includes('understand your') || 
            lowerText.includes('sorry to hear') || 
            lowerText.includes('must be difficult')) {
            return 'sympathetic';
        }
        
        // Default to professional for educational content
        if (this.isLearningContent('', text)) {
            return 'professional';
        }
        
        // Default emotion
        return 'neutral';
    }

    /**
     * Determine if the content is educational based on text analysis
     * @param {string} userText - The user's input text
     * @param {string} responseText - The AI's response text
     * @returns {boolean} - Whether the content is educational
     */
    isLearningContent(userText, responseText) {
        const learningSignals = [
            'definition', 'concept', 'theory', 'formula', 'method',
            'process', 'steps', 'procedure', 'example', 'explanation',
            'in summary', 'key points', 'remember that', 'important to note',
            'to understand', 'works by', 'means that', 'refers to'
        ];
        
        const lowerResponse = responseText.toLowerCase();
        
        // Check if response contains learning signals
        const hasLearningSignals = learningSignals.some(signal => 
            lowerResponse.includes(signal)
        );
        
        // Check if response has paragraph structure (likely explanatory)
        const hasParagraphs = (responseText.split('\n\n').length > 1);
        
        // Check if response has bullet points (likely structured information)
        const hasBulletPoints = (responseText.includes('•') || 
                                 responseText.includes('- ') ||
                                 responseText.includes('* '));
        
        return hasLearningSignals || hasParagraphs || hasBulletPoints;
    }

    /**
     * Generate structured notes from a response
     * @param {string} text - The response text
     * @returns {Array} - Array of note points
     */
    generateStructuredNotes(text) {
        const notes = [];
        
        // Split text into paragraphs
        const paragraphs = text.split('\n\n').filter(p => p.trim().length > 0);
        
        // Process each paragraph
        paragraphs.forEach(paragraph => {
            // Skip very short paragraphs
            if (paragraph.length < 30) return;
            
            // Look for bullet points
            if (paragraph.includes('• ') || 
                paragraph.includes('- ') || 
                paragraph.includes('* ')) {
                
                // Split by bullet points
                const bulletPattern = /[•\-\*]\s+(.*?)(?=\n[•\-\*]|$)/gs;
                const bullets = [...paragraph.matchAll(bulletPattern)];
                
                bullets.forEach(match => {
                    if (match[1] && match[1].trim().length > 0) {
                        notes.push(match[1].trim());
                    }
                });
            } 
            // Check for numbered points
            else if (/^\d+\.\s/.test(paragraph)) {
                // Split by numbered points
                const numberPattern = /\d+\.\s+(.*?)(?=\n\d+\.|$)/gs;
                const numbered = [...paragraph.matchAll(numberPattern)];
                
                numbered.forEach(match => {
                    if (match[1] && match[1].trim().length > 0) {
                        notes.push(match[1].trim());
                    }
                });
            }
            // Add important sentences as notes
            else {
                const sentences = paragraph.split(/[.!?]/).filter(s => s.trim().length > 0);
                
                sentences.forEach(sentence => {
                    // Look for key phrases indicating important information
                    if (sentence.includes('important') || 
                        sentence.includes('key point') || 
                        sentence.includes('remember') ||
                        sentence.includes('note that') ||
                        sentence.includes('crucial') ||
                        sentence.length > 100) { // Longer sentences often contain key information
                        
                        notes.push(sentence.trim() + '.');
                    }
                });
                
                // If no important sentences were found, add the first sentence
                if (sentences.length > 0 && notes.length === 0) {
                    notes.push(sentences[0].trim() + '.');
                }
            }
        });
        
        // If we couldn't extract structured notes, create some based on the text
        if (notes.length === 0 && text.length > 100) {
            // Split by sentences
            const sentences = text.split(/[.!?]/).filter(s => s.trim().length > 20);
            
            // Take up to 3 sentences
            for (let i = 0; i < Math.min(3, sentences.length); i++) {
                notes.push(sentences[i].trim() + '.');
            }
        }
        
        return notes;
    }

    /**
     * Extract main topics from text
     * @param {string} text - The response text
     * @returns {Array} - Array of main topics
     */
    extractTopics(text) {
        const topics = [];
        const lowerText = text.toLowerCase();
        
        // Look for common topic indicators
        const definitions = text.match(/([A-Z][a-z]+(?:\s[a-z]+)*) (?:is|are|refers to|means|can be defined as)/g);
        if (definitions) {
            definitions.forEach(def => {
                const term = def.split(' ')[0];
                if (term && term.length > 2 && !topics.includes(term)) {
                    topics.push(term);
                }
            });
        }
        
        // Look for bold or emphasized text (often topics)
        const emphasized = text.match(/\*\*(.*?)\*\*/g) || text.match(/__(.*?)__/g);
        if (emphasized) {
            emphasized.forEach(emp => {
                const term = emp.replace(/\*\*/g, '').replace(/__/g, '');
                if (term && term.length > 2 && !topics.includes(term)) {
                    topics.push(term);
                }
            });
        }
        
        // If no topics found, extract based on frequency
        if (topics.length === 0) {
            // Remove common words
            const commonWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'by', 'with', 'about', 'as'];
            
            // Split the text into words
            const words = lowerText.split(/\W+/).filter(word => 
                word.length > 3 && !commonWords.includes(word)
            );
            
            // Count word frequency
            const wordCount = {};
            words.forEach(word => {
                wordCount[word] = (wordCount[word] || 0) + 1;
            });
            
            // Get the most frequent words
            const sortedWords = Object.entries(wordCount)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 3)
                .map(entry => entry[0]);
            
            topics.push(...sortedWords);
        }
        
        return topics;
    }

    /**
     * Generate placeholder images for learning content
     * @param {string} text - The response text
     * @returns {Array} - Array of image objects
     */
    generatePlaceholderImages(text) {
        // In a real implementation, this would call an image generation API
        // For now, we'll use placeholder images based on content
        
        const images = [];
        const topics = this.extractTopics(text);
        
        // Generate placeholder images for up to 2 topics
        for (let i = 0; i < Math.min(2, topics.length); i++) {
            const topic = topics[i];
            
            // Use placeholder service
            images.push({
                url: `https://source.unsplash.com/featured/?${encodeURIComponent(topic)}`,
                alt: `Visual representation of ${topic}`,
                caption: `Illustration related to ${topic}`
            });
        }
        
        return images;
    }

    /**
     * Fallback responses when server is unavailable
     * @param {string} text - User input text
     * @returns {string} - Fallback response
     */
    getFallbackResponse(text) {
        const lowerText = text.toLowerCase();
        const userData = JSON.parse(localStorage.getItem('mentaura_user') || '{}');
        const username = userData.username || userData.name || 'there';
        
        // Update connection status
        userData.isOnline = false;
        localStorage.setItem('mentaura_user', JSON.stringify(userData));
        
        if (lowerText.includes('hello') || lowerText.includes('hi')) {
            return `Hello ${username}! I'm Mentaura. How can I help you today?`;
        }
        
        if (lowerText.includes('math') || lowerText.includes('mathematics')) {
            return `Mathematics is a fascinating subject! I'd be happy to help you with math concepts. What specific topic or problem are you interested in?`;
        }
        
        if (lowerText.includes('science') || lowerText.includes('physics')) {
            return `Science helps us understand the natural world. I'd be happy to discuss scientific concepts with you. What aspect of science are you curious about?`;
        }
        
        return `I understand you're interested in learning about this. Let me help you with that. What specific aspects would you like to explore?`;
    }
    
    /**
     * Get context information from message history
     * @returns {Object} - Context information
     */
    getContextFromHistory() {
        // Last 5 messages for immediate context
        const recentMessages = this.messageHistory.slice(-5);
        
        // Extract topics from all messages
        const allText = this.messageHistory.map(msg => msg.text).join(' ');
        const topics = this.extractTopics(allText);
        
        return {
            recentMessages,
            topics
        };
    }
    
    /**
     * Add a message to the history
     * @param {string} role - Role of the message sender ('user' or 'ai')
     * @param {string} text - Message text
     */
    addMessage(role, text) {
        this.messageHistory.push({
            role,
            text,
            timestamp: Date.now()
        });
        
        // Trim history if it exceeds max length
        if (this.messageHistory.length > this.maxHistoryLength) {
            this.messageHistory = this.messageHistory.slice(-this.maxHistoryLength);
        }
        
        try {
            const messages = JSON.parse(localStorage.getItem('mentaura_messages') || '[]');
            messages.push({
                sender: role,
                text,
                timestamp: new Date().toISOString()
            });
            
            // Keep only the last 50 messages to avoid localStorage space issues
            const trimmedMessages = messages.slice(-50);
            localStorage.setItem('mentaura_messages', JSON.stringify(trimmedMessages));
        } catch (error) {
            console.error('Error saving message:', error);
        }
    }
    
    /**
     * Get user learning progress
     * @returns {Object} - Learning progress data
     */
    getLearningProgress() {
        // Extract topics from localStorage or generate default ones
        let topics = [];
        const recentMessages = this._getRecentMessages();
        
        if (recentMessages.length > 0) {
            topics = this._extractTopicsFromMessages(recentMessages);
        }
        
        return { topics };
    }
    
    /**
     * Helper to get recent messages from localStorage
     * @returns {Array} - Recent messages
     * @private
     */
    _getRecentMessages() {
        try {
            return JSON.parse(localStorage.getItem('mentaura_messages') || '[]');
        } catch (error) {
            console.error('Error loading messages:', error);
            return [];
        }
    }
    
    /**
     * Helper to extract topics from messages
     * @param {Array} messages - Messages to extract topics from
     * @returns {Array} - Extracted topics
     * @private
     */
    _extractTopicsFromMessages(messages) {
        const topics = [];
        const topicKeywords = {
            'math': ['mathematics', 'algebra', 'calculus', 'geometry', 'trigonometry'],
            'physics': ['mechanics', 'electricity', 'magnetism', 'quantum', 'relativity'],
            'chemistry': ['organic', 'inorganic', 'biochemistry', 'elements', 'compounds'],
            'biology': ['genetics', 'ecology', 'anatomy', 'physiology', 'evolution'],
            'computer science': ['programming', 'algorithms', 'data structures', 'coding', 'software'],
            'history': ['ancient', 'medieval', 'modern', 'world war', 'civilization'],
            'literature': ['poetry', 'novel', 'drama', 'fiction', 'shakespeare']
        };
        
        // Look for topic keywords in messages
        messages.forEach(message => {
            if (message.sender === 'user') {
                const text = message.text.toLowerCase();
                
                for (const [topic, keywords] of Object.entries(topicKeywords)) {
                    if (text.includes(topic) || keywords.some(keyword => text.includes(keyword))) {
                        // Only add if not already in the list
                        if (!topics.find(t => t.name === topic)) {
                            topics.push({
                                name: topic,
                                progress: Math.floor(Math.random() * 40) + 10, // Random progress 10-50%
                                lastStudied: new Date().toISOString()
                            });
                        }
                    }
                }
            }
        });
        
        return topics;
    }
}

// Export the API class
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { MentauraAPI };
} else if (typeof window !== 'undefined') {
    window.MentauraAPI = MentauraAPI;
} 