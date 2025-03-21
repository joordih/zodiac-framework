import { TypedEventComponent } from "@/core/events/typed/typed-event-component.ts";
import { BaseComponent } from "../../core/component/baseComponent.ts";
import { useEffect, useService } from "../../core/component/hooks/index.ts";
import { ZodiacComponent } from "../../core/component/zodiacComponent.ts";
import { DirectiveManager } from "../../core/directives/directive-manager.ts";
import { EventHandler } from "../../core/events/eventHandler.ts";
import { TypedEvents } from "../../core/events/typed/typed-event-decorator.ts";
import { Injectable } from "../../core/injection/injectable.ts";
import {
  ErrorBoundaryMiddleware,
  LoggerMiddleware,
} from "../../core/middleware/middleware.ts";
import { Render } from "../../core/render/vdom.ts";
import { Route } from "../../core/routing/route.ts";
import { State } from "../../core/states/state.ts";

interface CalendarDay {
  date: number;
  hasPomodoro: boolean;
}

interface TaskItem {
  id: string;
  text: string;
  completed: boolean;
}

interface PomodoroEvents {
  "task-complete": TaskItem;
  "pomodoro-start": void;
  "pomodoro-stop": void;
}

@ZodiacComponent("productivity-dashboard")
@Injectable()
@Route("/productivity")
@TypedEvents<PomodoroEvents>()
export class ProductivityDashboard
  extends BaseComponent
  implements TypedEventComponent<PomodoroEvents>
{
  @State()
  private currentDate: Date = new Date();

  @State()
  // @ts-ignore
  private selectedMonth: number = new Date().getMonth();

  @State()
  // @ts-ignore
  private selectedYear: number = new Date().getFullYear();

  @State()
  private points: number = 750;

  @State()
  private rank: number = 3;

  @State()
  private totalUsers: number = 56;

  @State()
  // @ts-ignore
  private pomodoroActiveCount: number = 1;

  @State()
  // @ts-ignore
  private totalPomodoros: number = 12;

  @State()
  // @ts-ignore
  private pomodoroMinutes: number = 40;

  @State()
  private note: string = "";

  @State()
  private todoTasks: { id: string; text: string }[] = [
    { id: "todo1", text: "Refine dashboard layout" },
    { id: "todo2", text: "Add activity visualization" },
    { id: "todo3", text: "Implement pomodoro timer" },
    { id: "todo4", text: "Create task management system" },
    { id: "todo5", text: "Update user settings page" }
  ];

  @State()
  private completedTasks: { id: string; text: string }[] = [
    { id: "done1", text: "Initialize project structure" },
    { id: "done2", text: "Set up component system" },
    { id: "done3", text: "Create basic layout" }
  ];

  @State()
  private overdueTasks: { id: string; text: string }[] = [
    { id: "overdue1", text: "Complete initial wireframes" },
    { id: "overdue2", text: "Finalize color scheme" }
  ];

  @State()
  private pomodoroActivity: Map<string, number> = new Map<string, number>();

  // @ts-ignore
  private directiveManager!: DirectiveManager;

  
  emit!: <K extends keyof PomodoroEvents>(
    event: K,
    data: PomodoroEvents[K]
  ) => void;
  on!: <K extends keyof PomodoroEvents>(
    event: K,
    listener: (data: PomodoroEvents[K]) => void
  ) => { unsubscribe: () => void };
  once!: <K extends keyof PomodoroEvents>(
    event: K,
    listener: (data: PomodoroEvents[K]) => void
  ) => { unsubscribe: () => void };
  off!: <K extends keyof PomodoroEvents>(
    event: K,
    listener: (data: PomodoroEvents[K]) => void
  ) => void;

  constructor() {
    super(true);
    this.initializeActivityData();
  }

  private initializeActivityData() {
    
    const months = ["Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb"];

    months.forEach((month) => {
      const daysInMonth = month === "Feb" ? 28 : 30;

      for (let day = 1; day <= daysInMonth; day++) {
        
        const sessions =
          Math.random() > 0.3 ? Math.floor(Math.random() * 5) : 0;
        if (sessions > 0) {
          const key = `${month}-${day}`;
          this.pomodoroActivity.set(key, sessions);
        }
      }
    });
  }

  async connectedCallback() {
    await super.connectedCallback();

    try {
      this.directiveManager = useService(this, "directive-manager");

      useEffect(
        this,
        () => {
          console.log("Productivity Dashboard mounted");
          return () => {
            console.log("Productivity Dashboard unmounted");
          };
        },
        {}
      );

      this.render();
    } catch (error) {
      console.error("Error in connectedCallback:", error);
    }
  }

  @EventHandler("click", ".calendar-month")
  @LoggerMiddleware
  @ErrorBoundaryMiddleware
  // @ts-ignore
  private handleMonthSelect(e: MouseEvent) {
    const monthElement = (e.target as HTMLElement).closest(".calendar-month");
    if (monthElement) {
      const month = monthElement.getAttribute("data-month");
      if (month) {
        console.log(`Selected month: ${month}`);
      }
    }
  }

  @EventHandler("click", ".day")
  @LoggerMiddleware
  @ErrorBoundaryMiddleware
  // @ts-ignore
  private handleDaySelect(e: MouseEvent) {
    const dayElement = (e.target as HTMLElement).closest(".day");
    if (dayElement) {
      const day = dayElement.getAttribute("data-day");
      if (day) {
        console.log(`Selected day: ${day}`);
      }
    }
  }

  @EventHandler("click", ".task-checkbox")
  @LoggerMiddleware
  @ErrorBoundaryMiddleware
  // @ts-ignore
  private handleTaskToggle(e: MouseEvent) {
    const checkbox = e.target as HTMLElement;
    const taskId = checkbox.getAttribute("data-task-id");

    if (taskId) {
      
      let task: { id: string; text: string } | undefined;

      for (const list of [
        this.todoTasks,
        this.overdueTasks,
        this.completedTasks,
      ]) {
        task = list.find((t) => t.id === taskId);
        if (task) break;
      }

      if (task) {
        
        if (this.todoTasks.includes(task)) {
          this.todoTasks = this.todoTasks.filter((t) => t.id !== taskId);
          this.completedTasks = [...this.completedTasks, task];
        } else if (this.overdueTasks.includes(task)) {
          this.overdueTasks = this.overdueTasks.filter((t) => t.id !== taskId);
          this.completedTasks = [...this.completedTasks, task];
        } else if (this.completedTasks.includes(task)) {
          this.completedTasks = this.completedTasks.filter((t) => t.id !== taskId);
          this.todoTasks = [...this.todoTasks, task];
        }

        this.render();
      }
    }
  }

  @EventHandler("click", "#start-pomodoro")
  @LoggerMiddleware
  @ErrorBoundaryMiddleware
  // @ts-ignore
  private handleStartPomodoro() {
    this.emit("pomodoro-start", undefined);
    console.log("Starting Pomodoro session");
    this.render();
  }

  private getDaysInMonth(month: number, year: number): number {
    return new Date(year, month + 1, 0).getDate();
  }

  private getMonthCalendar(): CalendarDay[][] {
    const weeks: CalendarDay[][] = [];
    const firstDay = new Date(
      this.currentDate.getFullYear(),
      this.currentDate.getMonth(),
      1
    ).getDay();
    const daysInMonth = this.getDaysInMonth(
      this.currentDate.getMonth(),
      this.currentDate.getFullYear()
    );

    let week: CalendarDay[] = [];

    
    for (let i = 0; i < firstDay; i++) {
      week.push({ date: 0, hasPomodoro: false });
    }

    
    for (let day = 1; day <= daysInMonth; day++) {
      const hasPomodoro = Math.random() > 0.5; 
      week.push({ date: day, hasPomodoro });

      if (week.length === 7) {
        weeks.push(week);
        week = [];
      }
    }

    
    if (week.length > 0) {
      while (week.length < 7) {
        week.push({ date: 0, hasPomodoro: false });
      }
      weeks.push(week);
    }

    return weeks;
  }

  @Render()
  render() {
    const dayNames = ["M", "T", "W", "T", "F", "S", "S"];
    const currentMonth = this.getMonthCalendar();
    const activityGrid = this.generateActivityGrid();

    return (this.root.innerHTML = `
      <style>
        :host {
          display: block;
          padding: 1.5rem;
          --background: hsl(0, 0%, 5%);
          --foreground: hsl(210, 40%, 98%);
          --card: hsla(224, 71%, 4%, 0.5);
          --card-foreground: hsl(210, 40%, 98%);
          --border: hsl(215, 27.9%, 16.9%);
          --primary: hsl(0, 80%, 50%);
          --primary-foreground: white;
          --secondary: hsla(220, 14%, 16%, 0.7);
          --muted: hsl(215, 27.9%, 16.9%);
          --muted-foreground: hsl(217.9, 10.6%, 64.9%);
          background-color: var(--background);
          color: var(--foreground);
          font-family: system-ui, -apple-system, sans-serif;
        }

        .dashboard-grid {
          display: grid;
          grid-template-columns: 250px 1fr 250px;
          gap: 1rem;
          max-width: 1600px;
          margin: 0 auto;
        }

        .left-column, .center-column, .right-column {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .card {
          background-color: var(--card);
          border-radius: 0.5rem;
          border: 1px solid var(--border);
          padding: 1rem;
          overflow: hidden;
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .card-title {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.8rem;
          font-weight: 500;
          color: var(--foreground);
        }

        .card-title .icon {
          color: var(--primary);
          width: 16px;
          height: 16px;
        }

        .tag {
          font-size: 0.7rem;
          padding: 0.15rem 0.5rem;
          border-radius: 0.25rem;
          background-color: var(--muted);
          color: var(--muted-foreground);
        }

        .tasks-list {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          max-height: 500px;
          overflow-y: auto;
        }

        .tasks-list.completed label {
          text-decoration: line-through;
          opacity: 0.7;
        }

        .task-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.5rem;
          border-radius: 0.25rem;
          background-color: var(--secondary);
          transition: background-color 0.2s;
        }

        .task-item:hover {
          background-color: hsla(220, 14%, 20%, 0.7);
        }

        .task-item input[type="checkbox"] {
          appearance: none;
          width: 16px;
          height: 16px;
          background-color: transparent;
          border: 1px solid var(--primary);
          border-radius: 4px;
          position: relative;
          cursor: pointer;
        }

        .task-item input[type="checkbox"]:checked {
          background-color: var(--primary);
        }

        .task-item input[type="checkbox"]:checked::after {
          content: "";
          position: absolute;
          top: 2px;
          left: 5px;
          width: 4px;
          height: 8px;
          border: solid white;
          border-width: 0 2px 2px 0;
          transform: rotate(45deg);
        }

        .task-item label {
          flex: 1;
          font-size: 0.85rem;
          color: var(--foreground);
        }

        .activity-months {
          display: flex;
          justify-content: space-between;
          font-size: 0.7rem;
          color: var(--muted-foreground);
          margin-bottom: 0.25rem;
          padding: 0 0.5rem;
        }

        .activity-grid {
          display: grid;
          grid-template-columns: repeat(52, 1fr);
          grid-auto-rows: 1fr;
          grid-template-rows: repeat(7, 1fr);
          gap: 2px;
          margin: 0.5rem 0;
        }

        .activity-cell {
          width: 100%;
          aspect-ratio: 1;
          border-radius: 2px;
          background-color: var(--secondary);
        }

        .activity-cell[data-level="1"] { background-color: var(--primary); opacity: 0.2; }
        .activity-cell[data-level="2"] { background-color: var(--primary); opacity: 0.4; }
        .activity-cell[data-level="3"] { background-color: var(--primary); opacity: 0.6; }
        .activity-cell[data-level="4"] { background-color: var(--primary); opacity: 0.8; }
        .activity-cell[data-level="5"] { background-color: var(--primary); opacity: 1; }

        .activity-info {
          display: flex;
          justify-content: space-between;
          font-size: 0.7rem;
          color: var(--muted-foreground);
          margin-top: 0.25rem;
          padding: 0 0.5rem;
        }

        .work-mode-button {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.75rem;
          background-color: var(--primary);
          color: var(--primary-foreground);
          border: none;
          border-radius: 9999px;
          font-size: 0.9rem;
          font-weight: 500;
          cursor: pointer;
          width: 100%;
          transition: opacity 0.2s;
        }

        .work-mode-button:hover {
          opacity: 0.9;
        }

        .note-textarea {
          width: 100%;
          min-height: 120px;
          background-color: var(--secondary);
          color: var(--foreground);
          border: none;
          border-radius: 0.25rem;
          padding: 0.75rem;
          font-size: 0.85rem;
          resize: none;
        }

        .note-textarea:focus {
          outline: 1px solid var(--border);
        }

        .calendar {
          margin-top: 0.5rem;
        }

        .calendar-days {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 3px;
        }

        .calendar-day-name {
          font-size: 0.7rem;
          color: var(--muted-foreground);
          text-align: center;
          padding: 0.25rem 0;
        }

        .day {
          aspect-ratio: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
          border-radius: 0.25rem;
          background-color: var(--secondary);
          cursor: pointer;
        }

        .day:hover {
          background-color: var(--muted);
        }

        .day.has-pomodoro {
          background-color: var(--primary);
          color: var(--primary-foreground);
        }

        .day.empty {
          background-color: transparent;
          cursor: default;
        }

        .medal {
          font-size: 2.5rem;
          margin: 0.5rem 0;
        }

        .points-text {
          font-weight: 500;
          margin-bottom: 0.25rem;
        }

        .rank-text {
          font-size: 0.8rem;
          color: var(--muted-foreground);
        }
      </style>

      <div class="dashboard-grid">
        <div class="left-column">
          <div class="card">
            <div class="card-header">
              <div class="card-title">
                <svg class="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
                Pomodoro Activity
              </div>
            </div>
            <div class="activity-months">
              <span>Jul</span>
              <span>Aug</span>
              <span>Sep</span>
              <span>Oct</span>
              <span>Nov</span>
              <span>Dec</span>
              <span>Jan</span>
              <span>Feb</span>
            </div>
            <div class="activity-grid">${activityGrid}</div>
            <div class="activity-info">
              <span>No pomodoros</span>
              <span>74 pomodoros</span>
            </div>
          </div>

          <div class="card">
            <div class="card-header">
              <div class="card-title">
                <svg class="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/>
                  <line x1="16" x2="16" y1="2" y2="6"/>
                  <line x1="8" x2="8" y1="2" y2="6"/>
                  <line x1="3" x2="21" y1="10" y2="10"/>
                </svg>
                March 2025
              </div>
            </div>
            <div class="calendar">
              <div class="calendar-days">
                ${dayNames
                  .map((day) => `<div class="calendar-day-name">${day}</div>`)
                  .join("")}
                ${currentMonth
                  .flat()
                  .map((day) => {
                    if (day.date === 0) return '<div class="day empty"></div>';
                    return `<div class="day${
                      day.hasPomodoro ? " has-pomodoro" : ""
                    }" data-day="${day.date}">${day.date}</div>`;
                  })
                  .join("")}
              </div>
            </div>
          </div>

          <div class="card">
            <div class="card-header">
              <div class="card-title">
                <svg class="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                </svg>
                Position
              </div>
            </div>
            <div style="text-align: center">
              <div class="medal">🏅</div>
              <div class="points-text">${this.points} points</div>
              <div class="rank-text">Rank ${this.rank} of ${
      this.totalUsers
    }</div>
            </div>
          </div>

          <div class="card">
            <div class="card-header">
              <div class="card-title">
                <svg class="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                </svg>
                Work Mode
              </div>
            </div>
            <button id="start-pomodoro" class="work-mode-button">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M5 12h14"/>
                <path d="M12 5v14"/>
              </svg>
              Focus
            </button>
          </div>
        </div>

        <div class="center-column">
          <div class="card">
            <div class="card-header">
              <div class="card-title">
                <svg class="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 20h9"/>
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                </svg>
                Work done today
              </div>
              <span class="tag">work</span>
            </div>
            <div class="tasks-list completed">
              ${this.completedTasks
                .map(
                  (task) => `
                <div class="task-item">
                  <input type="checkbox" checked id="${task.id}" />
                  <label for="${task.id}">${task.text}</label>
                </div>
              `
                )
                .join("")}
            </div>
          </div>
        </div>

        <div class="right-column">
          <div class="card">
            <div class="card-header">
              <div class="card-title">
                <svg class="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
                Work Index today
              </div>
              <span class="tag">work</span>
            </div>
            <div class="tasks-list">
              ${this.todoTasks
                .map(
                  (task) => `
                <div class="task-item">
                  <input type="checkbox" id="${task.id}" />
                  <label for="${task.id}">${task.text}</label>
                </div>
              `
                )
                .join("")}
            </div>
          </div>

          <div class="card">
            <div class="card-header">
              <div class="card-title">
                <svg class="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                Overdue
              </div>
              <span class="tag">work</span>
            </div>
            <div class="tasks-list overdue">
              ${this.overdueTasks
                .map(
                  (task) => `
                <div class="task-item">
                  <input type="checkbox" id="${task.id}" />
                  <label for="${task.id}">${task.text}</label>
                </div>
              `
                )
                .join("")}
            </div>
          </div>

          <div class="card">
            <div class="card-header">
              <div class="card-title">
                <svg class="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 20h9"/>
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                </svg>
                Quick Note
              </div>
            </div>
            <textarea class="note-textarea" placeholder="Write a note...">${
              this.note
            }</textarea>
          </div>
        </div>
      </div>
    `);
  }

  private generateActivityGrid(): string {
    let gridHtml = "";

    
    const pattern = [
      [0, 1, 3, 0, 2, 0, 5, 3, 1, 0, 5, 0, 3, 4, 5, 3, 2, 0, 5, 0, 5, 5, 4, 5, 5, 0, 5, 5, 5, 4, 3, 0, 0, 5, 5, 4, 3, 5, 0, 5, 2, 4, 3, 4, 5, 2, 5, 5, 3, 4, 5, 3],
      [0, 0, 2, 3, 0, 4, 5, 0, 3, 0, 5, 4, 5, 3, 3, 5, 0, 2, 5, 3, 5, 5, 5, 5, 0, 0, 2, 5, 4, 5, 4, 0, 5, 5, 3, 0, 5, 5, 5, 5, 0, 3, 5, 0, 3, 3, 3, 3, 4, 4, 5, 5],
      [0, 0, 0, 5, 5, 5, 0, 0, 0, 5, 0, 5, 0, 0, 5, 0, 0, 5, 0, 5, 0, 4, 3, 5, 5, 0, 5, 0, 0, 5, 0, 0, 3, 4, 0, 5, 0, 5, 0, 5, 0, 0, 0, 5, 0, 5, 3, 0, 5, 0, 5, 0],
      [0, 0, 0, 0, 0, 0, 0, 5, 5, 0, 5, 0, 0, 0, 0, 0, 5, 0, 5, 0, 5, 0, 0, 0, 0, 5, 0, 5, 0, 0, 0, 5, 0, 0, 5, 0, 0, 0, 5, 0, 5, 0, 0, 0, 5, 0, 0, 5, 0, 5, 0, 0],
      [5, 0, 0, 0, 0, 5, 0, 0, 0, 5, 0, 0, 0, 5, 0, 0, 0, 5, 0, 0, 0, 5, 0, 0, 0, 0, 0, 0, 5, 0, 0, 0, 0, 5, 0, 0, 0, 0, 0, 5, 0, 0, 5, 0, 0, 0, 0, 0, 5, 0, 0, 0],
      [0, 0, 5, 0, 0, 0, 0, 0, 0, 0, 0, 5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    ];

    
    for (let row = 0; row < pattern.length; row++) {
      for (let col = 0; col < pattern[row].length; col++) {
        const level = pattern[row][col];
        gridHtml += `<div class="activity-cell" data-level="${level}"></div>`;
      }
    }

    return gridHtml;
  }
}
