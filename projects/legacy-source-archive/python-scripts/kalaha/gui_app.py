import sys
import os

# Ensure the project root is in sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

try:
    from kalaha.gui.main import run_gui
except ImportError:
    from gui.main import run_gui

if __name__ == "__main__":
    run_gui()
