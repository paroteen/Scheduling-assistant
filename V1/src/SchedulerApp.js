// src/SchedulerApp.js
import React, { useState, useEffect, useMemo } from 'react';
import FullCalendar from '@fullcalendar/react';
import resourceTimelinePlugin from '@fullcalendar/resource-timeline';
import interactionPlugin from '@fullcalendar/interaction';
import './App.css';

// --- Helper Functions ---
const timeToMinutes = (time) => {
  if (!time) return 0;
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

const minutesToTime = (minutes) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

// --- Main Component ---
export default function SchedulerApp({ employees, rules, weekStart, events, onEventsGenerated, onEventClick }) {
  const [isLoading, setIsLoading] = useState(true);

  const emailToEmployeeMap = useMemo(() => {
    const map = new Map();
    for (const name in employees) {
      if (employees[name].email) map.set(employees[name].email, name);
    }
    return map;
  }, [employees]);

  const resources = useMemo(() => {
    return Object.keys(employees).map(name => ({ id: name, title: name }));
  }, [employees]);

  useEffect(() => {
    const generateAndFetchSchedule = async () => {
      if (!rules.coverage || Object.keys(employees).length === 0) return;

      setIsLoading(true);
      const startDate = new Date(weekStart);
      const finalEvents = [];
      
      const blockedIntervals = {};
      try {
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 7);
        const response = await fetch(`/api/events?start=${startDate.toISOString()}&end=${endDate.toISOString()}`);
        const externalEventsRaw = await response.json();

        for (const event of externalEventsRaw) {
          if (event.attendees) {
            for (const attendeeEmail of event.attendees) {
              if (emailToEmployeeMap.has(attendeeEmail)) {
                const employeeName = emailToEmployeeMap.get(attendeeEmail);
                if (!blockedIntervals[employeeName]) {
                  blockedIntervals[employeeName] = [];
                }
                blockedIntervals[employeeName].push({
                  start: new Date(event.start),
                  end: new Date(event.end)
                });
                
                finalEvents.push({
                  id: event.id + '-' + employeeName, resourceId: employeeName,
                  title: event.title, start: event.start, end: event.end, allDay: event.allDay,
                  backgroundColor: '#dc3545', borderColor: '#dc3545',
                });
              }
            }
          }
        }
      } catch (error) {
        console.error("Error fetching external events:", error);
      }

      for (let i = 0; i < 7; i++) {
        const dailyAssignments = {};
        for (const empName in employees) {
          dailyAssignments[empName] = {};
        }

        for (let minOfDay = timeToMinutes('07:00'); minOfDay < timeToMinutes('22:00'); minOfDay += 30) {
          const currentDate = new Date(startDate);
          currentDate.setDate(startDate.getDate() + i);
          currentDate.setHours(0, 0, 0, 0);
          currentDate.setMinutes(minOfDay);
          const timeStr = minutesToTime(minOfDay);

          let availablePool = Object.keys(employees).filter(empName => {
            const emp = employees[empName];
            const startMin = timeToMinutes(emp.shift.start);
            const endMin = timeToMinutes(emp.shift.end);
            const lunchStartMin = timeToMinutes(emp.lunch.start);
            const lunchEndMin = timeToMinutes(emp.lunch.end);
            const isBlocked = blockedIntervals[empName]?.some(interval => 
                currentDate >= interval.start && currentDate < interval.end
            );
            return !isBlocked && minOfDay >= startMin && minOfDay < endMin && !(minOfDay >= lunchStartMin && minOfDay < lunchEndMin);
          });

          const slotTime = minOfDay / 60;
          let coverageNeeds = {};
          if (slotTime >= 8 && slotTime < 17) coverageNeeds = rules.coverage.primary.requirements;
          else if (slotTime >= 17) coverageNeeds = rules.coverage.evening.requirements;
          
          const tasksInOrder = ['Dispatch', 'Reservations'];

          tasksInOrder.forEach(task => {
            const needed = coverageNeeds[task] || 0;
            let assignedForThisTask = 0;
            const tempPool = [...availablePool];
            for (const empName of tempPool) {
              if (assignedForThisTask < needed && employees[empName].abilities.includes(task)) {
                dailyAssignments[empName][timeStr] = task;
                availablePool = availablePool.filter(e => e !== empName);
                assignedForThisTask++;
              }
            }
          });
          
          for (const empName of availablePool) {
            dailyAssignments[empName][timeStr] = employees[empName].specialistTask;
          }
        }

        for (const empName in employees) {
            const emp = employees[empName];
            const lunchStartMin = timeToMinutes(emp.lunch.start);
            const lunchEndMin = timeToMinutes(emp.lunch.end);
            if (!lunchStartMin || !lunchEndMin) continue;
            for (let min = lunchStartMin; min < lunchEndMin; min += 30) {
                dailyAssignments[empName][minutesToTime(min)] = 'Lunch';
            }
        }

        const dayDate = new Date(startDate);
        dayDate.setDate(startDate.getDate() + i);
        const dateString = dayDate.toISOString().split('T')[0];

        for (const empName in dailyAssignments) {
          const slots = Object.keys(dailyAssignments[empName]).sort((a, b) => timeToMinutes(a) - timeToMinutes(b));
          if (slots.length === 0) continue;

          let currentTask = dailyAssignments[empName][slots[0]];
          let eventStart = slots[0];

          for (let j = 1; j < slots.length; j++) {
            const slot = slots[j];
            const task = dailyAssignments[empName][slot];
            if (task !== currentTask) {
              const eventEnd = slot;
              if (currentTask) {
                finalEvents.push({
                  id: `${currentTask}-${empName}-${dateString}-${eventStart}`,
                  resourceId: empName, title: currentTask,
                  start: `${dateString}T${eventStart}:00`, end: `${dateString}T${eventEnd}:00`,
                  backgroundColor: getTaskColor(currentTask), borderColor: getTaskColor(currentTask),
                });
              }
              currentTask = task;
              eventStart = slot;
            }
          }
          const lastSlotTime = timeToMinutes(slots[slots.length - 1]) + 30;
          const eventEnd = minutesToTime(lastSlotTime);
           if(currentTask) {
             finalEvents.push({
                id: `${currentTask}-${empName}-${dateString}-${eventStart}`,
                resourceId: empName, title: currentTask,
                start: `${dateString}T${eventStart}:00`, end: `${dateString}T${eventEnd}:00`,
                backgroundColor: getTaskColor(currentTask), borderColor: getTaskColor(currentTask),
            });
           }
        }
      }

      onEventsGenerated(finalEvents);
      setIsLoading(false);
    };

    generateAndFetchSchedule();
  }, [weekStart, employees, rules, emailToEmployeeMap, onEventsGenerated]);

  return (
    <div className="scheduler-container">
      {isLoading && <div className="loading-overlay">Generating Schedule...</div>}
      <FullCalendar
        key={weekStart}
        plugins={[resourceTimelinePlugin, interactionPlugin]}
        initialView="resourceTimelineWeek"
        initialDate={weekStart}
        schedulerLicenseKey="GPL-My-Project-Is-Open-Source"
        headerToolbar={{ left: '', center: 'title', right: 'resourceTimelineDay,resourceTimelineWeek' }}
        editable={true}
        resources={resources}
        events={events}
        eventClick={onEventClick}
        resourceAreaHeaderContent="Employees"
        slotMinWidth={120}
        slotDuration="00:30:00"
        slotLabelFormat={{
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        }}
        slotLabelInterval="01:00"
        resourceAreaWidth="200px"
        resourceAreaColumns={[
          {
            field: 'title',
            headerContent: 'Employee'
          }
        ]}
        resourceGroupField="department"
        resourceOrder="title"
        eventMinHeight={30}
        eventMinWidth={60}
        eventOverlap={false}
        eventResizableFromStart={true}
        eventDurationEditable={true}
        eventStartEditable={true}
        resourceAreaWidth="150px"
        slotMinTime="07:00:00"
        slotMaxTime="22:00:00"
        height="100%"
      />
    </div>
  );
}

function getTaskColor(task) {
  switch (task) {
    case 'Reservations': return '#007bff';
    case 'Dispatch': return '#28a745';
    case 'Lunch': return '#ffc107';
    case 'Journey Desk': return '#6610f2';
    case 'Network': return '#fd7e14';
    case 'Badges/Projects': return '#20c997';
    case 'Scheduling': return '#e83e8c';
    case 'Marketing': return '#17a2b8';
    case 'Security': return '#343a40';
    case 'Sales': return '#d63384';
    default: return '#6c757d';
  }
}
