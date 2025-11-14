const receiptInput = document.getElementById('receiptInput');
const previewImg = document.getElementById('previewImg');
const imagePreview = document.getElementById('imagePreview');
const progressBox = document.getElementById('progressBox');
const rawText = document.getElementById('rawText');
const ocrApiKeyInput = document.getElementById('ocrApiKey');
const receiptList = document.getElementById('receiptList');
const manualForm = document.getElementById('manualForm');
const manualLabelInput = document.getElementById('manualLabel');
const manualAmountInput = document.getElementById('manualAmount');
const totalAmountDisplay = document.getElementById('totalAmountDisplay');
const peopleInput = document.getElementById('peopleInput');
const calculateBtn = document.getElementById('calculateBtn');
const clearReceiptsBtn = document.getElementById('clearReceiptsBtn');
const resultCard = document.getElementById('resultCard');
const resultText = document.getElementById('resultText');
const breakdown = document.getElementById('breakdown');
const breakdownList = document.getElementById('breakdownList');
const copyBtn = document.getElementById('copyBtn');
const copyHint = document.getElementById('copyHint');

const OCR_API_ENDPOINT = 'https://api.ocr.space/parse/image';
const DEFAULT_OCR_API_KEY = 'helloworld';

const receipts = [];
let receiptCounter = 0;
let currentCopyText = '';

initializeApiKeyField();

receiptInput.addEventListener('change', async (event) => {
  const files = Array.from(event.target.files ?? []);
  if (files.length === 0) {
    return;
  }

  const lastFile = files[files.length - 1];
  if (lastFile) {
    showPreview(lastFile);
  }

  for (const file of files) {
    await processReceiptFile(file);
  }

  receiptInput.value = '';
});

manualForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const label = manualLabelInput.value.trim() || `직접 입력 ${receipts.length + 1}`;
  const amount = parseInt(manualAmountInput.value, 10);

  if (!Number.isFinite(amount) || amount <= 0) {
    setProgress('직접 추가할 금액을 올바르게 입력해 주세요.');
    return;
  }

  addReceipt({
    label,
    amount,
    source: 'manual',
    status: 'ready',
  });

  manualForm.reset();
  setProgress(`${label} 금액을 추가했습니다.`);
});

clearReceiptsBtn.addEventListener('click', () => {
  receipts.splice(0, receipts.length);
  receiptCounter = 0;
  renderReceipts();
  updateTotals();
  showResult('영수증 목록을 모두 비웠습니다.');
});

receiptList.addEventListener('input', (event) => {
  if (!(event.target instanceof HTMLInputElement)) return;
  if (!event.target.classList.contains('receipt-amount-input')) return;

  const id = event.target.dataset.id;
  const value = parseInt(event.target.value, 10);
  updateReceipt(id, {
    amount: Number.isFinite(value) && value > 0 ? value : null,
  });
});

receiptList.addEventListener('click', (event) => {
  if (!(event.target instanceof HTMLButtonElement)) return;
  if (event.target.dataset.action !== 'remove') return;

  const id = event.target.dataset.id;
  removeReceipt(id);
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
  const total = getTotalAmount();
  const people = parseInt(peopleInput.value, 10);

  if (!Number.isFinite(total) || total <= 0) {
    showResult('영수증 금액을 먼저 추가해 주세요.');
    return;
  }

  if (!Number.isFinite(people) || people <= 0) {
    showResult('함께한 인원 수를 1 이상으로 입력해 주세요.');
    return;
  }

  const baseAmount = Math.floor(total / people);
  const roundedUpAmount = Math.ceil(total / people);
  const remainder = total - baseAmount * people;

  const formattedTotal = formatCurrency(total);
  const formattedRounded = formatCurrency(roundedUpAmount);

  const summaryMessage =
    remainder === 0
      ? `총 ${formattedTotal}원을 ${people}명이 나누면 모두 ${formatCurrency(baseAmount)}원씩 부담하면 됩니다.`
      : `총 ${formattedTotal}원을 ${people}명이 나누면 1인당 약 ${formattedRounded}원입니다. 정확히 맞추려면 아래 안내처럼 분배하세요.`;

  const breakdownItems = buildBreakdownLines({ total, baseAmount, remainder, people });
  const receiptLines = buildReceiptSummaryLines();

  currentCopyText = [...receiptLines, summaryMessage, ...breakdownItems].filter(Boolean).join('\n');

  showResult(summaryMessage, breakdownItems);
});

