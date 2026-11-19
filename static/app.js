// 



const THREAD_KEY = 'reflactai_thread_id';

function newThreadId() {
  return 'incident-' + crypto.randomUUID();
}

let threadId = localStorage.getItem(THREAD_KEY) || newThreadId();
localStorage.setItem(THREAD_KEY, threadId);

const q = document.getElementById('question');
const send = document.getElementById('sendBtn');
const messages = document.getElementById('messages');
const upload = document.getElementById('uploadBtn');
const fileInput = document.getElementById('fileInput');
const uploadStatus = document.getElementById('uploadStatus');
const fileLabel = document.getElementById('fileLabel');
const starters = document.getElementById('starterPrompts');
const sessionId = document.getElementById('sessionId');
const newSessionBtn = document.getElementById('newSessionBtn');

function renderSession() {
  if (sessionId) {
    sessionId.textContent = 'MEMORY / ' + threadId.slice(-8).toUpperCase();
  }
}

renderSession();

function esc(s = '') {
  return String(s).replace(/[&<>"']/g, c => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }[c]));
}

function addMessage(role, html, meta = '') {
  const el = document.createElement('div');
  el.className = `message ${role}`;

  const avatar = role === 'assistant' ? '<div class="avatar">S</div>' : '';
  const label = role === 'assistant' ? 'ReflactAi' : 'ON-CALL ENGINEER';

  el.innerHTML = `${avatar}
    <div class="message-body">
      <div class="message-label">${label}</div>
      <div class="bubble">${html}</div>
      ${meta}
    </div>`;

  messages.appendChild(el);
  messages.scrollTop = messages.scrollHeight;

  return el;
}

function loadingMarkup() {
  return '<span class="thinking">Running Self-RAG <i></i><i></i><i></i></span>';
}

function pretty(v = '') {
  return String(v)
    .replaceAll('_', ' ')
    .replace(/\b\w/g, m => m.toUpperCase());
}


// --------------------------------------------------
// COMMON API RESPONSE HANDLER
// --------------------------------------------------

async function readApiResponse(response, label = 'API request') {
  const raw = await response.text();

  let data;

  try {
    data = raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.error(`${label} returned invalid JSON:`, raw);

    throw new Error(
      `${label}: Invalid JSON response (HTTP ${response.status}). ` +
      `Response: ${raw.slice(0, 500) || '[Empty response]'}`
    );
  }

  if (!response.ok) {
    console.error(`${label} failed:`, response.status, data);

    throw new Error(
      data?.detail ||
      data?.error ||
      `${label} failed with HTTP ${response.status}`
    );
  }

  if (!data || typeof data !== 'object') {
    throw new Error(
      `${label}: Server returned an empty response (HTTP ${response.status}).`
    );
  }

  return data;
}


// --------------------------------------------------
// CHAT FUNCTION
// --------------------------------------------------

async function ask() {
  const question = q.value.trim();

  if (!question) return;

  starters.style.display = 'none';

  addMessage('user', esc(question));

  q.value = '';
  send.disabled = true;

  const loading = addMessage('assistant', loadingMarkup());

  try {
    const r = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        question,
        thread_id: threadId
      })
    });

    const data = await readApiResponse(r, 'Chat request');

    loading.remove();

    let meta = `
      <div class="meta-card">
        <div class="verification">
          <span class="tag">ROUTE · ${esc(data.route)}</span>
    `;

    if (data.support_status) {
      meta += `<span class="tag ok">IsSUP · ${esc(pretty(data.support_status))}</span>`;
    }

    if (data.usefulness) {
      meta += `<span class="tag ok">IsUSE · ${esc(pretty(data.usefulness))}</span>`;
    }

    if (data.used_web_search) {
      meta += `<span class="tag web">INTERNET SEARCH USED</span>`;
    }

    meta += `
      <span class="tag memory">
        SQLITE MEMORY · ${data.memory_turns || 0}
        TURN${(data.memory_turns || 0) === 1 ? '' : 'S'}
      </span>
      </div>
    `;

    if (data.sources?.length) {
      meta += `
        <div class="sources">
          ${data.sources.map(s => `
            <div class="source">
              <span class="source-icon">
                ${s.type === 'web' ? '⌁' : '▱'}
              </span>
              <span>
                ${esc(s.title || s.source || 'Evidence')}
                ${s.page ? ' · p.' + s.page : ''}
                ${s.url ? ` · <a target="_blank" rel="noopener" href="${esc(s.url)}">open source ↗</a>` : ''}
              </span>
            </div>
          `).join('')}
        </div>
      `;
    }

    if (data.trace?.length) {
      meta += `
        <div class="trace">
          <details>
            <summary>Inspect Self-RAG workflow trace</summary>
            <ol>
              ${data.trace.map(t => `<li>${esc(t)}</li>`).join('')}
            </ol>
          </details>
        </div>
      `;
    }

    meta += '</div>';

    addMessage('assistant', esc(data.answer), meta);

  } catch (e) {
    console.error('Chat error:', e);

    loading.remove();

    addMessage(
      'assistant',
      'Request failed: ' + esc(e.message)
    );

  } finally {
    send.disabled = false;
    q.focus();
  }
}


