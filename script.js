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
        const response = await fetch('/analyze-movie', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ movie: movieName })
        });
        
        const data = await response.json();
        if (data.error) {
            showError('movieResult', data.error);
            return;
        }
        
        displayMovieResults(data);
    } catch (error) {
        showError('movieResult', 'Error analyzing movie. Please try again.');
    }
}

// Image Analysis Function
async function analyzeImage() {
    const fileInput = document.getElementById('imageInput');
    if (!fileInput.files[0]) {
        showError('imageResult', 'Please select an image');
        return;
    }

    try {
        const file = fileInput.files[0];
        const reader = new FileReader();
        
        reader.onload = async function(e) {
            const base64Image = e.target.result.split(',')[1];
            
            // Using Google Cloud Vision API (you'll need to set up a project and get an API key)
            const apiKey = 'YOUR_CLOUD_VISION_API_KEY'; // Replace with your API key
            const response = await fetch('https://vision.googleapis.com/v1/images:annotate?key=' + apiKey, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    requests: [{
                        image: {
                            content: base64Image
                        },
                        features: [{
                            type: 'FACE_DETECTION',
                            maxResults: 10
                        }]
                    }]
                })
            });
            
            const data = await response.json();
            displayImageResults(data);
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
    const imagePreview = document.getElementById('imagePreview');
    
    if (data.responses[0].faceAnnotations) {
        const faces = data.responses[0].faceAnnotations;
        let html = `
            <div class="result-container">
                <h4>Face Analysis Results</h4>
                <div class="image-preview">
                    <img src="${imagePreview.src}" alt="Uploaded Image">
                </div>
                <div class="face-results">
                    <p>Total Faces Detected: ${faces.length}</p>
        `;
        
        faces.forEach((face, index) => {
            const emotions = getEmotionsFromFace(face);
            html += `
                <div class="face-analysis">
                    <h5>Face ${index + 1}</h5>
                    <p>Joy: ${(emotions.joy * 100).toFixed(1)}%</p>
                    <p>Sorrow: ${(emotions.sorrow * 100).toFixed(1)}%</p>
                    <p>Anger: ${(emotions.anger * 100).toFixed(1)}%</p>
                    <p>Surprise: ${(emotions.surprise * 100).toFixed(1)}%</p>
                </div>
            `;
        });
        
        html += '</div></div>';
        resultDiv.innerHTML = html;
    } else {
        showError('imageResult', 'No faces detected in the image');
    }
}

function getEmotionsFromFace(face) {
    return {
        joy: face.joyLikelihood === 'VERY_LIKELY' ? 1 : 
             face.joyLikelihood === 'LIKELY' ? 0.75 :
             face.joyLikelihood === 'POSSIBLE' ? 0.5 :
             face.joyLikelihood === 'UNLIKELY' ? 0.25 : 0,
        sorrow: face.sorrowLikelihood === 'VERY_LIKELY' ? 1 :
                face.sorrowLikelihood === 'LIKELY' ? 0.75 :
                face.sorrowLikelihood === 'POSSIBLE' ? 0.5 :
                face.sorrowLikelihood === 'UNLIKELY' ? 0.25 : 0,
        anger: face.angerLikelihood === 'VERY_LIKELY' ? 1 :
               face.angerLikelihood === 'LIKELY' ? 0.75 :
               face.angerLikelihood === 'POSSIBLE' ? 0.5 :
               face.angerLikelihood === 'UNLIKELY' ? 0.25 : 0,
        surprise: face.surpriseLikelihood === 'VERY_LIKELY' ? 1 :
                 face.surpriseLikelihood === 'LIKELY' ? 0.75 :
                 face.surpriseLikelihood === 'POSSIBLE' ? 0.5 :
                 face.surpriseLikelihood === 'UNLIKELY' ? 0.25 : 0
    };
}

// Image preview function
function previewImage(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const imagePreview = document.getElementById('imagePreview');
            imagePreview.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
        };
        reader.readAsDataURL(file);
    }
}