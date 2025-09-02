package com.studentplanner.pomodoro;

import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class SessionService {
    private final SessionRepository repo;
    public SessionService(SessionRepository repo) { this.repo = repo; }

    public List<Session> list() { return repo.findAll(); }
    public Session create(Session s) { return repo.save(s); }
}


