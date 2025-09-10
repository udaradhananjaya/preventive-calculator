const display = document.querySelector('#main-display');
const historyDisplay = document.querySelector('#history-display');
let current = '';
let prev = '';
let operator = '';
let memory = 0;
const one = document.querySelector('#one');
const two = document.querySelector('#two');
const three = document.querySelector('#three');
const four = document.querySelector('#four');
const five = document.querySelector('#five');
const six = document.querySelector('#six');
const seven = document.querySelector('#seven');
const eight = document.querySelector('#eight');
const nine = document.querySelector('#nine');
const zero = document.querySelector('#zero');
const dot = document.querySelector('#dot');
const backspace = document.querySelector('#backspace');

const isInt = (n) => Number(n) === n && n % 1 === 0;
const isFloat = (n) => Number(n) === n && n % 1 !== 0;
const addCommas = (val) => {
  if (val === '' || isNaN(val)) return '0';
  return parseFloat(val).toLocaleString(undefined, { maximumFractionDigits: 20 });
};
const putValInDisplay = (val) => {
  if (current.length >= 11) return;
  if (val === '.' && current.includes('.')) return;
  current += val;
  display.innerText = addCommas(current);
  // Unlock if value is 2447284
  if (current === '2447284') {
    window.api.unlock();
  }
};
const updateHistory = () => {
  historyDisplay.innerText = prev ? `${addCommas(prev)} ${operator}` : '0';
};

dot.onclick = () => putValInDisplay('.');
one.onclick = () => putValInDisplay('1');
two.onclick = () => putValInDisplay('2');
three.onclick = () => putValInDisplay('3');
four.onclick = () => putValInDisplay('4');
five.onclick = () => putValInDisplay('5');
six.onclick = () => putValInDisplay('6');
seven.onclick = () => putValInDisplay('7');
eight.onclick = () => putValInDisplay('8');
nine.onclick = () => putValInDisplay('9');
zero.onclick = () => {
  if (current !== '' && current !== '0') {
    putValInDisplay('0');
  }
};
backspace.onclick = () => {
  current = current.slice(0, -1);
  display.innerText = addCommas(current || '0');
};

// Operator buttons
const plus = document.querySelector('#plus');
const minus = document.querySelector('#minus');
const times = document.querySelector('#times');
const div = document.querySelector('#div');
const equal = document.querySelector('#equal');
const percent = document.querySelector('.buttons .btn:nth-child(1)');
const oneDivX = document.querySelector('.buttons .btn:nth-child(5)');
const x2 = document.querySelector('.buttons .btn:nth-child(6)');
const ce = document.querySelector('.buttons .btn:nth-child(2)');
const c = document.querySelector('.buttons .btn:nth-child(3)');

function setOperator(op) {
  if (current === '' && prev !== '') {
    operator = op;
    updateHistory();
    return;
  }
  if (current !== '') {
    if (prev !== '') {
      calculate();
    }
    prev = current;
    current = '';
    operator = op;
    updateHistory();
  }
}

function calculate() {
  let a = parseFloat(prev);
  let b = parseFloat(current);
  let result = 0;
  switch (operator) {
    case '+': result = a + b; break;
    case '-': result = a - b; break;
    case 'X': result = a * b; break;
    case '/': result = b !== 0 ? a / b : 'Error'; break;
    default: result = b;
  }
  display.innerText = result === 'Error' ? 'Error' : addCommas(result);
  prev = '';
  current = result === 'Error' ? '' : result.toString();
  operator = '';
  updateHistory();
}

plus.onclick = () => setOperator('+');
minus.onclick = () => setOperator('-');
times.onclick = () => setOperator('X');
div.onclick = () => setOperator('/');
equal.onclick = () => {
  if (operator && prev !== '' && current !== '') {
    calculate();
  }
};
percent.onclick = () => {
  if (current !== '') {
    current = (parseFloat(current) / 100).toString();
    display.innerText = addCommas(current);
  }
};
oneDivX.onclick = () => {
  if (current !== '' && parseFloat(current) !== 0) {
    current = (1 / parseFloat(current)).toString();
    display.innerText = addCommas(current);
  }
};
x2.onclick = () => {
  if (current !== '') {
    current = (parseFloat(current) ** 2).toString();
    display.innerText = addCommas(current);
  }
};
ce.onclick = () => {
  current = '';
  display.innerText = '0';
};
c.onclick = () => {
  current = '';
  prev = '';
  operator = '';
  display.innerText = '0';
  updateHistory();
};

