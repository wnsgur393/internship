const apiUrl = "/api/data"; // Flask API URL

let allData = []; // 전체 데이터 저장
let filteredData = []; // 검색 및 필터링된 데이터 저장
let currentPage = 1; // 현재 페이지
const rowsPerPage = 20; // 페이지당 카드 수

//API에서 데이터 가져오기
async function fetchAllData() {
  showLoading();
  try {
    const response = await fetch(apiUrl);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const result = await response.json();
    allData = result.data; // 전체 데이터 저장
    filteredData = allData; // 초기값은 전체 데이터

    displayCards(filteredData.slice(0, rowsPerPage));
    updatePagination();
  } catch (error) {
    console.error("Error fetching data:", error);
    alert("Failed to load data. Check the console for details.");
  } finally {
    hideLoading();
  }
}

// 데이터셋 클릭 시 모달 열기
function openModal(rowData) {
    if (typeof rowData === "string") {
        rowData = JSON.parse(rowData);
    }

    const modal = document.getElementById("vcdh-modal");
    const modalOverlay = document.getElementById("vcdh-modal-overlay");
    const modalTitle = document.getElementById("vcdh-modal-title");
    const modalContent = document.getElementById("vcdh-modal-content");

    modalTitle.textContent = rowData["핀 제목"];

    // 출처 버튼 (클릭 시 openSourceLink 호출)
    const sourceLinkButton = rowData["출처 URL"]
        ? `<div style="text-align: right; margin-top: 20px;">
             <button class="vcdh-url-button" onclick="openSourceLink('${rowData["id"]}', '${rowData["출처 URL"]}')">
               출처 페이지로 이동
             </button>
           </div>`
        : "";

    const desiredOrder = [
        "데이터셋 원제",
        "데이터셋 소개",
        "분량",
        "데이터 유형",
        "언어",
        "공개 연도",
        "이용료",
        "제작",
        "출처"
    ];

    const orderedEntries = desiredOrder
        .filter((key) => key in rowData)
        .map((key) => [key, rowData[key]]);

    modalContent.innerHTML = `
        <div class="vcdh-modal-table">
            ${orderedEntries
                .map(([key, value]) => `
                    <div class="vcdh-modal-row">
                        <div class="vcdh-modal-cell header">${key}</div>
                        <div class="vcdh-modal-cell">${value || "-"}</div>
                    </div>
                `)
                .join("")}
        </div>
        ${sourceLinkButton}`;

    modal.style.display = "block";
    modalOverlay.style.display = "block";
}

// 카드 표시
function displayCards(data) {
  const cardContainer = document.getElementById("vcdh-card-container");
  cardContainer.innerHTML = "";

  data.forEach(row => {
    const card = document.createElement("div");
    card.className = "vcdh-card";
    card.innerHTML = `
      <h3>${row["핀 제목"]}</h3>
      <div class="vcdh-tag-container">
        ${createTags(row["데이터 유형"], { 텍스트: "darkgreen", 오디오: "purple", 비디오: "blue", default: "#EC8305" })} 
        ${createTags(row["언어"], { 한국어: "#024CAA", 영어: "green", 일본어: "red", 중국어: "orange", default: "gray" })}
        ${createTags(row["공개 연도"], { default: "#888" })} 
        ${createTags(row["이용료"], { 무료: "#091057", 유료: "darkred", default: "gray" })}
      </div>
      <p>${row["핀 소개"] || ""}</p>
    `;
    card.addEventListener("click", () => openModal(row));
    cardContainer.appendChild(card);
  });
}

// 태그 생성
function createTags(tag, colorMapping) {
  if (!tag) return "";
  const trimmedTag = tag.toString().trim();
  const color = colorMapping[trimmedTag] || colorMapping["default"];
  return `<span class="vcdh-tag" style="background-color: ${color};">${trimmedTag}</span>`;
}

// 클릭 카운트 증가 함수 (출처 버튼을 눌렀을 때만 호출됨)
async function incrementClickCount(datasetId) {
    try {
        await fetch("/api/increment_click", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: datasetId }),
        });
    } catch (error) {
        console.error("Error updating click count:", error);
    }
}

// 출처 페이지 이동 + click_count 증가
function openSourceLink(datasetId, sourceUrl) {
    if (!sourceUrl) return; // 출처 URL이 없는 경우 실행하지 않음

    // 클릭 카운트 증가 요청
    incrementClickCount(datasetId);

    // 출처 페이지로 이동
    window.open(sourceUrl, "_blank");
}



