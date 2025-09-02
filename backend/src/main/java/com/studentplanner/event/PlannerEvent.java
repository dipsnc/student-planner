package com.studentplanner.event;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "events")
public class PlannerEvent {
    @Id
    private String id;
    private String title;
    private int day; // 0-6
    private String time;
    private String linkTaskId; // optional

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public int getDay() { return day; }
    public void setDay(int day) { this.day = day; }
    public String getTime() { return time; }
    public void setTime(String time) { this.time = time; }
    public String getLinkTaskId() { return linkTaskId; }
    public void setLinkTaskId(String linkTaskId) { this.linkTaskId = linkTaskId; }
}


