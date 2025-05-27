echo "Installing dependencies..."
python -m pip install --upgrade pip
pip install -r requirements.txt
echo "Starting Gunicorn..."
gunicorn --bind 0.0.0.0:$PORT main:app