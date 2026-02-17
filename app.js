// ===== Configuration =====
// Google Apps Script URL (Proxy zu Notion)
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwPKHgy5w7Hnk9cToqMO7FQepzUksq-yzizENYGPhP6MUsAEszZAVrkxZN92JhsYr-DSA/exec';

// ===== State =====
let currentStep = 1;
const totalSteps = 3;
let selectedType = '';
let teilnehmerCount = 1;
const maxTeilnehmer = 10;
const formStartTime = Date.now();

// ===== Type Selector =====
document.querySelectorAll('.type-chip').forEach(chip => {
  chip.addEventListener('click', () => {
    document.querySelectorAll('.type-chip').forEach(c => c.classList.remove('selected'));
    chip.classList.add('selected');
    selectedType = chip.dataset.type;
    document.getElementById('projektTyp').value = selectedType;
    document.getElementById('projektTypError').textContent = '';
  });
});

// ===== Teilnehmer Management =====
function addTeilnehmer() {
  if (teilnehmerCount >= maxTeilnehmer) {
    showToast('Maximal 10 Teilnehmer möglich.');
    return;
  }

  teilnehmerCount++;
  const list = document.getElementById('teilnehmerList');
  const card = document.createElement('div');
  card.className = 'teilnehmer-card';
  card.dataset.index = teilnehmerCount - 1;
  card.innerHTML = `
    <div class="teilnehmer-header">
      <span class="teilnehmer-label">Teilnehmer ${teilnehmerCount}</span>
      <button type="button" class="btn-remove" onclick="removeTeilnehmer(this)" title="Entfernen">&times;</button>
    </div>
    <div class="teilnehmer-fields">
      <div class="form-group">
        <label>Name</label>
        <input type="text" class="tn-name" placeholder="Max Mustermann" required>
      </div>
      <div class="form-group">
        <label>Campus ID</label>
        <input type="text" class="tn-campus" placeholder="z.B. 12345678" required>
      </div>
    </div>
  `;
  list.appendChild(card);
  updateTeilnehmerLabels();

  // Focus auf neues Namensfeld
  card.querySelector('.tn-name').focus();
}

function removeTeilnehmer(btn) {
  const card = btn.closest('.teilnehmer-card');
  card.style.opacity = '0';
  card.style.transform = 'translateX(-20px)';
  card.style.transition = 'all 0.3s ease';
  setTimeout(() => {
    card.remove();
    teilnehmerCount--;
    updateTeilnehmerLabels();
  }, 300);
}

function updateTeilnehmerLabels() {
  const cards = document.querySelectorAll('.teilnehmer-card');
  cards.forEach((card, i) => {
    card.querySelector('.teilnehmer-label').textContent = `Teilnehmer ${i + 1}`;
    card.dataset.index = i;
  });
}

// ===== Step Navigation =====
function nextStep(from) {
  if (!validateStep(from)) return;

  if (from === 2) {
    submitProject();
    return;
  }

  currentStep = from + 1;
  showStep(currentStep);
}

function prevStep(from) {
  currentStep = from - 1;
  showStep(currentStep);
}

