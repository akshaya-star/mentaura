from flask import Blueprint, request, jsonify
import os
import sys
import json
import random
from datetime import datetime

# Add the parent directory to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Import service modules
from services.ai_service import setup_ai_models
from services.auth_service import get_user_profile, store_user_learning_data

# Initialize AI models
ai_service = setup_ai_models()

# Create a Blueprint for game routes
game_bp = Blueprint('games', __name__)

@game_bp.route('/list', methods=['GET'])
def list_games():
    """Get list of available educational games"""
    try:
        # For now, we'll return a hardcoded list of games
        # In a real application, this would be fetched from a database
        games = [
            {
                'id': 'math-challenge',
                'title': 'Math Challenge',
                'description': 'Test your math skills with fun puzzles',
                'image': 'https://source.unsplash.com/random/300x200/?math',
                'category': 'mathematics',
                'difficulty_levels': ['beginner', 'intermediate', 'advanced']
            },
            {
                'id': 'word-wizard',
                'title': 'Word Wizard',
                'description': 'Expand your vocabulary through play',
                'image': 'https://source.unsplash.com/random/300x200/?words',
                'category': 'language',
                'difficulty_levels': ['beginner', 'intermediate', 'advanced']
            },
            {
                'id': 'science-explorer',
                'title': 'Science Explorer',
                'description': 'Discover scientific concepts through interactive experiments',
                'image': 'https://source.unsplash.com/random/300x200/?science',
                'category': 'science',
                'difficulty_levels': ['beginner', 'intermediate', 'advanced']
            },
            {
                'id': 'knowledge-quiz',
                'title': 'Knowledge Quiz',
                'description': 'Test your knowledge across various subjects',
                'image': 'https://source.unsplash.com/random/300x200/?quiz',
                'category': 'general',
                'difficulty_levels': ['beginner', 'intermediate', 'advanced']
            }
        ]
        
        return jsonify({'games': games})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@game_bp.route('/math-challenge', methods=['POST'])
def math_challenge():
    """Generate math challenge questions"""
    try:
        data = request.json or {}
        difficulty = data.get('difficulty', 'intermediate')
        count = data.get('count', 5)
        topic = data.get('topic', 'general math')
        user_id = data.get('uid')
        
        # Generate math questions based on difficulty and topic
        if difficulty == 'beginner':
            questions = generate_beginner_math_questions(count, topic)
        elif difficulty == 'advanced':
            questions = generate_advanced_math_questions(count, topic)
        else:  # intermediate
            questions = generate_intermediate_math_questions(count, topic)
        
        # Store game session in user history if user_id is provided
        if user_id:
            game_data = {
                'timestamp': datetime.now().isoformat(),
                'game': 'math-challenge',
                'difficulty': difficulty,
                'topic': topic,
                'type': 'game-session'
            }
            
            store_user_learning_data(user_id, game_data)
        
        return jsonify({'questions': questions})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@game_bp.route('/word-wizard', methods=['POST'])
def word_wizard():
    """Generate word wizard game content"""
    try:
        data = request.json or {}
        difficulty = data.get('difficulty', 'intermediate')
        count = data.get('count', 5)
        category = data.get('category', 'general')
        user_id = data.get('uid')
        
        # Generate word challenges based on difficulty and category
        challenges = generate_word_challenges(difficulty, count, category)
        
        # Store game session in user history if user_id is provided
        if user_id:
            game_data = {
                'timestamp': datetime.now().isoformat(),
                'game': 'word-wizard',
                'difficulty': difficulty,
                'category': category,
                'type': 'game-session'
            }
            
            store_user_learning_data(user_id, game_data)
        
        return jsonify({'challenges': challenges})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@game_bp.route('/science-explorer', methods=['POST'])
def science_explorer():
    """Generate science explorer game content"""
    try:
        data = request.json or {}
        topic = data.get('topic', 'physics')
        difficulty = data.get('difficulty', 'intermediate')
        user_id = data.get('uid')
        
        # Generate experiment based on topic and difficulty
        experiment = generate_science_experiment(topic, difficulty)
        
        # Store game session in user history if user_id is provided
        if user_id:
            game_data = {
                'timestamp': datetime.now().isoformat(),
                'game': 'science-explorer',
                'topic': topic,
                'difficulty': difficulty,
                'type': 'game-session'
            }
            
            store_user_learning_data(user_id, game_data)
        
        return jsonify({'experiment': experiment})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@game_bp.route('/knowledge-quiz', methods=['POST'])
def knowledge_quiz():
    """Generate knowledge quiz questions"""
    try:
        data = request.json or {}
        topic = data.get('topic', 'general knowledge')
        difficulty = data.get('difficulty', 'intermediate')
        count = data.get('count', 10)
        user_id = data.get('uid')
        
        # Generate quiz questions based on topic, difficulty, and count
        questions = generate_quiz_questions(topic, difficulty, count)
        
        # Store game session in user history if user_id is provided
        if user_id:
            game_data = {
                'timestamp': datetime.now().isoformat(),
                'game': 'knowledge-quiz',
                'topic': topic,
                'difficulty': difficulty,
                'type': 'game-session'
            }
            
            store_user_learning_data(user_id, game_data)
        
        return jsonify({'questions': questions})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@game_bp.route('/verify-answer', methods=['POST'])
