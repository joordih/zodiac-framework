import { ValidationRule } from "../validation/validators.ts";

export type FormControlStatus = 'VALID' | 'INVALID' | 'PENDING' | 'DISABLED';

export interface FormControlOptions {
  validators?: Array<(value: any) => string | null>;
  asyncValidators?: Array<(value: any) => Promise<string | null>>;
  disabled?: boolean;
}

export class FormControl<T> {
  private value: T;
  private validators: Array<(value: T) => string | null> = [];
  private asyncValidators: Array<(value: T) => Promise<string | null>> = [];
  private listeners: Array<(value: T) => void> = [];
  private statusListeners: Array<(status: FormControlStatus) => void> = [];
  private errors: string[] = [];
  private status: FormControlStatus = 'VALID';
  private disabled = false;
  private pending = false;
  
  constructor(initialValue: T, options: FormControlOptions = {}) {
    this.value = initialValue;
    this.validators = options.validators || [];
    this.asyncValidators = options.asyncValidators || [];
    this.disabled = options.disabled || false;
    
    if (this.disabled) {
      this.status = 'DISABLED';
    } else {
      this.validate();
    }
  }
  
  getValue(): T {
    return this.value;
  }
  
  setValue(value: T, options: { emitEvent?: boolean } = {}): void {
    const emitEvent = options.emitEvent !== false;
    
    if (this.disabled) {
      return;
    }
    
    if (this.value !== value) {
      this.value = value;
      this.validate();
      
      if (emitEvent) {
        this.notifyListeners();
      }
    }
  }
  
  patchValue(value: Partial<T>, options: { emitEvent?: boolean } = {}): void {
    const emitEvent = options.emitEvent !== false;
    
    if (this.disabled) {
      return;
    }
    
    const newValue = { ...this.value as any, ...value as any };
    
    if (JSON.stringify(this.value) !== JSON.stringify(newValue)) {
      this.value = newValue as T;
      this.validate();
      
      if (emitEvent) {
        this.notifyListeners();
      }
    }
  }
  
  reset(value?: T, options: { emitEvent?: boolean } = {}): void {
    const emitEvent = options.emitEvent !== false;
    
    if (value !== undefined) {
      this.value = value;
    }
    
    this.errors = [];
    this.status = this.disabled ? 'DISABLED' : 'VALID';
    
    if (emitEvent) {
      this.notifyListeners();
      this.notifyStatusListeners();
    }
  }
  
  disable(options: { emitEvent?: boolean } = {}): void {
    const emitEvent = options.emitEvent !== false;
    
    if (!this.disabled) {
      this.disabled = true;
      this.status = 'DISABLED';
      
      if (emitEvent) {
        this.notifyStatusListeners();
      }
    }
  }
  
  enable(options: { emitEvent?: boolean } = {}): void {
    const emitEvent = options.emitEvent !== false;
    
    if (this.disabled) {
      this.disabled = false;
      this.validate();
      
      if (emitEvent) {
        this.notifyStatusListeners();
      }
    }
  }
  
  subscribe(listener: (value: T) => void): () => void {
    this.listeners.push(listener);
    
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }
  
  subscribeToStatus(listener: (status: FormControlStatus) => void): () => void {
    this.statusListeners.push(listener);
    
    return () => {
      this.statusListeners = this.statusListeners.filter(l => l !== listener);
    };
  }
  
  getErrors(): string[] {
    return [...this.errors];
  }
  
  getStatus(): FormControlStatus {
    return this.status;
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
  
  private async validate(): Promise<void> {
    if (this.disabled) {
      return;
    }
    
    this.errors = [];
    
    for (const validator of this.validators) {
      const error = validator(this.value);
      if (error) {
        this.errors.push(error);
      }
    }
    
    if (this.errors.length > 0) {
      this.status = 'INVALID';
      this.notifyStatusListeners();
      return;
    }
    
    if (this.asyncValidators.length > 0) {
      this.status = 'PENDING';
      this.pending = true;
      this.notifyStatusListeners();
      
      const asyncResults = await Promise.all(
        this.asyncValidators.map(validator => validator(this.value))
      );
      
      this.pending = false;
      
      for (const error of asyncResults) {
        if (error) {
          this.errors.push(error);
        }
      }
      
      this.status = this.errors.length > 0 ? 'INVALID' : 'VALID';
      this.notifyStatusListeners();
    } else {
      this.status = 'VALID';
      this.notifyStatusListeners();
    }
  }
  
  private notifyListeners(): void {
    for (const listener of this.listeners) {
      listener(this.value);
    }
  }
  
  private notifyStatusListeners(): void {
    for (const listener of this.statusListeners) {
      listener(this.status);
    }
  }
}