// 필터(검색어가 있을 때)와 정렬을 클라이언트에서 적용하는 함수
function applyLocalFilters() {
  // 필터 변경 시 페이지 번호를 1번으로 초기화
  currentPage = 1;

  // 언어 입력창의 값을 쉼표로 분리한 후, 각 항목을 트림하고 정렬하여 순서를 무시하도록 함
  const languageInput = document.getElementById("vcdh-language-input").value.trim();
  let inputLanguages = [];
  if (languageInput) {
    inputLanguages = languageInput
      .split(",")
      .map(lang => lang.trim())
      .filter(lang => lang !== "");
    inputLanguages.sort(); // 정렬하여 순서 무시
  }

  const typeFilter = document.getElementById("vcdh-type-filter").value;
  const timeFilter = document.getElementById("vcdh-time-filter").value;
  const sortFilter = document.getElementById("vcdh-sort-filter").value;

  let dataToFilter = [...allData];

  // 언어 필터: 데이터셋의 "언어" 필드도 쉼표로 분리, 트림, 정렬하여 비교
  if (inputLanguages.length > 0) {
    dataToFilter = dataToFilter.filter(item => {
      if (!item["언어"]) return false;
      const datasetLangs = item["언어"]
        .split(",")
        .map(lang => lang.trim())
        .filter(lang => lang !== "");
      datasetLangs.sort();
      // 입력한 모든 언어가 데이터셋의 언어 배열에 포함되어야 함
      return inputLanguages.every(lang => datasetLangs.includes(lang));
    });
  }

  // 데이터 유형 필터 적용
  if (typeFilter !== "all") {
    dataToFilter = dataToFilter.filter(item =>
      item["데이터 유형"] && item["데이터 유형"].includes(typeFilter)
    );
  }

  // 기간 필터 적용
  if (timeFilter === "3months") {
    dataToFilter = dataToFilter.filter(item =>
      new Date(item["insert_time"]) >= new Date(Date.now() - 3 * 30 * 24 * 60 * 60 * 1000)
    );
  } else if (timeFilter === "6months") {
    dataToFilter = dataToFilter.filter(item =>
      new Date(item["insert_time"]) >= new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000)
    );
  } else if (timeFilter === "1year") {
    dataToFilter = dataToFilter.filter(item =>
      new Date(item["insert_time"]) >= new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
    );
  } else if (timeFilter === "2years") {
    dataToFilter = dataToFilter.filter(item =>
      new Date(item["insert_time"]) >= new Date(Date.now() - 2 * 365 * 24 * 60 * 60 * 1000)
    );
  }

  // 정렬: 최신순, 조회순은 클라이언트에서 수행
  if (sortFilter === "latest") {
    dataToFilter.sort((a, b) => {
      const timeA = new Date(a.insert_time);
      const timeB = new Date(b.insert_time);
      return timeB - timeA || a.id - b.id;
    });
  } else if (sortFilter === "popular") {
    dataToFilter.sort((a, b) => {
      return b.click_count - a.click_count || a.id - b.id;
    });
  }

  filteredData = dataToFilter;
  displayCards(filteredData.slice(0, rowsPerPage));
  updatePagination();
}

