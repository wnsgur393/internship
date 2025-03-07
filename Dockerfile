# 베이스 이미지로 Python 3.9-slim 사용
FROM python:3.9-slim

# 작업 디렉토리 설정
WORKDIR /app

# 의존성 파일 복사 및 설치
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 애플리케이션 코드 복사
COPY . .

# Flask 기본 포트 5000 개방
EXPOSE 5000

# 애플리케이션 실행
CMD ["python", "app.py"]
