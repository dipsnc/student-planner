package com.studentplanner.pomodoro;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "sessions")
public class Session {
    @Id
    private String id;
    private String type; // focus, short, long
    private long completedAt;
    private String day; // Date.toDateString()

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public long getCompletedAt() { return completedAt; }
    public void setCompletedAt(long completedAt) { this.completedAt = completedAt; }
    public String getDay() { return day; }
    public void setDay(String day) { this.day = day; }
}