function showStep(step) {
  document.querySelectorAll('.form-step').forEach(el => el.classList.remove('active'));
  document.getElementById(`step${step}`).classList.add('active');

  const fill = document.getElementById('progressFill');
  fill.style.width = `${(step / totalSteps) * 100}%`;

  document.querySelectorAll('.step').forEach(el => {
    const s = parseInt(el.dataset.step);
    el.classList.remove('active', 'completed');
    if (s === step) el.classList.add('active');
    if (s < step) el.classList.add('completed');
  });

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ===== Validation =====
function validateStep(step) {
  switch (step) {
    case 1: return validateProject();
    case 2: return validateTeilnehmer();
    default: return true;
  }
}

function validateProject() {
  let valid = true;

  const titel = document.getElementById('projektTitel');
  if (!titel.value.trim()) {
    titel.classList.add('invalid');
    document.getElementById('projektTitelError').textContent = 'Bitte gib einen Projekttitel ein.';
    valid = false;
  } else {
    titel.classList.remove('invalid');
    titel.classList.add('valid');
    document.getElementById('projektTitelError').textContent = '';
  }

  if (!selectedType) {
    document.getElementById('projektTypError').textContent = 'Bitte wähle einen Projekttyp.';
    valid = false;
  } else {
    document.getElementById('projektTypError').textContent = '';
  }

  const beschreibung = document.getElementById('projektBeschreibung');
  if (!beschreibung.value.trim()) {
    beschreibung.classList.add('invalid');
    document.getElementById('projektBeschreibungError').textContent = 'Bitte gib eine Projektbeschreibung ein.';
    valid = false;
  } else {
    beschreibung.classList.remove('invalid');
    beschreibung.classList.add('valid');
    document.getElementById('projektBeschreibungError').textContent = '';
  }

  return valid;
}

function validateTeilnehmer() {
  let valid = true;
  const cards = document.querySelectorAll('.teilnehmer-card');

  cards.forEach(card => {
    const nameInput = card.querySelector('.tn-name');
    const campusInput = card.querySelector('.tn-campus');

    if (!nameInput.value.trim()) {
      nameInput.classList.add('invalid');
      valid = false;
    } else {
      nameInput.classList.remove('invalid');
    }

    if (!campusInput.value.trim()) {
      campusInput.classList.add('invalid');
      valid = false;
    } else {
      campusInput.classList.remove('invalid');
    }
  });

  if (!valid) {
    document.getElementById('teilnehmerError').textContent = 'Bitte fülle alle Teilnehmerfelder aus.';
  } else {
    document.getElementById('teilnehmerError').textContent = '';
  }

  return valid;
}

// ===== Clear validation on input =====
document.addEventListener('input', (e) => {
  if (e.target.matches('.form-group input, .form-group textarea')) {
    e.target.classList.remove('invalid');
    const errorEl = e.target.parentElement.querySelector('.error-message');
    if (errorEl) errorEl.textContent = '';
  }
});

// ===== Collect Teilnehmer Data =====
function getTeilnehmerData() {
  const cards = document.querySelectorAll('.teilnehmer-card');
  const teilnehmer = [];

  cards.forEach(card => {
    teilnehmer.push({
      name: card.querySelector('.tn-name').value.trim(),
      campusId: card.querySelector('.tn-campus').value.trim()
    });
  });

  return teilnehmer;
}

// ===== Submit Project =====
async function submitProject() {
  const btn = document.querySelector('#step2 .btn-primary');
  const originalText = btn.textContent;
  btn.innerHTML = '<span class="spinner"></span>Sende...';
  btn.disabled = true;

  try {
    const teilnehmer = getTeilnehmerData();
    const data = {
      projektTitel: document.getElementById('projektTitel').value.trim(),
      projektTyp: selectedType,
      projektBeschreibung: document.getElementById('projektBeschreibung').value.trim(),
      teilnehmer: teilnehmer,
      // Honeypot
      website: document.getElementById('website').value,
      // Timing
      _formStart: formStartTime
    };

    if (GOOGLE_SCRIPT_URL === 'YOUR_GOOGLE_SCRIPT_URL_HERE') {
      console.log('Demo-Modus: Projektdaten:', data);
      await new Promise(resolve => setTimeout(resolve, 1000));
      document.getElementById('confirmProjekt').textContent = data.projektTitel;
      currentStep = 3;
      showStep(3);
      showToast('Projekt erfolgreich eingereicht!', 'success');
      return;
    }

    // Sende Daten via no-cors + text/plain (gleicher Ansatz wie Registration-App)
    await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(data),
      redirect: 'follow'
    });

    // Erfolg
    document.getElementById('confirmProjekt').textContent = data.projektTitel;
    currentStep = 3;
    showStep(3);
    showToast('Projekt erfolgreich eingereicht!', 'success');

  } catch (error) {
    console.error('Fehler:', error);
    showToast('Verbindungsfehler. Bitte versuche es erneut.');
  } finally {
    btn.innerHTML = originalText;
    btn.disabled = false;
  }
}

// ===== Reset Form =====
function resetForm() {
  document.getElementById('projektTitel').value = '';
  document.getElementById('projektBeschreibung').value = '';
  document.getElementById('projektTyp').value = '';
  document.getElementById('website').value = '';
  selectedType = '';

  document.querySelectorAll('.type-chip').forEach(c => c.classList.remove('selected'));

  // Reset Teilnehmer zu 1
  const list = document.getElementById('teilnehmerList');
  list.innerHTML = `
    <div class="teilnehmer-card" data-index="0">
      <div class="teilnehmer-header">
        <span class="teilnehmer-label">Teilnehmer 1</span>
      </div>
      <div class="teilnehmer-fields">
        <div class="form-group">
          <label>Name</label>
          <input type="text" class="tn-name" placeholder="Max Mustermann" required>
        </div>
        <div class="form-group">
          <label>Campus ID</label>
          <input type="text" class="tn-campus" placeholder="z.B. 12345678" required>
        </div>
      </div>
    </div>
  `;
  teilnehmerCount = 1;

  // Clear validation
  document.querySelectorAll('.form-group input, .form-group textarea').forEach(input => {
    input.classList.remove('valid', 'invalid');
  });
  document.querySelectorAll('.error-message').forEach(el => {
    el.textContent = '';
  });

  currentStep = 1;
  showStep(1);
}

// ===== Toast =====
function showToast(message, type = 'error') {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);

  requestAnimationFrame(() => toast.classList.add('show'));

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}
