import cv2
import pytesseract
import re
import platform
import sqlite3
import os

# Set Tesseract path if on Windows
if platform.system() == 'Windows':
    pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

# Paths
video_path = './R2.mp4'
db_path = 'data.db'
video_filename = os.path.relpath(video_path)  # store relative path

# Connect to SQLite database
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Create tables
cursor.execute('''
    CREATE TABLE IF NOT EXISTS videos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        filename TEXT UNIQUE
    )
''')

cursor.execute('''
    CREATE TABLE IF NOT EXISTS frames (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        video_id INTEGER,
        frame_number INTEGER,
        latitude REAL,
        longitude REAL,
        FOREIGN KEY(video_id) REFERENCES videos(id)
    )
''')

# Insert video entry if not present
cursor.execute("SELECT id FROM videos WHERE filename = ?", (video_filename,))
row = cursor.fetchone()

if row:
    video_id = row[0]
else:
    cursor.execute("INSERT INTO videos (filename) VALUES (?)", (video_filename,))
    conn.commit()
    video_id = cursor.lastrowid
    print(f"Inserted video path '{video_filename}' into database with ID {video_id}.")

# Open video
cap = cv2.VideoCapture(video_path)
frame_number = 0
frame_interval = 100  # Skip every 15 frames

def extract_lat_lng(text):
    lat_match = re.search(r'Lat:\s*([0-9.+-]+)', text)
    lon_match = re.search(r'Lon:\s*([0-9.+-]+)', text)
    if lat_match and lon_match:
        return float(lat_match.group(1)), float(lon_match.group(1))
    return None, None

# Process video frames
while cap.isOpened():
    ret, frame = cap.read()
    if not ret:
        break

    frame_number += 1
    if frame_number % frame_interval != 0:
        continue

    cropped = frame[0:120, :]
    gray = cv2.cvtColor(cropped, cv2.COLOR_BGR2GRAY)

    text = pytesseract.image_to_string(gray)
    print(f"Frame {frame_number} OCR Text: {text.strip()}")

    lat, lon = extract_lat_lng(text)
    if lat is not None and lon is not None:
        cursor.execute(
            "INSERT INTO frames (video_id, frame_number, latitude, longitude) VALUES (?, ?, ?, ?)",
            (video_id, frame_number, lat, lon)
        )
        conn.commit()

cap.release()
conn.close()
