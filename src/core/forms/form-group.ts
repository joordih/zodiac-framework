import { FormControl, FormControlStatus } from "./form-control.ts";

export class FormGroup<T extends Record<string, any>> {
  private controls: {
    [K in keyof T]: FormControl<T[K]>
  };
  private status: FormControlStatus = 'VALID';
  private statusListeners: Array<(status: FormControlStatus) => void> = [];
  private valueListeners: Array<(value: T) => void> = [];
  
  constructor(controls: { [K in keyof T]: FormControl<T[K]> }) {
    this.controls = controls;
    this.registerControlListeners();
    this.updateStatus();
  }
  
  getControl<K extends keyof T>(name: K): FormControl<T[K]> {
    return this.controls[name];
  }
  
  getValue(): T {
    const result = {} as T;
    
    for (const key in this.controls) {
      result[key] = this.controls[key].getValue();
    }
    
    return result;
  }
  
  setValue(value: T, options: { emitEvent?: boolean } = {}): void {
    const emitEvent = options.emitEvent !== false;
    
    for (const key in this.controls) {
      if (key in value) {
        this.controls[key].setValue(value[key], { emitEvent: false });
      }
    }
    
    if (emitEvent) {
      this.notifyValueListeners();
    }
  }
  
  patchValue(value: Partial<T>, options: { emitEvent?: boolean } = {}): void {
    const emitEvent = options.emitEvent !== false;
    
    for (const key in value) {
      if (key in this.controls) {
        this.controls[key as keyof T].setValue(value[key as keyof T] as any, { emitEvent: false });
      }
    }
    
    if (emitEvent) {
      this.notifyValueListeners();
    }
  }
  
  reset(value?: Partial<T>, options: { emitEvent?: boolean } = {}): void {
    const emitEvent = options.emitEvent !== false;
    
    for (const key in this.controls) {
      this.controls[key].reset(value ? value[key] as any : undefined, { emitEvent: false });
    }
    
    this.updateStatus();
    
    if (emitEvent) {
      this.notifyValueListeners();
      this.notifyStatusListeners();
    }
  }
  
  disable(options: { emitEvent?: boolean } = {}): void {
    const emitEvent = options.emitEvent !== false;
    
    for (const key in this.controls) {
      this.controls[key].disable({ emitEvent: false });
    }
    
    this.status = 'DISABLED';
    
    if (emitEvent) {
      this.notifyStatusListeners();
    }
  }
  
  enable(options: { emitEvent?: boolean } = {}): void {
    const emitEvent = options.emitEvent !== false;
    
    for (const key in this.controls) {
      this.controls[key].enable({ emitEvent: false });
    }
    
    this.updateStatus();
    
    if (emitEvent) {
      this.notifyStatusListeners();
    }
  }
  
  isValid(): boolean {
    return this.status === 'VALID';
  }
  
  isDisabled(): boolean {
    return this.status === 'DISABLED';
  }
  
  isPending(): boolean {
    return this.status === 'PENDING';
  }
  
  getStatus(): FormControlStatus {
    return this.status;
  }
  
  subscribeToValue(listener: (value: T) => void): () => void {
    this.valueListeners.push(listener);
    
    return () => {
      this.valueListeners = this.valueListeners.filter(l => l !== listener);
    };
  }
  
  subscribeToStatus(listener: (status: FormControlStatus) => void): () => void {
    this.statusListeners.push(listener);
    
    return () => {
      this.statusListeners = this.statusListeners.filter(l => l !== listener);
    };
  }
  
  private registerControlListeners(): void {
    for (const key in this.controls) {
      const control = this.controls[key];
      
      control.subscribeToStatus(() => {
        this.updateStatus();
      });
      
      control.subscribe(() => {
        this.notifyValueListeners();
      });
    }
  }
  
  private updateStatus(): void {
    if (Object.values(this.controls).some(control => control.isPending())) {
      this.status = 'PENDING';
    } else if (Object.values(this.controls).some(control => control.isDisabled())) {
      this.status = 'DISABLED';
    } else if (Object.values(this.controls).some(control => !control.isValid())) {
      this.status = 'INVALID';
    } else {
      this.status = 'VALID';
    }
    
    this.notifyStatusListeners();
  }
  
  private notifyValueListeners(): void {
    const value = this.getValue();
    for (const listener of this.valueListeners) {
      listener(value);
    }
  }
  
  private notifyStatusListeners(): void {
    for (const listener of this.statusListeners) {
      listener(this.status);
    }
  }
}
