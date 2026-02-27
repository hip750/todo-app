package com.example.todo.controller;

import com.example.todo.dto.TodoRequestDTO;
import com.example.todo.dto.TodoResponseDTO;
import com.example.todo.service.TodoService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/todos")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class TodoController {

    private final TodoService todoService;

    // 全権取得
    @GetMapping
    public ResponseEntity<List<TodoResponseDTO>> getAllTodos() {
        List<TodoResponseDTO> todos = todoService.getAllTodos();
        return ResponseEntity.ok(todos);
    }

    // ID指定で取得
    @GetMapping("/{id}")
    public ResponseEntity<TodoResponseDTO> getTodoById(@PathVariable Long id) {
        TodoResponseDTO todo = todoService.getTodoById(id);
        return ResponseEntity.ok(todo);
    }

    // 新規作成
    @PostMapping
    public ResponseEntity<TodoResponseDTO> createTodo(@RequestBody TodoRequestDTO requestDTO) {
        TodoResponseDTO createTodo = todoService.createTodo(requestDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(createTodo);
    }

    // 更新
    @PutMapping("/{id}")
    public ResponseEntity<TodoResponseDTO> updateTodo(
            @PathVariable Long id,
            @RequestBody TodoRequestDTO requestDTO) {
        TodoResponseDTO updateTodo = todoService.updateTodo(id, requestDTO);
        return ResponseEntity.ok(updateTodo);
    }

    // 削除
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTodo(@PathVariable Long id) {
        todoService.deleteTodo(id);
        return ResponseEntity.noContent().build();
    }

    // 完了・未完了で絞り込み
    @GetMapping("/filter")
    public ResponseEntity<List<TodoResponseDTO>> getTodoByCompleted(
            @RequestParam Boolean completed) {
        List<TodoResponseDTO> todos = todoService.getTodosByCompleted(completed);
        return ResponseEntity.ok(todos);
    }

    // タイトル検索
    @GetMapping("/search")
    public ResponseEntity<List<TodoResponseDTO>> searchByTitle(
            @RequestParam String keyword) {
        List<TodoResponseDTO> todos = todoService.searchByTitle(keyword);
        return ResponseEntity.ok(todos);
    }

    // 作成日ソート
    @GetMapping("/sorted")
    public ResponseEntity<List<TodoResponseDTO>> getSortedTodos(
            @RequestParam(defaultValue = "desc") String sortDirection) {
        List<TodoResponseDTO> todos = todoService.getAllTodosSorted(sortDirection);
        return ResponseEntity.ok(todos);
    }
}