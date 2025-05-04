// Text Analysis Function
async function analyzeText() {
    const text = document.getElementById('textInput').value;
    if (!text) {
        alert('Please enter some text to analyze');
        return;
    }

    try {
        const response = await fetch('/analyze-text', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ text }),
        });

        const data = await response.json();
        const resultDiv = document.getElementById('textResult');
        
        if (data.error) {
            resultDiv.innerHTML = `<p class="error">${data.error}</p>`;
            return;
        }

        const emotions = data.emotions;
        const polarity = data.polarity;
        const subjectivity = data.subjectivity;

        // Create emotion bars
        const emotionBars = Object.entries(emotions)
            .map(([emotion, value]) => `
                <div class="emotion-bar">
                    <span class="emotion-label">${emotion}:</span>
                    <div class="bar-container">
                        <div class="bar" style="width: ${value * 100}%"></div>
                    </div>
                    <span class="emotion-value">${(value * 100).toFixed(1)}%</span>
                </div>
            `).join('');

        resultDiv.innerHTML = `
            <div class="result-container">
                <h4>Analysis Results:</h4>
                <div class="sentiment-info">
                    <p>Polarity: ${polarity.toFixed(2)} (${getPolarityLabel(polarity)})</p>
                    <p>Subjectivity: ${subjectivity.toFixed(2)} (${getSubjectivityLabel(subjectivity)})</p>
                </div>
                <div class="emotions-container">
                    <h4>Emotions:</h4>
                    ${emotionBars}
                </div>
            </div>
        `;
    } catch (error) {
        document.getElementById('textResult').innerHTML = `<p class="error">Error analyzing text: ${error.message}</p>`;
    }
}

// Movie Analysis Function
async function analyzeMovie() {
    const movieName = document.getElementById('movieInput').value;
    if (!movieName) {
        alert('Please enter a movie name');
        return;
    }

    try {
        const response = await fetch('/analyze-movie', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ movie: movieName }),
        });

        const data = await response.json();
        const resultDiv = document.getElementById('movieResult');
        
        if (data.error) {
            resultDiv.innerHTML = `<p class="error">${data.error}</p>`;
            return;
        }

        resultDiv.innerHTML = `
            <div class="result-container">
                <h4>Movie Analysis Results:</h4>
                <div class="movie-info">
                    <p><strong>Title:</strong> ${data.movie}</p>
                    <p><strong>Rating:</strong> ${data.rating.toFixed(1)}/10</p>
                    <p><strong>Origin:</strong> ${data.is_indian ? 'Indian Movie' : 'International Movie'}</p>
                    <div class="plot-summary">
                        <h5>Plot Summary:</h5>
                        <p>${data.plot}</p>
                    </div>
                </div>
            </div>
        `;
    } catch (error) {
        document.getElementById('movieResult').innerHTML = `<p class="error">Error analyzing movie: ${error.message}</p>`;
    }
}

// Image Analysis Function
async function analyzeImage() {
    const fileInput = document.getElementById('imageInput');
    const file = fileInput.files[0];
    
    if (!file) {
        alert('Please select an image file');
        return;
    }

    try {
        const base64Image = await convertToBase64(file);
        const response = await fetch('/analyze-image', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ image: base64Image }),
        });

        const data = await response.json();
        const resultDiv = document.getElementById('imageResult');
        
        if (data.error) {
            resultDiv.innerHTML = `<p class="error">${data.error}</p>`;
            return;
        }

        // Display image preview
        const imagePreview = document.createElement('img');
        imagePreview.src = base64Image;
        imagePreview.style.maxWidth = '100%';
        imagePreview.style.marginBottom = '20px';

        // Create face analysis results
        const faceResults = data.face_analysis.map((face, index) => `
            <div class="face-analysis">
                <h5>Face ${face.face_number}:</h5>
                <p><strong>Expression:</strong> ${face.expression}</p>
                <p><strong>Confidence:</strong> ${(face.confidence * 100).toFixed(1)}%</p>
            </div>
        `).join('');

        resultDiv.innerHTML = `
            <div class="result-container">
                <h4>Image Analysis Results:</h4>
                <div class="image-preview">${imagePreview.outerHTML}</div>
                <div class="analysis-summary">
                    <p><strong>Total Faces Detected:</strong> ${data.image_info.faces_detected}</p>
                    <div class="face-results">
                        ${faceResults}
                    </div>
                </div>
            </div>
        `;
    } catch (error) {
        document.getElementById('imageResult').innerHTML = `<p class="error">Error analyzing image: ${error.message}</p>`;
    }
}

// Helper Functions
function convertToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}

function getPolarityLabel(polarity) {
    if (polarity > 0.5) return 'Very Positive';
    if (polarity > 0) return 'Positive';
    if (polarity < -0.5) return 'Very Negative';
    if (polarity < 0) return 'Negative';
    return 'Neutral';
}

function getSubjectivityLabel(subjectivity) {
    if (subjectivity > 0.75) return 'Very Subjective';
    if (subjectivity > 0.5) return 'Subjective';
    if (subjectivity > 0.25) return 'Somewhat Subjective';
    return 'Objective';
}