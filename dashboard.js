// Mentaura Dashboard JavaScript

document.addEventListener('DOMContentLoaded', function() {
    console.log('Dashboard initialized');
    
    // TEMPORARY: Clear previous conversations to start fresh with new behavior
    localStorage.removeItem('mentaura_messages');
    
    // Initialize API client
    const api = new MentauraAPI();
    
    // Check if user is logged in
    const user = JSON.parse(localStorage.getItem('mentaura_user') || '{}');
    if (!user.username) {
        // Redirect to login page
        window.location.href = 'index.html';
        return;
    }
    
    // Update UI with user info
    const username = document.getElementById('username');
    const learningType = document.getElementById('learning-type');
    
    if (username) {
        username.textContent = user.username || user.name || '';
    }
    
    if (learningType) {
        learningType.textContent = user.learningType || 'Personal Growth';
    }
    
    // Update profile avatar to show first letter of username or a user icon
    const profileAvatar = document.getElementById('profile-avatar');
    const dropdownMenu = document.getElementById('profile-dropdown');
    
    if (profileAvatar) {
        // Replace default icon with user's first letter in a circle or user icon
        if (user.name) {
            const firstLetter = user.name.charAt(0).toUpperCase();
            profileAvatar.innerHTML = `<div class="avatar-circle">${firstLetter}</div>`;
        } else {
            profileAvatar.innerHTML = `<i class="fas fa-user"></i>`;
        }
    }
    
    // Handle profile dropdown
    if (profileAvatar && dropdownMenu) {
        console.log('Profile avatar and dropdown menu found');
        
        // Position the dropdown menu relative to the profile avatar
        function positionDropdown() {
            const avatarRect = profileAvatar.getBoundingClientRect();
            dropdownMenu.style.position = 'fixed';
            dropdownMenu.style.top = `${avatarRect.bottom + 5}px`;
            dropdownMenu.style.right = `${window.innerWidth - avatarRect.right}px`;
        }
        
        // Toggle dropdown when profile avatar is clicked
        profileAvatar.addEventListener('click', function(e) {
            e.stopPropagation();
            console.log('Profile avatar clicked');
            
            // Position the dropdown before showing it
            positionDropdown();
            
            // Toggle the active class
            dropdownMenu.classList.toggle('active');
        });
        
        // Close dropdown when clicking elsewhere
        document.addEventListener('click', function(e) {
            if (dropdownMenu.classList.contains('active') && !profileAvatar.contains(e.target) && !dropdownMenu.contains(e.target)) {
                dropdownMenu.classList.remove('active');
            }
        });
        
        // Reposition dropdown on window resize
        window.addEventListener('resize', function() {
            if (dropdownMenu.classList.contains('active')) {
                positionDropdown();
            }
        });
        
        // View profile functionality
        const viewProfileBtn = document.getElementById('view-profile');
        if (viewProfileBtn) {
            viewProfileBtn.addEventListener('click', function() {
                // Hide dropdown
                dropdownMenu.classList.remove('active');
                // Create modal for profile view/edit
                showProfileModal(user);
            });
        }
        
        // Settings functionality
        const settingsBtn = document.getElementById('settings');
        if (settingsBtn) {
            settingsBtn.addEventListener('click', function() {
                // Hide dropdown
                dropdownMenu.classList.remove('active');
                // Create modal for settings
                showSettingsModal();
            });
        }
        
        // Logout functionality
        const logoutBtn = document.getElementById('logout');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', function() {
                console.log('Logout clicked');
                
                // Show logout confirmation for better UX
                if (confirm('Are you sure you want to log out?')) {
                    // First check if Firebase auth is available
                    if (typeof firebase !== 'undefined' && firebase.auth) {
                        // Sign out from Firebase first
                        firebase.auth().signOut().then(() => {
                            console.log('Firebase sign-out successful');
                            completeLogout();
                        }).catch((error) => {
                            console.error('Firebase sign-out error:', error);
                            // Continue with local logout even if Firebase fails
                            completeLogout();
                        });
                    } else {
                        // If Firebase is not available, just do local logout
                        completeLogout();
                    }
                }
            });
        }
    }
    
    // Setup tabs functionality
    setupTabs();
    
    // Setup action cards
    setupActionCards();
    
    // Load conversation history
    loadConversationHistory();
    
    // Update learning progress
    updateLearningProgress();
    
    // Show initial greeting
    showInitialGreeting();
    
    // Initialize Fun Talks section at page load 
    // (this ensures it works even if the Fun Talks tab isn't initially active)
    initializeFunTalks();
    console.log('Fun Talks initialized at page load');
    
    // Initialize Games section at page load
    initializeGames();
    console.log('Games initialized at page load');
    
    // EMERGENCY FIX: Direct handler for topic cards in case the normal function doesn't work
    // This bypasses the regular function to provide a simple direct test
    console.log('Setting up direct topic card handlers');
    setTimeout(() => {
        const topicCards = document.querySelectorAll('.topic-card');
        console.log(`Direct handler found ${topicCards.length} topic cards`);
        
        topicCards.forEach((card) => {
            const topicText = card.querySelector('span').textContent;
            console.log(`Setting up direct handler for: ${topicText}`);
            
            card.onclick = function() {
                console.log(`DIRECT HANDLER: ${topicText} was clicked!`);
                const funChatHistory = document.getElementById('fun-chat-history');
                
                if (funChatHistory) {
                    // Add user message
                    const userMsg = document.createElement('div');
                    userMsg.className = 'message user-message';
                    userMsg.innerHTML = `
                        <div class="avatar">
                            <i class="fas fa-user"></i>
                        </div>
                        <div class="message-content">
                            <p>Let's talk about ${topicText}!</p>
                        </div>
                    `;
                    funChatHistory.appendChild(userMsg);
                    
                    // Prepare AI response based on topic
                    let response = "I'm not sure what to say about that topic.";
                    
                    if (topicText === 'Movies') {
                        response = "Movies are a wonderful escape! Are you more into action-packed blockbusters or thought-provoking indie films?";
                    } else if (topicText === 'Music') {
                        response = "Music has the incredible power to change our mood instantly. Do you have any songs that always make you feel better?";
                    } else if (topicText === 'Gaming') {
                        response = "Gaming has evolved so much over the years! Are you into console games, PC gaming, or mobile games?";
                    } else if (topicText === 'Hobbies') {
                        response = "Hobbies are so important for maintaining balance in life! What activities do you enjoy in your free time?";
                    } else if (topicText === 'Travel') {
                        response = "Traveling opens our eyes to new cultures and perspectives! What's been your most memorable travel destination?";
                    } else if (topicText === 'Trivia') {
                        response = "I love random facts and trivia! Did you know that honey never spoils? Archaeologists have found pots of honey in ancient Egyptian tombs that are over 3,000 years old and still perfectly good to eat!";
                    }
                    
                    // Add AI response after a slight delay
                    setTimeout(() => {
                        const aiMsg = document.createElement('div');
                        aiMsg.className = 'message ai-message';
                        aiMsg.innerHTML = `
                            <div class="avatar">
                                <i class="fas fa-robot"></i>
                            </div>
                            <div class="message-content">
                                <p>${response}</p>
                            </div>
                        `;
                        funChatHistory.appendChild(aiMsg);
                        funChatHistory.scrollTop = funChatHistory.scrollHeight;
                    }, 1000);
                    
                    funChatHistory.scrollTop = funChatHistory.scrollHeight;
                } else {
                    console.error('Fun chat history element not found in direct handler');
                }
            };
        });
    }, 1000); // Small delay to ensure DOM is fully loaded
    
    // Add event listener for user input
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-message');
    
    if (userInput && sendButton) {
        // Send message when Enter key is pressed
        userInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                handleUserTextSubmission();
            }
        });
        
        // Send message when Send button is clicked
        sendButton.addEventListener('click', handleUserTextSubmission);
    }
    
    // Add event listener for voice input
    const voiceButton = document.getElementById('voice-input');
    if (voiceButton) {
        voiceButton.addEventListener('click', startVoiceRecognition);
    }
    
    // Add event listener for image upload
    const imageButton = document.getElementById('image-upload');
    if (imageButton) {
        imageButton.addEventListener('click', function() {
            // Create a file input element
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.accept = 'image/*';
            fileInput.style.display = 'none';
            
            // Append to body
            document.body.appendChild(fileInput);
            
            // Trigger click on file input
            fileInput.click();
            
            // Handle file selection
            fileInput.addEventListener('change', function() {
                const file = this.files[0];
                if (file) {
                    // Handle image upload
                    const reader = new FileReader();
                    reader.onload = function(e) {
                        const imageData = e.target.result;
                        // Add user message with image
                        addUserMessage(`<img src="${imageData}" alt="Uploaded image" style="max-width: 100%; max-height: 300px; border-radius: 8px;">`);
                        
                        // Process image (in a real app, this would use AI to analyze the image)
                        processImage(file);
                    };
                    reader.readAsDataURL(file);
                }
                
                // Remove file input from DOM
                document.body.removeChild(fileInput);
            });
        });
    }
    
    // Function to process uploaded image
    function processImage(file) {
        // Simulate AI processing of the image
        const typingIndicator = addTypingIndicator();
        
        // Simulate delay for AI processing
        setTimeout(() => {
            // Remove typing indicator
            if (typingIndicator) {
                conversationHistory.removeChild(typingIndicator);
            }
            
            // Determine a random image type for variety
            const imageTypes = ['chart', 'diagram', 'photo', 'document'];
            const randomType = imageTypes[Math.floor(Math.random() * imageTypes.length)];
            
            let response;
            
            switch (randomType) {
                case 'chart':
                    response = "I see you've uploaded what appears to be a chart or graph. Would you like me to analyze the data trends shown in this visualization? I can help interpret the key patterns and insights from this data.";
                    break;
                case 'diagram':
                    response = "This looks like a diagram or schematic. If you'd like me to explain what's shown here or help understand specific elements, just let me know what you'd like to focus on.";
                    break;
                case 'document':
                    response = "I can see this is a document with text. Would you like me to extract and summarize the key information? Or is there something specific from this text you'd like me to explain?";
                    break;
                default: // photo
                    response = "Thank you for sharing this image. What would you like to know about it? I can describe what I see, answer questions about elements in the image, or use it as reference for our discussion.";
            }
            
            // Add AI response
            addAIMessage(response);
            
            // Save message to conversation history
            api.addMessage('user', 'image_upload');
            api.addMessage('ai', response);
        }, 2000);
    }
    
    // Add click handler for learning tab
    const learningTab = document.querySelector('.nav-tabs li[data-tab="learning"]');
    if (learningTab) {
        learningTab.addEventListener('click', function() {
            // Initialize learning tab functionality
            initializeLearningTab();
        });
    }
    
    // Add click handler for fun talks tab
    const funTalksTab = document.querySelector('.nav-tabs li[data-tab="fun-talks"]');
    if (funTalksTab) {
        funTalksTab.addEventListener('click', function() {
            // Initialize fun talks tab functionality when tab is clicked
            initializeFunTalks();
        });
    }
    
    // Add click handler for games tab
    const gamesTab = document.querySelector('.nav-tabs li[data-tab="games"]');
    if (gamesTab) {
        gamesTab.addEventListener('click', function() {
            // Initialize games tab functionality
            initializeGames();
        });
    }
});