function applyFilter() {
  const searchInput = document.getElementById("vcdh-search-input").value.trim();
  const sortFilter = document.getElementById("vcdh-sort-filter").value; // 이미 선언되어 있다고 가정

  if (searchInput) {
    // 검색어가 있을 경우(검색창), 이미 불러온 데이터(allData)에 대해 클라이언트 필터 적용
    applyLocalFilters();
  } else {
    // 검색어가 없으면(언어 검색, 유형 필터 등), 서버 API를 통해 필터 조건에 맞는 데이터를 불러옴
    let apiUrl = "/api/filtered_data?";

    // 언어 필터 추가
    const languageInput = document.getElementById("vcdh-language-input").value.trim();
    if (languageInput) {
      apiUrl += `language=${encodeURIComponent(languageInput)}&`;
    }

    // 데이터 유형 필터 추가
    const typeFilter = document.getElementById("vcdh-type-filter").value;
    if (typeFilter && typeFilter !== "all") {
      apiUrl += `type=${encodeURIComponent(typeFilter)}&`;
    }

    // 기간 필터 추가
    const timeFilter = document.getElementById("vcdh-time-filter").value;
    if (timeFilter && timeFilter !== "all") {
      apiUrl += `time=${encodeURIComponent(timeFilter)}&`;
    }

    // 정렬 옵션 추가 (정렬 값이 "all"이나 기본 정렬("id")가 아닌 경우)
    if (sortFilter && sortFilter !== "all" && sortFilter !== "id") {
      apiUrl += `sort=${encodeURIComponent(sortFilter)}&`;
    }

    showLoading();
    fetch(apiUrl)
      .then(response => response.json())
      .then(result => {
        allData = result.data;
        filteredData = allData;

        // ★ 필수: 데이터를 새로 불러왔으므로 페이지를 1번으로 초기화
        currentPage = 1;

        // 정렬이 latest/popular이면 클라이언트에서 정렬 적용
        if (sortFilter === "latest" || sortFilter === "popular") {
          applyLocalFilters();
        } else {
          // 기본 정렬이면 바로 첫 페이지를 그립니다.
          displayCards(filteredData.slice(0, rowsPerPage));
          updatePagination();
        }
      })
      .catch(error => {
        console.error("Error fetching filtered data:", error);
        alert("데이터 필터링 중 오류가 발생했습니다.");
      })
      .finally(() => hideLoading());
  }
}

document.getElementById("vcdh-language-input").addEventListener("keypress", function (event) {
  if (event.key === "Enter") {
    event.preventDefault();
    applyFilter();
  }
});

// 필터링 기능 (언어, 연도, 기간, 조회순)
function applySorting() {
    const sortFilter = document.getElementById("vcdh-sort-filter").value;

    if (sortFilter === "latest") {
        // 최신순 (insert_time 기준 내림차순 정렬, 같은 경우 ID 오름차순 정렬)
        filteredData.sort((a, b) => {
            const timeA = new Date(a.insert_time);
            const timeB = new Date(b.insert_time);
            if (timeA === timeB) {
                return a.id - b.id;  // 동일한 날짜일 경우 ID 기준으로 오름차순 정렬
            }
            return timeB - timeA;  // 최신 날짜가 먼저 오도록 내림차순 정렬
        });
    } else if (sortFilter === "popular") {
        // 조회순 (click_count 기준 내림차순 정렬, 같은 경우 ID 오름차순 정렬)
        filteredData.sort((a, b) => {
            if (a.click_count === b.click_count) {
                return a.id - b.id;  // 동일한 조회수일 경우 ID 기준으로 오름차순 정렬
            }
            return b.click_count - a.click_count;  // 높은 조회수가 먼저 오도록 내림차순 정렬
        });
    }

    displayCards(filteredData.slice(0, rowsPerPage)); // 정렬된 데이터 표시
}

document.getElementById("vcdh-sort-filter").addEventListener("change", applySorting);

// 필터 초기화 버튼 (모든 데이터를 보여주도록 수정)
function clearFilters() {
  document.getElementById("vcdh-language-input").value = "all";
  document.getElementById("vcdh-type-filter").value = "all";
  document.getElementById("vcdh-time-filter").value = "all";
  document.getElementById("vcdh-sort-filter").value = "id"; // 기본 id 정렬 유지
  fetchAllData(); // 모든 데이터를 다시 로드
}

// 검색 기능
async function applySearch() {
  const searchInput = document.getElementById("vcdh-search-input").value.trim();
  if (!searchInput) {
    fetchAllData(); // 검색어 없으면 전체 데이터 불러오기
    return;
  }
  showLoading();
  try {
    const response = await fetch(`/api/search?query=${encodeURIComponent(searchInput)}`);
    const result = await response.json();
    allData = result.data; // 검색 결과 저장
    filteredData = allData;
    applyLocalFilters(); // 검색 결과에 대해 필터 적용
  } catch (error) {
    alert("검색 중 오류가 발생했습니다.");
  } finally {
    hideLoading();
  }
}

document.getElementById("vcdh-search-input").addEventListener("keypress", function (event) {
  if (event.key === "Enter") {
    event.preventDefault(); // 기본 Enter 동작 방지
    applySearch(); // Enter 눌렀을 때만 검색 실행
  }
});

