import shutil
import os

src = r"C:\Users\USER 1\.gemini\antigravity\brain\0f7af387-4891-42f0-b25b-5666bb9d49ae\.system_generated\click_feedback\click_feedback_1773508515615.png"
dst = r"C:\Users\USER 1\.gemini\antigravity\brain\0f7af387-4891-42f0-b25b-5666bb9d49ae\attendance_view.png"

try:
    shutil.copy(src, dst)
    print(f"Successfully copied {src} to {dst}")
except Exception as e:
    print(f"Error copying file: {e}")
