package com.example.todo.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TodoRequestDTO {
    private String title;
    private String description;
    private Boolean completed;
    private LocalDate dueDate;
}