// 페이지네이션 업데이트
function updatePagination() {
  const paginationContainer = document.getElementById("vcdh-pagination");
  paginationContainer.innerHTML = "";

  const totalPages = Math.ceil(filteredData.length / rowsPerPage);
  const maxVisibleButtons = 5; // 한 번에 표시할 최대 버튼 수
  const halfVisible = Math.floor(maxVisibleButtons / 2);

  let startPage = Math.max(currentPage - halfVisible, 1);
  let endPage = Math.min(currentPage + halfVisible, totalPages);

  // 처음과 끝 버튼을 항상 표시하려면 범위를 조정
  if (currentPage <= halfVisible) {
    endPage = Math.min(maxVisibleButtons, totalPages);
  } else if (currentPage + halfVisible > totalPages) {
    startPage = Math.max(totalPages - maxVisibleButtons + 1, 1);
  }

  // 처음 페이지 버튼 추가
  if (startPage > 1) {
    const firstButton = document.createElement("button");
    firstButton.textContent = "1";
    firstButton.className = "vcdh-pagination-button";
    firstButton.addEventListener("click", () => {
      currentPage = 1;
      const start = (currentPage - 1) * rowsPerPage;
      const end = start + rowsPerPage;
      displayCards(filteredData.slice(start, end));
      updatePagination();
    });
    paginationContainer.appendChild(firstButton);

    if (startPage > 2) {
      const dots = document.createElement("span");
      dots.textContent = "...";
      dots.className = "vcdh-pagination-dots";
      paginationContainer.appendChild(dots);
    }
  }

  // 페이지 번호 버튼 추가
  for (let i = startPage; i <= endPage; i++) {
    const button = document.createElement("button");
    button.textContent = i;
    button.className = "vcdh-pagination-button";
    if (i === currentPage) button.classList.add("active");

    button.addEventListener("click", () => {
      currentPage = i;
      const start = (currentPage - 1) * rowsPerPage;
      const end = start + rowsPerPage;
      displayCards(filteredData.slice(start, end));
      updatePagination();
    });

    paginationContainer.appendChild(button);
  }

  // 끝 페이지 버튼 추가
  if (endPage < totalPages) {
    if (endPage < totalPages - 1) {
      const dots = document.createElement("span");
      dots.textContent = "...";
      dots.className = "vcdh-pagination-dots";
      paginationContainer.appendChild(dots);
    }

    const lastButton = document.createElement("button");
    lastButton.textContent = totalPages;
    lastButton.className = "vcdh-pagination-button";
    lastButton.addEventListener("click", () => {
      currentPage = totalPages;
      const start = (currentPage - 1) * rowsPerPage;
      const end = start + rowsPerPage;
      displayCards(filteredData.slice(start, end));
      updatePagination();
    });
    paginationContainer.appendChild(lastButton);
  }
}

// 페이지 점프 함수
function jumpToPage() {
    const input = document.getElementById("page-number-input").value;
    const targetPage = parseInt(input, 10);
    const totalPages = Math.ceil(filteredData.length / rowsPerPage);

    if (isNaN(targetPage) || targetPage < 1 || targetPage > totalPages) {
        alert("올바른 페이지 번호를 입력하세요.");
        return;
    }

    currentPage = targetPage;
    const start = (currentPage - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    displayCards(filteredData.slice(start, end));
    updatePagination();
}

document.getElementById("page-number-input").addEventListener("keypress", function (event) {
  if (event.key === "Enter") {
    event.preventDefault();
    jumpToPage();
  }
});

// DOM이 준비된 후 jump-button 이벤트 리스너 등록
document.addEventListener("DOMContentLoaded", () => {
    // 기존 모달 닫기 이벤트 등과 함께 추가
    document.getElementById("vcdh-close-btn").addEventListener("click", closeModal);
    document.getElementById("vcdh-modal-overlay").addEventListener("click", closeModal);

    // 페이지 점프 버튼 클릭 이벤트 등록
    document.getElementById("jump-button").addEventListener("click", jumpToPage);
});

function closeModal() {
  document.getElementById("vcdh-modal").style.display = "none";
  document.getElementById("vcdh-modal-overlay").style.display = "none";
}


// 로딩 메시지 표시/숨기기
function showLoading() {
  document.getElementById("vcdh-loading").style.display = "block";
}
function hideLoading() {
  document.getElementById("vcdh-loading").style.display = "none";
}

// 초기 데이터 로드
window.onload = function () {
  fetchAllData();
};