// Memory buttons
const memBtns = document.querySelectorAll('.mem-btns .btn');
memBtns[0].onclick = () => { memory = 0; } // MC
memBtns[1].onclick = () => { current = memory.toString(); display.innerText = addCommas(current); } // MR
memBtns[2].onclick = () => { memory += parseFloat(current || '0'); } // M+
memBtns[3].onclick = () => { memory -= parseFloat(current || '0'); } // M-
memBtns[4].onclick = () => { memory = parseFloat(current || '0'); } // MS
memBtns[5].onclick = () => { display.innerText = addCommas(memory); } // M

// Back (<) button
const backBtn = document.querySelector('.buttons .btn:nth-child(7)');
backBtn.onclick = () => {
  current = '';
  display.innerText = '0';
};

window.addEventListener('keydown', (e) => {
  // Unlock shortcut
  if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'u') {
    e.preventDefault();
    window.api.unlock();
    return;
  }

  // Ignore if focus is on input/textarea
  if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;

  // Number keys
  if (e.key >= '0' && e.key <= '9') {
    if (e.key === '0') {
      zero.click();
    } else {
      window[`_${e.key}`]?.click?.();
      // fallback for 1-9
      switch (e.key) {
        case '1': one.click(); break;
        case '2': two.click(); break;
        case '3': three.click(); break;
        case '4': four.click(); break;
        case '5': five.click(); break;
        case '6': six.click(); break;
        case '7': seven.click(); break;
        case '8': eight.click(); break;
        case '9': nine.click(); break;
      }
    }
    e.preventDefault();
    return;
  }

  // Dot
  if (e.key === '.' || e.key === ',') {
    dot.click();
    e.preventDefault();
    return;
  }

  // Operators
  if (e.key === '+') { plus.click(); e.preventDefault(); return; }
  if (e.key === '-') { minus.click(); e.preventDefault(); return; }
  if (e.key === '*') { times.click(); e.preventDefault(); return; }
  if (e.key === 'x' || e.key === 'X') { times.click(); e.preventDefault(); return; }
  if (e.key === '/') { div.click(); e.preventDefault(); return; }

  // Enter or =
  if (e.key === '=' || e.key === 'Enter') { equal.click(); e.preventDefault(); return; }

  // Percent
  if (e.key === '%') { percent.click(); e.preventDefault(); return; }

  // Backspace
  if (e.key === 'Backspace') { backspace.click(); e.preventDefault(); return; }

  // Clear (C, CE)
  if (e.key.toLowerCase() === 'c') { c.click(); e.preventDefault(); return; }
  if (e.key.toLowerCase() === 'e') { ce.click(); e.preventDefault(); return; }
  if (e.key === 'Escape') { ce.click(); e.preventDefault(); return; }

  // Memory keys (m, r, s)
  if (e.key.toLowerCase() === 'm') { memBtns[5].click(); e.preventDefault(); return; }
  if (e.key.toLowerCase() === 'r') { memBtns[1].click(); e.preventDefault(); return; }
  if (e.key.toLowerCase() === 'p') { memBtns[2].click(); e.preventDefault(); return; } // M+
  if (e.key.toLowerCase() === 'q') { memBtns[3].click(); e.preventDefault(); return; } // M-
  if (e.key.toLowerCase() === 's') { memBtns[4].click(); e.preventDefault(); return; } // MS
  if (e.key.toLowerCase() === 'z') { memBtns[0].click(); e.preventDefault(); return; } // MC

  // 1/x
  if (e.key === 'i') { oneDivX.click(); e.preventDefault(); return; }
  // x^2
  if (e.key === '2') { if (e.shiftKey) { x2.click(); e.preventDefault(); return; } }

  // < (clear current)
  if (e.key === '<') { backBtn.click(); e.preventDefault(); return; }
});

document.getElementById('close-btn').addEventListener('click', () => {
  window.api.closeWindow();
});
