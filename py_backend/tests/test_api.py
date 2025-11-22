import pytest
from httpx import AsyncClient
from app.main import app

@pytest.mark.asyncio
async def test_health():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        r = await ac.get("/health")
        assert r.status_code == 200
        assert r.json()["status"] == "ok"

@pytest.mark.asyncio
async def test_solve_force_text():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        data = {"board": "CIE", "force_text": "Which graph shows the displacement-time relationship for constant non-zero velocity? A. A straight line with positive gradient B. A horizontal line C. A curve with increasing gradient D. A sine wave"}
        r = await ac.post("/api/solve", data=data)
        assert r.status_code == 200
        body = r.json()
        assert body["answer"] == "A"

