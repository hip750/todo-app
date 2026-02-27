package com.example.todo.repository;

import com.example.todo.entity.Todo;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TodoRepository extends JpaRepository<Todo, Long> {

    // 完了状態で絞り込み
    List<Todo> findByCompleted(Boolean completed);

    // タイトルで部分一致検索
    List<Todo> findByTitleContaining(String keyword);

    // 検索 + ソート
    List<Todo> findByTitleContaining(String keyword, Sort sort);
}
