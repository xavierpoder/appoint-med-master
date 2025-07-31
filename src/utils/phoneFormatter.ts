export const formatWhatsAppNumber = (phone: string): string => {
  // Limpiar el número de caracteres no numéricos
  const cleaned = phone.replace(/\D/g, '');
  
  // Si ya empieza con 593, agregar el +
  if (cleaned.startsWith('593')) {
    return `+${cleaned}`;
  }
  
  // Si empieza con 0, reemplazar por +593
  if (cleaned.startsWith('0')) {
    return `+593${cleaned.slice(1)}`;
  }
  
  // Si tiene 9 dígitos (formato local sin 0), agregar +593
  if (cleaned.length === 9) {
    return `+593${cleaned}`;
  }
  
  // Si tiene 10 dígitos y empieza con 9, probablemente falta el 0
  if (cleaned.length === 10 && cleaned.startsWith('9')) {
    return `+593${cleaned}`;
  }
  
  // Por defecto, agregar +593 si no tiene prefijo
  return `+593${cleaned}`;
};

export const validateWhatsAppNumber = (phone: string): boolean => {
  const formatted = formatWhatsAppNumber(phone);
  // Los números de Ecuador tienen formato +593XXXXXXXXX (13 dígitos total)
  return /^\+593\d{9}$/.test(formatted);
};

export const displayPhoneNumber = (phone: string): string => {
  if (!phone) return '';
  
  const formatted = formatWhatsAppNumber(phone);
  // Mostrar en formato: +593 9XX XXX XXX
  if (formatted.startsWith('+593')) {
    const number = formatted.slice(4);
    return `+593 ${number.slice(0, 3)} ${number.slice(3, 6)} ${number.slice(6)}`;
  }
  
  return formatted;
};