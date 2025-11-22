import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from fastapi import APIRouter

@pytest.mark.asyncio
async def test_health():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        r = await ac.get("/api/health")
        assert r.status_code == 200
        assert r.json()["status"] == "ok"

@pytest.mark.asyncio
async def test_solve_force_text():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        data = {"board": "CIE", "force_text": "Which graph shows the displacement-time relationship for constant non-zero velocity? A. A straight line with positive gradient B. A horizontal line C. A curve with increasing gradient D. A sine wave"}
        r = await ac.post("/api/solve", data=data)
        assert r.status_code == 200
        body = r.json()
        assert body["answer"] == "A"

@pytest.mark.asyncio
async def test_solve_requires_text_or_image():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        r = await ac.post("/api/solve", data={"board": "CIE"})
        assert r.status_code == 400

@pytest.mark.asyncio
async def test_board_normalization_edexcel():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        data = {"board": "EDEXCEL", "force_text": "Which graph shows the displacement-time relationship for constant non-zero velocity?"}
        r = await ac.post("/api/solve", data=data)
        assert r.status_code == 200
        body = r.json()
        assert body["board"] == "EDX"

@pytest.mark.asyncio
async def test_history_records_after_solve():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        text = "Solve for x: 2x + 5 = 17"
        r = await ac.post("/api/solve", data={"board": "EDX", "force_text": text})
        assert r.status_code == 200
        h = await ac.get("/api/history")
        assert h.status_code == 200
        items = h.json()["items"]
        assert any(text in (it.get("question_text") or "") for it in items)

@pytest.mark.asyncio
async def test_favorite_add_and_list():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        payload = {"question_text": "Which statement about exothermic reactions is correct?", "board": "CIE", "answer": "B"}
        r = await ac.post("/api/favorite", json=payload)
        assert r.status_code == 200
        g = await ac.get("/api/favorites")
        assert g.status_code == 200
        items = g.json()["items"]
        assert any("exothermic" in (it.get("question_text") or "") for it in items)

@pytest.mark.asyncio
async def test_analysis_branches_math_chem_fallback():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        r1 = await ac.post("/api/solve", data={"board": "CIE", "force_text": "Solve for x: 2x + 5 = 17"})
        assert r1.status_code == 200
        b1 = r1.json()
        assert b1["answer"] == "A"
        r2 = await ac.post("/api/solve", data={"board": "EDX", "force_text": "Which statement about exothermic reactions is correct?"})
        assert r2.status_code == 200
        b2 = r2.json()
        assert b2["answer"] in {"B", "A"}
        r3 = await ac.post("/api/solve", data={"board": "EDX", "force_text": "velocity graph"})
        assert r3.status_code == 200
        b3 = r3.json()
        assert b3["answer"] == "A"
        r4 = await ac.post("/api/solve", data={"board": "CIE", "force_text": "random text without keywords"})
        assert r4.status_code == 200
        b4 = r4.json()
        assert "思路：" in b4["explanation"]

@pytest.mark.asyncio
async def test_index_route_and_middleware_error():
    # index route
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        idx = await ac.get("/")
        assert idx.status_code == 200
    # inject an error route to exercise middleware exception branch
    def boom():
        raise Exception("boom")
    app.add_api_route("/api/boom", boom, methods=["GET"])
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        err = await ac.get("/api/boom")
        assert err.status_code == 500
