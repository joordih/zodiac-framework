import { BaseComponent } from "@/core/component/baseComponent.ts";
import { ZodiacComponent } from "@/core/component/zodiacComponent.ts";
import { EventHandler } from "@/core/events/eventHandler.ts";
import { TypedEvents } from "@/core/events/typed/typed-event-decorator.ts";
import { Injectable } from "@/core/injection/injectable.ts";
import { Render } from "@/core/render/vdom.ts";
import { State } from "@/core/states/state.ts";
import { DashboardEvents } from "../dashboard.ts";
import { TypedEventComponent } from "@/core/events/typed/typed-event-component.ts";

@ZodiacComponent("overview-component")
@Injectable()
@TypedEvents<DashboardEvents>()
class OverviewDashboard
  extends BaseComponent
  implements TypedEventComponent<DashboardEvents> {
  emit!: <K extends keyof DashboardEvents>(
    event: K,
    data: DashboardEvents[K]
  ) => void;
  on!: <K extends keyof DashboardEvents>(
    event: K,
    listener: (data: DashboardEvents[K]) => void
  ) => {
    unsubscribe: () => void;
  };
  once!: <K extends keyof DashboardEvents>(
    event: K,
    listener: (data: DashboardEvents[K]) => void
  ) => {
    unsubscribe: () => void;
  };
  off!: <K extends keyof DashboardEvents>(
    event: K,
    listener: (data: DashboardEvents[K]) => void
  ) => void;

  @State()
  private metrics = {
    revenue: {
      value: "$45,231.89",
      change: "+20.1%",
      period: "from last month",
    },
    subscriptions: {
      value: "+2350",
      change: "+180.1%",
      period: "from last month",
    },
    sales: {
      value: "+12,234",
      change: "+19%",
      period: "from last month",
    },
    activeUsers: {
      value: "+573",
      change: "+201",
      period: "since last hour",
    },
  };

  @State()
  private recentSales = [
    {
      name: "Olivia Martin",
      email: "olivia.martin@email.com",
      amount: "$1,999.00",
    },
    {
      name: "Jackson Lee",
      email: "jackson.lee@email.com",
      amount: "$39.00",
    },
    {
      name: "Isabella Nguyen",
      email: "isabella.nguyen@email.com",
      amount: "$299.00",
    },
    {
      name: "William Kim",
      email: "will@email.com",
      amount: "$99.00",
    },
    {
      name: "Sofia Davis",
      email: "sofia.davis@email.com",
      amount: "$39.00",
    },
  ];

  @State()
  private chartData = {
    months: [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ],
    values: [
      3000, 2900, 1500, 1800, 2500, 3500, 2100, 3000, 2800, 3200, 3600, 3000,
    ],
  };

  constructor() {
    super(true);
  }

  async connectedCallback() {
    await super.connectedCallback();
    this.render();
  }

  @EventHandler("click", ".metric-card")
  private handleMetricClick(_e: MouseEvent, element: Element) {
    const metricName = element.getAttribute("data-metric");
    if (metricName) {
      this.emit("metric-click", {
        metricName,
      });
      console.log(`Clicked on metric: ${metricName}`);
    }
  }

  @Render()
  render() {
    this.root.innerHTML = `
    <style>
              .metrics-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
            gap: 1rem;
            margin-bottom: 1.5rem;
          }

          .metric-card {
            padding: 1.5rem;
            background-color: var(--card-bg);
            border-radius: 0.75rem;
            border: 1px solid var(--border-color);
          }

          .metric-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 0.75rem;
            font-size: 0.875rem;
            color: var(--muted-color);
          }

          .metric-value {
            font-size: 2rem;
            font-weight: 600;
            margin-bottom: 0.5rem;
            line-height: 1;
          }

          .metric-change {
            font-size: 0.875rem;
            color: hsl(142.1, 76.2%, 36.3%);
          }

          .dashboard-grid {
            display: grid;
            grid-template-columns: 2fr 1fr;
            gap: 1.5rem;
          }

          @media (max-width: 768px) {
            .dashboard-grid {
              grid-template-columns: 1fr;
            }
          }

          .chart-container {
            padding: 1.5rem;
            background-color: var(--card-bg);
            border-radius: 0.75rem;
            border: 1px solid var(--border-color);
            position: relative;
          }

          .chart-header {
            margin-bottom: 2rem;
          }

          .chart-title {
            font-size: 1rem;
            font-weight: 500;
            margin: 0;
          }

          .chart {
            height: 350px;
            display: flex;
            align-items: flex-end;
            gap: 8px;
            padding: 2rem 3rem 2rem 3rem;
            position: relative;
          }

          .chart-bar {
            flex: 1;
            background-color: var(--chart-bars);
            border-radius: 3px 3px 0 0;
            position: relative;
            min-width: 20px;
            transition: height 0.3s ease;
          }

          .chart-bar-label {
            position: absolute;
            bottom: -24px;
            left: 50%;
            transform: translateX(-50%);
            text-align: center;
            font-size: 0.75rem;
            color: var(--muted-color);
          }

          .chart-bar-value {
            position: absolute;
            top: -24px;
            left: 50%;
            transform: translateX(-50%);
            text-align: center;
            font-size: 0.75rem;
            color: var(--text-color);
            white-space: nowrap;
          }

          .chart-bar:hover {
            background-color: var(--chart-bars-accent);

          }

          .chart-bar:hover .chart-bar-value {
            color: var(--chart-bars-accent);
            font-weight: 500;
          }

          .chart-grid-lines {
            position: absolute;
            top: 2rem;
            left: 0;
            right: 0;
            bottom: 2rem;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            pointer-events: none;
            padding: 0 3rem;
          }

          .chart-grid-line {
            width: 100%;
            height: 1px;
            background-color: var(--border-color);
            position: relative;
          }

          .chart-grid-line-label {
            position: absolute;
            left: -3rem;
            top: -0.5rem;
            font-size: 0.75rem;
            color: var(--muted-color);
            width: 2.5rem;
            text-align: right;
          }

          .recent-sales {
            padding: 1.5rem;
            background-color: var(--card-bg);
            border-radius: 0.75rem;
            border: 1px solid var(--border-color);
          }

          .recent-sales-header {
            margin-bottom: 1rem;
          }

          .recent-sales-title {
            font-size: 1rem;
            font-weight: 500;
            margin: 0 0 0.5rem 0;
          }

          .recent-sales-subtitle {
            font-size: 0.875rem;
            color: var(--muted-color);
            margin: 0;
          }

          .sales-list {
            display: flex;
            flex-direction: column;
            gap: 1rem;
          }

          .sales-item {
            display: flex;
            align-items: center;
            gap: 1rem;
          }

          .sales-item-avatar {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            background-color: var(--border-color);
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 500;
            font-size: 0.875rem;
            color: var(--text-color);
          }

          .sales-item-info {
            flex: 1;
          }

          .sales-item-name {
            font-weight: 500;
          }

          .sales-item-email {
            font-size: 0.875rem;
            color: var(--muted-color);
          }

          .sales-item-amount {
            font-weight: 500;
          }
    </style>
            <div class="metrics-grid">
            <div class="metric-card" data-metric="revenue">
              <div class="metric-header">
                <span>Total Revenue</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
              </div>
              <div class="metric-value">${this.metrics.revenue.value}</div>
              <div class="metric-change">${this.metrics.revenue.change} ${this.metrics.revenue.period
      }</div>
            </div>

            <div class="metric-card" data-metric="subscriptions">
              <div class="metric-header">
                <span>Subscriptions</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              </div>
              <div class="metric-value">${this.metrics.subscriptions.value
      }</div>
              <div class="metric-change">${this.metrics.subscriptions.change} ${this.metrics.subscriptions.period
      }</div>
            </div>

            <div class="metric-card" data-metric="sales">
              <div class="metric-header">
                <span>Sales</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
              </div>
              <div class="metric-value">${this.metrics.sales.value}</div>
              <div class="metric-change">${this.metrics.sales.change} ${this.metrics.sales.period
      }</div>
            </div>

            <div class="metric-card" data-metric="activeUsers">
              <div class="metric-header">
                <span>Active Now</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
              </div>
              <div class="metric-value">${this.metrics.activeUsers.value}</div>
              <div class="metric-change">${this.metrics.activeUsers.change} ${this.metrics.activeUsers.period
      }</div>
            </div>
        </div>
        
        <div class="dashboard-grid">
          <div class="chart-container">
            <div class="chart-header">
              <h3 class="chart-title">Overview</h3>
            </div>
            <div class="chart">
              <div class="chart-grid-lines">
                ${Array.from({ length: 6 }, (_, i) => {
        const value = Math.round((4000 / 5) * (5 - i));
        return `
                    <div class="chart-grid-line">
                      <span class="chart-grid-line-label">$${value.toLocaleString()}</span>
                    </div>
                  `;
      }).join("")}
              </div>
              ${this.chartData.months
        .map((month, index) => {
          const value = this.chartData.values[index];
          const maxValue = Math.max(...this.chartData.values);
          const height = (value / maxValue) * 100;
          return `
                  <div class="chart-bar" style="height: ${height}%">
                    <span class="chart-bar-value">$${value.toLocaleString()}</span>
                    <span class="chart-bar-label">${month}</span>
                  </div>
                `;
        })
        .join("")}
            </div>
          </div>

          <div class="recent-sales">
            <div class="recent-sales-header">
              <h3 class="recent-sales-title">Recent Sales</h3>
              <p class="recent-sales-subtitle">You made 265 sales this month.</p>
            </div>

            <div class="sales-list">
              ${this.recentSales
        .map((sale) => {
          const initials = sale.name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase();

          return `
                  <div class="sales-item">
                    <div class="sales-item-avatar">${initials}</div>
                    <div class="sales-item-info">
                      <div class="sales-item-name">${sale.name}</div>
                      <div class="sales-item-email">${sale.email}</div>
                    </div>
                    <div class="sales-item-amount">${sale.amount}</div>
                  </div>
                `;
        })
        .join("")}
            </div>
          </div>
        </div>
  `;
  }
}
