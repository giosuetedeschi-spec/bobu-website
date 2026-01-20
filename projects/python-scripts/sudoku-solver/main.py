# main.py
import asyncio
from visualizer import main

if __name__ == "__main__":
    # In Pyodide, asyncio.run is usually handled by the environment or top-level await 
    # but for local Python 3.7+ this works.
    asyncio.run(main())
