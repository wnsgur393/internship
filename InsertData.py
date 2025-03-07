import csv
import mysql.connector
from mysql.connector import Error
from dotenv import load_dotenv
import os

# .env 파일 로드
load_dotenv()

def get_db_connection():
    return mysql.connector.connect(
        host=os.getenv("MYSQL_HOST"),
        user=os.getenv("MYSQL_USER"),
        password=os.getenv("MYSQL_PASSWORD"),
        database=os.getenv("MYSQL_DATABASE")
    )

def insert_data_from_csv(file_path):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        with open(file_path, mode='r', encoding='utf-8-sig') as csvfile:
            reader = csv.DictReader(csvfile)
            rows = []
            for row in reader:
                # '공개 연도' 값 처리
                year_str = row.get('공개 연도', '').strip()
                try:
                    공개_연도 = int(year_str) if year_str not in ('', '-') else None
                except ValueError:
                    공개_연도 = None
                rows.append((
                    row.get('핀 제목'),
                    row.get('핀 소개'),
                    row.get('데이터셋 원제'),
                    row.get('데이터셋 소개'),
                    row.get('분량'),
                    row.get('데이터 유형'),
                    row.get('언어'),
                    공개_연도,
                    row.get('이용료'),
                    row.get('제작'),
                    row.get('출처'),
                    row.get('출처 URL')
                ))
        insert_query = """
            INSERT INTO intern_task (
                `핀 제목`,
                `핀 소개`,
                `데이터셋 원제`,
                `데이터셋 소개`,
                `분량`,
                `데이터 유형`,
                `언어`,
                `공개 연도`,
                `이용료`,
                `제작`,
                `출처`,
                `출처 URL`
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        cursor.executemany(insert_query, rows)
        conn.commit()
        print(f"CSV 파일({file_path})의 데이터를 성공적으로 삽입했습니다.")
    except Error as e:
        print("MySQL 연결/쿼리 실행 중 오류 발생:", e)
    finally:
        if conn.is_connected():
            cursor.close()
            conn.close()

if __name__ == "__main__":
    csv_file_path = "csv/MC_Data_Pin.csv"
    insert_data_from_csv(csv_file_path)
