const API_URL = 'http://localhost:8080/api/todos';
let currentFilter = 'all';

// ページ読み込み時にToDoを取得
window.addEventListener('load', () => {
    loadTodos();
});

// ToDoを読み込む
async function loadTodos() {
    try {
        const response = await fetch(API_URL);
        const todos = await response.json();
        renderTodos(todos);
    } catch (error) {
        console.error('Error loading todos:', error);
        alert('ToDoの読み込みに失敗しました');
    }
}

// ToDoを画面に表示
function renderTodos(todos) {
    const todoList = document.getElementById('todoList');
    const emptyState = document.getElementById('emptyState');
    
    // フィルタリング
    let filteredTodos = todos;
    if (currentFilter === 'active') {
        filteredTodos = todos.filter(todo => !todo.completed);
    } else if (currentFilter === 'completed') {
        filteredTodos = todos.filter(todo => todo.completed);
    }
    
    // 空の状態を表示
    if (filteredTodos.length === 0) {
        todoList.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }
    
    todoList.style.display = 'block';
    emptyState.style.display = 'none';
    
    // ToDoリストをHTML化
    todoList.innerHTML = filteredTodos.map(todo => `
        <li class="todo-item ${todo.completed ? 'completed' : ''}">
            <input 
                type="checkbox" 
                ${todo.completed ? 'checked' : ''}
                onchange="toggleTodo(${todo.id}, ${!todo.completed})"
            >
            <div class="todo-content">
                <div class="todo-title">${escapeHtml(todo.title)}</div>
                ${todo.description ? `<div class="todo-description">${escapeHtml(todo.description)}</div>` : ''}
            </div>
            <button class="delete-btn" onclick="deleteTodo(${todo.id})">削除</button>
        </li>
    `).join('');
}

// HTMLエスケープ（XSS対策）
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ToDoを追加
async function addTodo() {
    const input = document.getElementById('todoInput');
    const title = input.value.trim();
    
    if (!title) {
        alert('ToDoを入力してください');
        return;
    }
    
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                title: title,
                description: '',
                completed: false
            })
        });
        
        if (response.ok) {
            input.value = '';
            loadTodos();
        } else {
            alert('ToDoの追加に失敗しました');
        }
    } catch (error) {
        console.error('Error adding todo:', error);
        alert('ToDoの追加に失敗しました');
    }
}

// ToDoの完了状態を切り替え
async function toggleTodo(id, completed) {
    try {
        // まず該当のToDoを取得
        const getResponse = await fetch(`${API_URL}/${id}`);
        const todo = await getResponse.json();
        
        // 完了状態を更新
        const updateResponse = await fetch(`${API_URL}/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                title: todo.title,
                description: todo.description,
                completed: completed
            })
        });
        
        if (updateResponse.ok) {
            loadTodos();
        } else {
            alert('ToDoの更新に失敗しました');
        }
    } catch (error) {
        console.error('Error toggling todo:', error);
        alert('ToDoの更新に失敗しました');
    }
}

// ToDoを削除
async function deleteTodo(id) {
    if (!confirm('このToDoを削除しますか？')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            loadTodos();
        } else {
            alert('ToDoの削除に失敗しました');
        }
    } catch (error) {
        console.error('Error deleting todo:', error);
        alert('ToDoの削除に失敗しました');
    }
}

// フィルタリング
function filterTodos(filter) {
    currentFilter = filter;
    
    // ボタンのアクティブ状態を更新
    document.querySelectorAll('.filter-buttons button').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    loadTodos();
}