function initializeApiKeyField() {
  if (!ocrApiKeyInput) return;

  try {
    const saved = localStorage.getItem('ocrSpaceApiKey');
    if (saved) {
      ocrApiKeyInput.value = saved;
    }
  } catch (error) {
    console.warn('API key 초기화 실패', error);
  }

  ocrApiKeyInput.addEventListener('input', () => {
    try {
      const value = ocrApiKeyInput.value.trim();
      if (value) {
        localStorage.setItem('ocrSpaceApiKey', value);
      } else {
        localStorage.removeItem('ocrSpaceApiKey');
      }
    } catch (error) {
      console.warn('API key 저장 실패', error);
    }
  });
}

function setProgress(message) {
  progressBox.textContent = message;
}

async function processReceiptFile(file) {
  const receipt = addReceipt({
    label: file.name,
    amount: null,
    source: 'ocr',
    status: 'pending',
  });

  setProgress(`${file.name} 업로드 중...`);
  rawText.value = '';
  resultCard.hidden = true;
  breakdown.classList.add('hidden');
  copyHint.hidden = true;

  try {
    const { text, amount } = await recognizeWithOcrSpace(file);
    updateReceipt(receipt.id, {
      rawText: text,
      amount: amount ?? null,
      status: 'ready',
      error: null,
    });
    rawText.value = text;
    if (amount) {
      setProgress(`${file.name} 인식 완료 · 총액 후보 ${formatCurrency(amount)}원`);
    } else {
      setProgress(`${file.name} 인식 완료 · 총액을 찾지 못했습니다. 직접 입력해 주세요.`);
    }
  } catch (error) {
    console.error(error);
    updateReceipt(receipt.id, {
      status: 'error',
      error: error.message || '인식에 실패했습니다.',
    });
    setProgress(`오류: ${error.message || '인식에 실패했습니다.'}`);
  }
}

function addReceipt({ label, amount = null, source, status, rawText = '', error = null }) {
  const receipt = {
    id: `receipt-${++receiptCounter}`,
    label,
    amount,
    source,
    status,
    rawText,
    error,
  };
  receipts.push(receipt);
  renderReceipts();
  updateTotals();
  return receipt;
}

function updateReceipt(id, updates) {
  const target = receipts.find((receipt) => receipt.id === id);
  if (!target) return;

  Object.assign(target, updates);
  renderReceipts();
  updateTotals();
}

function removeReceipt(id) {
  const index = receipts.findIndex((receipt) => receipt.id === id);
  if (index === -1) return;
  receipts.splice(index, 1);
  renderReceipts();
  updateTotals();
}

function renderReceipts() {
  receiptList.innerHTML = '';

  if (receipts.length === 0) {
    const placeholder = document.createElement('li');
    placeholder.className = 'empty-placeholder';
    placeholder.textContent = '아직 영수증이 없습니다. 이미지를 업로드하거나 금액을 직접 추가해 주세요.';
    receiptList.appendChild(placeholder);
    return;
  }

  receipts.forEach((receipt) => {
    const li = document.createElement('li');
    li.className = `receipt-item${receipt.status === 'pending' ? ' pending' : ''}`;
    li.dataset.id = receipt.id;

    const header = document.createElement('div');
    header.className = 'receipt-main';

    const titleWrap = document.createElement('div');
    const title = document.createElement('strong');
    title.textContent = receipt.label;
    titleWrap.appendChild(title);

    const meta = document.createElement('p');
    meta.className = 'receipt-meta';
    meta.textContent = buildReceiptMeta(receipt);
    titleWrap.appendChild(meta);
    header.appendChild(titleWrap);

    const actions = document.createElement('div');
    actions.className = 'receipt-actions';
    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.dataset.action = 'remove';
    removeBtn.dataset.id = receipt.id;
    removeBtn.textContent = '삭제';
    actions.appendChild(removeBtn);
    header.appendChild(actions);

    li.appendChild(header);

    const amountInput = document.createElement('input');
    amountInput.type = 'number';
    amountInput.min = '0';
    amountInput.step = '1';
    amountInput.placeholder = '금액 (원)';
    amountInput.value = receipt.amount ?? '';
    amountInput.className = 'receipt-amount-input';
    amountInput.dataset.id = receipt.id;
    amountInput.disabled = receipt.status === 'pending';
    li.appendChild(amountInput);

    if (receipt.error) {
      const errorMsg = document.createElement('p');
      errorMsg.className = 'receipt-errors';
      errorMsg.textContent = receipt.error;
      li.appendChild(errorMsg);
    }

    receiptList.appendChild(li);
  });
}

function buildReceiptMeta(receipt) {
  const parts = [receipt.source === 'manual' ? '직접 입력' : 'OCR 추출'];
  if (receipt.status === 'pending') {
    parts.push('인식 중');
  } else if (receipt.status === 'error') {
    parts.push('실패');
  } else {
    parts.push('완료');
  }
  return parts.join(' · ');
}

function updateTotals() {
  const total = getTotalAmount();
  totalAmountDisplay.textContent = `${formatCurrency(total)}원`;
}

