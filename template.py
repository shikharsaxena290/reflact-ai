from pathlib import Path

folders = [
    "src",
    "documents",
    "templates",
    "static",
    "upload",
    "data"
]


files = [
    # Root files
    "app.py",
    "data_ingestion.py",
    "requirements.txt",
    "Dockerfile",
    ".env",

    # Source files
    "src/__init__.py",
    "src/config.py",
    "src/db.py",
    "src/ingestion.py",
    "src/models.py",
    "src/self_rag.py",
    "src/vectorstore.py",

    # Frontend
    "templates/index.html",
    "static/styles.css",
    "static/app.js",
]

def create_project_structure():
    for folder in folders:
        Path(folder).mkdir(parents=True, exist_ok=True)

    for file in files:
        Path(file).touch(exist_ok=True)

    print("Project structure created successfully")
if __name__=="__main__":
    create_project_structure()