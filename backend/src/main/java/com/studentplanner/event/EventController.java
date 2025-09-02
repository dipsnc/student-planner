package com.studentplanner.event;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/events")
public class EventController {
    private final EventService service;
    public EventController(EventService service) { this.service = service; }

    @GetMapping
    public List<PlannerEvent> list() { return service.list(); }

    @PostMapping
    public PlannerEvent create(@RequestBody PlannerEvent e) { return service.upsert(e); }

    @PutMapping("/{id}")
    public ResponseEntity<PlannerEvent> update(@PathVariable String id, @RequestBody PlannerEvent e) {
        e.setId(id);
        return ResponseEntity.ok(service.upsert(e));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) { service.delete(id); return ResponseEntity.noContent().build(); }
}


