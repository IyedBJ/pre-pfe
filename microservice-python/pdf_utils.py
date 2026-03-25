import pdfplumber
from PIL import Image
import pytesseract

def is_pdf_scanned(pdf_path):
    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            if page.extract_text():   
                return False         
    return True                

def extract_text_pdf(pdf_path):
    text = ""
    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            content = page.extract_text()
            if content:
                text += content + "\n"
    return text

def extract_text_ocr(pdf_path):
    from pdf2image import convert_from_path
    text = ""
    pages = convert_from_path(pdf_path)
    for page in pages:
        text += pytesseract.image_to_string(page) + "\n"
    return text
