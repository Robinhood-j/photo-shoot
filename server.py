# server.py
import os
import io
import json
import pathlib
from datetime import datetime
from flask import Flask, request, jsonify, send_from_directory, abort
from flask_cors import CORS
import requests
from PIL import Image

BASE = pathlib.Path(__file__).parent.resolve()
STATIC_DIR = BASE / 'static'
UPLOADS_DIR = BASE / 'uploads'
DATA_DIR = BASE / 'data'

for d in (UPLOADS_DIR, DATA_DIR):
    d.mkdir(parents=True, exist_ok=True)

app = Flask(__name__, static_folder=str(STATIC_DIR), static_url_path='')
CORS(app)  # allow cross-origin for testing

def safe_write_contacts(entry):
    dest = DATA_DIR / 'contacts.json'
    if dest.exists():
        try:
            data = json.loads(dest.read_text(encoding='utf-8'))
        except Exception:
            data = []
    else:
        data = []
    data.append(entry)
    dest.write_text(json.dumps(data, indent=2), encoding='utf-8')

@app.route('/')
def index():
    return send_from_directory(str(STATIC_DIR), 'index.html')

@app.route('/<path:path>')
def static_files(path):
    # serve files from /static
    file_path = STATIC_DIR / path
    if file_path.exists():
        return send_from_directory(str(STATIC_DIR), path)
    # allow serving uploaded images
    upath = UPLOADS_DIR / path
    if upath.exists():
        return send_from_directory(str(UPLOADS_DIR), path)
    abort(404)

@app.route('/api/contact', methods=['POST'])
def api_contact():
    """
    Accepts JSON payload:
    { name, email, service, message }
    Saves to data/contacts.json for demo purposes.
    """
    try:
        payload = request.get_json(force=True)
    except Exception:
        return jsonify({'error': 'Invalid JSON'}), 400

    name = payload.get('name', '').strip()
    email = payload.get('email', '').strip()
    service = payload.get('service', '').strip()
    message = payload.get('message', '').strip()

    if not name or not email or not message:
        return jsonify({'error': 'Missing required fields'}), 400

    entry = {
        'id': int(datetime.utcnow().timestamp() * 1000),
        'name': name,
        'email': email,
        'service': service,
        'message': message,
        'received_at': datetime.utcnow().isoformat() + 'Z'
    }
    try:
        safe_write_contacts(entry)
    except Exception as e:
        return jsonify({'error': 'Failed to save contact', 'details': str(e)}), 500

    return jsonify({'message': 'Thank you — your message was received (demo).'}), 200

def rgb_to_hex(rgb):
    return '#%02x%02x%02x' % rgb

def dominant_color_from_image(img: Image.Image, resize=150):
    # resize small and get most common color
    img = img.convert('RGBA')
    img.thumbnail((resize, resize))
    # remove alpha by compositing on white if present
    background = Image.new('RGB', img.size, (255,255,255))
    background.paste(img, mask=img.split()[3] if img.mode == 'RGBA' else None)
    small = background.convert('P', palette=Image.ADAPTIVE, colors=8)
    palette = small.getpalette()
    color_counts = sorted(small.getcolors(), reverse=True)
    if not color_counts:
        return (200,200,200)
    dominant_index = color_counts[0][1]
    dominant_rgb = palette[dominant_index*3:dominant_index*3+3]
    return tuple(dominant_rgb)

@app.route('/api/analyze', methods=['POST'])
def api_analyze():
    """
    Temporary canned version for debugging.
    Always returns fake tags + caption to confirm frontend connection.
    """
    try:
        data = request.get_json(force=True)
    except Exception:
        return jsonify({'error': 'Invalid JSON'}), 400

    image_url = data.get('image_url') or data.get('url')
    # Print for local debugging
    print("DEBUG: received analyze request for", image_url)

    # Return safe demo data (no external fetch)
    result = {
        'tags': ['ai', 'demo', 'test'],
        'dominant_color': '#e63946',
        'caption': f"AI demo caption for image: {image_url}"
    }
    return jsonify(result), 200

if __name__ == '__main__':
    # Run dev server
    app.run(debug=True, host='0.0.0.0', port=5000)
