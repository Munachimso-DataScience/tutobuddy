# Use official Python 3.9 image
FROM python:3.9-slim

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PORT=7860 \
    NLTK_DATA=/home/user/nltk_data

# Create a non-root user for Hugging Face security
RUN useradd -m -u 1000 user
USER user
ENV HOME=/home/user \
	PATH=/home/user/.local/bin:$PATH

WORKDIR $HOME/app

# Install system dependencies (need for some Python libs)
USER root
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    software-properties-common \
    && rm -rf /var/lib/apt/lib/lists/*
USER user

# Copy requirements and install
COPY --chown=user requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Download NLTK data during build to save time
RUN python -m nltk.downloader wordnet omw-1.4 punkt averaged_perceptron_tagger stopwords

# Copy the rest of the application
COPY --chown=user . .

# Hugging Face Spaces expect port 7860
EXPOSE 7860

# Start the application
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "7860"]
