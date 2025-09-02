package com.studentplanner.pomodoro;

import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/sessions")
public class SessionController {
    private final SessionService service;
    public SessionController(SessionService service) { this.service = service; }

    @GetMapping
    public List<Session> list() { return service.list(); }

    @PostMapping
    public Session create(@RequestBody Session s) { return service.create(s); }
}