// Function to initialize learning tab functionality
function initializeLearningTab() {
    console.log('Initializing learning tab...');
    
    // Get category elements
    const booksCategory = document.getElementById('books-category');
    const coursesCategory = document.getElementById('courses-category');
    const practiceCategory = document.getElementById('practice-category');
    const topicsCategory = document.getElementById('topics-category');
    
    // Get section elements
    const booksSection = document.getElementById('books-section');
    const coursesSection = document.getElementById('courses-section');
    const practiceSection = document.getElementById('practice-section');
    const topicsSection = document.getElementById('topics-section');
    
    // Clear recommended resources - show empty state
    const recommendedContainer = document.getElementById('recommended-resources-container');
    if (recommendedContainer) {
        recommendedContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-lightbulb"></i>
                <p>Resources will be recommended according to your learning progress.</p>
            </div>
        `;
    }
    
    // Initially hide all sections
    hideAllSections();
    
    // Add click event listeners to categories
    if (booksCategory) {
        booksCategory.addEventListener('click', function() {
            console.log('Books category clicked');
            hideAllSections();
            if (booksSection) {
                booksSection.style.display = 'block';
                initializeBooksSection();
            }
        });
    }
    
    if (coursesCategory) {
        coursesCategory.addEventListener('click', function() {
            console.log('Courses category clicked');
            hideAllSections();
            if (coursesSection) {
                coursesSection.style.display = 'block';
                initializeCoursesSection();
            }
        });
    }
    
    if (practiceCategory) {
        practiceCategory.addEventListener('click', function() {
            console.log('Practice category clicked');
            hideAllSections();
            if (practiceSection) {
                practiceSection.style.display = 'block';
                initializePracticeSection();
            }
        });
    }
    
    if (topicsCategory) {
        topicsCategory.addEventListener('click', function() {
            console.log('Topics category clicked');
            hideAllSections();
            if (topicsSection) {
                topicsSection.style.display = 'block';
                initializeTopicsSection();
            }
        });
    }
    
    // Helper function to hide all sections
    function hideAllSections() {
        if (booksSection) booksSection.style.display = 'none';
        if (coursesSection) coursesSection.style.display = 'none';
        if (practiceSection) practiceSection.style.display = 'none';
        if (topicsSection) topicsSection.style.display = 'none';
    }
}

// Function to initialize the Books section
function initializeBooksSection() {
    console.log('Initializing books section...');
    
    const uploadBtn = document.getElementById('upload-book-btn');
    const searchBtn = document.getElementById('search-books-btn');
    const uploadContainer = document.querySelector('.book-upload-container');
    const searchContainer = document.querySelector('.book-search-container');
    const cancelUploadBtn = document.getElementById('cancel-upload');
    const bookUploadForm = document.getElementById('book-upload-form');
    const executeSearchBtn = document.getElementById('execute-book-search');
    const searchInput = document.getElementById('book-search-input');
    const searchResults = document.getElementById('book-search-results');
    const booksGrid = document.getElementById('books-grid');
    const emptyLibrary = document.getElementById('library-empty');
    
    // Toggle book upload form
    if (uploadBtn) {
        uploadBtn.addEventListener('click', function() {
            console.log('Upload button clicked');
            if (uploadContainer) {
                uploadContainer.style.display = 'block';
            }
            if (searchContainer) {
                searchContainer.style.display = 'none';
            }
        });
    }
    
    // Toggle book search form
    if (searchBtn) {
        searchBtn.addEventListener('click', function() {
            console.log('Search button clicked');
            if (searchContainer) {
                searchContainer.style.display = 'block';
            }
            if (uploadContainer) {
                uploadContainer.style.display = 'none';
            }
        });
    }
    
    // Cancel upload action
    if (cancelUploadBtn) {
        cancelUploadBtn.addEventListener('click', function() {
            console.log('Cancel upload clicked');
            if (uploadContainer) {
                uploadContainer.style.display = 'none';
            }
            if (bookUploadForm) {
                bookUploadForm.reset();
            }
        });
    }
    
    // Handle book upload
    if (bookUploadForm) {
        console.log('Book upload form found:', bookUploadForm);
        
        // Form submit handler
        bookUploadForm.addEventListener('submit', function(e) {
            e.preventDefault();
            console.log('Book form submitted');
            
            const title = document.getElementById('book-title').value;
            const author = document.getElementById('book-author').value;
            const category = document.getElementById('book-category').value;
            const fileInput = document.getElementById('book-file');
            
            if (!title || !author || !category || !fileInput || !fileInput.files[0]) {
                alert('Please fill in all required fields');
                return;
            }
            
            const file = fileInput.files[0];
            console.log('File selected:', file.name);
            
            try {
                // Simulate file upload
                const newBook = uploadBook(title, author, category, file);
                console.log('Book uploaded successfully:', newBook);
                
                // Reset form
                bookUploadForm.reset();
                
                // Hide upload container
                if (uploadContainer) {
                    uploadContainer.style.display = 'none';
                }
                
                // Show success notification
                showNotification('Book uploaded successfully!');
                
                // Force refresh the books display
                displayBooks();
            } catch (error) {
                console.error('Error uploading book:', error);
                alert('There was an error uploading your book. Please try again.');
            }
        });
    }
    
    // Handle book upload button
    const uploadBookBtn = document.getElementById('upload-book-btn-submit');
    if (uploadBookBtn) {
        console.log('Upload book submit button found');
        uploadBookBtn.addEventListener('click', function() {
            console.log('Upload book button clicked');
            
            const title = document.getElementById('book-title').value;
            const author = document.getElementById('book-author').value;
            const category = document.getElementById('book-category').value;
            const fileInput = document.getElementById('book-file');
            
            if (!title || !author || !category || !fileInput || !fileInput.files[0]) {
                alert('Please fill in all required fields');
                return;
            }
            
            const file = fileInput.files[0];
            console.log('File selected:', file.name);
            
            try {
                // Simulate file upload
                const newBook = uploadBook(title, author, category, file);
                console.log('Book uploaded successfully:', newBook);
                
                // Reset form fields
                document.getElementById('book-title').value = '';
                document.getElementById('book-author').value = '';
                document.getElementById('book-category').value = '';
                document.getElementById('book-file').value = '';
                
                // Hide upload container
                if (uploadContainer) {
                    uploadContainer.style.display = 'none';
                }
                
                // Show success notification
                showNotification('Book uploaded successfully!');
                
                // Force refresh the books display
                displayBooks();
            } catch (error) {
                console.error('Error uploading book:', error);
                alert('There was an error uploading your book. Please try again.');
            }
        });
    }
    
    // Handle book search
    if (executeSearchBtn && searchInput) {
        executeSearchBtn.addEventListener('click', function() {
            console.log('Execute search clicked');
            const query = searchInput.value.trim();
            
            if (!query) {
                alert('Please enter a search term');
                return;
            }
            
            // Simulate search (in a real app, this would be an API call)
            searchBooks(query);
        });
    }
    
    // Simulate book upload function
    function uploadBook(title, author, category, file) {
        console.log(`Uploading book: ${title} by ${author}, category: ${category}`);
        
        // Generate a cover image URL
        let coverUrl;
        if (file.type.includes('image')) {
            coverUrl = URL.createObjectURL(file);
        } else {
            // For PDFs and other files, use a placeholder based on category
            const categoryImages = {
                'programming': 'https://source.unsplash.com/random/300x400/?coding',
                'mathematics': 'https://source.unsplash.com/random/300x400/?math',
                'science': 'https://source.unsplash.com/random/300x400/?science',
                'other': 'https://source.unsplash.com/random/300x400/?book'
            };
            coverUrl = categoryImages[category] || categoryImages.other;
        }
        
        // Generate a unique ID for the book
        const bookId = 'book-' + Date.now();
        
        // Create a new book object
        const newBook = {
            id: bookId,
            title: title,
            author: author,
            category: category,
            coverUrl: coverUrl,
            fileName: file.name,
            dateAdded: new Date().toISOString()
        };
        
        // Save to local storage
        const books = JSON.parse(localStorage.getItem('mentaura_books') || '[]');
        books.push(newBook);
        localStorage.setItem('mentaura_books', JSON.stringify(books));
        
        return newBook;
    }
    
    // Simulate book search function
    function searchBooks(query) {
        console.log(`Searching for books with query: ${query}`);
        
        // Clear previous results
        if (searchResults) {
            searchResults.innerHTML = '<p>Searching...</p>';
        }
        
        // Simulate API delay
        setTimeout(() => {
            // Sample search results (in a real app, these would come from an API)
            const results = [
                {
                    id: 'web-book-1',
                    title: 'Advanced JavaScript',
                    author: 'John Smith',
                    coverUrl: 'https://source.unsplash.com/random/300x400/?javascript',
                    category: 'programming'
                },
                {
                    id: 'web-book-2',
                    title: 'Full Stack Development',
                    author: 'Jane Doe',
                    coverUrl: 'https://source.unsplash.com/random/300x400/?webdev',
                    category: 'programming'
                },
                {
                    id: 'web-book-3',
                    title: 'Calculus Made Easy',
                    author: 'Michael Johnson',
                    coverUrl: 'https://source.unsplash.com/random/300x400/?math',
                    category: 'mathematics'
                }
            ].filter(book => 
                book.title.toLowerCase().includes(query.toLowerCase()) || 
                book.author.toLowerCase().includes(query.toLowerCase())
            );
            
            // Display results
            if (searchResults) {
                if (results.length === 0) {
                    searchResults.innerHTML = '<p>No books found matching your search.</p>';
                } else {
                    searchResults.innerHTML = '';
                    
                    results.forEach(book => {
                        const bookElement = document.createElement('div');
                        bookElement.className = 'book-item';
                        bookElement.innerHTML = `
                            <div class="book-cover">
                                <img src="${book.coverUrl}" alt="${book.title}">
                            </div>
                            <div class="book-details">
                                <h5>${book.title}</h5>
                                <p>${book.author}</p>
                                <div class="book-actions">
                                    <button class="add-book-btn" data-book-id="${book.id}">Add to Library</button>
                                </div>
                            </div>
                        `;
                        searchResults.appendChild(bookElement);
                        
                        // Add event listener to the Add button
                        const addBtn = bookElement.querySelector('.add-book-btn');
                        addBtn.addEventListener('click', function() {
                            addBookToLibrary(book);
                            addBtn.textContent = 'Added';
                            addBtn.disabled = true;
                        });
                    });
                }
            }
        }, 1000); // Simulate 1 second delay for API call
    }
    
    // Function to add a book from search results to the library
    function addBookToLibrary(book) {
        console.log(`Adding book to library: ${book.title}`);
        
        // Add date added to the book
        book.dateAdded = new Date().toISOString();
        
        // Save to local storage
        const books = JSON.parse(localStorage.getItem('mentaura_books') || '[]');
        
        // Check if book already exists in library
        const exists = books.some(existingBook => existingBook.id === book.id);
        
        if (!exists) {
            books.push(book);
            localStorage.setItem('mentaura_books', JSON.stringify(books));
            
            // Refresh the books display
            displayBooks();
            
            // Show success notification
            showNotification('Book added to your library!');
        }
    }
    
    // Function to display books from the library
    function displayBooks() {
        console.log('Displaying books from library');
        
        if (!booksGrid || !emptyLibrary) {
            console.error('Missing UI elements for books display');
            return;
        }
        
        const books = JSON.parse(localStorage.getItem('mentaura_books') || '[]');
        console.log(`Found ${books.length} books in library`);
        
        if (books.length === 0) {
            booksGrid.style.display = 'none';
            emptyLibrary.style.display = 'flex';
            return;
        }
        
        // Show books grid, hide empty state
        booksGrid.style.display = 'grid';
        emptyLibrary.style.display = 'none';
        
        // Clear existing books
        booksGrid.innerHTML = '';
        
        // Add each book to the grid
        books.forEach(book => {
            const bookElement = document.createElement('div');
            bookElement.className = 'book-item';
            bookElement.innerHTML = `
                <div class="book-cover">
                    <img src="${book.coverUrl}" alt="${book.title}" onerror="this.src='https://source.unsplash.com/random/300x400/?book'">
                </div>
                <div class="book-details">
                    <h5>${book.title}</h5>
                    <p>${book.author}</p>
                    <div class="book-actions">
                        <button class="read-book-btn" data-book-id="${book.id}">Read</button>
                        <button class="remove-book-btn" data-book-id="${book.id}">Remove</button>
                    </div>
                </div>
            `;
            booksGrid.appendChild(bookElement);
            
            // Add event listeners to buttons
            const readBtn = bookElement.querySelector('.read-book-btn');
            const removeBtn = bookElement.querySelector('.remove-book-btn');
            
            if (readBtn) {
                readBtn.addEventListener('click', function() {
                    // In a real app, this would open the book reader
                    alert(`Opening book: ${book.title}`);
                });
            }
            
            if (removeBtn) {
                removeBtn.addEventListener('click', function() {
                    removeBookFromLibrary(book.id);
                });
            }
        });
    }
    
    // Function to remove a book from the library
    function removeBookFromLibrary(bookId) {
        console.log(`Removing book with ID: ${bookId}`);
        
        const books = JSON.parse(localStorage.getItem('mentaura_books') || '[]');
        const updatedBooks = books.filter(book => book.id !== bookId);
        
        localStorage.setItem('mentaura_books', JSON.stringify(updatedBooks));
        
        // Refresh the books display
        displayBooks();
        
        // Show notification
        showNotification('Book removed from your library');
    }
    
    // Display books on initialization
    displayBooks();
}

// Function to initialize the Courses section
function initializeCoursesSection() {
    console.log('Initializing courses section...');
    
    const coursesContainer = document.querySelector('.courses-container');
    const coursePlanContainer = document.getElementById('course-plan-container');
    const coursePlanTitle = document.getElementById('course-plan-title');
    const coursePlanContent = document.getElementById('course-plan-content');
    const backButton = document.getElementById('back-to-courses');
    
    // Initialize state
    if (coursePlanContainer) {
        coursePlanContainer.style.display = 'none';
    }
    
    // Add event listeners to Start Learning buttons
    const startCourseButtons = document.querySelectorAll('.start-course-btn');
    
    if (startCourseButtons) {
        startCourseButtons.forEach(button => {
            button.addEventListener('click', function() {
                const courseType = this.getAttribute('data-course');
                console.log(`Starting course: ${courseType}`);
                
                // Hide courses container and show course plan
                if (coursesContainer) {
                    coursesContainer.style.display = 'none';
                }
                
                if (coursePlanContainer) {
                    coursePlanContainer.style.display = 'block';
                }
                
                // Generate and display course plan
                const coursePlan = generateCoursePlan(courseType);
                
                // Update course plan title
                if (coursePlanTitle) {
                    coursePlanTitle.textContent = coursePlan.title;
                }
                
                // Render course plan content
                if (coursePlanContent) {
                    coursePlanContent.innerHTML = '';
                    
                    coursePlan.modules.forEach((module, index) => {
                        const moduleElement = document.createElement('div');
                        moduleElement.className = 'course-module';
                        
                        // Determine progress percentage
                        let progress = 0;
                        if (index === 0) {
                            progress = Math.floor(Math.random() * 70) + 10; // Random between 10-80%
                        }
                        
                        moduleElement.innerHTML = `
                            <h4><i class="${module.icon}"></i> Module ${index + 1}: ${module.title}</h4>
                            <p>${module.description}</p>
                            <ul class="module-topics">
                                ${module.topics.map(topic => `<li>${topic}</li>`).join('')}
                            </ul>
                            <div class="module-completion">
                                <span>Progress:</span>
                                <div class="module-progress-bar">
                                    <div class="module-progress" style="width: ${progress}%"></div>
                                </div>
                                <span>${progress}%</span>
                            </div>
                        `;
                        
                        coursePlanContent.appendChild(moduleElement);
                    });
                }
            });
        });
    }
    
    // Back button functionality
    if (backButton) {
        backButton.addEventListener('click', function() {
            // Hide course plan and show courses container
            if (coursePlanContainer) {
                coursePlanContainer.style.display = 'none';
            }
            
            if (coursesContainer) {
                coursesContainer.style.display = 'grid';
            }
        });
    }
    
    // Function to generate course plan based on course type
    function generateCoursePlan(courseType) {
        switch (courseType) {
            case 'fullstack':
                return {
                    title: 'Full Stack Development Learning Path',
                    modules: [
                        {
                            title: 'HTML & CSS Fundamentals',
                            icon: 'fas fa-code',
                            description: 'Master the building blocks of web development with HTML5 and CSS3.',
                            topics: [
                                'HTML Document Structure & Semantic Elements',
                                'CSS Selectors, Properties & Layout Techniques',
                                'Responsive Design with Media Queries',
                                'CSS Flexbox and Grid Systems',
                                'Web Accessibility Principles'
                            ]
                        },
                        {
                            title: 'JavaScript Basics',
                            icon: 'fab fa-js',
                            description: 'Learn core JavaScript concepts and DOM manipulation.',
                            topics: [
                                'JavaScript Syntax, Variables & Data Types',
                                'Functions, Objects & Arrays',
                                'DOM Manipulation & Event Handling',
                                'Asynchronous JavaScript (Promises, Async/Await)',
                                'Error Handling & Debugging'
                            ]
                        },
                        {
                            title: 'Frontend Frameworks (React)',
                            icon: 'fab fa-react',
                            description: 'Build interactive UIs with React and modern frontend tools.',
                            topics: [
                                'React Components & JSX',
                                'State Management & Hooks',
                                'Routing & Navigation',
                                'API Integration',
                                'Testing React Applications'
                            ]
                        },
                        {
                            title: 'Backend Development (Node.js)',
                            icon: 'fab fa-node-js',
                            description: 'Create server-side applications with Node.js and Express.',
                            topics: [
                                'Node.js Fundamentals',
                                'Express.js Framework',
                                'RESTful API Development',
                                'Authentication & Authorization',
                                'Error Handling & Middleware'
                            ]
                        },
                        {
                            title: 'Databases',
                            icon: 'fas fa-database',
                            description: 'Work with SQL and NoSQL databases for data persistence.',
                            topics: [
                                'Database Design Principles',
                                'SQL Fundamentals (PostgreSQL/MySQL)',
                                'NoSQL Databases (MongoDB)',
                                'ORM/ODM Tools',
                                'Data Validation & Security'
                            ]
                        },
                        {
                            title: 'Deployment & DevOps',
                            icon: 'fas fa-cloud-upload-alt',
                            description: 'Deploy and maintain applications in production environments.',
                            topics: [
                                'Version Control with Git',
                                'CI/CD Pipelines',
                                'Cloud Hosting (AWS, Heroku, Vercel)',
                                'Docker Containerization',
                                'Performance Optimization'
                            ]
                        }
                    ]
                };
            case 'math':
                return {
                    title: 'Basic Mathematics Learning Path',
                    modules: [
                        {
                            title: 'Number Systems',
                            icon: 'fas fa-hashtag',
                            description: 'Understand different number systems and foundational arithmetic.',
                            topics: [
                                'Natural, Integer, Rational & Real Numbers',
                                'Place Value & Number Representation',
                                'Basic Operations & Properties',
                                'Fractions, Decimals & Percentages',
                                'Order of Operations (PEMDAS/BODMAS)'
                            ]
                        },
                        {
                            title: 'Algebra Fundamentals',
                            icon: 'fas fa-superscript',
                            description: 'Learn algebraic expressions, equations, and problem-solving techniques.',
                            topics: [
                                'Variables & Expressions',
                                'Solving Linear Equations',
                                'Inequalities & Absolute Value',
                                'Exponents & Roots',
                                'Word Problems & Applications'
                            ]
                        },
                        {
                            title: 'Geometry Basics',
                            icon: 'fas fa-shapes',
                            description: 'Explore geometric shapes, measurements, and spatial relationships.',
                            topics: [
                                'Points, Lines & Angles',
                                'Triangles & Quadrilaterals',
                                'Circles & Polygons',
                                'Area, Perimeter & Volume',
                                'Coordinate Geometry'
                            ]
                        },
                        {
                            title: 'Introduction to Calculus',
                            icon: 'fas fa-chart-line',
                            description: 'Discover the foundations of calculus through limits and derivatives.',
                            topics: [
                                'Functions & Graphs',
                                'Limits & Continuity',
                                'Introduction to Derivatives',
                                'Basic Integration Concepts',
                                'Applications of Calculus'
                            ]
                        },
                        {
                            title: 'Statistics & Probability',
                            icon: 'fas fa-chart-bar',
                            description: 'Learn data analysis, probability theory, and statistical methods.',
                            topics: [
                                'Data Collection & Representation',
                                'Measures of Central Tendency',
                                'Probability Concepts',
                                'Distributions & Variance',
                                'Statistical Inference'
                            ]
                        }
                    ]
                };
            default:
                return {
                    title: 'Course Learning Path',
                    modules: [
                        {
                            title: 'Introduction',
                            icon: 'fas fa-book',
                            description: 'Getting started with the fundamentals.',
                            topics: ['Overview', 'Basic Concepts', 'Tools Setup']
                        }
                    ]
                };
        }
    }
}

// Function to initialize the Practice section
function initializePracticeSection() {
    console.log('Initializing practice section...');
    
    const topicItems = document.querySelectorAll('.topic-item');
    const practiceContent = document.getElementById('practice-content');
    const practiceEmpty = document.querySelector('.practice-empty');
    
    // Add click event to each topic item
    if (topicItems && practiceContent) {
        topicItems.forEach(item => {
            item.addEventListener('click', function() {
                const topic = this.getAttribute('data-topic');
                console.log(`Topic clicked: ${topic}`);
                
                // Remove active class from all topics
                topicItems.forEach(t => t.classList.remove('active'));
                
                // Add active class to current topic
                this.classList.add('active');
                
                // Hide the empty state
                if (practiceEmpty) {
                    practiceEmpty.style.display = 'none';
                }
                
                // Generate questions for the selected topic
                const questions = generateQuestions(topic);
                
                // Display the questions
                displayQuestions(questions, practiceContent);
            });
        });
    }
    
    // Function to generate questions based on topic
    function generateQuestions(topic) {
        const questionsData = {
            javascript: [
                {
                    question: "What will be the output of: console.log(typeof([]));",
                    options: ["array", "object", "undefined", "null"],
                    correctAnswer: 1,
                    explanation: "In JavaScript, arrays are actually objects, so typeof([]) returns 'object'."
                },
                {
                    question: "Which method adds an element to the end of an array?",
                    options: ["push()", "pop()", "shift()", "unshift()"],
                    correctAnswer: 0,
                    explanation: "The push() method adds elements to the end of an array and returns the new length."
                },
                {
                    question: "What does the '===' operator do in JavaScript?",
                    options: ["Checks for equality with type conversion", "Checks for equality without type conversion", "Assigns a value", "Checks if a value exists"],
                    correctAnswer: 1,
                    explanation: "The '===' operator is a strict equality operator that checks both value and type without conversion."
                }
            ],
            python: [
                {
                    question: "What is the correct way to create a function in Python?",
                    options: ["function myFunc():", "def myFunc():", "create myFunc():", "func myFunc():"],
                    correctAnswer: 1,
                    explanation: "In Python, functions are defined using the 'def' keyword followed by the function name and parentheses."
                },
                {
                    question: "Which method is used to add an element to a list in Python?",
                    options: ["add()", "append()", "insert()", "extend()"],
                    correctAnswer: 1,
                    explanation: "The append() method adds a single element to the end of a list."
                },
                {
                    question: "What does the following code return: len([1, 2, 3, 4])?",
                    options: ["3", "4", "5", "Error"],
                    correctAnswer: 1,
                    explanation: "The len() function returns the number of items in an object. The list has 4 elements."
                }
            ],
            "html-css": [
                {
                    question: "Which HTML tag is used to create a hyperlink?",
                    options: ["<link>", "<a>", "<href>", "<url>"],
                    correctAnswer: 1,
                    explanation: "The <a> (anchor) tag is used to create hyperlinks in HTML."
                },
                {
                    question: "Which CSS property is used to change the text color?",
                    options: ["text-color", "font-color", "color", "text-style"],
                    correctAnswer: 2,
                    explanation: "The 'color' property is used to set the color of text in CSS."
                },
                {
                    question: "What does CSS stand for?",
                    options: ["Creative Style Sheets", "Computer Style Sheets", "Cascading Style Sheets", "Colorful Style Sheets"],
                    correctAnswer: 2,
                    explanation: "CSS stands for Cascading Style Sheets, which is used to style web pages."
                }
            ],
            algorithms: [
                {
                    question: "What is the time complexity of binary search?",
                    options: ["O(n)", "O(n log n)", "O(log n)", "O(1)"],
                    correctAnswer: 2,
                    explanation: "Binary search has a time complexity of O(log n) as it divides the search interval in half with each step."
                },
                {
                    question: "Which sorting algorithm has the best average time complexity?",
                    options: ["Bubble Sort", "Insertion Sort", "Quick Sort", "Selection Sort"],
                    correctAnswer: 2,
                    explanation: "Quick Sort has an average time complexity of O(n log n), which is better than O(n²) algorithms like Bubble, Insertion, and Selection Sort."
                },
                {
                    question: "What data structure would you use for implementing a LIFO (Last In, First Out) structure?",
                    options: ["Queue", "Stack", "Linked List", "Array"],
                    correctAnswer: 1,
                    explanation: "A Stack is a data structure that follows the LIFO principle where the last element added is the first one to be removed."
                }
            ],
            algebra: [
                {
                    question: "Solve for x: 3x - 7 = 8",
                    options: ["x = 3", "x = 5", "x = 6", "x = 15/3"],
                    correctAnswer: 1,
                    explanation: "3x - 7 = 8\n3x = 15\nx = 5"
                },
                {
                    question: "What is the value of x in the equation 2(x + 3) = 14?",
                    options: ["x = 4", "x = 5", "x = 7", "x = 8"],
                    correctAnswer: 0,
                    explanation: "2(x + 3) = 14\n2x + 6 = 14\n2x = 8\nx = 4"
                },
                {
                    question: "Simplify the expression: 3(x - 2) - 2(x + 1)",
                    options: ["x - 8", "x - 4", "5x - 8", "x - 6"],
                    correctAnswer: 0,
                    explanation: "3(x - 2) - 2(x + 1) = 3x - 6 - 2x - 2 = x - 8"
                }
            ],
            calculus: [
                {
                    question: "What is the derivative of f(x) = x²?",
                    options: ["f'(x) = x", "f'(x) = 2x", "f'(x) = 2", "f'(x) = x³"],
                    correctAnswer: 1,
                    explanation: "The derivative of x² is 2x using the power rule: d/dx(x^n) = n*x^(n-1)"
                },
                {
                    question: "What is the integral of f(x) = 2x?",
                    options: ["∫2x dx = x² + C", "∫2x dx = 2x² + C", "∫2x dx = x² + 2C", "∫2x dx = x²/2 + C"],
                    correctAnswer: 0,
                    explanation: "∫2x dx = 2∫x dx = 2(x²/2) + C = x² + C"
                },
                {
                    question: "What is the limit as x approaches 0 of sin(x)/x?",
                    options: ["0", "1", "∞", "Does not exist"],
                    correctAnswer: 1,
                    explanation: "The limit as x approaches 0 of sin(x)/x is 1, which is a famous result in calculus."
                }
            ],
            geometry: [
                {
                    question: "What is the formula for the area of a circle?",
                    options: ["A = πr", "A = 2πr", "A = πr²", "A = 2πr²"],
                    correctAnswer: 2,
                    explanation: "The area of a circle is given by A = πr², where r is the radius."
                },
                {
                    question: "What is the sum of the interior angles of a triangle?",
                    options: ["90 degrees", "180 degrees", "270 degrees", "360 degrees"],
                    correctAnswer: 1,
                    explanation: "The sum of interior angles of a triangle is always 180 degrees."
                },
                {
                    question: "What is the Pythagorean theorem?",
                    options: ["a² + b² = c", "a + b + c = 180", "a² + b² = c²", "a + b = c"],
                    correctAnswer: 2,
                    explanation: "The Pythagorean theorem states that in a right triangle, the square of the length of the hypotenuse (c) equals the sum of squares of the other two sides (a and b): a² + b² = c²."
                }
            ],
            statistics: [
                {
                    question: "What is the mean of the numbers: 3, 5, 7, 9?",
                    options: ["5", "6", "7", "8"],
                    correctAnswer: 1,
                    explanation: "Mean = (3 + 5 + 7 + 9) / 4 = 24 / 4 = 6"
                },
                {
                    question: "What measure of central tendency is affected most by extreme values?",
                    options: ["Mean", "Median", "Mode", "Range"],
                    correctAnswer: 0,
                    explanation: "The mean is most affected by extreme values (outliers) because it includes every value in its calculation."
                },
                {
                    question: "What is the probability of rolling a 6 on a standard six-sided die?",
                    options: ["1/5", "1/6", "1/3", "1/2"],
                    correctAnswer: 1,
                    explanation: "The probability is 1/6 because there is 1 favorable outcome out of 6 possible equally likely outcomes."
                }
            ]
        };
        
        // Return questions for the selected topic or empty array if topic not found
        return questionsData[topic] || [];
    }
    
    // Function to display questions in the practice content area
    function displayQuestions(questions, container) {
        // Clear current content
        container.innerHTML = '';
        
        if (questions.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>No questions available for this topic yet.</p>
                </div>
            `;
            return;
        }
        
        // Create container for each question
        questions.forEach((question, index) => {
            const questionElement = document.createElement('div');
            questionElement.className = 'question-container';
            questionElement.id = `question-${index}`;
            
            let optionsHTML = '';
            question.options.forEach((option, optionIndex) => {
                optionsHTML += `
                    <div class="answer-option" data-question="${index}" data-option="${optionIndex}">
                        <span class="option-marker">${String.fromCharCode(65 + optionIndex)}.</span>
                        <span class="option-text">${option}</span>
                    </div>
                `;
            });
            
            questionElement.innerHTML = `
                <h4>Question ${index + 1}</h4>
                <div class="question-text">${question.question}</div>
                <div class="answer-options">
                    ${optionsHTML}
                </div>
                <div class="answer-feedback" id="feedback-${index}" style="display: none;"></div>
            `;
            
            container.appendChild(questionElement);
        });
        
        // Add event listeners to answer options
        const answerOptions = container.querySelectorAll('.answer-option');
        answerOptions.forEach(option => {
            option.addEventListener('click', function() {
                const questionIndex = parseInt(this.getAttribute('data-question'));
                const optionIndex = parseInt(this.getAttribute('data-option'));
                const question = questions[questionIndex];
                const feedbackElement = document.getElementById(`feedback-${questionIndex}`);
                
                // Remove any previous selection and feedback
                const questionContainer = document.getElementById(`question-${questionIndex}`);
                const options = questionContainer.querySelectorAll('.answer-option');
                options.forEach(opt => {
                    opt.classList.remove('correct');
                    opt.classList.remove('incorrect');
                });
                
                // Check if answer is correct
                if (optionIndex === question.correctAnswer) {
                    // Correct answer
                    this.classList.add('correct');
                    if (feedbackElement) {
                        feedbackElement.innerHTML = `
                            <i class="fas fa-check-circle"></i>
                            <p>Correct! ${question.explanation}</p>
                        `;
                        feedbackElement.className = 'answer-feedback correct';
                        feedbackElement.style.display = 'block';
                    }
                } else {
                    // Incorrect answer
                    this.classList.add('incorrect');
                    if (feedbackElement) {
                        feedbackElement.innerHTML = `
                            <i class="fas fa-times-circle"></i>
                            <p>Incorrect. The correct answer is ${String.fromCharCode(65 + question.correctAnswer)}: ${question.options[question.correctAnswer]}. ${question.explanation}</p>
                        `;
                        feedbackElement.className = 'answer-feedback incorrect';
                        feedbackElement.style.display = 'block';
                    }
                }
            });
        });
    }
}

