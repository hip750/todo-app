// =============================================================
// 定数・状態管理
// =============================================================
const API_URL = 'http://localhost:8080/api/todos';

// UI状態をオブジェクトで管理
const state = {
    filter:  'all',   // 'all' | 'active' | 'completed'
    sort:    'desc',  // 'desc'（新しい順） | 'asc'（古い順）
    keyword: '',      // 検索キーワード
};

// =============================================================
// 初期化
// =============================================================
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    loadTodos();
});

function setupEventListeners() {
    // 追加フォーム
    document.getElementById('btnAdd').addEventListener('click', handleAddTodo);
    document.getElementById('addTitle').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') handleAddTodo();
    });

    // 検索バー
    document.getElementById('searchInput').addEventListener('input', (e) => {
        state.keyword = e.target.value.trim();
        // クリアボタンの表示切り替え
        document.getElementById('btnClearSearch')
            .classList.toggle('visible', state.keyword.length > 0);
        loadTodos();
    });

    document.getElementById('btnClearSearch').addEventListener('click', () => {
        state.keyword = '';
        document.getElementById('searchInput').value = '';
        document.getElementById('btnClearSearch').classList.remove('visible');
        loadTodos();
    });

    // フィルターボタン
    document.querySelectorAll('.filter-buttons button').forEach((btn) => {
        btn.addEventListener('click', () => {
            state.filter = btn.dataset.filter;
            setActiveButton('.filter-buttons button', btn);
            loadTodos();
        });
    });

    // ソートボタン
    document.querySelectorAll('.sort-buttons button').forEach((btn) => {
        btn.addEventListener('click', () => {
            state.sort = btn.dataset.sort;
            setActiveButton('.sort-buttons button', btn);
            loadTodos();
        });
    });
}

// =============================================================
// API 呼び出し
// =============================================================

/**
 * state に応じたURLでToDoを取得して描画する
 */
async function loadTodos() {
    try {
        const url = buildApiUrl();
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        let todos = await res.json();

        // キーワード検索時はサーバーがソートを保証しないので
        // クライアント側でもソートをかける
        if (state.keyword) {
            todos = clientSort(todos);
        }

        renderTodos(todos);
    } catch (err) {
        console.error('取得失敗:', err);
        showEmptyState('ToDoの読み込みに失敗しました。サーバーを確認してください。');
    }
}

/**
 * state からAPIのURLを組み立てる
 *   - キーワードあり → 検索API  GET /api/todos/search?keyword=xxx
 *   - キーワードなし → ソートAPI GET /api/todos/sorted?sortDirection=desc
 */
function buildApiUrl() {
    if (state.keyword) {
        return `${API_URL}/search?keyword=${encodeURIComponent(state.keyword)}`;
    }
    return `${API_URL}/sorted?sortDirection=${state.sort}`;
}

// =============================================================
// CRUD 操作
// =============================================================

async function handleAddTodo() {
    const title       = document.getElementById('addTitle').value.trim();
    const description = document.getElementById('addDescription').value.trim();
    const dueDate     = document.getElementById('addDueDate').value || null;

    if (!title) {
        alert('タイトルを入力してください');
        document.getElementById('addTitle').focus();
        return;
    }

    try {
        const res = await fetch(API_URL, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ title, description, dueDate, completed: false }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        // フォームをリセット
        document.getElementById('addTitle').value       = '';
        document.getElementById('addDescription').value = '';
        document.getElementById('addDueDate').value     = '';

        loadTodos();
    } catch (err) {
        console.error('追加失敗:', err);
        alert('ToDoの追加に失敗しました');
    }
}

/**
 * チェックボックスの変更：completed だけ反転させて PUT する
 * 編集フォームが開いている場合は何もしない（意図しない切り替えを防ぐ）
 */
async function handleToggle(id) {
    try {
        const getRes = await fetch(`${API_URL}/${id}`);
        if (!getRes.ok) throw new Error(`HTTP ${getRes.status}`);
        const todo = await getRes.json();

        // 編集中アイテムはトグルしない
        const li = document.querySelector(`.todo-item[data-id="${id}"]`);
        if (li && li.classList.contains('editing')) return;

        const putRes = await fetch(`${API_URL}/${id}`, {
            method:  'PUT',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({
                title:       todo.title,
                description: todo.description,
                dueDate:     todo.dueDate ?? null,
                completed:   !todo.completed,
            }),
        });
        if (!putRes.ok) throw new Error(`HTTP ${putRes.status}`);
        loadTodos();
    } catch (err) {
        console.error('更新失敗:', err);
        alert('ToDoの更新に失敗しました');
    }
}

/**
 * 編集フォームの保存ボタン：タイトル・説明・期限日を PUT する
 */
