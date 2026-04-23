import pypdf
import os

pdf_path = "Inventory Management Case Study - .NET.pdf"
output_path = "case_study_text.txt"

def extract_text(pdf_file, out_file):
    reader = pypdf.PdfReader(pdf_file)
    with open(out_file, "w", encoding="utf-8") as f:
        for i, page in enumerate(reader.pages):
            f.write(f"--- Page {i+1} ---\n")
            f.write(page.extract_text())
            f.write("\n\n")

if __name__ == "__main__":
    if os.path.exists(pdf_path):
        extract_text(pdf_path, output_path)
        print(f"Extraction complete. Saved to {output_path}")
    else:
        print(f"File not found: {pdf_path}")