// Function to initialize the Topics section
function initializeTopicsSection() {
    console.log('Initializing topics section...');
    
    // Get all explore buttons in the topics section
    const exploreButtons = document.querySelectorAll('#topics-section .explore-btn');
    
    if (exploreButtons) {
        exploreButtons.forEach(button => {
            button.addEventListener('click', function() {
                // Get the subject from the parent card
                const subjectCard = this.closest('.subject-card');
                const subjectName = subjectCard.querySelector('h4').textContent;
                
                // Create or update description element
                let descriptionElement = subjectCard.querySelector('.subject-description');
                
                if (!descriptionElement) {
                    // Create new description element if it doesn't exist
                    descriptionElement = document.createElement('div');
                    descriptionElement.className = 'subject-description';
                    
                    // Insert before the explore button
                    subjectCard.insertBefore(descriptionElement, this);
                }
                
                // Get description based on subject
                const description = getSubjectDescription(subjectName);
                
                // Update description content
                descriptionElement.textContent = description;
                
                // Toggle visibility for better UX
                if (descriptionElement.style.display === 'block') {
                    // Hide the description if already visible
                    descriptionElement.style.display = 'none';
                    this.textContent = 'Explore';
                } else {
                    // Show the description
                    descriptionElement.style.display = 'block';
                    this.textContent = 'Hide';
                }
            });
        });
    }
    
    // Function to get description based on subject
    function getSubjectDescription(subject) {
        const descriptions = {
            'Programming': 'Learn coding skills to build software, websites, and applications across various platforms.',
            'Mathematics': 'Explore the fundamental concepts of numbers, structures, shapes, and patterns that form the basis of science and engineering.',
            'Science': 'Discover principles and methodologies that explain natural phenomena through observation and experimentation.',
            'Languages': 'Master communication skills in various world languages to connect across cultures and borders.',
            'Arts': 'Express creativity through various mediums including visual arts, music, drama, and design.',
            'History': 'Study past events, civilizations, and developments that shaped our modern world.'
        };
        
        return descriptions[subject] || `Explore comprehensive resources and lessons about ${subject}.`;
    }
}

