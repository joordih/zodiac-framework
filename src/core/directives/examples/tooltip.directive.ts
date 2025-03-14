import { Directive } from "../directive.decorator.ts";
import { DirectiveLifecycle } from "../directive.interface.ts";

@Directive({
  selector: "[tooltip]",
  observedAttributes: ["tooltip", "tooltip-position"],
})
export class TooltipDirective implements DirectiveLifecycle {
  private element: HTMLElement;
  private tooltipElement: HTMLElement | null = null;
  private tooltipText: string = "";
  private tooltipPosition: "top" | "bottom" | "left" | "right" = "top";
  private boundShowTooltip: (event: MouseEvent) => void;
  private boundHideTooltip: (event: MouseEvent) => void;

  constructor(element: HTMLElement) {
    this.element = element;
    this.boundShowTooltip = this.showTooltip.bind(this);
    this.boundHideTooltip = this.hideTooltip.bind(this);
  }

  onInit(): void {
    this.tooltipText = this.element.getAttribute("tooltip") || "";
    this.tooltipPosition =
      (this.element.getAttribute("tooltip-position") as any) || "top";

    this.element.addEventListener("mouseenter", this.boundShowTooltip);
    this.element.addEventListener("mouseleave", this.boundHideTooltip);
  }

  onDestroy(): void {
    this.element.removeEventListener("mouseenter", this.boundShowTooltip);
    this.element.removeEventListener("mouseleave", this.boundHideTooltip);

    this.removeTooltip();
  }

  onAttributeChanged(
    name: string,
    _oldValue: string | null,
    newValue: string | null
  ): void {
    if (name === "tooltip") {
      this.tooltipText = newValue || "";

      if (this.tooltipElement) {
        this.tooltipElement.textContent = this.tooltipText;
      }
    } else if (name === "tooltip-position") {
      this.tooltipPosition = (newValue as any) || "top";

      if (this.tooltipElement) {
        this.updateTooltipPosition();
      }
    }
  }

  private showTooltip(): void {
    if (!this.tooltipText) {
      return;
    }

    this.tooltipElement = document.createElement("div");
    this.tooltipElement.textContent = this.tooltipText;
    this.tooltipElement.style.position = "absolute";
    this.tooltipElement.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
    this.tooltipElement.style.color = "white";
    this.tooltipElement.style.padding = "5px 10px";
    this.tooltipElement.style.borderRadius = "4px";
    this.tooltipElement.style.fontSize = "14px";
    this.tooltipElement.style.zIndex = "1000";
    this.tooltipElement.style.pointerEvents = "none";

    document.body.appendChild(this.tooltipElement);

    this.updateTooltipPosition();
  }

  private hideTooltip(): void {
    this.removeTooltip();
  }

  private removeTooltip(): void {
    if (this.tooltipElement && this.tooltipElement.parentNode) {
      this.tooltipElement.parentNode.removeChild(this.tooltipElement);
      this.tooltipElement = null;
    }
  }

  private updateTooltipPosition(): void {
    if (!this.tooltipElement) {
      return;
    }

    const elementRect = this.element.getBoundingClientRect();
    const tooltipRect = this.tooltipElement.getBoundingClientRect();

    let top = 0;
    let left = 0;

    switch (this.tooltipPosition) {
      case "top":
        top = elementRect.top - tooltipRect.height - 10;
        left = elementRect.left + (elementRect.width - tooltipRect.width) / 2;
        break;
      case "bottom":
        top = elementRect.bottom + 10;
        left = elementRect.left + (elementRect.width - tooltipRect.width) / 2;
        break;
      case "left":
        top = elementRect.top + (elementRect.height - tooltipRect.height) / 2;
        left = elementRect.left - tooltipRect.width - 10;
        break;
      case "right":
        top = elementRect.top + (elementRect.height - tooltipRect.height) / 2;
        left = elementRect.right + 10;
        break;
    }

    top += window.scrollY;
    left += window.scrollX;

    this.tooltipElement.style.top = `${top}px`;
    this.tooltipElement.style.left = `${left}px`;
  }
}
