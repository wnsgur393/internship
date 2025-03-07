import os
from flask import Flask, jsonify, render_template, request
import pymysql
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)

def get_db_connection():
    return pymysql.connect(
        host=os.getenv("MYSQL_HOST"),
        user=os.getenv("MYSQL_USER"),
        password=os.getenv("MYSQL_PASSWORD"),
        database=os.getenv("MYSQL_DATABASE"),
        charset="utf8mb4"
    )

# 메인 페이지 렌더링
@app.route("/")
def home():
    return render_template("index.html")

@app.route("/api/search")
def search_data():
    connection = get_db_connection()
    cursor = connection.cursor()
    try:
        query = request.args.get("query", "").strip()  # 검색어 가져오기
        if not query:
            return jsonify({"data": []})  # 검색어 없으면 빈 배열 반환

        sql_query = f"""SELECT * FROM intern_task WHERE `핀 제목` LIKE %s OR `데이터셋 소개` LIKE %s ORDER BY id DESC LIMIT 100"""
        cursor.execute(sql_query, (f"%{query}%", f"%{query}%"))  # 검색어 포함된 데이터 찾기
        rows = cursor.fetchall()

        columns = [desc[0] for desc in cursor.description]
        data = [dict(zip(columns, row)) for row in rows]

        return jsonify({"data": data})
    except Exception as e:
        return jsonify({"error": str(e)})
    finally:
        cursor.close()
        connection.close()

# MySQL 데이터 조회 API
@app.route("/api/data")
def get_data():
    connection = get_db_connection()
    cursor = connection.cursor()
    try:
        query = "SELECT * FROM intern_task"
        cursor.execute(query)
        rows = cursor.fetchall()

        columns = [desc[0] for desc in cursor.description]
        data = [dict(zip(columns, row)) for row in rows]

        return jsonify({"data": data})
    except Exception as e:
        return jsonify({"error": str(e)})
    finally:
        cursor.close()
        connection.close()


# 사용자가 데이터셋을 클릭할 때 `click_count` 증가
@app.route("/api/increment_click", methods=["POST"])
def increment_click():
    dataset_id = request.json.get("id")  # 클릭한 데이터셋 ID 받기
    if not dataset_id:
        return jsonify({"error": "Invalid dataset ID"}), 400

    connection = get_db_connection()
    cursor = connection.cursor()
    try:
        # click_count 증가
        query = "UPDATE intern_task SET click_count = click_count + 1 WHERE id = %s"
        cursor.execute(query, (dataset_id,))
        connection.commit()

        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"error": str(e)})
    finally:
        cursor.close()
        connection.close()

# 필터 조건에 맞는 데이터 불러오기
@app.route("/api/filtered_data")
def get_filtered_data():
    connection = get_db_connection()
    cursor = connection.cursor()
    try:
        language_filter = request.args.get("language", "all")
        type_filter = request.args.get("type", "all")
        time_filter = request.args.get("time", "all")
        sort_filter = request.args.get("sort", "id")

        query = "SELECT * FROM intern_task WHERE 1=1"
        conditions = []
        params = []

        # 언어 필터 적용: 입력받은 문자열을 쉼표로 분리해서 각각에 대해 LIKE 조건 추가
        if language_filter != "all":
            # 쉼표로 분리한 후 공백 제거
            languages = [x.strip() for x in language_filter.split(",") if x.strip()]
            for lang in languages:
                conditions.append("`언어` LIKE %s")
                params.append(f"%{lang}%")

        # 데이터 유형 필터 적용
        if type_filter != "all":
            conditions.append("`데이터 유형` LIKE %s")
            params.append(f"%{type_filter}%")

        # 기간 필터 적용
        if time_filter == "3months":
            conditions.append("insert_time >= NOW() - INTERVAL 3 MONTH")
        elif time_filter == "6months":
            conditions.append("insert_time >= NOW() - INTERVAL 6 MONTH")
        elif time_filter == "1year":
            conditions.append("insert_time >= NOW() - INTERVAL 1 YEAR")
        elif time_filter == "2years":
            conditions.append("insert_time >= NOW() - INTERVAL 2 YEAR")

        if conditions:
            query += " AND " + " AND ".join(conditions)

        # 정렬 옵션 적용
        if sort_filter == "popular":
            query += " ORDER BY click_count DESC, id ASC"
        else:
            query += " ORDER BY id ASC"

        cursor.execute(query, params)
        rows = cursor.fetchall()

        columns = [desc[0] for desc in cursor.description]
        data = [dict(zip(columns, row)) for row in rows]

        return jsonify({"data": data})
    except Exception as e:
        return jsonify({"error": str(e)})
    finally:
        cursor.close()
        connection.close()


if __name__ == "__main__":
    app.run(host='0.0.0.0', debug=True)
