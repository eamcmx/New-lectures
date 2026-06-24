/* TSI Buddy — vanilla-JS chat widget for the TSI Dynamics course.
 *
 * Mount once per page:
 *
 *   TSIBuddy.mount({
 *     systemPrompt: "You are TSI Buddy ...",   // required, the AUDITOR prompt
 *     contextLabel: "docs/01_F_equals_ma.md",  // shown in the modal subtitle
 *     openingLine:  "I'm reading the F=ma chapter ..."   // optional pre-fill
 *   });
 *
 * The widget mounts a floating button (top-right of the viewport), a settings
 * modal where the student pastes their Mistral API key, and a chat panel that
 * streams responses progressively. API key persists in localStorage.
 *
 * Streams via Mistral's SSE endpoint (stream: true). Falls back to a single
 * non-streaming response if the runtime doesn't expose ReadableStream.
 *
 * Designed to coexist with the React+htm widget already inside each hook
 * page. They use the same localStorage keys so a student who pastes their
 * key once gets it everywhere.
 */
(function () {
  'use strict';

  if (window.TSIBuddy && window.TSIBuddy.__loaded) return;

  var KEY_LS    = 'tsi_mistral_key';
  var MODEL_LS  = 'tsi_mistral_model';
  var ENABLE_LS = 'tsi_buddy_enabled';

  function lsGet(k, fb) { try { var v = localStorage.getItem(k); return v == null ? fb : v; } catch (e) { return fb; } }
  function lsSet(k, v)  { try { localStorage.setItem(k, v); } catch (e) {} }

  /* ---------- Styles (injected once) ---------- */
  var STYLE = `
.tsi-buddy-btn {
  position: fixed; top: 14px; right: 14px; z-index: 9000;
  background: rgba(255,255,255,0.95); color: #1a3a5c;
  border: 1px solid #cbd5e1; border-radius: 999px;
  padding: 8px 14px; font: 600 13px/1 'Inter', system-ui, sans-serif;
  box-shadow: 0 2px 6px rgba(15,23,42,0.12);
  cursor: pointer; display: flex; align-items: center; gap: 8px;
  transition: transform 0.12s, box-shadow 0.12s;
}
.tsi-buddy-btn:hover { transform: translateY(-1px); box-shadow: 0 4px 10px rgba(15,23,42,0.18); }
.tsi-buddy-btn .tsi-buddy-dot {
  width: 8px; height: 8px; border-radius: 50%;
  background: #94a3b8;
}
.tsi-buddy-btn.tsi-on .tsi-buddy-dot { background: #16a34a; box-shadow: 0 0 0 2px rgba(34,197,94,0.25); }
.tsi-buddy-btn.tsi-on { border-color: #16a34a; color: #166534; }

.tsi-buddy-overlay {
  position: fixed; inset: 0; background: rgba(15,23,42,0.55); z-index: 9100;
  display: flex; align-items: center; justify-content: center;
  padding: 24px;
}
.tsi-buddy-overlay[hidden] { display: none; }

.tsi-buddy-modal {
  background: white; border-radius: 12px;
  max-width: 480px; width: 100%;
  padding: 24px 26px;
  box-shadow: 0 20px 60px rgba(15,23,42,0.35);
  font: 400 14px/1.55 'Inter', system-ui, sans-serif;
  color: #1e293b;
}
.tsi-buddy-modal h3 { margin: 0 0 8px; font-size: 1.2rem; color: #0f172a; }
.tsi-buddy-modal .tsi-buddy-sub { color: #64748b; font-size: 0.92em; margin: 0 0 16px; }
.tsi-buddy-modal label { display: block; margin-top: 14px; font-weight: 600; color: #334155; font-size: 0.9em; }
.tsi-buddy-modal input[type="password"],
.tsi-buddy-modal select,
.tsi-buddy-modal textarea {
  margin-top: 6px; width: 100%; box-sizing: border-box;
  padding: 9px 12px; border: 1px solid #cbd5e1; border-radius: 6px;
  font: inherit; color: #1e293b; background: #f8fafc;
}
.tsi-buddy-modal input[type="password"] { font-family: ui-monospace, Menlo, monospace; font-size: 0.92em; }
.tsi-buddy-modal .tsi-buddy-toggle { display: flex; align-items: center; gap: 8px; margin-top: 14px; cursor: pointer; }
.tsi-buddy-modal .tsi-buddy-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 22px; }
.tsi-buddy-modal button {
  font: 600 13px/1 'Inter', system-ui, sans-serif;
  padding: 9px 16px; border-radius: 6px; border: none; cursor: pointer;
}
.tsi-buddy-modal .tsi-buddy-secondary { background: white; color: #475569; border: 1px solid #cbd5e1; }
.tsi-buddy-modal .tsi-buddy-primary   { background: #1565c0; color: white; }
.tsi-buddy-modal .tsi-buddy-primary:hover { background: #0d47a1; }
.tsi-buddy-modal .tsi-buddy-secondary:hover { background: #f1f5f9; }
.tsi-buddy-modal small { color: #64748b; }

.tsi-buddy-chat {
  position: fixed; right: 14px; top: 56px; z-index: 9000;
  width: 380px; max-width: calc(100vw - 28px);
  height: 540px; max-height: calc(100vh - 72px);
  background: white; border: 1px solid #cbd5e1; border-radius: 12px;
  box-shadow: 0 12px 40px rgba(15,23,42,0.25);
  display: flex; flex-direction: column;
  overflow: hidden;
  font: 400 14px/1.55 'Inter', system-ui, sans-serif; color: #1e293b;
}
.tsi-buddy-chat[hidden] { display: none; }
.tsi-buddy-chat-head {
  background: linear-gradient(135deg, #1a3a5c 0%, #1e4d8c 100%);
  color: white; padding: 12px 14px;
  display: flex; align-items: center; justify-content: space-between;
}
.tsi-buddy-chat-head strong { font-size: 0.95em; }
.tsi-buddy-chat-head small  { color: rgba(255,255,255,0.78); font-size: 0.78em; display: block; margin-top: 2px; }
.tsi-buddy-chat-head button { background: transparent; border: none; color: white; cursor: pointer; font-size: 1.1em; line-height: 1; padding: 4px 8px; border-radius: 4px; }
.tsi-buddy-chat-head button:hover { background: rgba(255,255,255,0.16); }
.tsi-buddy-chat-body {
  flex: 1 1 auto; overflow-y: auto; padding: 14px 14px 6px;
  background: #f8fafc;
}
.tsi-buddy-bubble {
  margin: 8px 0; padding: 10px 13px; border-radius: 10px;
  word-wrap: break-word; overflow-wrap: anywhere; font-size: 0.93em;
}
.tsi-buddy-bubble.tsi-user      { background: #e3f2fd; color: #1a3a5c; border-bottom-right-radius: 2px; margin-left: 32px; }
.tsi-buddy-bubble.tsi-assistant { background: white; border: 1px solid #e2e8f0; margin-right: 32px; }
.tsi-buddy-bubble .tsi-buddy-role { font-size: 0.72em; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.4px; margin-bottom: 4px; }
.tsi-buddy-bubble.tsi-thinking { color: #94a3b8; font-style: italic; }
/* Markdown typography inside bubbles (rendered for assistant replies). */
.tsi-buddy-bubble .tsi-buddy-text > * { margin: 0; }
.tsi-buddy-bubble .tsi-buddy-text > * + * { margin-top: 6px; }
.tsi-buddy-bubble .tsi-buddy-text p { line-height: 1.55; }
.tsi-buddy-bubble .tsi-buddy-text strong { font-weight: 700; color: #0f172a; }
.tsi-buddy-bubble .tsi-buddy-text em { font-style: italic; }
.tsi-buddy-bubble .tsi-buddy-text ul,
.tsi-buddy-bubble .tsi-buddy-text ol { padding-left: 22px; }
.tsi-buddy-bubble .tsi-buddy-text li { margin: 2px 0; }
.tsi-buddy-bubble .tsi-buddy-text code {
  background: rgba(15,23,42,0.06); padding: 0 4px; border-radius: 3px;
  font-family: ui-monospace, Menlo, monospace; font-size: 0.92em;
}
.tsi-buddy-bubble .tsi-buddy-text pre {
  background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px;
  padding: 8px 10px; overflow-x: auto;
}
.tsi-buddy-bubble .tsi-buddy-text pre code { background: transparent; padding: 0; }
.tsi-buddy-bubble .tsi-buddy-text blockquote {
  border-left: 3px solid #cbd5e1; padding: 2px 10px; color: #475569;
  background: #f8fafc; border-radius: 4px;
}
.tsi-buddy-bubble .tsi-buddy-text h1,
.tsi-buddy-bubble .tsi-buddy-text h2,
.tsi-buddy-bubble .tsi-buddy-text h3,
.tsi-buddy-bubble .tsi-buddy-text h4 { font-weight: 700; color: #0f172a; }
.tsi-buddy-bubble .tsi-buddy-text h1 { font-size: 1.05em; }
.tsi-buddy-bubble .tsi-buddy-text h2 { font-size: 1.0em; }
.tsi-buddy-bubble .tsi-buddy-text h3,
.tsi-buddy-bubble .tsi-buddy-text h4 { font-size: 0.95em; }
.tsi-buddy-bubble .tsi-buddy-text hr { border: none; border-top: 1px solid #e2e8f0; }
.tsi-buddy-bubble .tsi-buddy-text a { color: #1565c0; text-decoration: underline; }
.tsi-buddy-error {
  background: #fee2e2; color: #7f1d1d; border: 1px solid #fecaca;
  padding: 8px 10px; border-radius: 6px; margin: 8px 14px; font-size: 0.85em;
}
.tsi-buddy-chat-foot {
  border-top: 1px solid #e2e8f0; padding: 10px 12px;
  display: flex; gap: 8px; align-items: flex-end;
  background: white;
}
.tsi-buddy-chat-foot textarea {
  flex: 1 1 auto; resize: none; min-height: 36px; max-height: 140px;
  padding: 8px 10px; border: 1px solid #cbd5e1; border-radius: 6px;
  font: inherit; color: #1e293b;
}
.tsi-buddy-chat-foot button {
  font: 600 13px/1 'Inter', system-ui, sans-serif;
  padding: 9px 14px; border-radius: 6px; border: none; cursor: pointer;
  background: #1565c0; color: white;
}
.tsi-buddy-chat-foot button:disabled { background: #94a3b8; cursor: default; }
.tsi-buddy-chat-foot button:hover:not(:disabled) { background: #0d47a1; }
.tsi-buddy-startbar {
  display: flex; gap: 8px; padding: 12px 14px;
  border-bottom: 1px solid #e2e8f0; background: #fafbfc;
}
.tsi-buddy-startbar button {
  flex: 1 1 auto; font: 600 13px/1 'Inter', system-ui, sans-serif;
  padding: 9px 12px; border-radius: 6px; border: 1px solid #1565c0;
  background: white; color: #1565c0; cursor: pointer;
}
.tsi-buddy-startbar button:hover { background: #e3f2fd; }
@media (max-width: 480px) {
  .tsi-buddy-chat { width: calc(100vw - 16px); right: 8px; top: 52px; bottom: 8px; height: auto; max-height: none; }
}
`;

  function injectStyles() {
    if (document.getElementById('tsi-buddy-styles')) return;
    var s = document.createElement('style');
    s.id = 'tsi-buddy-styles';
    s.textContent = STYLE;
    document.head.appendChild(s);
  }

  /* ---------- Markdown rendering ---------- */
  // The buddy returns markdown (bold, italic, lists, code, headers).
  // We lazily load `marked` from CDN and render assistant replies through it.
  // Until marked is loaded (or if it fails to load), we fall back to plain
  // text with newlines preserved as <br>.
  function loadMarked() {
    if (window.marked) return Promise.resolve(window.marked);
    if (window.__tsiMarkedLoading) return window.__tsiMarkedLoading;
    window.__tsiMarkedLoading = new Promise(function (resolve) {
      var s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/marked@12.0.2/marked.min.js';
      s.async = true;
      s.onload  = function () { resolve(window.marked || null); };
      s.onerror = function () { resolve(null); };
      document.head.appendChild(s);
    });
    return window.__tsiMarkedLoading;
  }

  /* ---------- KaTeX (for math in replies) ----------
     Lazy-load KaTeX + CSS when the host page doesn't already have it, so
     $...$ / $$...$$ in replies typeset instead of showing raw. */
  var KATEX_OPTS = {
    delimiters: [
      { left: '$$', right: '$$', display: true },
      { left: '$',  right: '$',  display: false }
    ],
    throwOnError: false
  };
  function loadKatex() {
    if (window.katex && window.katex.renderToString) return Promise.resolve(window.katex);
    if (window.__tsiKatexLoading) return window.__tsiKatexLoading;
    window.__tsiKatexLoading = new Promise(function (resolve) {
      if (!document.querySelector('link[data-tsi-katex]')) {
        var link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css';
        link.setAttribute('data-tsi-katex', '1');
        document.head.appendChild(link);
      }
      var s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js';
      s.onload  = function () { resolve(window.katex || null); };
      s.onerror = function () { resolve(null); };
      document.head.appendChild(s);
    });
    return window.__tsiKatexLoading;
  }

  // Light DOM sanitiser: walks the parsed tree and removes any tags / attrs
  // that could execute code if the model went rogue. Allow-listing all
  // safe markdown tags; strip everything else's dangerous attributes.
  function sanitizeHTML(html) {
    var div = document.createElement('div');
    div.innerHTML = html;
    var deny = ['script', 'style', 'iframe', 'object', 'embed', 'form',
                'input', 'button', 'textarea', 'select', 'meta', 'link', 'base'];
    deny.forEach(function (tag) {
      Array.from(div.getElementsByTagName(tag)).forEach(function (n) { n.remove(); });
    });
    Array.from(div.querySelectorAll('*')).forEach(function (n) {
      Array.from(n.attributes).forEach(function (a) {
        var name = a.name.toLowerCase();
        if (name.indexOf('on') === 0) { n.removeAttribute(a.name); return; }
        if (name === 'href' || name === 'src' || name === 'srcset') {
          var v = (a.value || '').replace(/\s/g, '');
          if (/^javascript:/i.test(v) || /^data:text\/html/i.test(v)) {
            n.removeAttribute(a.name);
          }
        }
      });
      // External links: open in new tab safely
      if (n.tagName === 'A' && n.getAttribute('href')) {
        n.setAttribute('target', '_blank');
        n.setAttribute('rel', 'noopener noreferrer');
      }
    });
    return div.innerHTML;
  }

  function escapeHTML(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function renderContent(text, isAssistant) {
    var div = document.createElement('div');
    div.className = 'tsi-buddy-text';
    var raw = text == null ? '' : String(text);
    if (isAssistant && window.marked && window.marked.parse) {
      try {
        /* Protect math from markdown (it mangles _ * \ inside $…$), then
           restore + typeset with KaTeX. */
        var math = [];
        var protectedSrc = raw
          .replace(/\$\$([\s\S]+?)\$\$/g, function (_m, body) {
            math.push({ display: true, tex: body }); return ' @@TSIMATH' + (math.length - 1) + '@@ ';
          })
          .replace(/\$([^\$\n]+?)\$/g, function (_m, body) {
            math.push({ display: false, tex: body }); return '@@TSIMATH' + (math.length - 1) + '@@';
          });
        var html = sanitizeHTML(window.marked.parse(protectedSrc, { breaks: true, gfm: true, mangle: false, headerIds: false }));
        var katexReady = window.katex && window.katex.renderToString;
        html = html.replace(/@@TSIMATH(\d+)@@/g, function (_m, i) {
          var item = math[Number(i)];
          if (!item) return '';
          if (katexReady) {
            try { return window.katex.renderToString(item.tex, { displayMode: item.display, throwOnError: false }); }
            catch (e) {}
          }
          var d = item.display ? '$$' : '$';
          return d + escapeHTML(item.tex) + d;
        });
        div.innerHTML = html;
        if (math.length && !katexReady) {
          loadKatex().then(function (k) {
            if (k && window.renderMathInElement) { try { window.renderMathInElement(div, KATEX_OPTS); } catch (e) {} }
          });
        }
        return div;
      } catch (e) { /* fall through to plain text */ }
    }
    // Plain-text fallback (user messages, or assistant before marked loads)
    div.innerHTML = escapeHTML(raw).replace(/\n/g, '<br>');
    return div;
  }

  /* ---------- Streaming Mistral call ---------- */
  function callMistralChat(apiKey, model, systemPrompt, messages, onDelta) {
    return fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: model || 'mistral-small-latest',
        temperature: 0.4,
        max_tokens: 1500,
        stream: true,
        messages: [{ role: 'system', content: systemPrompt }].concat(messages)
      })
    }).then(function (r) {
      if (!r.ok) {
        return r.text().then(function (t) {
          throw new Error('Mistral ' + r.status + ': ' + (t || 'request failed'));
        });
      }
      if (!r.body || !r.body.getReader) {
        return r.json().then(function (data) {
          if (!data.choices || !data.choices[0]) throw new Error('Mistral returned no choices.');
          var full = (data.choices[0].message.content || '').trim();
          if (onDelta) onDelta(full);
          return full;
        });
      }
      var reader = r.body.getReader();
      var decoder = new TextDecoder();
      var buf = '';
      var full = '';
      function pump() {
        return reader.read().then(function (res) {
          if (res.done) return full.trim();
          buf += decoder.decode(res.value, { stream: true });
          var lines = buf.split('\n');
          buf = lines.pop();
          for (var i = 0; i < lines.length; i++) {
            var ln = lines[i];
            if (ln.indexOf('data: ') !== 0) continue;
            var s = ln.substring(6).trim();
            if (s === '[DONE]') return full.trim();
            try {
              var d = JSON.parse(s);
              if (d.choices && d.choices[0] && d.choices[0].delta && d.choices[0].delta.content) {
                full += d.choices[0].delta.content;
                if (onDelta) onDelta(full);
              }
            } catch (e) {}
          }
          return pump();
        });
      }
      return pump();
    });
  }

  /* ---------- DOM helpers ---------- */
  function el(tag, attrs, kids) {
    var n = document.createElement(tag);
    if (attrs) for (var k in attrs) {
      if (k === 'class') n.className = attrs[k];
      else if (k === 'html') n.innerHTML = attrs[k];
      else if (k === 'text') n.textContent = attrs[k];
      else if (k.indexOf('on') === 0 && typeof attrs[k] === 'function') n.addEventListener(k.substring(2), attrs[k]);
      else if (attrs[k] === true) n.setAttribute(k, '');
      else if (attrs[k] != null && attrs[k] !== false) n.setAttribute(k, attrs[k]);
    }
    if (kids) (Array.isArray(kids) ? kids : [kids]).forEach(function (c) {
      if (c == null) return;
      n.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    });
    return n;
  }

  /* ---------- Mount ---------- */
  function mount(opts) {
    if (!opts || !opts.systemPrompt) {
      console.warn('TSIBuddy.mount: systemPrompt required');
      return null;
    }
    injectStyles();

    // ---- State (closure-scoped) ----
    var state = {
      apiKey:  lsGet(KEY_LS, ''),
      model:   lsGet(MODEL_LS, 'mistral-small-latest'),
      enabled: lsGet(ENABLE_LS, '') === '1',
      messages: [],     // {role, content}
      pending: '',
      status:  'idle',  // idle | loading | error
      error:   '',
      open:    false    // chat panel visible
    };
    if (state.apiKey) state.enabled = true; // having a key implies enabled

    // ---- Floating button ----
    var btnDot   = el('span', { class: 'tsi-buddy-dot' });
    var btnLabel = el('span', null, '🤖 TSI Buddy');
    var btnState = el('span', null, '');
    var btn = el('button', {
      class: 'tsi-buddy-btn',
      title: 'TSI Buddy — your study companion',
      onclick: function () {
        if (state.apiKey) toggleChat();
        else openSettings();
      }
    }, [btnDot, btnLabel, btnState]);
    document.body.appendChild(btn);

    // ---- Settings modal ----
    var keyInput = el('input', {
      type: 'password', autocomplete: 'off',
      placeholder: 'paste your Mistral key (starts with "sk-…")',
      value: state.apiKey,
      oninput: function (e) { state.apiKey = e.target.value; }
    });
    var modelSelect = el('select', {
      onchange: function (e) { state.model = e.target.value; }
    }, ['mistral-small-latest', 'mistral-medium-latest', 'mistral-large-latest'].map(function (m) {
      var o = el('option', { value: m }, m + (m === 'mistral-small-latest' ? ' (recommended)' : ''));
      if (m === state.model) o.selected = true;
      return o;
    }));
    var enableBox = el('input', {
      type: 'checkbox',
      onchange: function (e) { state.enabled = !!e.target.checked; }
    });
    enableBox.checked = state.enabled;
    var modalCard = el('div', { class: 'tsi-buddy-modal', onclick: function (e) { e.stopPropagation(); } }, [
      el('h3', null, '🤖 TSI Buddy'),
      el('p', { class: 'tsi-buddy-sub' }, opts.contextLabel
        ? ('You are reading: ' + opts.contextLabel + '. The buddy reads the page context and helps you understand worked examples — it does not give you the answer to your homework.')
        : 'A study companion. The buddy helps you understand the worked examples on this page.'),
      el('label', { class: 'tsi-buddy-toggle' }, [enableBox, el('span', null, 'Enable TSI Buddy on this page')]),
      el('label', null, 'Mistral API key'),
      keyInput,
      el('label', null, 'Model'),
      modelSelect,
      el('p', null, [el('small', null, 'Get a free key at '), el('a', { href: 'https://console.mistral.ai/api-keys/', target: '_blank' }, 'console.mistral.ai'), el('small', null, '. The key stays in your browser only.')]),
      el('div', { class: 'tsi-buddy-actions' }, [
        el('button', { class: 'tsi-buddy-secondary', onclick: function () { state.apiKey = ''; keyInput.value = ''; } }, 'Clear key'),
        el('button', { class: 'tsi-buddy-primary',   onclick: function () { saveSettings(); } }, 'Save')
      ])
    ]);
    var modalOverlay = el('div', { class: 'tsi-buddy-overlay', hidden: true, onclick: function () { closeSettings(); } }, [modalCard]);
    document.body.appendChild(modalOverlay);

    // ---- Chat panel ----
    var chatBody = el('div', { class: 'tsi-buddy-chat-body' });
    var chatErr  = el('div', { class: 'tsi-buddy-error', hidden: true });
    var inputBox = el('textarea', {
      rows: 1, placeholder: 'Ask about this page…',
      onkeydown: function (e) {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          sendUserMessage();
        }
      },
      oninput: function (e) { state.pending = e.target.value; sendBtn.disabled = !canSend(); autosize(e.target); }
    });
    var sendBtn = el('button', {
      onclick: function () { sendUserMessage(); }
    }, 'Send');
    sendBtn.disabled = true;

    var startBar = el('div', { class: 'tsi-buddy-startbar' });

    var chatFoot = el('div', { class: 'tsi-buddy-chat-foot' }, [inputBox, sendBtn]);

    var chatHead = el('div', { class: 'tsi-buddy-chat-head' }, [
      el('div', null, [
        el('strong', null, '🤖 TSI Buddy'),
        opts.contextLabel ? el('small', null, opts.contextLabel) : null
      ]),
      el('div', null, [
        el('button', { title: 'Settings', onclick: function () { openSettings(); } }, '⚙'),
        el('button', { title: 'Reset chat', onclick: function () { resetChat(); } }, '↺'),
        el('button', { title: 'Close', onclick: function () { closeChat(); } }, '×')
      ])
    ]);

    var chatPanel = el('div', { class: 'tsi-buddy-chat', hidden: true }, [
      chatHead, startBar, chatErr, chatBody, chatFoot
    ]);
    document.body.appendChild(chatPanel);

    // ---- Render ----
    function refreshButton() {
      if (state.apiKey && state.enabled) { btn.classList.add('tsi-on'); btnState.textContent = 'ON'; }
      else                                { btn.classList.remove('tsi-on'); btnState.textContent = 'off'; }
    }
    function autosize(t) {
      t.style.height = 'auto';
      t.style.height = Math.min(140, Math.max(36, t.scrollHeight)) + 'px';
    }
    function canSend() {
      return !!(state.apiKey && state.enabled && state.pending.trim() && state.status !== 'loading');
    }
    function refreshSendBtn() { sendBtn.disabled = !canSend(); }
    function refreshStartBar() {
      while (startBar.firstChild) startBar.removeChild(startBar.firstChild);
      if (state.messages.length > 0) { startBar.style.display = 'none'; return; }
      startBar.style.display = 'flex';
      if (opts.openingLine) {
        startBar.appendChild(el('button', {
          onclick: function () { startWith(opts.openingLine); }
        }, '🚀 Start with: "' + opts.openingLine.substring(0, 50) + (opts.openingLine.length > 50 ? '…' : '') + '"'));
      }
      startBar.appendChild(el('button', {
        onclick: function () { startWith('Help me understand the worked example on this page.'); }
      }, '💡 Generic walkthrough'));
    }
    function refreshChat() {
      while (chatBody.firstChild) chatBody.removeChild(chatBody.firstChild);
      state.messages.forEach(function (m, i) {
        var thinking = (state.status === 'loading' && i === state.messages.length - 1 && m.role === 'assistant' && !m.content);
        var displayText = m.content || (thinking ? '…' : '');
        var contentDiv = thinking
          ? (function () { var d = document.createElement('div'); d.className = 'tsi-buddy-text'; d.textContent = '…'; return d; })()
          : renderContent(displayText, m.role === 'assistant');
        var bubble = el('div', { class: 'tsi-buddy-bubble tsi-' + m.role }, [
          el('div', { class: 'tsi-buddy-role' }, m.role === 'assistant' ? '🤖 TSI Buddy' : '🧑 You'),
          contentDiv
        ]);
        if (thinking) bubble.classList.add('tsi-thinking');
        chatBody.appendChild(bubble);
      });
      if (state.status === 'error' && state.error) {
        chatErr.textContent = 'API error: ' + state.error;
        chatErr.hidden = false;
      } else {
        chatErr.hidden = true;
      }
      // scroll to bottom
      requestAnimationFrame(function () { chatBody.scrollTop = chatBody.scrollHeight; });
      refreshStartBar();
      refreshSendBtn();
    }

    // ---- Behaviour ----
    function openSettings()  { modalOverlay.hidden = false; setTimeout(function () { keyInput.focus(); }, 50); }
    function closeSettings() { modalOverlay.hidden = true; }
    function saveSettings() {
      lsSet(KEY_LS, state.apiKey || '');
      lsSet(MODEL_LS, state.model || 'mistral-small-latest');
      lsSet(ENABLE_LS, state.enabled ? '1' : '');
      closeSettings();
      refreshButton();
      if (state.apiKey && state.enabled) openChat();
    }
    function openChat()  { state.open = true; chatPanel.hidden = false; refreshChat(); inputBox.focus(); }
    function closeChat() { state.open = false; chatPanel.hidden = true; }
    function toggleChat(){ state.open ? closeChat() : openChat(); }
    function resetChat() { state.messages = []; state.pending = ''; state.status = 'idle'; state.error = ''; inputBox.value = ''; refreshChat(); }
    function startWith(line) {
      inputBox.value = line;
      state.pending = line;
      autosize(inputBox);
      sendUserMessage();
    }
    function sendUserMessage() {
      var draft = (state.pending || '').trim();
      if (!draft || !state.apiKey || state.status === 'loading') return;
      var userMsg = { role: 'user', content: draft };
      state.messages.push(userMsg);
      state.messages.push({ role: 'assistant', content: '' });
      state.pending = ''; inputBox.value = ''; autosize(inputBox);
      state.status = 'loading'; state.error = '';
      refreshChat();
      callMistralChat(state.apiKey, state.model, opts.systemPrompt, state.messages.slice(0, -1), function (full) {
        var last = state.messages[state.messages.length - 1];
        if (last && last.role === 'assistant') {
          last.content = full;
          refreshChat();
        }
      }).then(function () {
        state.status = 'idle';
        refreshChat();
      }).catch(function (err) {
        var last = state.messages[state.messages.length - 1];
        if (last && last.role === 'assistant' && !last.content) state.messages.pop();
        state.status = 'error';
        state.error = (err && err.message) || String(err);
        refreshChat();
      });
    }

    refreshButton();
    refreshChat();

    // Lazily fetch marked so assistant replies render markdown. If it
    // arrives mid-conversation, re-render so any plain-text bubbles get
    // upgraded to formatted ones.
    loadMarked().then(function (m) { if (m) refreshChat(); });

    // First-time arrival: nudge the modal open if no key set
    // (but not too aggressively — only on explicit click of the button).

    return {
      open: openChat, close: closeChat, toggle: toggleChat,
      reset: resetChat,
      destroy: function () {
        try { document.body.removeChild(btn); } catch (e) {}
        try { document.body.removeChild(modalOverlay); } catch (e) {}
        try { document.body.removeChild(chatPanel); } catch (e) {}
      }
    };
  }

  window.TSIBuddy = { mount: mount, __loaded: true };
})();
