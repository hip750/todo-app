package com.example.todo.service;

import com.example.todo.dto.TodoRequestDTO;
import com.example.todo.dto.TodoResponseDTO;
import com.example.todo.entity.Todo;
import com.example.todo.repository.TodoRepository;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class TodoServiceImpl implements TodoService {

    private final TodoRepository todoRepository;

    @Override
    public List<TodoResponseDTO> getAllTodos() {
        return todoRepository.findAll().stream()
                .map(TodoResponseDTO::fromEntity)
                .collect(Collectors.toList());
    }

    @Override
    public TodoResponseDTO getTodoById(Long id) {
        Todo todo = todoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Todo not found with id: " + id));
        return TodoResponseDTO.fromEntity(todo);
    }

    @Override
    public TodoResponseDTO createTodo(TodoRequestDTO requestDTO) {
        Todo todo = new Todo();
        todo.setTitle(requestDTO.getTitle());
        todo.setDescription(requestDTO.getDescription());
        todo.setCompleted(requestDTO.getCompleted() != null ? requestDTO.getCompleted() : false);
        todo.setDueDate(requestDTO.getDueDate());

        Todo savedTodo = todoRepository.save(todo);
        return TodoResponseDTO.fromEntity(savedTodo);
    }

    @Override
    public TodoResponseDTO updateTodo(Long id, TodoRequestDTO requestDTO) {
        Todo todo = todoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Todo not found with id: " + id));

        todo.setTitle(requestDTO.getTitle());
        todo.setDescription(requestDTO.getDescription());
        todo.setCompleted(requestDTO.getCompleted());
        todo.setDueDate(requestDTO.getDueDate());

        Todo updatedTodo = todoRepository.save(todo);
        return TodoResponseDTO.fromEntity(updatedTodo);
    }

    @Override
    public void deleteTodo(Long id) {
        if (!todoRepository.existsById(id)) {
            throw new RuntimeException("Todo not found with id: " + id);
        }
        todoRepository.deleteById(id);
    }

    @Override
    public List<TodoResponseDTO> getTodosByCompleted(Boolean completed) {
        return todoRepository.findByCompleted(completed).stream()
                .map(TodoResponseDTO::fromEntity)
                .collect(Collectors.toList());
    }

    @Override
    public List<TodoResponseDTO> searchByTitle(String keyword) {
        return todoRepository.findByTitleContaining(keyword).stream()
                .map(TodoResponseDTO::fromEntity)
                .collect(Collectors.toList());
    }

    @Override
    public List<TodoResponseDTO> getAllTodosSorted(String sortDirection) {
        Sort sort = sortDirection.equalsIgnoreCase("asc")
                ? Sort.by(Sort.Direction.ASC, "createAt")
                : Sort.by(Sort.Direction.DESC, "createAt");

        return todoRepository.findAll(sort).stream()
                .map(TodoResponseDTO::fromEntity)
                .collect(Collectors.toList());
    }
}