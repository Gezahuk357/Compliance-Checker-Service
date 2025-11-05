from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any
import json

app = FastAPI(title="Compliance Checklist Service", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:2000", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Data models
class ChecklistItem(BaseModel):
    id: str
    category: str
    requirement: str
    hints: List[str]
    status: str = "pending"
    evidence: List[str] = []

class Checklist(BaseModel):
    id: str
    name: str
    items: List[ChecklistItem]

class StatusUpdate(BaseModel):
    status: str
    evidence: List[str] = []

# In-memory storage
checklists = {
    "iso-27001-simplified": {
        "id": "iso-27001-simplified",
        "name": "ISO 27001 Essential Controls",
        "items": [
            {
                "id": "AC-1",
                "category": "Access Control",
                "requirement": "Password policy documented and enforced",
                "hints": ["password policy", "security guidelines"],
                "status": "pending",
                "evidence": []
            },
            {
                "id": "AC-2",
                "category": "Access Control",
                "requirement": "User access reviews quarterly",
                "hints": ["access review", "user permissions"],
                "status": "pending",
                "evidence": []
            },
            {
                "id": "AC-3",
                "category": "Access Control",
                "requirement": "Admin access logged",
                "hints": ["admin logging", "privilege access"],
                "status": "pending",
                "evidence": []
            },
            {
                "id": "IM-1",
                "category": "Incident Management",
                "requirement": "Incident response plan documented",
                "hints": ["incident response", "emergency plan"],
                "status": "pending",
                "evidence": []
            },
            {
                "id": "IM-2",
                "category": "Incident Management",
                "requirement": "Incident log maintained",
                "hints": ["incident log", "tracking"],
                "status": "pending",
                "evidence": []
            },
            {
                "id": "DP-1",
                "category": "Data Protection",
                "requirement": "Backup policy defined",
                "hints": ["backup policy", "data recovery"],
                "status": "pending",
                "evidence": []
            },
            {
                "id": "DP-2",
                "category": "Data Protection",
                "requirement": "Encryption standards documented",
                "hints": ["encryption", "security standards"],
                "status": "pending",
                "evidence": []
            },
            {
                "id": "DP-3",
                "category": "Data Protection",
                "requirement": "Data retention policy exists",
                "hints": ["data retention", "policy"],
                "status": "pending",
                "evidence": []
            }
        ]
    }
}

@app.get("/checklists")
async def get_checklists():
    """Get all available checklists"""
    return list(checklists.values())

@app.get("/checklists/{checklist_id}")
async def get_checklist(checklist_id: str):
    """Get checklist details by ID"""
    if checklist_id not in checklists:
        raise HTTPException(status_code=404, detail="Checklist not found")
    return checklists[checklist_id]

@app.post("/checklists/{checklist_id}/items/{item_id}/status")
async def update_item_status(checklist_id: str, item_id: str, status_update: StatusUpdate):
    """Update status of a checklist item"""
    if checklist_id not in checklists:
        raise HTTPException(status_code=404, detail="Checklist not found")
    
    checklist = checklists[checklist_id]
    item_found = False
    
    for item in checklist["items"]:
        if item["id"] == item_id:
            item["status"] = status_update.status
            item["evidence"] = status_update.evidence
            item_found = True
            break
    
    if not item_found:
        raise HTTPException(status_code=404, detail="Item not found")
    
    return {"message": "Status updated successfully"}

@app.get("/checklists/{checklist_id}/progress")
async def get_progress(checklist_id: str):
    """Get compliance progress percentage"""
    if checklist_id not in checklists:
        raise HTTPException(status_code=404, detail="Checklist not found")
    
    checklist = checklists[checklist_id]
    total_items = len(checklist["items"])
    completed_items = sum(1 for item in checklist["items"] if item["status"] == "completed")
    
    progress_percentage = (completed_items / total_items) * 100 if total_items > 0 else 0
    
    return {
        "checklist_id": checklist_id,
        "total_items": total_items,
        "completed_items": completed_items,
        "progress_percentage": round(progress_percentage, 2)
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)