FROM python:3.13-slim
WORKDIR /app
RUN pip install poetry
COPY pyproject.toml /app/
RUN poetry install --no-root
COPY app /app/app
EXPOSE 8000
CMD ["poetry", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