// --------------------------------------------------
// CHAT EVENT LISTENERS
// --------------------------------------------------

send.addEventListener('click', ask);

q.addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    ask();
  }
});

starters.addEventListener('click', e => {
  const b = e.target.closest('button[data-q]');

  if (!b) return;

  q.value = b.dataset.q;
  q.focus();
});


// --------------------------------------------------
// FILE SELECTION
// --------------------------------------------------

fileInput.addEventListener('change', () => {
  fileLabel.textContent =
    fileInput.files[0]?.name || 'Choose runbook';

  uploadStatus.textContent = '';
});


// --------------------------------------------------
// DOCUMENT UPLOAD AND INDEXING
// --------------------------------------------------

upload.addEventListener('click', async () => {

  const file = fileInput.files[0];

  if (!file) {
    uploadStatus.textContent = 'Choose a runbook first.';
    return;
  }

  upload.disabled = true;

  uploadStatus.textContent =
    'Indexing private operational knowledge…';

  try {

    const fd = new FormData();

    fd.append('file', file);

    console.log('Uploading file:', file.name);
    console.log('File size:', file.size);
    console.log('File type:', file.type);

    const r = await fetch('/api/upload', {
      method: 'POST',
      body: fd
    });

    console.log('Upload HTTP status:', r.status);
    console.log('Upload content type:', r.headers.get('content-type'));

    const data = await readApiResponse(r, 'Document upload');

    console.log('Upload response:', data);

    if (typeof data.chunks_indexed !== 'number') {
      throw new Error(
        'Upload response is missing chunks_indexed.'
      );
    }

    uploadStatus.textContent =
      `✓ ${data.chunks_indexed} chunks indexed in ${data.namespace}`;

  } catch (e) {

    console.error('Document upload error:', e);

    uploadStatus.textContent =
      'Error: ' + e.message;

  } finally {

    upload.disabled = false;

  }
});


// --------------------------------------------------
// NEW SESSION
// --------------------------------------------------

newSessionBtn?.addEventListener('click', () => {

  threadId = newThreadId();

  localStorage.setItem(THREAD_KEY, threadId);

  renderSession();

  messages.innerHTML = `
    <div class="message assistant">
      <div class="avatar">S</div>
      <div class="message-body">
        <div class="message-label">ReflactAi</div>
        <div class="bubble intro">
          New incident memory session started.
          Describe the production issue and I'll build
          context across your follow-up questions.
        </div>
      </div>
    </div>
  `;

  starters.style.display = 'flex';

  q.value = '';
  q.focus();

});
