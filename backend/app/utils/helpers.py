import re


def generate_slug(text: str) -> str:
    """Convert input string into URL-safe slug representation."""
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    return re.sub(r"[\s_-]+", "-", text)
