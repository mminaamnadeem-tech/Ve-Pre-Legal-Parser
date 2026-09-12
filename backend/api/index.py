import sys
import os

# Add parent directory to path so FastAPI can find app module
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.main import app