function getTotalAmount() {
  return receipts.reduce((sum, receipt) => {
    if (!Number.isFinite(receipt.amount)) return sum;
    return sum + receipt.amount;
  }, 0);
}

function formatCurrency(value) {
  if (!Number.isFinite(value) || value <= 0) {
    return '0';
  }
  return value.toLocaleString('ko-KR');
}

async function recognizeWithOcrSpace(file) {
  const formData = new FormData();
  formData.append('language', 'kor');
  formData.append('scale', 'true');
  formData.append('isOverlayRequired', 'false');
  formData.append('detectOrientation', 'true');
  formData.append('OCREngine', '2');
  formData.append('file', file);

  const response = await fetch(OCR_API_ENDPOINT, {
    method: 'POST',
    headers: {
      apikey: getOcrApiKey(),
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error('OCR 서버 응답이 올바르지 않습니다.');
  }

  const payload = await response.json();
  if (payload.IsErroredOnProcessing) {
    const message = Array.isArray(payload.ErrorMessage) ? payload.ErrorMessage[0] : payload.ErrorMessage;
    throw new Error(message || 'OCR 처리 중 오류가 발생했습니다.');
  }

  const parsedText =
    payload.ParsedResults?.map((result) => result.ParsedText ?? '').join('\n').trim() ?? '';
  const detected = detectTotal(parsedText);
  return { text: parsedText, amount: detected };
}

function getOcrApiKey() {
  return ocrApiKeyInput?.value?.trim() || DEFAULT_OCR_API_KEY;
}

function showPreview(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    previewImg.src = e.target.result;
    imagePreview.classList.remove('hidden');
  };
  reader.readAsDataURL(file);
}

function detectTotal(text) {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.replace(/[₩\\]/g, '').trim())
    .filter(Boolean);

  const preferredKeywords = /(합계|총액|총\s*계|받을\s*금액|결제\s*금액|카드금액|청구금액|이체금액|현금영수증|결제\s*합계)/i;
  const taxableKeywords = /(공급가액|과세\s*금액|과세물품가액|면세|부가세|부\s*가\s*세|세액)/i;
  const numberPattern = /([0-9]{1,3}(?:[,\.][0-9]{3})+|[0-9]+)(?:\s*원)?/g;

  let candidate = null;
  let fallbackCandidate = null;
  let taxableAmount = null;
  let vatAmount = null;

  for (const line of lines) {
    const numbers = extractNumbers(line, numberPattern);
    if (numbers.length === 0) continue;

    if (/부\s*가\s*세|부가세|세액/i.test(line)) {
      vatAmount = Math.max(vatAmount ?? 0, Math.max(...numbers));
    }
    if (/공급가액|과세\s*금액|과세물품가액/i.test(line)) {
      taxableAmount = Math.max(taxableAmount ?? 0, Math.max(...numbers));
    }

    if (preferredKeywords.test(line)) {
      const maxNumber = Math.max(...numbers);
      if (!candidate || maxNumber > candidate) {
        candidate = maxNumber;
      }
      continue;
    }

    if (!taxableKeywords.test(line)) {
      const maxNumber = Math.max(...numbers);
      if (!fallbackCandidate || maxNumber > fallbackCandidate) {
        fallbackCandidate = maxNumber;
      }
    }
  }

  if (candidate) {
    return candidate;
  }

  if (taxableAmount && vatAmount) {
    return taxableAmount + vatAmount;
  }

  if (fallbackCandidate) {
    return fallbackCandidate;
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

function buildReceiptSummaryLines() {
  const valid = receipts.filter((receipt) => Number.isFinite(receipt.amount) && receipt.amount > 0);
  if (valid.length === 0) {
    return [];
  }

  const lines = ['[영수증 합계]'];
  valid.forEach((receipt) => {
    lines.push(`- ${receipt.label}: ${formatCurrency(receipt.amount)}원`);
  });
  lines.push(`[총 합계] ${formatCurrency(getTotalAmount())}원`);
  return lines;
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
  const formattedBase = formatCurrency(baseAmount);
  const formattedExtra = formatCurrency(baseAmount + 1);

  if (remainder === 0) {
    lines.push(`모든 인원이 각각 ${formattedBase}원씩 내면 ${formatCurrency(total)}원이 정확히 됩니다.`);
    return lines;
  }

  if (remainder > 0) {
    lines.push(`${remainder}명은 ${formattedExtra}원씩 부담합니다.`);
  }

  const rest = people - remainder;
  if (rest > 0) {
    lines.push(`${rest}명은 ${formattedBase}원씩 부담합니다.`);
  }

  lines.push(`위와 같이 분배하면 총액 ${formatCurrency(total)}원을 정확히 맞출 수 있습니다.`);
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
