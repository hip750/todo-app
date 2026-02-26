const API_URL = 'http://localhost:8080/api/todos';

let currentFilter = 'all';
let allTodos = []; // 取得データのキャッシュ

// ===== 初期化 =====
window.addEventListener('load', () => {
    loadTodos();
    registerStaticListeners();
});

// ===== 静的要素へのイベント登録 =====
// HTMLが確定している要素は直接 addEventListener で登録する
function registerStaticListeners() {
    // 追加ボタン
    document.getElementById('btnAdd').addEventListener('click', addTodo);

    // タイトル入力欄でEnterキーを押したときも追加
    document.getElementById('addTitle').addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.isComposing) addTodo();
    });

    // フィルターボタン（親要素へのイベント委譲）
    // data-filter属性でどのボタンか識別する
    document.querySelector('.filter-buttons').addEventListener('click', (e) => {
        const btn = e.target.closest('button[data-filter]');
        if (!btn) return;
        filterTodos(btn, btn.dataset.filter);
    });

    // ToDoリストへのイベント委譲
    // 動的に生成される要素はDOMに存在しないため直接登録できない
    // 親要素（#todoList）に登録し、クリック対象をdata-action属性で振り分ける
    document.getElementById('todoList').addEventListener('click', onTodoListClick);
    document.getElementById('todoList').addEventListener('change', onTodoListChange);
}

// ===== ToDoリストのクリックをまとめて処理（イベント委譲） =====
function onTodoListClick(e) {
    // クリックされた要素から一番近い .todo-item を探してidを取得
    const item = e.target.closest('.todo-item');
    if (!item) return;
    const id = Number(item.dataset.id);

    // 削除ボタン
    if (e.target.closest('[data-action="delete"]')) {
        deleteTodo(id);
        return;
    }

    // キャンセルボタン
    if (e.target.closest('[data-action="cancel"]')) {
        renderTodos(); // 入力値を元に戻すため再描画
        return;
    }

    // 保存ボタン
    if (e.target.closest('[data-action="save"]')) {
        const completed = item.querySelector('[data-action="toggle"]').checked;
        saveEdit(id, completed);
        return;
    }

    // チェックボックスのクリックは change イベントで処理するためここでは無視
    if (e.target.closest('[data-action="toggle"]')) return;

    // 上記以外のtodo-view内クリック → 編集開始
    if (e.target.closest('.todo-view')) {
        openEdit(item);
    }
}

// ===== チェックボックスのchange（クリックとは別で拾う） =====
function onTodoListChange(e) {
    if (e.target.dataset.action !== 'toggle') return;
    const item = e.target.closest('.todo-item');
    const id   = Number(item.dataset.id);
    toggleTodo(id, e.target.checked);
}

// ===== データ取得 =====
async function loadTodos() {
    try {
        const res = await fetch(API_URL);
        allTodos  = await res.json();
        renderTodos();
    } catch (err) {
        console.error(err);
        alert('ToDoの読み込みに失敗しました');
    }
}

// ===== 描画 =====
function renderTodos() {
    const list  = document.getElementById('todoList');
    const empty = document.getElementById('emptyState');

    let todos = allTodos;
    if (currentFilter === 'active')    todos = todos.filter(t => !t.completed);
    if (currentFilter === 'completed') todos = todos.filter(t => t.completed);

    if (todos.length === 0) {
        list.style.display  = 'none';
        empty.style.display = 'block';
        return;
    }

    list.style.display  = 'block';
    empty.style.display = 'none';

    list.innerHTML = todos.map(buildTodoItemHtml).join('');
}

