import logging
import sys


def setup_logging() -> None:
    """Initialize structured logging configuration across the application."""
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        handlers=[
            logging.StreamHandler(sys.stdout),
        ],
    )
    logging.getLogger("uvicorn.access").setLevel(logging.INFO)