def verify_answer():
    """Verify user's answer to a game question"""
    try:
        data = request.json
        
        if not data or 'game' not in data or 'question' not in data or 'answer' not in data:
            return jsonify({'error': 'Game, question, and answer are required'}), 400
        
        game = data['game']
        question = data['question']
        user_answer = data['answer']
        correct_answer = data.get('correctAnswer')
        user_id = data.get('uid')
        
        # Verify answer based on game type
        if game == 'math-challenge':
            result = verify_math_answer(question, user_answer, correct_answer)
        elif game == 'word-wizard':
            result = verify_word_answer(question, user_answer, correct_answer)
        elif game == 'science-explorer':
            result = verify_science_answer(question, user_answer, correct_answer)
        elif game == 'knowledge-quiz':
            result = verify_quiz_answer(question, user_answer, correct_answer)
        else:
            return jsonify({'error': 'Unknown game type'}), 400
        
        # Store answer in user history if user_id is provided
        if user_id:
            answer_data = {
                'timestamp': datetime.now().isoformat(),
                'game': game,
                'question': question,
                'userAnswer': user_answer,
                'correctAnswer': correct_answer,
                'isCorrect': result['isCorrect'],
                'type': 'game-answer'
            }
            
            store_user_learning_data(user_id, answer_data)
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@game_bp.route('/recommend', methods=['GET'])
def recommend_games():
    """Recommend games based on user's learning history"""
    try:
        user_id = request.args.get('uid')
        topic = request.args.get('topic', '')
        
        if not user_id and not topic:
            return jsonify({'error': 'User ID or topic is required'}), 400
        
        # Get recommended games
        if user_id:
            # Get user profile to find learning preferences
            user_profile = get_user_profile(user_id)
            
            # Recommend games based on user's learning history
            recommended_games = recommend_games_for_user(user_profile)
        else:
            # Recommend games based on topic
            recommended_games = recommend_games_for_topic(topic)
        
        return jsonify({'recommendations': recommended_games})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Helper functions for math challenge
def generate_beginner_math_questions(count, topic):
    """Generate beginner-level math questions"""
    questions = []
    
    # Generate addition, subtraction, and multiplication questions
    operations = ['+', '-', '*']
    
    for i in range(count):
        operation = random.choice(operations)
        num1 = random.randint(1, 20)
        num2 = random.randint(1, 10)
        
        if operation == '+':
            question = f"What is {num1} + {num2}?"
            answer = num1 + num2
        elif operation == '-':
            # Ensure positive result for beginners
            if num1 < num2:
                num1, num2 = num2, num1
            question = f"What is {num1} - {num2}?"
            answer = num1 - num2
        else:  # multiplication
            question = f"What is {num1} × {num2}?"
            answer = num1 * num2
        
        questions.append({
            'id': f"math-{i+1}",
            'question': question,
            'type': 'number',
            'answer': str(answer)
        })
    
    return questions

def generate_intermediate_math_questions(count, topic):
    """Generate intermediate-level math questions"""
    questions = []
    
    # Generate more complex operations including division and exponents
    operations = ['+', '-', '*', '/', 'exponent']
    
    for i in range(count):
        operation = random.choice(operations)
        
        if operation == '+':
            num1 = random.randint(10, 100)
            num2 = random.randint(10, 100)
            question = f"Calculate {num1} + {num2}"
            answer = num1 + num2
        elif operation == '-':
            num1 = random.randint(50, 150)
            num2 = random.randint(10, 50)
            question = f"Calculate {num1} - {num2}"
            answer = num1 - num2
        elif operation == '*':
            num1 = random.randint(5, 20)
            num2 = random.randint(5, 20)
            question = f"Calculate {num1} × {num2}"
            answer = num1 * num2
        elif operation == '/':
            # Ensure clean division for intermediate level
            num2 = random.randint(2, 10)
            num1 = num2 * random.randint(2, 10)
            question = f"Calculate {num1} ÷ {num2}"
            answer = num1 // num2
        else:  # exponent
            base = random.randint(2, 10)
            exponent = random.randint(2, 3)
            question = f"Calculate {base}^{exponent} (power)"
            answer = base ** exponent
        
        questions.append({
            'id': f"math-{i+1}",
            'question': question,
            'type': 'number',
            'answer': str(answer)
        })
    
    return questions

def generate_advanced_math_questions(count, topic):
    """Generate advanced-level math questions using AI"""
    questions = []
    
    # Use AI to generate advanced math questions based on topic
    prompt = f"""Generate {count} advanced-level math questions about {topic}.
    For each question, provide:
    1. A clear and concise question
    2. The correct answer (must be a numerical value)
    
    Example format:
    [
      {{
        "id": "math-1",
        "question": "Calculate the derivative of f(x) = x^3 + 2x^2 - 4x + 7 at x = 2",
        "type": "number",
        "answer": "22"
      }}
    ]"""
    
    try:
        response = ai_service.query_gemini(prompt)
        
        # Try to parse the response as JSON
        try:
            parsed_questions = json.loads(response)
            
            if isinstance(parsed_questions, list) and len(parsed_questions) > 0:
                questions = parsed_questions
            else:
                # Fallback to manually generated questions
                questions = generate_intermediate_math_questions(count, topic)
                
        except json.JSONDecodeError:
            # Fallback to manually generated questions
            questions = generate_intermediate_math_questions(count, topic)
            
    except Exception as e:
        print(f"Error generating math questions: {e}")
        questions = generate_intermediate_math_questions(count, topic)
    
    return questions

