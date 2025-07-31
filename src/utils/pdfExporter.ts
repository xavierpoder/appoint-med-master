interface ClinicalHistory {
  id: string;
  fecha_ingreso: string;
  sintoma?: string;
  diagnostico?: string;
  tratamiento?: string;
  medicamento?: string;
  seguimiento?: string;
  seguimiento_completado: boolean;
}

interface Patient {
  nombre: string;
  apellido: string;
  cedula: string;
  correo?: string;
  whatsapp?: string;
}

interface AppointmentData {
  time: string;
  status: string;
  specialty: string;
}

export const generateClinicalHistoryPDF = async (
  patient: Patient,
  histories: ClinicalHistory[],
  appointments: AppointmentData[] = []
) => {
  // Crear contenido HTML para el PDF
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Historia Clínica - ${patient.nombre} ${patient.apellido}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          margin: 20px;
          color: #333;
        }
        .header {
          text-align: center;
          border-bottom: 2px solid #2563eb;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .header h1 {
          color: #2563eb;
          margin: 0;
        }
        .patient-info {
          background: #f8fafc;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 30px;
        }
        .patient-info h2 {
          color: #1e40af;
          margin-top: 0;
        }
        .info-row {
          display: flex;
          margin-bottom: 10px;
        }
        .info-label {
          font-weight: bold;
          width: 120px;
          color: #374151;
        }
        .history-section {
          margin-bottom: 40px;
        }
        .history-item {
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 20px;
          background: white;
        }
        .history-date {
          background: #2563eb;
          color: white;
          padding: 8px 16px;
          border-radius: 4px;
          font-weight: bold;
          display: inline-block;
          margin-bottom: 15px;
        }
        .field {
          margin-bottom: 15px;
        }
        .field-label {
          font-weight: bold;
          color: #374151;
          margin-bottom: 5px;
        }
        .field-content {
          color: #6b7280;
          margin-left: 10px;
        }
        .appointments-section {
          margin-top: 40px;
          border-top: 2px solid #e5e7eb;
          padding-top: 20px;
        }
        .appointment-item {
          background: #f0f9ff;
          padding: 10px 15px;
          border-radius: 6px;
          margin-bottom: 10px;
          border-left: 4px solid #0ea5e9;
        }
        .status-badge {
          padding: 3px 8px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: bold;
        }
        .status-scheduled {
          background: #dbeafe;
          color: #1e40af;
        }
        .status-completed {
          background: #d1fae5;
          color: #065f46;
        }
        .footer {
          text-align: center;
          margin-top: 50px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
          color: #6b7280;
          font-size: 12px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>HISTORIA CLÍNICA</h1>
        <p>Documento generado el ${new Date().toLocaleDateString('es-ES', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })}</p>
      </div>

      <div class="patient-info">
        <h2>Información del Paciente</h2>
        <div class="info-row">
          <span class="info-label">Nombre:</span>
          <span>${patient.nombre} ${patient.apellido}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Cédula:</span>
          <span>${patient.cedula}</span>
        </div>
        ${patient.correo ? `
        <div class="info-row">
          <span class="info-label">Email:</span>
          <span>${patient.correo}</span>
        </div>
        ` : ''}
        ${patient.whatsapp ? `
        <div class="info-row">
          <span class="info-label">WhatsApp:</span>
          <span>${patient.whatsapp}</span>
        </div>
        ` : ''}
      </div>

      <div class="history-section">
        <h2>Registros Médicos</h2>
        ${histories.length === 0 ? `
          <p style="text-align: center; color: #6b7280; font-style: italic;">
            No hay registros médicos disponibles.
          </p>
        ` : histories.map(history => `
          <div class="history-item">
            <div class="history-date">
              ${new Date(history.fecha_ingreso).toLocaleDateString('es-ES', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </div>
            
            ${history.sintoma ? `
            <div class="field">
              <div class="field-label">Síntomas:</div>
              <div class="field-content">${history.sintoma}</div>
            </div>
            ` : ''}
            
            ${history.diagnostico ? `
            <div class="field">
              <div class="field-label">Diagnóstico:</div>
              <div class="field-content">${history.diagnostico}</div>
            </div>
            ` : ''}
            
            ${history.tratamiento ? `
            <div class="field">
              <div class="field-label">Tratamiento:</div>
              <div class="field-content">${history.tratamiento}</div>
            </div>
            ` : ''}
            
            ${history.medicamento ? `
            <div class="field">
              <div class="field-label">Medicamentos:</div>
              <div class="field-content">${history.medicamento}</div>
            </div>
            ` : ''}
            
            ${history.seguimiento ? `
            <div class="field">
              <div class="field-label">Seguimiento:</div>
              <div class="field-content">${history.seguimiento}</div>
            </div>
            ` : ''}
            
            <div class="field">
              <div class="field-label">Estado del Seguimiento:</div>
              <div class="field-content">
                <span class="status-badge ${history.seguimiento_completado ? 'status-completed' : 'status-scheduled'}">
                  ${history.seguimiento_completado ? 'Completado' : 'Pendiente'}
                </span>
              </div>
            </div>
          </div>
        `).join('')}
      </div>

      ${appointments.length > 0 ? `
      <div class="appointments-section">
        <h2>Historial de Citas</h2>
        ${appointments.map(appointment => `
          <div class="appointment-item">
            <strong>Fecha:</strong> ${new Date(appointment.time).toLocaleDateString('es-ES')} - 
            <strong>Especialidad:</strong> ${appointment.specialty} - 
            <span class="status-badge ${appointment.status === 'completed' ? 'status-completed' : 'status-scheduled'}">
              ${appointment.status === 'completed' ? 'Completada' : 'Programada'}
            </span>
          </div>
        `).join('')}
      </div>
      ` : ''}

      <div class="footer">
        <p>Documento generado automáticamente por el Sistema de Gestión Médica</p>
        <p>Este documento contiene información médica confidencial</p>
      </div>
    </body>
    </html>
  `;

  // Crear un blob con el contenido HTML
  const blob = new Blob([htmlContent], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  
  // Abrir en nueva ventana para imprimir o guardar como PDF
  const printWindow = window.open(url, '_blank');
  if (printWindow) {
    printWindow.onload = () => {
      printWindow.print();
      URL.revokeObjectURL(url);
    };
  }
};