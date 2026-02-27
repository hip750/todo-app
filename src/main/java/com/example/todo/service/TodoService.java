package com.example.todo.service;

import com.example.todo.dto.TodoRequestDTO;
import com.example.todo.dto.TodoResponseDTO;
import com.example.todo.repository.TodoRepository;

import java.util.List;

public interface TodoService {
    List<TodoResponseDTO> getAllTodos();
    TodoResponseDTO getTodoById(Long id);
    TodoResponseDTO createTodo(TodoRequestDTO requestDTO);
    TodoResponseDTO updateTodo(Long id, TodoRequestDTO requestDTO);
    void deleteTodo(Long id);
    List<TodoResponseDTO> getTodosByCompleted(Boolean completed);

    // タイトル検索
    List<TodoResponseDTO> searchByTitle(String keyword);
    // 作成日ソート
    List<TodoResponseDTO> getAllTodosSorted(String sortDirection);
}
