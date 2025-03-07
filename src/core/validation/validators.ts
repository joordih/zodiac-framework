export interface ValidationRule {
  validator: (value: any) => boolean;
  message: string;
}

export function Required(target: any, propertyKey: string) {
  const validationMetadataKey = 'validation:rules';
  const existingRules = Reflect.getMetadata(validationMetadataKey, target) || {};
  
  existingRules[propertyKey] = existingRules[propertyKey] || [];
  existingRules[propertyKey].push({
    validator: (value: any) => value !== undefined && value !== null && value !== '',
    message: `${propertyKey} is required`
  });
  
  Reflect.defineMetadata(validationMetadataKey, existingRules, target);
}

export function MinLength(length: number) {
  return function(target: any, propertyKey: string) {
    const validationMetadataKey = 'validation:rules';
    const existingRules = Reflect.getMetadata(validationMetadataKey, target) || {};
    
    existingRules[propertyKey] = existingRules[propertyKey] || [];
    existingRules[propertyKey].push({
      validator: (value: string) => !value || value.length >= length,
      message: `${propertyKey} must be at least ${length} characters long`
    });
    
    Reflect.defineMetadata(validationMetadataKey, existingRules, target);
  };
}

export function MaxLength(length: number) {
  return function(target: any, propertyKey: string) {
    const validationMetadataKey = 'validation:rules';
    const existingRules = Reflect.getMetadata(validationMetadataKey, target) || {};
    
    existingRules[propertyKey] = existingRules[propertyKey] || [];
    existingRules[propertyKey].push({
      validator: (value: string) => !value || value.length <= length,
      message: `${propertyKey} must not exceed ${length} characters`
    });
    
    Reflect.defineMetadata(validationMetadataKey, existingRules, target);
  };
}

export function Pattern(regex: RegExp) {
  return function(target: any, propertyKey: string) {
    const validationMetadataKey = 'validation:rules';
    const existingRules = Reflect.getMetadata(validationMetadataKey, target) || {};
    
    existingRules[propertyKey] = existingRules[propertyKey] || [];
    existingRules[propertyKey].push({
      validator: (value: string) => !value || regex.test(value),
      message: `${propertyKey} does not match the required pattern`
    });
    
    Reflect.defineMetadata(validationMetadataKey, existingRules, target);
  };
}

export function Email(target: any, propertyKey: string) {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  Pattern(emailRegex)(target, propertyKey);
}

export function Range(min: number, max: number) {
  return function(target: any, propertyKey: string) {
    const validationMetadataKey = 'validation:rules';
    const existingRules = Reflect.getMetadata(validationMetadataKey, target) || {};
    
    existingRules[propertyKey] = existingRules[propertyKey] || [];
    existingRules[propertyKey].push({
      validator: (value: number) => !value || (value >= min && value <= max),
      message: `${propertyKey} must be between ${min} and ${max}`
    });
    
    Reflect.defineMetadata(validationMetadataKey, existingRules, target);
  };
}
