import DOMPurify from 'dompurify';

export const sanitize = (input: string): string => {
  return DOMPurify.sanitize(input);
};

export const sanitizeObject = (obj: any): any => {
  if (!obj) return obj;
  
  if (typeof obj === 'string') {
    return sanitize(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }
  
  if (typeof obj === 'object') {
    const sanitizedObj: any = {};
    for (const key in obj) {
      sanitizedObj[key] = sanitizeObject(obj[key]);
    }
    return sanitizedObj;
  }
  
  return obj;
};