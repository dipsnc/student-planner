package com.studentplanner.event;

import org.springframework.data.jpa.repository.JpaRepository;

public interface EventRepository extends JpaRepository<PlannerEvent, String> {
}


