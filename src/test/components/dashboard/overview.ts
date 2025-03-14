import { BaseComponent } from "@/core/component/baseComponent.ts";
import { ZodiacComponent } from "@/core/component/zodiacComponent.ts";
import { EventHandler } from "@/core/events/eventHandler.ts";
import { TypedEvents } from "@/core/events/typed/typed-event-decorator.ts";
import { Injectable } from "@/core/injection/injectable.ts";
import { Render } from "@/core/render/vdom.ts";
import { State } from "@/core/states/state.ts";
import { TypedEventComponent } from "@/core/events/typed/typed-event-component.ts";

export interface DashboardEvents {
  "date-range-change": {
    startDate: string;
    endDate: string;
  };
  "metric-click": {
    metricName: string;
  };
}

@ZodiacComponent("overview-component")
@Injectable()
@TypedEvents<DashboardEvents>()
// eslint-disable-next-line no-unused-vars
class OverviewDashboard
  extends BaseComponent
  implements TypedEventComponent<DashboardEvents>
{
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
    this.root.innerHTML = /* html */ `
      <style>
          .metrics-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
            gap: 1rem;
            margin-bottom: 1.5rem;
            padding: 1rem;
          }

          .metric-card {
            background-color: var(--card-bg, #fff);
            border: 1px solid var(--border-color, #e5e7eb);
            border-radius: 0.5rem;
            padding: 1.5rem;
            transition: all 0.2s ease;
          }

          .metric-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1),
              0 2px 4px -1px rgba(0, 0, 0, 0.06);
          }

          .metric-title {
            font-size: 0.875rem;
            font-weight: 500;
            color: var(--muted-color, #6b7280);
            margin-bottom: 0.5rem;
          }

          .metric-value {
            font-size: 2rem;
            font-weight: 600;
            line-height: 1;
            margin-bottom: 0.5rem;
          }

          .metric-change {
            display: flex;
            align-items: center;
            gap: 0.25rem;
            font-size: 0.875rem;
            color: var(--primary-color, #10b981);
          }

          .metric-period {
            font-size: 0.75rem;
            color: var(--muted-color, #6b7280);
          }

          .chart-container {
            background-color: var(--card-bg, #fff);
            border: 1px solid var(--border-color, #e5e7eb);
            border-radius: 0.5rem;
            padding: 1.5rem;
            margin: 1rem;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            max-width: 100%;
            overflow-x: hidden;
          }

          .chart {
            position: relative;
            height: 350px;
            display: flex;
            align-items: flex-end;
            gap: 12px;
            padding: 2rem;
            border-bottom: 1px solid var(--border-color, #e5e7eb);
            overflow-x: auto;
            scrollbar-width: thin;
            scroll-behavior: smooth;
            -webkit-overflow-scrolling: touch;
          }

          .chart-bar-wrapper {
            flex: 1;
            min-width: 55px;
            display: flex;
            justify-content: center;
            align-items: flex-end;
            padding: 0 2px;
          }

          .chart-bar {
            width: 42px;
            background-color: var(--primary-color, #10b981);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            border-radius: 6px 6px 0 0;
            position: relative;
            cursor: pointer;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }

          .chart-bar:hover {
            filter: brightness(1.1);
            transform: scaleY(1.02);
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.15);
          }

          .chart-value {
            position: absolute;
            top: -28px;
            left: 50%;
            transform: translateX(-50%);
            background-color: var(--card-bg, #fff);
            color: var(--text-color);
            padding: 4px 8px;
            border-radius: 6px;
            font-size: 0.875rem;
            font-weight: 600;
            opacity: 0;
            transition: all 0.2s ease;
            pointer-events: none;
            white-space: nowrap;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            z-index: 10;
          }

          .chart-bar:hover .chart-value {
            opacity: 1;
            transform: translateX(-50%) translateY(-4px);
          }

          .chart-labels {
            display: flex;
            justify-content: space-between;
            margin-top: 1rem;
            padding: 0 2rem;
            color: var(--muted-color, #6b7280);
            font-size: 0.875rem;
            font-weight: 500;
          }

          @media (max-width: 640px) {
            .chart-container {
              margin: 0.5rem;
              padding: 0.75rem;
            }

            .chart {
              height: 280px;
              padding: 1.5rem 1rem;
              gap: 8px;
            }

            .chart-bar-wrapper {
              min-width: 40px;
            }

            .chart-bar {
              width: 32px;
            }

            .chart-value {
              top: -24px;
              font-size: 0.75rem;
              padding: 3px 6px;
            }

            .chart-labels {
              padding: 0 1rem;
              font-size: 0.75rem;
              margin-top: 0.75rem;
            }
          }
            -webkit-overflow-scrolling: touch;
          }

          .chart::-webkit-scrollbar {
            height: 6px;
          }

          .chart::-webkit-scrollbar-track {
            background: var(--border-color, #e5e7eb);
            border-radius: 3px;
          }

          .chart::-webkit-scrollbar-thumb {
            background: var(--muted-color, #6b7280);
            border-radius: 3px;
          }

          .chart-bar-wrapper {
            flex: 1;
            min-width: 45px;
            display: flex;
            justify-content: center;
            align-items: flex-end;
          }

          .chart-bar {
            width: 32px;
            background-color: var(--chart-bars, #6b7280);
            transition: height 0.3s ease;
            border-radius: 3px 3px 0 0;
            position: relative;
          }

          .chart-value {
            position: absolute;
            top: -20px;
            left: 50%;
            transform: translateX(-50%);
            font-size: 0.75rem;
            color: var(--muted-color, #6b7280);
            opacity: 0;
            transition: opacity 0.2s ease;
          }

          .chart-bar:hover .chart-value {
            opacity: 1;
          }

          .chart-bar:hover {
            background-color: var(--chart-bars-accent, #4b5563);
          }

          .chart-grid {
            position: absolute;
            left: 0;
            right: 0;
            top: 0;
            bottom: 0;
            pointer-events: none;
          }

          .chart-grid-line {
            position: absolute;
            left: 0;
            right: 0;
            border-top: 1px dashed var(--border-color, #e5e7eb);
            z-index: 1;
          }

          .chart-grid-line-label {
            position: absolute;
            left: -3.5rem;
            top: -0.5rem;
            width: 3rem;
            font-size: 0.75rem;
            color: var(--muted-color, #6b7280);
            text-align: right;
          }

          .chart-labels {
            display: flex;
            justify-content: space-between;
            margin-top: 0.75rem;
            padding: 0 1rem;
            color: var(--muted-color, #6b7280);
            font-size: 0.875rem;
            overflow-x: auto;
            scrollbar-width: none;
            -ms-overflow-style: none;
          }

          .chart-labels::-webkit-scrollbar {
            display: none;
          }

          .recent-sales {
            background-color: var(--card-bg, #fff);
            border: 1px solid var(--border-color, #e5e7eb);
            border-radius: 0.5rem;
            padding: 1.5rem;
          }

          .recent-sales-title {
            font-size: 1.125rem;
            font-weight: 600;
            margin-bottom: 1rem;
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
            padding: 0.75rem;
            border-radius: 0.375rem;
            transition: background-color 0.2s ease;
          }

          .sales-item:hover {
            background-color: var(--border-color, #f3f4f6);
          }

          .sales-item-avatar {
            width: 32px;
            height: 32px;
            background-color: var(--primary-color, #10b981);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 0.875rem;
            font-weight: 500;
          }

          .sales-item-info {
            flex: 1;
          }

          .sales-item-name {
            font-weight: 500;
            margin-bottom: 0.25rem;
          }

          .sales-item-email {
            font-size: 0.875rem;
            color: var(--muted-color, #6b7280);
          }

          .sales-item-amount {
            font-weight: 500;
          }

          @media (max-width: 640px) {
            .metrics-grid {
              grid-template-columns: 1fr;
              gap: 0.75rem;
              padding: 0.5rem;
            }

            .metric-card {
              padding: 1rem;
            }

            .metric-value {
              font-size: 1.5rem;
            }

            .chart-container {
              padding: 0.75rem;
              margin-bottom: 1rem;
            }

            .chart {
              height: 250px;
              padding: 1rem 0.5rem;
              gap: 3px;
            }

            .chart-bar-wrapper {
              min-width: 35px;
            }

            .chart-bar {
              width: 24px;
            }

            .chart-grid-line-label {
              left: -2.75rem;
              width: 2.5rem;
              font-size: 0.7rem;
            }

            .chart-labels {
              font-size: 0.75rem;
              margin-top: 0.5rem;
            }

            .recent-sales {
              padding: 1rem;
            }

            .recent-sales-title {
              font-size: 1rem;
              margin-bottom: 0.75rem;
            }

            .sales-list {
              gap: 0.75rem;
            }

            .sales-item {
              padding: 0.5rem;
              gap: 0.75rem;
            }

            .sales-item-avatar {
              width: 28px;
              height
    </style>
            <div class="metrics-grid">
            <div class="metric-card" data-metric="revenue">
              <div class="metric-header">
                <span>Total Revenue</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
              </div>
              <div class="metric-value">${this.metrics.revenue.value}</div>
              <div class="metric-change">${this.metrics.revenue.change} ${
      this.metrics.revenue.period
    }</div>
            </div>

            <div class="metric-card" data-metric="subscriptions">
              <div class="metric-header">
                <span>Subscriptions</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              </div>
              <div class="metric-value">${
                this.metrics.subscriptions.value
              }</div>
              <div class="metric-change">${this.metrics.subscriptions.change} ${
      this.metrics.subscriptions.period
    }</div>
            </div>

            <div class="metric-card" data-metric="sales">
              <div class="metric-header">
                <span>Sales</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
              </div>
              <div class="metric-value">${this.metrics.sales.value}</div>
              <div class="metric-change">${this.metrics.sales.change} ${
      this.metrics.sales.period
    }</div>
            </div>

            <div class="metric-card" data-metric="activeUsers">
              <div class="metric-header">
                <span>Active Now</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
              </div>
              <div class="metric-value">${this.metrics.activeUsers.value}</div>
              <div class="metric-change">${this.metrics.activeUsers.change} ${
      this.metrics.activeUsers.period
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
                  return /* html */ `
                    <div class="chart-bar-wrapper">
                      <div class="chart-bar" style="height: ${height}%" title="${value}">
                        <span class="chart-value">${value}</span>
                      </div>
                    </div>
                  `;
                })
                .join("")}
                <div class="chart-grid">
                  ${[25, 50, 75, 100]
                    .map(
                      (value) => /* html */ `
                    <div class="chart-grid-line" style="bottom: ${value}%">
                      <span class="chart-grid-line-label">${Math.round(
                        (Math.max(...this.chartData.values) * value) / 100
                      )}</span>
                    </div>
                  `
                    )
                    .join("")}
                </div>
              </div>
              <div class="chart-labels">
                ${this.chartData.months
                  .map((month) => /* html */ `<div>${month}</div>`)
                  .join("")}
              </div>
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
