// Mentaura API Client
class MentauraAPI {
    constructor() {
        this.baseUrl = "http://localhost:5000";
        this.isServerConnected = false;
        this.userId = null;
        this.userLearningType = null;
        this.checkServer();
        this.loadUserInfo();
    }

    // Load user information from localStorage
    loadUserInfo() {
        try {
            const userData = JSON.parse(localStorage.getItem('mentaura_user'));
            if (userData) {
                this.userId = userData.username || userData.email.split('@')[0];
                this.userLearningType = userData.learningType || 'Personal Growth';
                console.log(`Loaded user: ${this.userId}, Learning type: ${this.userLearningType}`);
            }
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
        } catch (error) {
            this.isServerConnected = false;
            console.log('Server not available, using fallback responses');
            
            // Update localStorage with connection status
            const userData = JSON.parse(localStorage.getItem('mentaura_user') || '{}');
            userData.isOnline = false;
            localStorage.setItem('mentaura_user', JSON.stringify(userData));
        }
    }

    async processText(text, options = {}) {
        try {
            // Extract options or use defaults
            const {
                generateStructuredNotes = false,
                generateEmotionalSpeech = true,
                includeImages = false
            } = options;
            
            if (!this.isServerConnected) {
                return this._getFallbackResponse(text, { generateEmotionalSpeech });
            }

            const response = await fetch(`${this.baseUrl}/api/ai/process-text`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    text,
                    userId: this.userId,
                    learningType: this.userLearningType,
                    generateStructuredNotes,
                    generateEmotionalSpeech,
                    includeImages
                })
            });

            if (!response.ok) {
                throw new Error(`Server responded with status: ${response.status}`);
            }

            const responseData = await response.json();
            
            // Add emotional context if it's not already included from server
            if (generateEmotionalSpeech && !responseData.emotion) {
                responseData.emotion = this._detectEmotion(text, responseData.text);
            }
            
            // Generate structured notes if requested but not provided by server
            if (generateStructuredNotes && !responseData.structuredNotes) {
                responseData.structuredNotes = this._generateStructuredNotes(responseData.text);
            }
            
            // If we get here, the connection is working
            const userData = JSON.parse(localStorage.getItem('mentaura_user') || '{}');
            userData.isOnline = true;
            localStorage.setItem('mentaura_user', JSON.stringify(userData));
            
            return responseData;
        } catch (error) {
            console.error('Error processing text:', error);
            return this._getFallbackResponse(text, options);
        }
    }

    // Fallback responses when server is unavailable
    _getFallbackResponse(text, options = {}) {
        const { generateEmotionalSpeech = true, generateStructuredNotes = false } = options;
        const lowerText = text.toLowerCase();
        const userData = JSON.parse(localStorage.getItem('mentaura_user') || '{}');
        const username = userData.username || userData.name || 'there';
        
        // Update connection status
        userData.isOnline = false;
        localStorage.setItem('mentaura_user', JSON.stringify(userData));
        
        let response = { isOnline: false };
        
        if (lowerText.includes('hello') || lowerText.includes('hi')) {
            response.text = `Hello ${username}! I'm Mentaura. How can I help you today?`;
            response.emotion = 'happy';
        } else if (lowerText.includes('math') || lowerText.includes('mathematics')) {
            response.text = `Mathematics is a fascinating subject! I'd be happy to help you with math concepts. What specific topic or problem are you interested in?`;
            response.emotion = 'excited';
        } else if (lowerText.includes('science') || lowerText.includes('physics')) {
            response.text = `Science helps us understand the natural world. I'd be happy to discuss scientific concepts with you. What aspect of science are you curious about?`;
            response.emotion = 'curious';
        } else {
            response.text = `I'd be happy to help you with that. What specific aspects would you like to explore?`;
            response.emotion = 'thoughtful';
        }
        
        // Add structured notes if requested
        if (generateStructuredNotes) {
            response.structuredNotes = this._generateStructuredNotes(response.text);
        }
        
        return response;
    }
    
    // Detect emotional tone for voice synthesis
    _detectEmotion(query, response) {
        const queryLower = query.toLowerCase();
        const responseLower = response.toLowerCase();
        
        // Excitement detection
        if (
            responseLower.includes('fascinating') || 
            responseLower.includes('amazing') || 
            responseLower.includes('incredible') ||
            queryLower.includes('cool') ||
            queryLower.includes('awesome')
        ) {
            return 'excited';
        }
        
        // Happiness detection
        if (
            queryLower.includes('thank') || 
            queryLower.includes('appreciate') || 
            responseLower.includes('happy to help') ||
            responseLower.includes('glad to assist')
        ) {
            return 'happy';
        }
        
        // Curiosity detection
        if (
            queryLower.includes('why') || 
            queryLower.includes('how') || 
            queryLower.includes('what') ||
            responseLower.includes('interesting question') ||
            responseLower.includes('let\'s explore')
        ) {
            return 'curious';
        }
        
        // Concern detection
        if (
            queryLower.includes('difficult') || 
            queryLower.includes('hard') || 
            queryLower.includes('confused') ||
            queryLower.includes('help') ||
            responseLower.includes('important to note') ||
            responseLower.includes('be careful')
        ) {
            return 'concerned';
        }
        
        // Thoughtful detection - fallback emotion for academic topics
        if (
            queryLower.includes('explain') || 
            queryLower.includes('understand') ||
            responseLower.includes('concept') ||
            responseLower.includes('understand')
        ) {
            return 'thoughtful';
        }
        
        // Default to neutral
        return 'neutral';
    }
    
    // Generate structured notes from response text
    _generateStructuredNotes(text) {
        // Simple implementation that creates bullet points from paragraphs
        const paragraphs = text.split('\n').filter(p => p.trim().length > 0);
        
        let notes = {
            title: this._extractTitle(text),
            keyPoints: [],
            details: []
        };
        
        // Extract key points (first few paragraphs or sentences)
        paragraphs.slice(0, Math.min(2, paragraphs.length)).forEach(p => {
            const sentences = p.split(/[.!?]+/).filter(s => s.trim().length > 0);
            sentences.slice(0, Math.min(2, sentences.length)).forEach(s => {
                notes.keyPoints.push(s.trim());
            });
        });
        
        // Extract details from the rest of the paragraphs
        paragraphs.slice(Math.min(2, paragraphs.length)).forEach(p => {
            if (p.length > 30) { // Only use substantial paragraphs
                notes.details.push(p.trim());
            }
        });
        
        return notes;
    }
    
    // Extract a title from the text
    _extractTitle(text) {
        // Get the first sentence or first 50 characters
        const firstSentence = text.split(/[.!?]+/)[0].trim();
        
        if (firstSentence.length < 60) {
            return firstSentence;
        } else {
            // Extract key noun phrases for title
            const words = firstSentence.split(' ');
            if (words.length > 4) {
                return words.slice(0, 4).join(' ') + '...';
            } else {
                return firstSentence.substring(0, 50) + '...';
            }
        }
    }
    
    // Get user learning progress
    getLearningProgress() {
        // Extract topics from localStorage or generate default ones
        let topics = [];
        const recentMessages = this._getRecentMessages();
        
        if (recentMessages.length > 0) {
            topics = this._extractTopicsFromMessages(recentMessages);
        }
        
        return { topics };
    }
    
    // Helper to get recent messages from localStorage
    _getRecentMessages() {
        try {
            return JSON.parse(localStorage.getItem('mentaura_messages') || '[]');
        } catch (error) {
            console.error('Error loading messages:', error);
            return [];
        }
    }
    
    // Helper to extract topics from messages
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
    
    // Add a message to history
    addMessage(sender, text) {
        try {
            const messages = JSON.parse(localStorage.getItem('mentaura_messages') || '[]');
            messages.push({
                sender,
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
}
