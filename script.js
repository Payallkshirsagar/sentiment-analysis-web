// Text Analysis Function
async function analyzeText() {
    const text = document.getElementById('textInput').value;
    if (!text) {
        showError('textResult', 'Please enter some text to analyze');
        return;
    }

    try {
        // Simple sentiment analysis using TextBlob.js
        const blob = new TextBlob(text);
        const polarity = blob.sentiment.polarity;
        const subjectivity = blob.sentiment.subjectivity;
        
        // Calculate emotions based on polarity
        const emotions = {
            happy: Math.max(0, polarity),
            sad: Math.max(0, -polarity)
        };
        
        displayTextResults({
            polarity: polarity,
            subjectivity: subjectivity,
            emotions: emotions
        });
    } catch (error) {
        showError('textResult', 'Error analyzing text. Please try again.');
    }
}

// Movie Analysis Function
async function analyzeMovie() {
    const movieName = document.getElementById('movieInput').value;
    if (!movieName) {
        showError('movieResult', 'Please enter a movie name');
        return;
    }

    try {
        // Show loading state
        const resultDiv = document.getElementById('movieResult');
        resultDiv.innerHTML = '<div class="loading">Analyzing movie...</div>';

        const response = await fetch('/analyze-movie', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ movie: movieName })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Failed to analyze movie');
        }
        
        if (data.error) {
            showError('movieResult', data.error);
            return;
        }
        
        displayMovieResults(data);
    } catch (error) {
        showError('movieResult', error.message || 'Error analyzing movie. Please try again.');
    }
}

// Image Analysis Function
async function analyzeImage() {
    const fileInput = document.getElementById('imageInput');
    const imagePreview = document.getElementById('imagePreview');
    
    if (!fileInput.files[0]) {
        showError('imageResult', 'Please select an image');
        return;
    }

    try {
        // Show loading state
        const resultDiv = document.getElementById('imageResult');
        resultDiv.innerHTML = '<div class="loading">Analyzing image...</div>';

        const file = fileInput.files[0];
        const reader = new FileReader();
        
        reader.onload = async function(e) {
            try {
                const base64Image = e.target.result;
                
                const response = await fetch('/analyze-image', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ image: base64Image })
                });
                
                const data = await response.json();
                
                if (data.error) {
                    showError('imageResult', data.error);
                    return;
                }
                
                displayImageResults(data);
            } catch (error) {
                showError('imageResult', 'Error processing image. Please try again.');
            }
        };
        
        reader.onerror = function() {
            showError('imageResult', 'Error reading image file. Please try again.');
        };
        
        reader.readAsDataURL(file);
    } catch (error) {
        showError('imageResult', 'Error analyzing image. Please try again.');
    }
}

// Helper functions
function showError(elementId, message) {
    const element = document.getElementById(elementId);
    element.innerHTML = `
        <div class="error">
            <h3>Error</h3>
            <p>${message}</p>
        </div>
    `;
}

function displayTextResults(data) {
    const resultDiv = document.getElementById('textResult');
    resultDiv.innerHTML = `
        <div class="result-container">
            <h4>Analysis Results</h4>
            <div class="sentiment-info">
                <p>Polarity: ${data.polarity.toFixed(2)}</p>
                <p>Subjectivity: ${data.subjectivity.toFixed(2)}</p>
            </div>
            <div class="emotion-bar">
                <span class="emotion-label">Happy</span>
                <div class="bar-container">
                    <div class="bar" style="width: ${data.emotions.happy * 100}%"></div>
                </div>
                <span class="emotion-value">${(data.emotions.happy * 100).toFixed(1)}%</span>
            </div>
            <div class="emotion-bar">
                <span class="emotion-label">Sad</span>
                <div class="bar-container">
                    <div class="bar" style="width: ${data.emotions.sad * 100}%"></div>
                </div>
                <span class="emotion-value">${(data.emotions.sad * 100).toFixed(1)}%</span>
            </div>
        </div>
    `;
}

function displayMovieResults(data) {
    const resultDiv = document.getElementById('movieResult');
    resultDiv.innerHTML = `
        <div class="result-container">
            <h4>${data.movie}</h4>
            <div class="movie-info">
                <p><strong>Rating:</strong> ${data.rating.toFixed(1)}/10</p>
                <p><strong>Origin:</strong> ${data.is_indian ? 'Indian Movie' : 'International Movie'}</p>
            </div>
            <div class="plot-summary">
                <h5>Plot Summary</h5>
                <p>${data.plot}</p>
            </div>
        </div>
    `;
}

function displayImageResults(data) {
    const resultDiv = document.getElementById('imageResult');
    const imagePreview = document.getElementById('imagePreview').querySelector('img');
    
    let html = `
        <div class="result-container">
            <h4>Face Analysis Results</h4>
            <div class="analysis-summary">
                <p>Total Faces Detected: ${data.image_info.faces_detected}</p>
            </div>
    `;
    
    if (data.face_analysis && data.face_analysis.length > 0) {
        data.face_analysis.forEach(face => {
            html += `
                <div class="face-analysis">
                    <h5>Face ${face.face_number}</h5>
                    <div class="emotion-bar">
                        <span class="emotion-label">Expression</span>
                        <div class="bar-container">
                            <div class="bar" style="width: ${face.confidence * 100}%"></div>
                        </div>
                        <span class="emotion-value">${face.expression} (${(face.confidence * 100).toFixed(1)}%)</span>
                    </div>
                </div>
            `;
        });
    }
    
    html += '</div>';
    resultDiv.innerHTML = html;
}

// Image preview function
function previewImage(event) {
    const file = event.target.files[0];
    const imagePreview = document.getElementById('imagePreview');
    
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            imagePreview.innerHTML = `
                <img src="${e.target.result}" alt="Preview" style="max-width: 100%; border-radius: 8px; margin-top: 10px;">
            `;
        };
        reader.readAsDataURL(file);
    } else {
        imagePreview.innerHTML = '';
    }
}