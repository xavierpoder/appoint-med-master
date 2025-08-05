// Input validation and sanitization utilities

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
  return emailRegex.test(email);
};

export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^[\+]?[0-9\-\(\)\s]{7,20}$/;
  return phoneRegex.test(phone);
};

export const validateCedula = (cedula: string): boolean => {
  const trimmed = cedula.trim();
  return trimmed.length >= 5 && trimmed.length <= 20;
};

export const validateName = (name: string): boolean => {
  const trimmed = name.trim();
  return trimmed.length >= 2 && trimmed.length <= 100;
};

export const sanitizeText = (text: string): string => {
  if (!text) return '';
  
  // Remove script tags and javascript protocols
  let sanitized = text.replace(/<script[^>]*>.*?<\/script>/gi, '');
  sanitized = sanitized.replace(/javascript:/gi, '');
  
  return sanitized.trim();
};

export const validateTextLength = (text: string, maxLength: number): boolean => {
  return text.length <= maxLength;
};

export const sanitizePhone = (phone: string): string => {
  // Remove all non-numeric characters except +
  return phone.replace(/[^\+0-9]/g, '');
};

export const formatPhone = (phone: string): string => {
  const sanitized = sanitizePhone(phone);
  // Add formatting if needed
  return sanitized;
};

export const validateFormData = {
  patient: (data: any) => {
    const errors: string[] = [];
    
    if (!validateName(data.nombre)) {
      errors.push('Nombre debe tener entre 2 y 100 caracteres');
    }
    
    if (!validateName(data.apellido)) {
      errors.push('Apellido debe tener entre 2 y 100 caracteres');
    }
    
    if (!validateCedula(data.cedula)) {
      errors.push('Cédula debe tener entre 5 y 20 caracteres');
    }
    
    if (data.correo && !validateEmail(data.correo)) {
      errors.push('Formato de email inválido');
    }
    
    if (data.whatsapp && !validatePhone(data.whatsapp)) {
      errors.push('Formato de teléfono inválido');
    }
    
    return errors;
  },
  
  clinicalHistory: (data: any) => {
    const errors: string[] = [];
    
    if (data.sintoma && !validateTextLength(data.sintoma, 5000)) {
      errors.push('Descripción de síntomas muy larga (máx. 5000 caracteres)');
    }
    
    if (data.diagnostico && !validateTextLength(data.diagnostico, 5000)) {
      errors.push('Diagnóstico muy largo (máx. 5000 caracteres)');
    }
    
    if (data.tratamiento && !validateTextLength(data.tratamiento, 10000)) {
      errors.push('Descripción de tratamiento muy larga (máx. 10000 caracteres)');
    }
    
    if (data.medicamento && !validateTextLength(data.medicamento, 2000)) {
      errors.push('Descripción de medicamentos muy larga (máx. 2000 caracteres)');
    }
    
    if (data.seguimiento && !validateTextLength(data.seguimiento, 10000)) {
      errors.push('Notas de seguimiento muy largas (máx. 10000 caracteres)');
    }
    
    return errors;
  }
};