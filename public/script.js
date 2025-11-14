const receiptInput = document.getElementById('receiptInput');
const previewImg = document.getElementById('previewImg');
const imagePreview = document.getElementById('imagePreview');
const progressBox = document.getElementById('progressBox');
const rawText = document.getElementById('rawText');
const totalInput = document.getElementById('totalInput');
const peopleInput = document.getElementById('peopleInput');
const calculateBtn = document.getElementById('calculateBtn');
const resultCard = document.getElementById('resultCard');
const resultText = document.getElementById('resultText');
const breakdown = document.getElementById('breakdown');
const breakdownList = document.getElementById('breakdownList');
const copyBtn = document.getElementById('copyBtn');
const copyHint = document.getElementById('copyHint');

const { Tesseract } = window;

let currentFile = null;
let currentCopyText = '';

receiptInput.addEventListener('change', async (event) => {
  const [file] = event.target.files;
  if (!file) {
    resetView();
    return;
  }
  currentFile = file;
  showPreview(file);
  await runOcr(file);
});

copyBtn.addEventListener('click', async () => {
  if (!currentCopyText) return;

  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(currentCopyText);
    } else {
      copyUsingFallback(currentCopyText);
    }
    copyHint.textContent = '클립보드에 복사했습니다.';
    copyHint.hidden = false;
    setTimeout(() => {
      copyHint.hidden = true;
    }, 2000);
  } catch (error) {
    console.error(error);
    copyHint.textContent = '복사에 실패했습니다. 직접 복사해 주세요.';
    copyHint.hidden = false;
  }
});

calculateBtn.addEventListener('click', () => {
  const total = parseInt(totalInput.value, 10);
  const people = parseInt(peopleInput.value, 10);

  if (!Number.isFinite(total) || total <= 0) {
    showResult('총 결제 금액을 확인해 주세요.');
    return;
  }

  if (!Number.isFinite(people) || people <= 0) {
    showResult('함께한 인원 수를 1 이상으로 입력해 주세요.');
    return;
  }

  const baseAmount = Math.floor(total / people);
  const roundedUpAmount = Math.ceil(total / people);
  const remainder = total - baseAmount * people;

  const formattedTotal = total.toLocaleString('ko-KR');
  const formattedRounded = roundedUpAmount.toLocaleString('ko-KR');

  const summaryMessage =
    remainder === 0
      ? `총 ${formattedTotal}원을 ${people}명이 나누면 모두 ${baseAmount.toLocaleString('ko-KR')}원씩 부담하면 됩니다.`
      : `총 ${formattedTotal}원을 ${people}명이 나누면 1인당 약 ${formattedRounded}원입니다. 정확히 맞추려면 아래 안내처럼 분배하세요.`;

  const breakdownItems = buildBreakdownLines({ total, baseAmount, remainder, people });
  currentCopyText = [summaryMessage, ...breakdownItems].join('\n');

  showResult(summaryMessage, breakdownItems);
});

function resetView() {
  currentFile = null;
  currentCopyText = '';
  imagePreview.classList.add('hidden');
  previewImg.src = '';
  progressBox.textContent = '대기 중';
  rawText.value = '';
  totalInput.value = '';
  resultCard.hidden = true;
  breakdown.classList.add('hidden');
  breakdownList.innerHTML = '';
  copyHint.hidden = true;
}

function showPreview(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    previewImg.src = e.target.result;
    imagePreview.classList.remove('hidden');
  };
  reader.readAsDataURL(file);
}

async function runOcr(file) {
  progressBox.textContent = '분석 준비 중...';
  rawText.value = '';
  resultCard.hidden = true;
  breakdown.classList.add('hidden');

  try {
    const { data } = await Tesseract.recognize(file, 'kor+eng', {
      logger: ({ status, progress }) => {
        if (status === 'recognizing text') {
          const percent = Math.round(progress * 100);
          progressBox.textContent = `인식 중... ${percent}%`;
        } else {
          progressBox.textContent = status;
        }
      },
    });

    const text = data.text.trim();
    rawText.value = text;
    progressBox.textContent = '완료';

    const detected = detectTotal(text);
    if (detected) {
      totalInput.value = detected;
    } else {
      progressBox.textContent += ' · 총액을 찾지 못했습니다. 직접 입력해 주세요.';
    }
  } catch (error) {
    console.error(error);
    progressBox.textContent = '오류가 발생했습니다. 다시 시도해 주세요.';
  }
}

function detectTotal(text) {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.replace(/[₩\\]/g, '').trim())
    .filter(Boolean);

  const keywordPattern = /(합계|총액|총\s*계|받을\s*금액|결제\s*금액|카드금액|현금|금액)/i;
  const numberPattern = /([0-9]{1,3}(?:[,\.][0-9]{3})+|[0-9]+)(?:\s*원)?/g;

  let candidate = null;

  for (const line of lines) {
    if (!keywordPattern.test(line)) continue;

    const numbers = extractNumbers(line, numberPattern);
    if (numbers.length === 0) continue;

    const maxNumber = Math.max(...numbers);
    if (!candidate || maxNumber > candidate) {
      candidate = maxNumber;
    }
  }

  if (candidate) {
    return candidate;
  }

  const allNumbers = extractNumbers(lines.join(' '), numberPattern);
  if (allNumbers.length === 0) {
    return null;
  }

  return Math.max(...allNumbers);
}

function extractNumbers(input, pattern) {
  const numbers = [];
  const regex = new RegExp(pattern);
  let match;
  while ((match = regex.exec(input)) !== null) {
    const normalized = match[1].replace(/[,\.]/g, '');
    const value = parseInt(normalized, 10);
    if (Number.isFinite(value)) {
      numbers.push(value);
    }
  }
  return numbers;
}

function showResult(message, breakdownItems = []) {
  resultText.textContent = message;
  resultCard.hidden = false;
  copyHint.hidden = true;

  if (breakdownItems.length === 0) {
    breakdown.classList.add('hidden');
    breakdownList.innerHTML = '';
    currentCopyText = message;
    return;
  }

  breakdown.classList.remove('hidden');
  breakdownList.innerHTML = '';
  copyHint.textContent = '클립보드에 복사했습니다.';
  breakdownItems.forEach((item) => {
    const li = document.createElement('li');
    li.textContent = item;
    breakdownList.appendChild(li);
  });
}

function buildBreakdownLines({ total, baseAmount, remainder, people }) {
  const lines = [];
  const formattedBase = baseAmount.toLocaleString('ko-KR');
  const formattedExtra = (baseAmount + 1).toLocaleString('ko-KR');

  if (remainder === 0) {
    lines.push(`모든 인원이 각각 ${formattedBase}원씩 내면 ${total.toLocaleString('ko-KR')}원이 정확히 됩니다.`);
    return lines;
  }

  if (remainder > 0) {
    lines.push(`${remainder}명은 ${formattedExtra}원씩 부담합니다.`);
  }

  const rest = people - remainder;
  if (rest > 0) {
    lines.push(`${rest}명은 ${formattedBase}원씩 부담합니다.`);
  }

  lines.push(`위와 같이 분배하면 총액 ${total.toLocaleString('ko-KR')}원을 정확히 맞출 수 있습니다.`);
  return lines;
}

function copyUsingFallback(text) {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'absolute';
  textarea.style.left = '-9999px';
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  document.body.removeChild(textarea);
}