function buildTodoItemHtml(todo) {
    const due = getDueInfo(todo.dueDate);

    return `
        <li class="todo-item ${todo.completed ? 'completed' : ''} ${due.cls}"
            id="item-${todo.id}"
            data-id="${todo.id}">

            <!-- 表示行 -->
            <div class="todo-view">
                <input type="checkbox"
                       data-action="toggle"
                       ${todo.completed ? 'checked' : ''}>
                <div class="todo-content">
                    <div class="todo-title">${esc(todo.title)}</div>
                    ${todo.description
                        ? `<div class="todo-description">${esc(todo.description)}</div>`
                        : ''}
                    ${due.label
                        ? `<div class="todo-meta ${due.metaCls}">${due.label}</div>`
                        : ''}
                </div>
                <button class="btn-delete" data-action="delete">削除</button>
            </div>

            <!-- 編集フォーム（.editing クラスで表示） -->
            <div class="todo-edit">
                <input type="text"
                       id="edit-title-${todo.id}"
                       value="${esc(todo.title)}"
                       placeholder="タイトル">
                <textarea id="edit-desc-${todo.id}"
                          placeholder="詳細説明">${esc(todo.description || '')}</textarea>
                <div class="edit-row">
                    <label for="edit-due-${todo.id}">期限日：</label>
                    <input type="date"
                           id="edit-due-${todo.id}"
                           value="${todo.dueDate || ''}">
                </div>
                <div class="edit-actions">
                    <button class="btn-cancel" data-action="cancel">キャンセル</button>
                    <button class="btn-save"   data-action="save">保存</button>
                </div>
            </div>
        </li>`;
}

// ===== 期限日の判定 =====
function getDueInfo(dueDate) {
    if (!dueDate) return { cls: '', metaCls: '', label: '' };

    const today = new Date(); today.setHours(0, 0, 0, 0);
    const due   = new Date(dueDate); due.setHours(0, 0, 0, 0);
    const diff  = Math.round((due - today) / 86400000);

    if (diff < 0)   return { cls: 'overdue',   metaCls: 'meta-overdue', label: `⚠️ 期限切れ（${dueDate}）` };
    if (diff === 0) return { cls: 'due-today', metaCls: 'meta-today',   label: `🔥 今日が期限！` };
    if (diff <= 3)  return { cls: 'due-soon',  metaCls: 'meta-soon',    label: `⏰ 期限まであと${diff}日（${dueDate}）` };
    return { cls: '', metaCls: 'meta-normal', label: `📅 期限：${dueDate}` };
}

// ===== 編集の開始 =====
function openEdit(item) {
    if (item.classList.contains('editing')) return;
    // 他に開いている編集フォームを閉じる
    document.querySelectorAll('.todo-item.editing').forEach(el => el.classList.remove('editing'));
    item.classList.add('editing');
}

// ===== フィルター =====
function filterTodos(btn, filter) {
    currentFilter = filter;
    document.querySelectorAll('.filter-buttons button')
        .forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderTodos(); // 再フェッチせずキャッシュから再描画
}

// ===== CRUD =====
async function addTodo() {
    const title = document.getElementById('addTitle').value.trim();
    if (!title) { alert('タイトルを入力してください'); return; }

    await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            title,
            description: document.getElementById('addDescription').value.trim(),
            completed: false,
            dueDate: document.getElementById('addDueDate').value || null,
        }),
    });

    document.getElementById('addTitle').value       = '';
    document.getElementById('addDescription').value = '';
    document.getElementById('addDueDate').value      = '';

    loadTodos();
}

async function saveEdit(id, completed) {
    const title = document.getElementById(`edit-title-${id}`).value.trim();
    if (!title) { alert('タイトルを入力してください'); return; }

    await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            title,
            description: document.getElementById(`edit-desc-${id}`).value.trim(),
            completed,
            dueDate: document.getElementById(`edit-due-${id}`).value || null,
        }),
    });

    loadTodos();
}

async function toggleTodo(id, completed) {
    const todo = allTodos.find(t => t.id === id);
    await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...todo, completed }),
    });
    loadTodos();
}

async function deleteTodo(id) {
    if (!confirm('このToDoを削除しますか？')) return;
    await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
    loadTodos();
}

// ===== ユーティリティ =====
function esc(text) {
    if (!text) return '';
    const d = document.createElement('div');
    d.textContent = text;
    return d.innerHTML;
}