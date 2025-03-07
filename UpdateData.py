import csv
import mysql.connector
from mysql.connector import Error
from dotenv import load_dotenv
import os

load_dotenv()

def get_db_connection():
    return mysql.connector.connect(
        host=os.getenv("MYSQL_HOST"),
        user=os.getenv("MYSQL_USER"),
        password=os.getenv("MYSQL_PASSWORD"),
        database=os.getenv("MYSQL_DATABASE")
    )

def update_or_insert_data_from_csv(file_path):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        with open(file_path, mode='r', encoding='utf-8-sig') as csvfile:
            reader = csv.DictReader(csvfile)
            for row in reader:
                if not row['핀 제목'].strip():
                    continue
                id_value = row.get('id')
                공개_연도 = int(row['공개 연도']) if row.get('공개 연도') and row['공개 연도'].strip() else None
                data_tuple = (
                    row['핀 제목'],
                    row['핀 소개'],
                    row['데이터셋 원제'],
                    row['데이터셋 소개'],
                    row['분량'],
                    row['데이터 유형'],
                    row['언어'],
                    공개_연도,
                    row['이용료'],
                    row['제작'],
                    row['출처'],
                    row['출처 URL']
                )
                if id_value and id_value.strip():
                    cursor.execute("SELECT id FROM intern_task WHERE id = %s", (id_value,))
                    result = cursor.fetchone()
                    if result:
                        update_query = """
                            UPDATE intern_task SET
                                `핀 제목` = %s,
                                `핀 소개` = %s,
                                `데이터셋 원제` = %s,
                                `데이터셋 소개` = %s,
                                `분량` = %s,
                                `데이터 유형` = %s,
                                `언어` = %s,
                                `공개 연도` = %s,
                                `이용료` = %s,
                                `제작` = %s,
                                `출처` = %s,
                                `출처 URL` = %s
                            WHERE id = %s
                        """
                        cursor.execute(update_query, data_tuple + (id_value,))
                    else:
                        print(f"오류: 제공된 id {id_value} 값이 데이터베이스에 존재하지 않습니다. 해당 행은 건너뜁니다.")
                        continue
                else:
                    insert_query = """
                        INSERT INTO intern_task (
                            `핀 제목`, `핀 소개`, `데이터셋 원제`, `데이터셋 소개`, `분량`,
                            `데이터 유형`, `언어`, `공개 연도`, `이용료`, `제작`, `출처`, `출처 URL`
                        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    """
                    cursor.execute(insert_query, data_tuple)
        conn.commit()
        print(f"CSV 파일({file_path})의 데이터를 성공적으로 업데이트/삽입했습니다.")
    except Error as e:
        print("MySQL 연결/쿼리 실행 중 오류 발생:", e)
    finally:
        if conn.is_connected():
            cursor.close()
            conn.close()

if __name__ == "__main__":
    csv_file_path = "csv/데이터수정.csv"
    update_or_insert_data_from_csv(csv_file_path)
