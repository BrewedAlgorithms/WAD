# microservices_python/utils/pdf_utils.py

import pdfplumber
from config.logging import get_logger

logger = get_logger(__name__)

def extract_text_from_pdf(file_path: str, max_pages: int = 5) -> str:
    """
    Extracts text from the first few pages of a PDF file.

    We limit the number of pages to control the amount of text sent to the
    AI model, which helps manage token usage and costs. The most important
    metadata (title, authors, abstract) is usually on the first page.

    Args:
        file_path (str): The local path to the PDF file.
        max_pages (int): The maximum number of pages to extract text from.

    Returns:
        str: The extracted text content.
    """
    text = ""
    try:
        with pdfplumber.open(file_path) as pdf:
            num_pages_to_process = min(len(pdf.pages), max_pages)
            logger.info(f"Processing {num_pages_to_process} of {len(pdf.pages)} pages from '{file_path}'.")
            for i, page in enumerate(pdf.pages):
                if i >= num_pages_to_process:
                    break
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n\n"
        return text.strip()
    except Exception as e:
        logger.error(f"Failed to extract text from PDF '{file_path}': {e}", exc_info=True)
        return ""