async function handleSave(id) {
    const li    = document.querySelector(`.todo-item[data-id="${id}"]`);
    const title = li.querySelector('.edit-title').value.trim();
    if (!title) { alert('タイトルを入力してください'); return; }

    const description = li.querySelector('.edit-description').value.trim();
    const dueDate     = li.querySelector('.edit-due').value || null;
    // 現在の completed 値は data 属性から読む
    const completed   = li.dataset.completed === 'true';

    try {
        const res = await fetch(`${API_URL}/${id}`, {
            method:  'PUT',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ title, description, dueDate, completed }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        loadTodos();
    } catch (err) {
        console.error('保存失敗:', err);
        alert('ToDoの保存に失敗しました');
    }
}

async function handleDelete(id) {
    if (!confirm('このToDoを削除しますか？')) return;
    try {
        const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        loadTodos();
    } catch (err) {
        console.error('削除失敗:', err);
        alert('ToDoの削除に失敗しました');
    }
}

// =============================================================
// 描画
// =============================================================

function renderTodos(todos) {
    // completed / active フィルタをクライアント側で適用
    const filtered = clientFilter(todos);

    if (filtered.length === 0) {
        document.getElementById('todoList').innerHTML = '';
        showEmptyState('ToDoがありません');
        return;
    }

    hideEmptyState();
    document.getElementById('todoList').innerHTML = filtered.map(buildTodoHtml).join('');

    // ── イベント登録（描画後に一括で行う） ──────────
    document.querySelectorAll('.todo-item').forEach((li) => {
        const id = Number(li.dataset.id);

        // チェックボックス → 完了トグル
        li.querySelector('input[type="checkbox"]')
            .addEventListener('change', () => handleToggle(id));

        // .todo-view クリック → 編集フォーム開閉
        // ただしチェックボックスや削除ボタンのクリックは除外
        li.querySelector('.todo-view').addEventListener('click', (e) => {
            if (e.target.type === 'checkbox') return;
            if (e.target.classList.contains('btn-delete')) return;
            toggleEditForm(li);
        });

        // 削除ボタン
        li.querySelector('.btn-delete')
            .addEventListener('click', () => handleDelete(id));

        // 保存ボタン
        li.querySelector('.btn-save')
            .addEventListener('click', () => handleSave(id));

        // キャンセルボタン
        li.querySelector('.btn-cancel')
            .addEventListener('click', () => li.classList.remove('editing'));
    });
}

/**
 * 編集フォームの開閉（他のアイテムが開いていれば閉じる）
 */
function toggleEditForm(targetLi) {
    const isEditing = targetLi.classList.contains('editing');

    // 全アイテムの編集フォームを閉じる
    document.querySelectorAll('.todo-item.editing')
        .forEach((li) => li.classList.remove('editing'));

    // 対象が閉じていたなら開く
    if (!isEditing) {
        targetLi.classList.add('editing');
    }
}

// =============================================================
// HTML テンプレート
// =============================================================

function buildTodoHtml(todo) {
    const { dueCls, metaCls, metaTxt } = buildDueMeta(todo.dueDate, todo.completed);

    return `
    <li class="todo-item ${todo.completed ? 'completed' : ''} ${dueCls}"
        data-id="${todo.id}"
        data-completed="${todo.completed}">

        <!-- 表示行（クリックで編集フォームを開閉） -->
        <div class="todo-view">
            <input type="checkbox" ${todo.completed ? 'checked' : ''}>
            <div class="todo-content">
                <div class="todo-title">${escapeHtml(todo.title)}</div>
                ${todo.description
                    ? `<div class="todo-description">${escapeHtml(todo.description)}</div>`
                    : ''}
                ${metaTxt
                    ? `<div class="todo-meta ${metaCls}">${metaTxt}</div>`
                    : ''}
            </div>
            <button class="btn-delete">削除</button>
        </div>

        <!-- 編集フォーム（.editing クラスがついたとき表示） -->
        <div class="todo-edit">
            <input class="edit-title" type="text" value="${escapeHtml(todo.title)}">
            <textarea class="edit-description">${escapeHtml(todo.description ?? '')}</textarea>
            <div class="edit-row">
                <label>期限日：</label>
                <input class="edit-due" type="date" value="${todo.dueDate ?? ''}">
            </div>
            <div class="edit-actions">
                <button class="btn-cancel">キャンセル</button>
                <button class="btn-save">保存</button>
            </div>
        </div>
    </li>`;
}

/**
 * 期限日に応じたCSSクラスと表示テキストを返す
 */
function buildDueMeta(dueDate, completed) {
    if (!dueDate || completed) {
        return { dueCls: '', metaCls: 'meta-normal', metaTxt: dueDate ? `期限：${dueDate}` : '' };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due   = new Date(dueDate);
    const diffDays = Math.ceil((due - today) / 86400000);

    if (diffDays < 0)  return { dueCls: 'overdue',   metaCls: 'meta-overdue', metaTxt: `⚠ 期限切れ（${dueDate}）` };
    if (diffDays === 0) return { dueCls: 'due-today', metaCls: 'meta-today',   metaTxt: `🔥 今日が期限（${dueDate}）` };
    if (diffDays <= 3)  return { dueCls: 'due-soon',  metaCls: 'meta-soon',    metaTxt: `⚡ 期限まで${diffDays}日（${dueDate}）` };

    return { dueCls: '', metaCls: 'meta-normal', metaTxt: `期限：${dueDate}` };
}

// =============================================================
// クライアント側フィルタ・ソート
// =============================================================

function clientFilter(todos) {
    if (state.filter === 'active')    return todos.filter((t) => !t.completed);
    if (state.filter === 'completed') return todos.filter((t) => t.completed);
    return todos;
}

// 検索時にサーバーがソートを保証しないため、クライアント側でもソートする
function clientSort(todos) {
    return [...todos].sort((a, b) => {
        const diff = new Date(a.createdAt) - new Date(b.createdAt);
        return state.sort === 'asc' ? diff : -diff;
    });
}

// =============================================================
// ユーティリティ
// =============================================================

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function setActiveButton(selector, activeBtn) {
    document.querySelectorAll(selector).forEach((b) => b.classList.remove('active'));
    activeBtn.classList.add('active');
}

function showEmptyState(msg) {
    document.getElementById('todoList').innerHTML = '';
    const el = document.getElementById('emptyState');
    el.textContent = msg;
    el.style.display = 'block';
}

function hideEmptyState() {
    document.getElementById('emptyState').style.display = 'none';
}