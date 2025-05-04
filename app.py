from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from textblob import TextBlob
from imdb import IMDb
# from fer import FER  # Temporarily disabled
from PIL import Image
import numpy as np
import base64
import io
import os
import cv2

app = Flask(__name__, static_folder='.', static_url_path='')
CORS(app)  # Allow frontend requests (from different port)

# Route: Serve static files
@app.route('/')
def serve_index():
    return send_from_directory('.', 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory('.', path)

# Route: Text Sentiment
@app.route('/analyze-text', methods=['POST'])
def analyze_text():
    data = request.json
    text = data.get('text', '')
    blob = TextBlob(text)
    polarity = blob.sentiment.polarity
    subjectivity = blob.sentiment.subjectivity
    emotions = {
        "happy": max(0, polarity),
        "sad": max(0, -polarity)
    }
    return jsonify({
        'polarity': polarity,
        'subjectivity': subjectivity,
        'emotions': emotions
    })

# Route: IMDb Movie Review Sentiment
@app.route('/analyze-movie', methods=['POST'])
def analyze_movie():
    try:
        movie_name = request.json.get('movie', '')
        if not movie_name:
            return jsonify({'error': 'Please provide a movie name'}), 400

        print(f"Searching for movie: {movie_name}")  # Debug log
        ia = IMDb()
        
        # Try different search patterns for better results
        search_patterns = [
            movie_name,  # Original name
            f"{movie_name} (India)",  # Add India to search
            f"{movie_name} (Bollywood)",  # Add Bollywood to search
            f"{movie_name} (Hindi)",  # Add Hindi to search
            f"{movie_name} (Telugu)",  # Add Telugu to search
            f"{movie_name} (Tamil)",  # Add Tamil to search
            f"{movie_name} (2022)",  # Add year for recent movies
        ]
        
        movies = []
        for pattern in search_patterns:
            results = ia.search_movie(pattern)
            if results:
                movies.extend(results)
                break  # Stop if we found results
        
        if not movies:
            return jsonify({'error': f'Movie "{movie_name}" not found'}), 404

        # Get the first movie and update with more information
        movie = movies[0]
        print(f"Found movie: {movie.get('title', 'Unknown')}")  # Debug log
        
        # Get the movie ID and fetch full details
        movie_id = movie.movieID
        movie = ia.get_movie(movie_id)
        
        # Get movie details
        title = movie.get('title', movie_name)
        countries = movie.get('countries', ['Unknown'])
        
        # Get rating with proper error handling
        rating = 0
        if 'rating' in movie:
            rating = movie['rating']
        elif 'votes' in movie:
            rating = movie['votes']
        
        # Check if it's an Indian movie
        is_indian = any(country.lower() in ['india', 'indian'] for country in countries)
        
        # Get plot with proper error handling
        plot = 'No plot available'
        if 'plot' in movie:
            if isinstance(movie['plot'], list):
                plot = movie['plot'][0]
            else:
                plot = movie['plot']
        
        print(f"Movie details - Title: {title}, Rating: {rating}, Indian: {is_indian}")  # Debug log
        
        return jsonify({
            'movie': title,
            'is_indian': is_indian,
            'rating': float(rating),
            'plot': plot
        })
        
    except Exception as e:
        print(f"Error analyzing movie: {str(e)}")  # Debug log
        return jsonify({
            'error': f'Error analyzing movie: {str(e)}',
            'movie': movie_name
        }), 500

# Route: Image Emotion Detection
@app.route('/analyze-image', methods=['POST'])
def analyze_image():
    try:
        if 'image' not in request.json:
            return jsonify({'error': 'No image data provided'}), 400

        image_data = request.json['image']
        if not image_data:
            return jsonify({'error': 'Empty image data'}), 400

        # Decode base64 image
        try:
            header, encoded = image_data.split(",", 1)
            img_bytes = base64.b64decode(encoded)
            image = Image.open(io.BytesIO(img_bytes)).convert('RGB')
            image_np = np.array(image)
        except Exception as e:
            return jsonify({'error': f'Invalid image format: {str(e)}'}), 400

        # Convert to grayscale for face detection
        gray = cv2.cvtColor(image_np, cv2.COLOR_RGB2GRAY)
        
        # Enhance image for better detection
        gray = cv2.equalizeHist(gray)
        
        # Load the face cascade classifier
        try:
            face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
        except Exception as e:
            return jsonify({'error': f'Error loading face detector: {str(e)}'}), 500
        
        # Detect faces with adjusted parameters
        faces = face_cascade.detectMultiScale(
            gray,
            scaleFactor=1.1,
            minNeighbors=5,
            minSize=(30, 30),
            flags=cv2.CASCADE_SCALE_IMAGE
        )
        
        print(f"Number of faces detected: {len(faces)}")  # Debug log
        
        if len(faces) == 0:
            # Try alternative detection method
            faces = face_cascade.detectMultiScale(
                gray,
                scaleFactor=1.2,
                minNeighbors=3,
                minSize=(20, 20)
            )
            print(f"Alternative detection - faces found: {len(faces)}")  # Debug log
        
        if len(faces) == 0:
            return jsonify({
                'error': 'No faces detected in the image. Please try another image with clear faces.',
                'image_info': {
                    'width': image_np.shape[1],
                    'height': image_np.shape[0]
                }
            })
        
        # Sort faces by size (largest to smallest)
        faces = sorted(faces, key=lambda x: x[2] * x[3], reverse=True)
        
        # Process each detected face
        face_analyses = []
        for i, (x, y, w, h) in enumerate(faces):
            # Extract the face region
            face_roi = gray[y:y+h, x:x+w]
            
            # Calculate face features
            face_area = w * h
            face_ratio = w / h
            
            # Calculate mouth region (lower third of face)
            mouth_y = int(y + h * 0.6)
            mouth_h = int(h * 0.3)
            mouth_roi = gray[mouth_y:mouth_y+mouth_h, x:x+w]
            
            # Calculate eye region (upper third of face)
            eye_y = int(y + h * 0.2)
            eye_h = int(h * 0.3)
            eye_roi = gray[eye_y:eye_y+eye_h, x:x+w]
            
            # Calculate eyebrow region (just above eyes)
            brow_y = int(y + h * 0.15)
            brow_h = int(h * 0.1)
            brow_roi = gray[brow_y:brow_y+brow_h, x:x+w]
            
            # Calculate mouth width and shape
            mouth_contours, _ = cv2.findContours(
                cv2.threshold(mouth_roi, 127, 255, cv2.THRESH_BINARY)[1],
                cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE
            )
            mouth_width = 0
            mouth_height = 0
            if mouth_contours:
                mouth_rect = cv2.boundingRect(mouth_contours[0])
                mouth_width = mouth_rect[2]
                mouth_height = mouth_rect[3]
            
            # Calculate eye openness
            eye_contours, _ = cv2.findContours(
                cv2.threshold(eye_roi, 127, 255, cv2.THRESH_BINARY)[1],
                cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE
            )
            eye_height = 0
            if eye_contours:
                eye_rect = cv2.boundingRect(eye_contours[0])
                eye_height = eye_rect[3]
            
            # Calculate eyebrow angle
            brow_contours, _ = cv2.findContours(
                cv2.threshold(brow_roi, 127, 255, cv2.THRESH_BINARY)[1],
                cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE
            )
            brow_angle = 0
            if brow_contours:
                brow_rect = cv2.boundingRect(brow_contours[0])
                brow_angle = brow_rect[2] / brow_rect[3]
            
            # Determine expression based on multiple features
            expression = "neutral"
            confidence = 0.5  # Default confidence
            
            # Happy: wide mouth, raised cheeks, raised eyebrows
            if mouth_width > w * 0.4 and face_ratio > 1.1 and brow_angle > 1.2:
                expression = "happy"
                confidence = min(0.8, (mouth_width / w + brow_angle / 1.2) / 2)
            
            # Surprised: wide eyes, open mouth, raised eyebrows
            elif eye_height > h * 0.15 and mouth_width > w * 0.3 and brow_angle > 1.3:
                expression = "surprised"
                confidence = min(0.8, (eye_height / h + mouth_width / w + brow_angle / 1.3) / 3)
            
            # Sad: narrow mouth, droopy eyebrows
            elif mouth_width < w * 0.3 and mouth_height > h * 0.1 and brow_angle < 0.8:
                expression = "sad"
                confidence = min(0.8, (1 - mouth_width / w + 1 - brow_angle) / 2)
            
            # Angry: narrow eyes, furrowed eyebrows
            elif eye_height < h * 0.1 and brow_angle < 0.7 and mouth_width < w * 0.35:
                expression = "angry"
                confidence = min(0.8, (1 - eye_height / h + 1 - brow_angle) / 2)
            
            # Disgusted: wrinkled nose, raised upper lip
            elif mouth_height < h * 0.08 and mouth_width < w * 0.35 and brow_angle < 0.9:
                expression = "disgusted"
                confidence = min(0.8, (1 - mouth_height / h + 1 - brow_angle) / 2)
            
            # Calculate overall confidence
            confidence = min(1.0, confidence * (face_area / (image_np.shape[0] * image_np.shape[1]) * 10))
            
            face_analyses.append({
                'face_number': i + 1,
                'expression': expression,
                'confidence': float(confidence)
            })
        
        return jsonify({
            'image_info': {
                'width': image_np.shape[1],
                'height': image_np.shape[0],
                'faces_detected': len(faces),
                'analysis_summary': {
                    'total_faces': len(faces),
                    'expressions': {
                        'happy': sum(1 for face in face_analyses if face['expression'] == 'happy'),
                        'surprised': sum(1 for face in face_analyses if face['expression'] == 'surprised'),
                        'sad': sum(1 for face in face_analyses if face['expression'] == 'sad'),
                        'angry': sum(1 for face in face_analyses if face['expression'] == 'angry'),
                        'disgusted': sum(1 for face in face_analyses if face['expression'] == 'disgusted'),
                        'neutral': sum(1 for face in face_analyses if face['expression'] == 'neutral')
                    }
                }
            },
            'face_analysis': face_analyses
        })
        
    except Exception as e:
        print(f"Error analyzing image: {str(e)}")
        return jsonify({
            'error': f'Error analyzing image: {str(e)}'
        }), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)