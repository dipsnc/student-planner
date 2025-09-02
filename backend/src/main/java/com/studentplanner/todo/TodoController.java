package com.studentplanner.todo;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/todos")
public class TodoController {
    private final TodoService service;
    public TodoController(TodoService service) { this.service = service; }

    @GetMapping
    public List<Todo> list() { return service.list(); }

    @GetMapping("/{id}")
    public ResponseEntity<Todo> get(@PathVariable String id) {
        Todo t = service.get(id);
        return t == null ? ResponseEntity.notFound().build() : ResponseEntity.ok(t);
    }

    @PostMapping
    public Todo create(@RequestBody Todo t) { return service.create(t); }

    @PutMapping("/{id}")
    public ResponseEntity<Todo> update(@PathVariable String id, @RequestBody Todo updates) {
        Todo t = service.update(id, updates);
        return t == null ? ResponseEntity.notFound().build() : ResponseEntity.ok(t);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) { service.delete(id); return ResponseEntity.noContent().build(); }
}