// Function to handle tab switching and initialize appropriate tabs
function setupTabs() {
    const navTabs = document.querySelectorAll('.nav-tabs li');
    const tabContents = document.querySelectorAll('.tab-content');
    
    // Add click event to tabs
    navTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            
            // Remove active class from all tabs
            navTabs.forEach(t => t.classList.remove('active'));
            
            // Add active class to current tab
            this.classList.add('active');
            
            // Hide all tab contents
            tabContents.forEach(content => {
                content.classList.remove('active');
            });
            
            // Show the current tab content
            const currentTabContent = document.getElementById(`${tabId}-content`);
            if (currentTabContent) {
                currentTabContent.classList.add('active');
                
                // Initialize specific tab content based on the tab
                if (tabId === 'learning') {
                    initializeLearningTab();
                } else if (tabId === 'fun-talks') {
                    // Initialize fun talks when the tab is clicked
                    initializeFunTalks();
                    console.log('Fun Talks tab initialized');
                } else if (tabId === 'games') {
                    // Initialize games when the tab is clicked
                    initializeGames();
                    console.log('Games tab initialized');
                }
            }
        });
    });
}

// Add the missing showNotification function
function showNotification(message, duration = 3000) {
    // Check if there's an existing notification
    let notification = document.querySelector('.notification');
    
    // If notification already exists, remove it first
    if (notification) {
        notification.remove();
    }
    
    // Create new notification
    notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    
    // Append to body
    document.body.appendChild(notification);
    
    // Show notification with animation
    setTimeout(() => {
        notification.classList.add('active');
    }, 10);
    
    // Hide and remove after duration
    setTimeout(() => {
        notification.classList.remove('active');
        
        // Remove from DOM after animation completes
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, duration);
}

// Function to initialize Fun Talks section
function initializeFunTalks() {
    console.log('Initializing fun talks section...');
    
    // Get all topic cards
    const topicCards = document.querySelectorAll('.topic-card');
    const funChatHistory = document.getElementById('fun-chat-history');
    const funChatInput = document.getElementById('fun-chat-input');
    const sendFunMessage = document.getElementById('send-fun-message');
    
    console.log(`Found ${topicCards.length} topic cards`);
    
    // Add event listeners to all topic cards
    if (topicCards && topicCards.length > 0) {
        topicCards.forEach((card, index) => {
            const topicName = card.querySelector('span').textContent;
            console.log(`Setting up listener for topic card ${index + 1}: ${topicName}`);
            
            // Remove any existing click listeners to prevent duplicates
            card.removeEventListener('click', topicCardClickHandler);
            
            // Add click event listener
            card.addEventListener('click', topicCardClickHandler);
        });
    } else {
        console.error('No topic cards found or topic cards not loaded yet');
    }
    
    // Topic card click handler function
    function topicCardClickHandler() {
        // Get the topic text
        const topicName = this.querySelector('span').textContent;
        console.log(`Topic card clicked: ${topicName}`);
        
        // Add user message showing topic selection
        addFunChatUserMessage(`Let's talk about ${topicName}!`);
        
        // Generate AI response based on the selected topic
        const aiResponse = getTopicResponse(topicName);
        console.log(`Generated response for ${topicName}: ${aiResponse.substring(0, 30)}...`);
        
        // Show typing indicator
        const typingIndicator = addFunChatTypingIndicator();
        
        // Simulate AI thinking time
        setTimeout(() => {
            // Remove typing indicator
            if (typingIndicator && funChatHistory.contains(typingIndicator)) {
                funChatHistory.removeChild(typingIndicator);
            }
            
            // Add AI response
            addFunChatAIMessage(aiResponse);
            console.log('AI response added to chat');
            
            // Scroll to the bottom of the chat
            funChatHistory.scrollTop = funChatHistory.scrollHeight;
        }, 1500);
    }
    
    // Handle user message submission in fun chat
    if (funChatInput && sendFunMessage) {
        console.log('Setting up fun chat input handlers');
        
        // Send message when Enter key is pressed
        funChatInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                handleFunChatSubmission();
            }
        });
        
        // Send message when Send button is clicked
        sendFunMessage.addEventListener('click', handleFunChatSubmission);
    } else {
        console.error('Fun chat input elements not found');
    }
    
    // Function to handle fun chat message submission
    function handleFunChatSubmission() {
        const message = funChatInput.value.trim();
        if (message) {
            console.log(`User submitted message: ${message}`);
            
            // Add user message
            addFunChatUserMessage(message);
            
            // Clear input
            funChatInput.value = '';
            
            // Show typing indicator
            const typingIndicator = addFunChatTypingIndicator();
            
            // Generate AI response
            setTimeout(() => {
                // Remove typing indicator
                if (typingIndicator && funChatHistory.contains(typingIndicator)) {
                    funChatHistory.removeChild(typingIndicator);
                }
                
                // Add AI response
                const aiResponse = getGenericResponse(message);
                console.log(`Generated generic response: ${aiResponse.substring(0, 30)}...`);
                addFunChatAIMessage(aiResponse);
                
                // Scroll to the bottom of the chat
                funChatHistory.scrollTop = funChatHistory.scrollHeight;
            }, 1500);
        }
    }
    
    // Function to add user message to fun chat
    function addFunChatUserMessage(message) {
        if (!funChatHistory) {
            console.error('Fun chat history element not found');
            return;
        }
        
        const messageElement = document.createElement('div');
        messageElement.className = 'message user-message';
        messageElement.innerHTML = `
            <div class="avatar">
                <i class="fas fa-user"></i>
            </div>
            <div class="message-content">
                <p>${message}</p>
            </div>
        `;
        
        funChatHistory.appendChild(messageElement);
        funChatHistory.scrollTop = funChatHistory.scrollHeight;
    }
    
    // Function to add AI message to fun chat
    function addFunChatAIMessage(message) {
        if (!funChatHistory) {
            console.error('Fun chat history element not found');
            return;
        }
        
        const messageElement = document.createElement('div');
        messageElement.className = 'message ai-message';
        messageElement.innerHTML = `
            <div class="avatar">
                <i class="fas fa-robot"></i>
            </div>
            <div class="message-content">
                <p>${message}</p>
            </div>
        `;
        
        funChatHistory.appendChild(messageElement);
        funChatHistory.scrollTop = funChatHistory.scrollHeight;
    }
    
    // Function to add typing indicator
    function addFunChatTypingIndicator() {
        if (!funChatHistory) {
            console.error('Fun chat history element not found');
            return null;
        }
        
        const typingIndicator = document.createElement('div');
        typingIndicator.className = 'message ai-message typing-indicator';
        typingIndicator.innerHTML = `
            <div class="avatar">
                <i class="fas fa-robot"></i>
            </div>
            <div class="message-content typing-dots">
                <span></span>
                <span></span>
                <span></span>
            </div>
        `;
        
        funChatHistory.appendChild(typingIndicator);
        funChatHistory.scrollTop = funChatHistory.scrollHeight;
        
        return typingIndicator;
    }
    
    // Function to generate topic-specific responses
    function getTopicResponse(topic) {
        const responses = {
            'Music': [
                "Music is such a fascinating topic! What genres do you enjoy listening to the most?",
                "I love talking about music! From classical to hip-hop, there's so much to explore. What's your favorite artist right now?",
                "Music has the incredible power to change our mood instantly. Do you have any songs that always make you feel better?",
                "There's something magical about how music connects people across different cultures and languages. What kind of music makes you feel most connected to others?"
            ],
            'Movies': [
                "Movies are a wonderful escape! Are you more into action-packed blockbusters or thought-provoking indie films?",
                "Film is such a rich medium for storytelling. What was the last movie that really moved you or made you think?",
                "I'm always looking for movie recommendations! What's a hidden gem you think more people should watch?",
                "Movies have a way of shaping our culture in profound ways. Is there a film that changed your perspective on something important?"
            ],
            'Gaming': [
                "Gaming has evolved so much over the years! Are you into console games, PC gaming, or mobile games?",
                "Games can be such immersive experiences these days. What game world would you most want to live in if you could?",
                "I find the storytelling in modern games to be incredible. Have you played any games with stories that really stayed with you?",
                "Whether for relaxation or competition, games offer so many different experiences. What do you enjoy most about gaming?"
            ],
            'Hobbies': [
                "Hobbies are so important for maintaining balance in life! What activities do you enjoy in your free time?",
                "There's something special about having a hobby you're passionate about. What hobby have you been dedicating time to lately?",
                "I'm curious - what hobby would you love to pick up if you had unlimited time and resources?",
                "Some hobbies can be relaxing while others energize us. Do you have different hobbies for different moods?"
            ],
            'Travel': [
                "Traveling opens our eyes to new cultures and perspectives! What's been your most memorable travel destination?",
                "If you could travel anywhere in the world right now, where would you go and why?",
                "Travel experiences shape us in unexpected ways. Has a trip ever changed how you see the world?",
                "There are so many different ways to travel - as a tourist, a backpacker, a luxury traveler. What's your preferred travel style?"
            ],
            'Trivia': [
                "I love random facts and trivia! Did you know that honey never spoils? Archaeologists have found pots of honey in ancient Egyptian tombs that are over 3,000 years old and still perfectly good to eat!",
                "Here's something fascinating: octopuses have three hearts, nine brains, and blue blood! Would you like to hear more animal trivia?",
                "Random trivia time: the shortest war in history was between Britain and Zanzibar in 1896. It lasted only 38 minutes! Do you have any favorite historical facts?",
                "Fun fact: a group of flamingos is called a 'flamboyance'. What's your favorite collective noun for animals?"
            ]
        };
        
        // Get responses for the specific topic, or use default if topic not found
        const topicResponses = responses[topic] || ["That's an interesting topic! What aspects of it would you like to discuss?"];
        
        // Return a random response from the array
        return topicResponses[Math.floor(Math.random() * topicResponses.length)];
    }
    
    // Function to generate generic responses to user messages
    function getGenericResponse(message) {
        const responses = [
            "That's really interesting! Tell me more about that.",
            "I'm curious to hear your thoughts on this. What makes you feel that way?",
            "Thanks for sharing that with me! What else would you like to talk about?",
            "That's a fascinating perspective! Have you always felt this way?",
            "I appreciate you telling me about this. How does this topic make you feel?",
            "That's good to know! Is there anything specific about this you'd like to explore further?",
            "I'm glad you brought this up! What other interests do you have related to this?",
            "That's a great point! How did you first become interested in this topic?"
        ];
        
        return responses[Math.floor(Math.random() * responses.length)];
    }
}

