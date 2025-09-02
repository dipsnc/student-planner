package com.studentplanner.event;

import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class EventService {
    private final EventRepository repo;
    public EventService(EventRepository repo) { this.repo = repo; }

    public List<PlannerEvent> list() { return repo.findAll(); }
    public PlannerEvent upsert(PlannerEvent e) { return repo.save(e); }
    public void delete(String id) { repo.deleteById(id); }
}


