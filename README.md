# Sentiment Analysis Web Application

A comprehensive web application that provides sentiment analysis for text, movies, and facial expressions in images.

## Features

- **Text Analysis**: Analyze sentiment and emotions in text
- **Movie Analysis**: Get movie information, ratings, and plot summaries
- **Image Analysis**: Detect faces and analyze facial expressions

## Technologies Used

- Flask (Backend)
- HTML/CSS/JavaScript (Frontend)
- TextBlob (Text Sentiment Analysis)
- IMDbPY (Movie Information)
- OpenCV (Face Detection)
- PIL (Image Processing)

## Setup Instructions

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/sentiment-analysis-web.git
   cd sentiment-analysis-web
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Run the application:
   ```bash
   python app.py
   ```

4. Open your browser and go to:
   - Local: http://localhost:5000
   - Network: http://your-ip:5000

## Usage

### Text Analysis
1. Enter text in the text input field
2. Click "Analyze Text"
3. View sentiment and emotion results

### Movie Analysis
1. Enter a movie name
2. Click "Analyze Movie"
3. View movie details, ratings, and plot

### Image Analysis
1. Upload an image with faces
2. Click "Analyze Image"
3. View detected expressions and confidence scores

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/YourFeature`)
3. Commit your changes (`git commit -m 'Add some feature'`)
4. Push to the branch (`git push origin feature/YourFeature`)
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 