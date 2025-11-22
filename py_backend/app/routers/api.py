from typing import Optional, Dict, Any, List
import structlog
from fastapi import APIRouter, UploadFile, Form, Body
from fastapi import HTTPException
from starlette.responses import JSONResponse
from pydantic import BaseModel
from ..services.analysis_service import AnalysisService
from ..data.repository import QuestionRepository

log = structlog.get_logger()
router = APIRouter()
repo = QuestionRepository()
analysis = AnalysisService(repo=repo)

HISTORY: List[Dict[str, Any]] = []
FAVORITES: List[Dict[str, Any]] = []

def normalize_board(board: Optional[str]) -> Optional[str]:
    if not board:
        return None
    b = board.upper()
    if b == "EDEXCEL":
        return "EDX"
    if b in {"CIE", "EDX"}:
        return b
    return None

@router.post("/solve")
async def solve(
    board: Optional[str] = Form(None),
    force_text: Optional[str] = Form(None),
    image: Optional[UploadFile] = None
):
    b = normalize_board(board)
    log.info("solve_start", board=b or "AUTO", force_len=len(force_text or ""), has_image=bool(image))
    raw_text = (force_text or "").strip()
    if not raw_text:
        raise HTTPException(status_code=400, detail="缺少试卷图片或文本")
    t0 = 0
    topic = analysis.detect_topic(raw_text)
    match = analysis.search(raw_text, b)
    explanation, suggested, points = analysis.generate(raw_text, match.subject if match else topic, match.answer if match else None)
    resp: Dict[str, Any] = {
        "board": match.board if match else (b or "UNKNOWN"),
        "question": raw_text,
        "choices": match.choices if match else None,
        "matched": {"id": match.id, "paper": match.paper, "number": match.number, "subject": match.subject} if match else None,
        "answer": match.answer if match else suggested,
        "explanation": explanation,
        "knowledge_points": points,
        "duration_ms": t0
    }
    log.info("solve_done", board=resp["board"], answer=resp["answer"]) 
    HISTORY.insert(0, {"id": len(HISTORY) + 1, "created_at": __import__("time").time() * 1000, "board": resp["board"], "question_text": resp["question"], "answer": resp["answer"], "duration_ms": resp["duration_ms"]})
    return JSONResponse(resp)

@router.get("/history")
async def history():
    return JSONResponse({"items": HISTORY[:100]})

class FavoriteReq(BaseModel):
    question_id: Optional[int] = None
    board: Optional[str] = None
    question_text: str
    answer: Optional[str] = None

@router.post("/favorite")
async def favorite(req: FavoriteReq = Body(...)):
    if not req.question_text:
        raise HTTPException(status_code=400, detail="缺少题目内容")
    FAVORITES.insert(0, {"id": len(FAVORITES) + 1, "created_at": __import__("time").time() * 1000, "question_id": req.question_id, "board": req.board or "UNKNOWN", "question_text": req.question_text, "answer": req.answer})
    return JSONResponse({"ok": True})

@router.get("/favorites")
async def favorites():
    return JSONResponse({"items": FAVORITES[:100]})
