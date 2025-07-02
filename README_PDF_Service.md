# PDF Generator Microservice

A Flask-based microservice for generating professional PDF documents from lesson content.

## 🚀 Quick Start

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Run the Service
```bash
python pdf_generator.py
```

The service will start on `http://localhost:5000`

## 📡 API Endpoints

### Health Check
```bash
GET /health
```
Returns service status information.

### Generate Single Lesson PDF
```bash
POST /generate-lesson-pdf
Content-Type: application/json

{
  "title": "God's Love Lesson",
  "content": "Lesson content here...",
  "studentName": "John Doe",
  "ageGroup": "5-10 years", 
  "topic": "God's Love",
  "biblePassage": "John 3:16",
  "theme": "Understanding God's love",
  "filename": "gods_love_lesson.pdf"
}
```

### Generate Batch PDF
```bash
POST /generate-batch-pdf
Content-Type: application/json

{
  "lessons": [
    {
      "title": "Lesson 1",
      "content": "Content 1...",
      "ageGroup": "5-10 years"
    },
    {
      "title": "Lesson 2", 
      "content": "Content 2...",
      "ageGroup": "11-14 years"
    }
  ],
  "filename": "batch_lessons.pdf"
}
```

## 🎨 PDF Features

- **Professional Headers**: Lesson title, student name, date
- **Lesson Metadata**: Age group, topic, Bible passage, theme
- **Content Formatting**: Proper paragraph spacing and line breaks
- **Page Numbers**: Automatic footer with page numbers
- **Text Wrapping**: Intelligent text wrapping for readability

## 🔧 Integration

The React app automatically detects if the PDF service is running:

- **Service Available**: Downloads professional PDFs
- **Service Offline**: Falls back to text file downloads
- **Health Checks**: Periodic service availability checks

## 📁 File Structure

```
pdf_generator.py      # Main Flask application
requirements.txt      # Python dependencies
README_PDF_Service.md # This documentation
```

## 🐳 Docker Deployment (Optional)

Create a `Dockerfile`:

```dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY pdf_generator.py .

EXPOSE 5000
CMD ["python", "pdf_generator.py"]
```

Build and run:
```bash
docker build -t lesson-pdf-generator .
docker run -p 5000:5000 lesson-pdf-generator
```

## 🌐 Environment Variables

```bash
# Optional environment variables
FLASK_ENV=production
FLASK_PORT=5000
```

## 🔒 Security Notes

- Service runs on localhost by default
- No authentication required (internal service)
- Temporary files are cleaned up automatically
- Content validation prevents malicious input

## 📊 Performance

- **Generation Time**: ~1-2 seconds per lesson
- **File Size**: ~50-200KB per lesson PDF
- **Concurrent Requests**: Supports multiple simultaneous requests
- **Memory Usage**: Low memory footprint

## 🛠️ Troubleshooting

### Service Won't Start
```bash
# Check if port 5000 is available
lsof -i :5000

# Kill existing process if needed
kill -9 <PID>
```

### Import Errors
```bash
# Reinstall dependencies
pip install --upgrade -r requirements.txt
```

### PDF Generation Fails
- Check available disk space
- Verify write permissions in temp directory
- Check content length (very large content may timeout)

## 🔄 Development

To modify the PDF layout:

1. Edit the `LessonPDF` class in `pdf_generator.py`
2. Customize `header()`, `footer()`, and `add_lesson_content()` methods
3. Restart the service to apply changes

## 📈 Scaling

For production deployment:

- Use Gunicorn WSGI server
- Add Redis for caching
- Implement request queuing for large batches
- Add monitoring and logging