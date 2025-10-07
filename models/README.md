# Models Directory Overview

This document provides detailed information about the structure, purpose, and usage of the `models/` directory in the iLUMA software project.

---

## Purpose

The `models/` directory contains machine learning model artifacts used by iLUMA’s backend for AI-related features such as:
- Visual detection (YOLOv8-based)
- Low-Rank Adaptation (LoRA) fine-tuning
- Retrieval-Augmented Generation (RAG) reasoning

These models are large and **not included** in the main Git repository.  
Please contact the **ZJU-China iGEM 2025 Software Team** to request access to the model files.

---

## Directory Structure
```
models/
├── LUplaSEE/
│   └── best.pt
└── Lumaris_4-Octo/
    ├── googlecolab_deploy.ipynb   # Notebook with a sample of testing dataset
    ├── lora/
    │   ├── adapter_config.json
    │   ├── adapter_model.safetensors
    │   └── other_lora_files...
    └── rag/
        ├── index.faiss
        └── index.pkl
```


### 1. LUplaSEE/
- **Purpose:** Contains trained weights for a YOLOv8-based detection model.
- **File:**
  - `best.pt`: The trained PyTorch model checkpoint.  
    Used for biological image or object detection tasks in iLUMA.

### 2. Lumaris_4-Octo/
This folder contains two submodules for text-based AI components.

#### a. lora/
- **Purpose:** Contains results of LoRA fine-tuning applied to a large language model (e.g., Llama 3.1 8B).
- **Typical files:**
  - `adapter_config.json`
  - `adapter_model.safetensors`
  - `tokenizer_config.json`
  - `tokenizer.json`
- **Usage:** These files enable the backend to load custom fine-tuned weights for domain-specific reasoning and dialogue.

#### b. rag/
- **Purpose:** Stores retrieval-augmented generation (RAG) assets.
- **Files:**
  - `index.faiss`: Vector index built using FAISS for semantic retrieval.
  - `index.pkl`: Metadata or document mapping for the FAISS index.
- **Usage:** Used by the backend’s RAG engine to retrieve relevant context before AI generation.

---

## Model Integration

By default, the backend expects model paths to be defined via environment variables or configuration files.  
If you place models in this directory, no further modification is needed unless custom paths are set in the backend.

### Example environment configuration:

```bash
export MODEL_ROOT=$(pwd)/models
export YOLO_MODEL_PATH="$MODEL_ROOT/LUplaSEE/best.pt"
export LORA_DIR="$MODEL_ROOT/Lumaris_4-Octo/lora"
export RAG_INDEX_PATH="$MODEL_ROOT/Lumaris_4-Octo/rag/index.faiss"
```
Make sure the backend (app.py or UserAgentBackend.py) is configured to read from these environment variables.

## Notes on Version Control
Model files are typically not tracked by Git due to their large size.

Recommended .gitignore snippet:

```bash
models/*
!models/.gitkeep
```
To keep the directory but ignore model binaries, include a .gitkeep file inside models/.

## Deployment Considerations
During continuous integration or deployment:

The models/ directory is excluded from CI/CD pipelines (e.g., via .gitlab-ci.yml).

Models should be provided manually on the deployment server or mounted from external storage.

Example in .gitlab-ci.yml:

```bash
rsync -av --exclude='models/' ./build_output/ user@server:/var/www/iLUMA/
```

## Obtaining Models
You will have the access to:

- YOLOv8 trained model weights (LUplaSEE/best.pt)

- LoRA adapter files

- RAG retrieval index files

You may reach the team through the official iGEM collaboration platform or email for further using guide.

## Summary
### Component Path Purpose

| Component      | Path                          | Purpose              |
| -------------- | ----------------------------- | -------------------- |
| YOLOv8 Weights | `models/LUplaSEE/best.pt`     | Visual detection     |
| LoRA Adapters  | `models/Lumaris_4-Octo/lora/` | Fine-tuned reasoning |
| RAG Index      | `models/Lumaris_4-Octo/rag/`  | Knowledge retrieval  |


### License and Usage Policy
All model files are shared for academic and non-commercial use under the same Creative Commons Attribution 4.0 International License as the main iLUMA project, unless specified otherwise.
Always check individual model subdirectories for any additional license files or usage restrictions.

