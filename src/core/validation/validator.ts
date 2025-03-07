import { ValidationRule } from "./validators.ts";

export interface ValidationError {
  property: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

export class Validator {
  static validate(object: any): ValidationResult {
    const errors: ValidationError[] = [];
    const validationRules = Reflect.getMetadata('validation:rules', object) || {};
    
    for (const property in validationRules) {
      const rules = validationRules[property] as ValidationRule[];
      const value = object[property];
      
      for (const rule of rules) {
        if (!rule.validator(value)) {
          errors.push({
            property,
            message: rule.message
          });
        }
      }
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
  
  static validateProperty(object: any, propertyName: string): ValidationResult {
    const errors: ValidationError[] = [];
    const validationRules = Reflect.getMetadata('validation:rules', object) || {};
    
    if (validationRules[propertyName]) {
      const rules = validationRules[propertyName] as ValidationRule[];
      const value = object[propertyName];
      
      for (const rule of rules) {
        if (!rule.validator(value)) {
          errors.push({
            property: propertyName,
            message: rule.message
          });
        }
      }
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
}