// Function to initialize the Games section
function initializeGames() {
    console.log('Initializing games section...');
    
    const playButtons = document.querySelectorAll('.play-btn');
    const gamesContainer = document.querySelector('.games-container');
    const gamePlayArea = document.getElementById('game-play-area');
    const gameContainer = document.getElementById('game-container');
    const backToGamesButton = document.getElementById('back-to-games');
    const currentGameTitle = document.getElementById('current-game-title');
    
    // Add click events to play buttons
    if (playButtons && gamesContainer && gamePlayArea && gameContainer) {
        playButtons.forEach(button => {
            button.addEventListener('click', function() {
                const gameType = this.getAttribute('data-game');
                console.log(`Game selected: ${gameType}`);
                
                // Hide games list and show game play area
                gamesContainer.style.display = 'none';
                gamePlayArea.style.display = 'block';
                
                // Load and start the selected game
                switch (gameType) {
                    case 'math-challenge':
                        currentGameTitle.textContent = 'Math Challenge';
                        startMathGame(gameContainer);
                        break;
                    case 'word-wizard':
                        currentGameTitle.textContent = 'Word Wizard';
                        showGameComingSoon(gameContainer, 'Word Wizard');
                        break;
                    case 'science-explorer':
                        currentGameTitle.textContent = 'Science Explorer';
                        startScienceGame(gameContainer);
                        break;
                    case 'knowledge-quiz':
                        currentGameTitle.textContent = 'Knowledge Quiz';
                        showGameComingSoon(gameContainer, 'Knowledge Quiz');
                        break;
                    default:
                        showGameComingSoon(gameContainer, 'This game');
                }
            });
        });
    }
    
    // Add click event for back button
    if (backToGamesButton) {
        backToGamesButton.addEventListener('click', function() {
            // Hide game play area and show games list
            gamePlayArea.style.display = 'none';
            gamesContainer.style.display = 'grid';
            
            // Clear game container
            if (gameContainer) {
                gameContainer.innerHTML = '';
            }
        });
    }
    
    // Function to show a coming soon message for games not yet implemented
    function showGameComingSoon(container, gameName) {
        container.innerHTML = `
            <div style="text-align: center; padding: 50px;">
                <h2>${gameName} - Coming Soon!</h2>
                <p>We're working hard to bring you this exciting game. Please check back later!</p>
                <i class="fas fa-gamepad" style="font-size: 5rem; margin: 30px 0; color: var(--primary-color);"></i>
            </div>
        `;
    }
    
    // Function to start Math Challenge game
    function startMathGame(container) {
        // Game variables
        let currentProblem = {};
        let score = 0;
        let timeLeft = 60;
        let timer;
        
        // Create the game UI
        container.innerHTML = `
            <div class="math-game-container">
                <div class="math-timer">Time remaining: <span id="timer">60</span> seconds</div>
                <div class="math-problem" id="problem">Loading...</div>
                <div class="math-options" id="options"></div>
                <div class="math-feedback" id="feedback"></div>
                <div class="math-score">Score: <span id="score">0</span></div>
            </div>
        `;
        
        // Get UI elements
        const problemElement = document.getElementById('problem');
        const optionsElement = document.getElementById('options');
        const feedbackElement = document.getElementById('feedback');
        const scoreElement = document.getElementById('score');
        const timerElement = document.getElementById('timer');
        
        // Function to generate a random math problem
        function generateProblem() {
            // Clear feedback
            feedbackElement.innerHTML = '';
            
            // Generate operands and operators
            const operators = ['+', '-', '*'];
            const operator = operators[Math.floor(Math.random() * operators.length)];
            
            let num1, num2, answer, problemText;
            
            // Generate appropriate numbers based on operator
            switch (operator) {
                case '+':
                    num1 = Math.floor(Math.random() * 50) + 1;
                    num2 = Math.floor(Math.random() * 50) + 1;
                    answer = num1 + num2;
                    problemText = `${num1} + ${num2} = ?`;
                    break;
                case '-':
                    num1 = Math.floor(Math.random() * 50) + 51; // Ensure num1 > num2
                    num2 = Math.floor(Math.random() * 50) + 1;
                    answer = num1 - num2;
                    problemText = `${num1} - ${num2} = ?`;
                    break;
                case '*':
                    num1 = Math.floor(Math.random() * 12) + 1;
                    num2 = Math.floor(Math.random() * 12) + 1;
                    answer = num1 * num2;
                    problemText = `${num1} × ${num2} = ?`;
                    break;
            }
            
            // Generate 3 wrong answers
            const wrongAnswers = [];
            while (wrongAnswers.length < 3) {
                // Generate a wrong answer within ±10 of the correct answer
                let wrongAnswer = answer + (Math.floor(Math.random() * 20) - 10);
                
                // Ensure it's not the correct answer and not already in the array
                if (wrongAnswer !== answer && !wrongAnswers.includes(wrongAnswer)) {
                    wrongAnswers.push(wrongAnswer);
                }
            }
            
            // Combine correct and wrong answers, and shuffle
            const options = [answer, ...wrongAnswers];
            for (let i = options.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [options[i], options[j]] = [options[j], options[i]];
            }
            
            return {
                problemText,
                options,
                correctAnswer: options.indexOf(answer)
            };
        }
        
        // Function to display a problem
        function displayProblem(problem) {
            problemElement.textContent = problem.problemText;
            
            // Clear options
            optionsElement.innerHTML = '';
            
            // Add options
            problem.options.forEach((option, index) => {
                const optionElement = document.createElement('div');
                optionElement.className = 'math-option';
                optionElement.textContent = option;
                optionElement.setAttribute('data-index', index);
                
                // Add click event
                optionElement.addEventListener('click', function() {
                    const selectedIndex = parseInt(this.getAttribute('data-index'));
                    checkAnswer(selectedIndex, problem.correctAnswer);
                });
                
                optionsElement.appendChild(optionElement);
            });
        }
        
        // Function to check answer
        function checkAnswer(selectedIndex, correctIndex) {
            const options = document.querySelectorAll('.math-option');
            
            // Disable all options
            options.forEach(option => {
                option.style.pointerEvents = 'none';
            });
            
            // Highlight correct and incorrect options
            if (selectedIndex === correctIndex) {
                // Correct answer
                options[selectedIndex].classList.add('correct');
                feedbackElement.innerHTML = '<p style="color: green;"><i class="fas fa-check-circle"></i> Correct!</p>';
                score += 10;
                scoreElement.textContent = score;
            } else {
                // Incorrect answer
                options[selectedIndex].classList.add('incorrect');
                options[correctIndex].classList.add('correct');
                feedbackElement.innerHTML = '<p style="color: red;"><i class="fas fa-times-circle"></i> Incorrect!</p>';
            }
            
            // Show next problem after a delay
            setTimeout(() => {
                // Only proceed if there's still time left
                if (timeLeft > 0) {
                    currentProblem = generateProblem();
                    displayProblem(currentProblem);
                }
            }, 1500);
        }
        
        // Function to update timer
        function updateTimer() {
            timeLeft--;
            timerElement.textContent = timeLeft;
            
            if (timeLeft <= 0) {
                // Game over
                clearInterval(timer);
                endGame();
            }
        }
        
        // Function to end the game
        function endGame() {
            // Display game over message
            container.innerHTML = `
                <div class="math-game-container">
                    <h2>Game Over!</h2>
                    <p>Your final score: ${score}</p>
                    <button id="play-again" class="play-btn" style="margin: 20px auto; display: block;">Play Again</button>
                </div>
            `;
            
            // Add event listener to play again button
            const playAgainButton = document.getElementById('play-again');
            if (playAgainButton) {
                playAgainButton.addEventListener('click', function() {
                    startMathGame(container);
                });
            }
        }
        
        // Start the game
        currentProblem = generateProblem();
        displayProblem(currentProblem);
        
        // Start the timer
        timer = setInterval(updateTimer, 1000);
    }

    // Function to start Science Explorer game
    function startScienceGame(container) {
        // Game variables
        let currentQuestion = {};
        let score = 0;
        let questionsAnswered = 0;
        const totalQuestions = 10;
        
        // Create the game UI
        container.innerHTML = `
            <div class="science-game-container">
                <div class="science-progress">
                    <div class="progress-text">Question <span id="current-question">1</span>/${totalQuestions}</div>
                    <div class="progress-bar">
                        <div class="progress" id="progress-indicator" style="width: 0%"></div>
                    </div>
                </div>
                <div class="science-question-container">
                    <div class="science-image" id="question-image">
                        <i class="fas fa-atom"></i>
                    </div>
                    <div class="science-question" id="question">Loading...</div>
                </div>
                <div class="science-options" id="options"></div>
                <div class="science-feedback" id="science-feedback"></div>
                <div class="science-score">Score: <span id="science-score">0</span></div>
            </div>
        `;
        
        // Get UI elements
        const questionElement = document.getElementById('question');
        const questionImageElement = document.getElementById('question-image');
        const optionsElement = document.getElementById('options');
        const feedbackElement = document.getElementById('science-feedback');
        const scoreElement = document.getElementById('science-score');
        const currentQuestionElement = document.getElementById('current-question');
        const progressIndicator = document.getElementById('progress-indicator');
        
        // Science quiz questions database
        const scienceQuestions = [
            {
                question: "What is the chemical symbol for water?",
                options: ["H2O", "CO2", "O2", "NaCl"],
                correctAnswer: 0,
                explanation: "Water has the chemical formula H2O, meaning it consists of two hydrogen atoms bonded to one oxygen atom.",
                image: '<i class="fas fa-tint"></i>'
            },
            {
                question: "Which planet is known as the Red Planet?",
                options: ["Venus", "Jupiter", "Mars", "Saturn"],
                correctAnswer: 2,
                explanation: "Mars is often called the Red Planet due to its reddish appearance, which is caused by iron oxide (rust) on its surface.",
                image: '<i class="fas fa-globe-americas"></i>'
            },
            {
                question: "What part of the plant conducts photosynthesis?",
                options: ["Roots", "Leaves", "Stem", "Flowers"],
                correctAnswer: 1,
                explanation: "Leaves are the primary site of photosynthesis in most plants. They contain chloroplasts with chlorophyll that capture light energy.",
                image: '<i class="fas fa-leaf"></i>'
            },
            {
                question: "What is the hardest natural substance on Earth?",
                options: ["Gold", "Iron", "Diamond", "Titanium"],
                correctAnswer: 2,
                explanation: "Diamond is the hardest naturally occurring substance, scoring 10 on the Mohs scale of mineral hardness.",
                image: '<i class="fas fa-gem"></i>'
            },
            {
                question: "Which gas do plants absorb from the atmosphere?",
                options: ["Oxygen", "Carbon Dioxide", "Nitrogen", "Hydrogen"],
                correctAnswer: 1,
                explanation: "Plants absorb carbon dioxide (CO2) from the atmosphere during photosynthesis and release oxygen as a byproduct.",
                image: '<i class="fas fa-wind"></i>'
            },
            {
                question: "What is the largest organ in the human body?",
                options: ["Heart", "Liver", "Brain", "Skin"],
                correctAnswer: 3,
                explanation: "The skin is the largest organ in the human body, covering an area of about 2 square meters in adults.",
                image: '<i class="fas fa-user"></i>'
            },
            {
                question: "Which of these is NOT a state of matter?",
                options: ["Solid", "Liquid", "Gas", "Electricity"],
                correctAnswer: 3,
                explanation: "The three common states of matter are solid, liquid, and gas. Plasma is the fourth state. Electricity is a form of energy, not a state of matter.",
                image: '<i class="fas fa-vial"></i>'
            },
            {
                question: "What force keeps planets orbiting around the Sun?",
                options: ["Electromagnetic force", "Gravity", "Nuclear force", "Friction"],
                correctAnswer: 1,
                explanation: "Gravity is the force that attracts objects with mass toward each other, keeping planets in orbit around the Sun.",
                image: '<i class="fas fa-sun"></i>'
            },
            {
                question: "Which of these animals is a mammal?",
                options: ["Snake", "Dolphin", "Shark", "Lizard"],
                correctAnswer: 1,
                explanation: "Dolphins are mammals. They breathe air through lungs, give birth to live young, and produce milk for their offspring.",
                image: '<i class="fas fa-fish"></i>'
            },
            {
                question: "What is the process by which plants make their own food?",
                options: ["Respiration", "Photosynthesis", "Digestion", "Fermentation"],
                correctAnswer: 1,
                explanation: "Photosynthesis is the process by which plants use sunlight, water, and carbon dioxide to create oxygen and energy in the form of sugar.",
                image: '<i class="fas fa-seedling"></i>'
            },
            {
                question: "Which element has the chemical symbol 'O'?",
                options: ["Gold", "Oxygen", "Osmium", "Oganesson"],
                correctAnswer: 1,
                explanation: "The chemical symbol 'O' represents oxygen, an essential element for most life forms on Earth.",
                image: '<i class="fas fa-lungs"></i>'
            },
            {
                question: "What is the smallest unit of matter?",
                options: ["Cell", "Molecule", "Atom", "Electron"],
                correctAnswer: 2,
                explanation: "The atom is considered the smallest unit of matter that retains the properties of an element.",
                image: '<i class="fas fa-atom"></i>'
            }
        ];
        
        // Shuffle questions and take first 10
        const shuffledQuestions = shuffleArray([...scienceQuestions]).slice(0, totalQuestions);
        
        // Function to shuffle array elements
        function shuffleArray(array) {
            for (let i = array.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [array[i], array[j]] = [array[j], array[i]];
            }
            return array;
        }
        
        // Function to display a question
        function displayQuestion(questionData, questionNumber) {
            // Update progress
            if (currentQuestionElement) {
                currentQuestionElement.textContent = questionNumber;
            }
            
            // Update progress bar
            if (progressIndicator) {
                const progressPercentage = ((questionNumber - 1) / totalQuestions) * 100;
                progressIndicator.style.width = `${progressPercentage}%`;
            }
            
            // Set question text
            questionElement.textContent = questionData.question;
            
            // Set question image
            questionImageElement.innerHTML = questionData.image;
            
            // Clear options
            optionsElement.innerHTML = '';
            
            // Clear feedback
            if (feedbackElement) {
                feedbackElement.innerHTML = '';
            }
            
            // Add options
            questionData.options.forEach((option, index) => {
                const optionElement = document.createElement('div');
                optionElement.className = 'science-option';
                optionElement.textContent = option;
                optionElement.setAttribute('data-index', index);
                
                // Add click event
                optionElement.addEventListener('click', function() {
                    const selectedIndex = parseInt(this.getAttribute('data-index'));
                    checkAnswer(selectedIndex, questionData.correctAnswer, questionData.explanation);
                });
                
                optionsElement.appendChild(optionElement);
            });
        }
        
        // Function to check an answer
        function checkAnswer(selectedIndex, correctIndex, explanation) {
            const options = document.querySelectorAll('.science-option');
            
            // Disable all options
            options.forEach(option => {
                option.style.pointerEvents = 'none';
            });
            
            // Highlight correct and incorrect options
            if (selectedIndex === correctIndex) {
                // Correct answer
                options[selectedIndex].classList.add('correct');
                feedbackElement.innerHTML = `<p class="correct-feedback"><i class="fas fa-check-circle"></i> Correct! ${explanation}</p>`;
                score += 10;
                scoreElement.textContent = score;
            } else {
                // Incorrect answer
                options[selectedIndex].classList.add('incorrect');
                options[correctIndex].classList.add('correct');
                feedbackElement.innerHTML = `<p class="incorrect-feedback"><i class="fas fa-times-circle"></i> Incorrect. ${explanation}</p>`;
            }
            
            // Move to next question or end game after delay
            questionsAnswered++;
            setTimeout(() => {
                if (questionsAnswered < totalQuestions) {
                    // Show next question
                    currentQuestion = shuffledQuestions[questionsAnswered];
                    displayQuestion(currentQuestion, questionsAnswered + 1);
                } else {
                    // Game over
                    endGame();
                }
            }, 2000);
        }
        
        // Function to end the game
        function endGame() {
            // Update progress bar to 100%
            if (progressIndicator) {
                progressIndicator.style.width = '100%';
            }
            
            // Display game over message
            container.innerHTML = `
                <div class="science-game-container">
                    <h2>Science Explorer Complete!</h2>
                    <div class="end-game-icon"><i class="fas fa-atom"></i></div>
                    <p>Your final score: ${score} out of ${totalQuestions * 10}</p>
                    <p class="performance-message">${getPerformanceMessage(score, totalQuestions)}</p>
                    <button id="play-again" class="play-btn" style="margin: 20px auto; display: block;">Play Again</button>
                </div>
            `;
            
            // Add event listener to play again button
            const playAgainButton = document.getElementById('play-again');
            if (playAgainButton) {
                playAgainButton.addEventListener('click', function() {
                    startScienceGame(container);
                });
            }
        }
        
        // Function to get performance message based on score
        function getPerformanceMessage(score, totalQuestions) {
            const percentage = (score / (totalQuestions * 10)) * 100;
            
            if (percentage >= 90) {
                return "Outstanding! You're a science genius!";
            } else if (percentage >= 70) {
                return "Great job! You have excellent science knowledge!";
            } else if (percentage >= 50) {
                return "Good effort! Keep learning about science!";
            } else {
                return "Keep exploring! Science is fascinating!";
            }
        }
        
        // Start the game
        currentQuestion = shuffledQuestions[0];
        displayQuestion(currentQuestion, 1);
    }
}