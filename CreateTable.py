import os
import mysql.connector
from dotenv import load_dotenv

load_dotenv()

def get_db_connection():
    return mysql.connector.connect(
        host=os.getenv("MYSQL_HOST"),
        user=os.getenv("MYSQL_USER"),
        password=os.getenv("MYSQL_PASSWORD"),
        database=os.getenv("MYSQL_DATABASE")
    )

conn = get_db_connection()
cursor = conn.cursor()

create_table = """
    CREATE TABLE `intern_task` (
      id INT AUTO_INCREMENT PRIMARY KEY,
      `핀 제목` VARCHAR(255) NOT NULL,
      `핀 소개` TEXT NOT NULL,
      `데이터셋 원제` VARCHAR(255) NOT NULL,
      `데이터셋 소개` TEXT,
      `분량` TEXT,
      `데이터 유형` VARCHAR(30) NOT NULL,
      `언어` VARCHAR(100),
      `공개 연도` INT,
      `이용료` VARCHAR(10),
      `제작` TEXT,
      `출처` VARCHAR(100),
      `출처 URL` TEXT NOT NULL,
      click_count INT DEFAULT 0,
      insert_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
"""

cursor.execute(create_table)
conn.commit()
cursor.close()
conn.close()
