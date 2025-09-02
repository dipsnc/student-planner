package com.studentplanner.todo;

import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class TodoService {
    private final TodoRepository repo;

    public TodoService(TodoRepository repo) {
        this.repo = repo;
    }

    public List<Todo> list() { return repo.findAll(); }
    public Todo get(String id) { return repo.findById(id).orElse(null); }
    public Todo create(Todo t) { return repo.save(t); }
    public Todo update(String id, Todo updates) {
        Todo t = get(id);
        if (t == null) return null;
        if (updates.getTitle() != null) t.setTitle(updates.getTitle());
        if (updates.getDueAt() != null) t.setDueAt(updates.getDueAt());
        t.setReminder(updates.isReminder());
        t.setDone(updates.isDone());
        return repo.save(t);
    }
    public void delete(String id) { repo.deleteById(id); }
}


