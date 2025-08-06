# microservices_python/utils/text_utils.py

import re

def clean_text(text: str) -> str:
    """
    Cleans extracted text to improve quality for AI processing.

    - Removes excessive line breaks and whitespace.
    - Can be extended to remove headers, footers, or other artifacts.

    Args:
        text (str): The raw text to be cleaned.

    Returns:
        str: The cleaned text.
    """
    if not text:
        return ""
    # Replace multiple newlines with a single one
    text = re.sub(r'\n\s*\n', '\n', text)
    # Replace multiple spaces with a single space
    text = re.sub(r'[ \t]+', ' ', text)
    # Remove leading/trailing whitespace from each line
    text = "\n".join([line.strip() for line in text.split('\n')])
    return text.strip()