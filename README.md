# 영수증 N빵 계산기

영수증 사진을 업로드하면 EasyOCR로 총액을 추출하고,
입력한 인원 수에 따라 더치페이(1/N 분할) 금액을 계산해 주는 웹 애플리케이션입니다.
Node.js 서버가 정적 파일을 제공하고, OCR 처리를 위해 Python(EasyOCR)을 호출합니다.

## 주요 기능
- 영수증 이미지 업로드 및 미리보기
- EasyOCR를 이용한 서버 사이드 OCR
- 합계/총액 키워드를 기반으로 자동 총 결제금액 추출
- 인원 수를 입력하면 1인당 부담 금액 계산 및 몫/잔액 분배 안내
- 총액이 잘못 인식된 경우 직접 수정 가능
- 결과를 클릭 한 번으로 클립보드에 복사

## 기술 스택
- **프론트엔드**: HTML, CSS, Vanilla JavaScript
- **백엔드**: Node.js (정적 파일 + OCR API), Python 3 + EasyOCR

## 개발/실행 방법
1. Node 의존성 설치 (선택)
   ```bash
   npm install
   ```
2. Python 의존성 설치 (EasyOCR)
   ```bash
   pip install easyocr
   ```
   GPU 없이도 동작하며, `opencv-python-headless` 등의 의존성은 EasyOCR가 함께 설치합니다.
3. 개발 서버 실행
   ```bash
   npm start
   ```
4. 브라우저에서 [http://localhost:3000](http://localhost:3000) 접속

### 환경 변수
- `PYTHON`: EasyOCR를 실행할 Python 바이너리 경로를 지정할 수 있습니다. (기본값: `python3`)

## 사용 팁
- 총액이 여러 번 등장하는 영수증일 경우, 가장 큰 금액을 선택합니다.
- OCR 결과가 부정확할 수 있으므로 총액을 한 번 더 확인하고 필요 시 직접 수정하세요.
- 한글/영문 혼합 영수증 인식을 위해 EasyOCR `ko` + `en` 언어 모델을 사용합니다.

## 라이선스
이 프로젝트는 MIT 라이선스로 배포됩니다.