def verify_math_answer(question, user_answer, correct_answer=None):
    """Verify user's answer to a math question"""
    try:
        # If correct_answer is provided, use it
        if correct_answer:
            correct = str(user_answer).strip() == str(correct_answer).strip()
            return {
                'isCorrect': correct,
                'correctAnswer': correct_answer,
                'explanation': get_math_explanation(question, correct_answer)
            }
        
        # Otherwise, try to extract the answer from the question
        # This is a simplified approach and would need more robust parsing in a real app
        
        # Extract the operation and numbers from the question
        parts = question.split()
        numbers = []
        operation = ''
        
        for part in parts:
            # Try to extract numbers
            try:
                numbers.append(int(part))
            except ValueError:
                # Check for operations
                if '+' in part:
                    operation = '+'
                elif '-' in part:
                    operation = '-'
                elif '×' in part or '*' in part:
                    operation = '*'
                elif '÷' in part or '/' in part:
                    operation = '/'
                elif '^' in part:
                    operation = '^'
        
        # Calculate the answer
        calculated_answer = None
        if len(numbers) >= 2:
            if operation == '+':
                calculated_answer = numbers[0] + numbers[1]
            elif operation == '-':
                calculated_answer = numbers[0] - numbers[1]
            elif operation == '*':
                calculated_answer = numbers[0] * numbers[1]
            elif operation == '/':
                calculated_answer = numbers[0] // numbers[1]
            elif operation == '^':
                calculated_answer = numbers[0] ** numbers[1]
        
        if calculated_answer is not None:
            correct = str(user_answer).strip() == str(calculated_answer).strip()
            return {
                'isCorrect': correct,
                'correctAnswer': str(calculated_answer),
                'explanation': get_math_explanation(question, calculated_answer)
            }
        
        # If we couldn't calculate the answer, use AI to evaluate
        prompt = f"""Question: {question}
        User's answer: {user_answer}
        
        Is the user's answer correct? Provide:
        1. Whether the answer is correct (true/false)
        2. The correct answer
        3. A brief explanation
        
        Format as JSON: {{"isCorrect": true/false, "correctAnswer": "answer", "explanation": "explanation"}}"""
        
        response = ai_service.query_gemini(prompt)
        
        try:
            result = json.loads(response)
            return result
        except json.JSONDecodeError:
            # Fallback response
            return {
                'isCorrect': False,
                'correctAnswer': 'Unknown',
                'explanation': 'Could not evaluate your answer.'
            }
        
    except Exception as e:
        print(f"Error verifying math answer: {e}")
        return {
            'isCorrect': False,
            'correctAnswer': 'Unknown',
            'explanation': 'Could not evaluate your answer due to an error.'
        }

def get_math_explanation(question, answer):
    """Generate explanation for a math question"""
    prompt = f"""Question: {question}
    Correct answer: {answer}
    
    Provide a brief, clear explanation for how to solve this math problem."""
    
    try:
        explanation = ai_service.query_gemini(prompt)
        return explanation
    except Exception:
        return "To solve this problem, apply the correct mathematical operation to the given numbers."

# Helper functions for other games can be implemented similarly
def generate_word_challenges(difficulty, count, category):
    """Generate word challenges for Word Wizard game"""
    # Simplified implementation - in a real app, you would use a more sophisticated approach
    return []

def generate_science_experiment(topic, difficulty):
    """Generate science experiment for Science Explorer game"""
    # Simplified implementation - in a real app, you would use a more sophisticated approach
    return {}

def generate_quiz_questions(topic, difficulty, count):
    """Generate quiz questions for Knowledge Quiz game"""
    # Simplified implementation - in a real app, you would use a more sophisticated approach
    return []

def verify_word_answer(question, user_answer, correct_answer):
    """Verify user's answer to a word challenge"""
    # Simplified implementation - in a real app, you would use a more sophisticated approach
    return {}

def verify_science_answer(question, user_answer, correct_answer):
    """Verify user's answer to a science experiment question"""
    # Simplified implementation - in a real app, you would use a more sophisticated approach
    return {}

def verify_quiz_answer(question, user_answer, correct_answer):
    """Verify user's answer to a quiz question"""
    # Simplified implementation - in a real app, you would use a more sophisticated approach
    return {}

def recommend_games_for_user(user_profile):
    """Recommend games based on user's learning history"""
    # Simplified implementation - in a real app, you would use a more sophisticated approach
    return []

def recommend_games_for_topic(topic):
    """Recommend games based on topic"""
    # Simplified implementation - in a real app, you would use a more sophisticated approach
    return [] 