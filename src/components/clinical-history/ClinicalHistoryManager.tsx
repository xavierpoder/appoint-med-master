import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { UserPlus, FileText } from 'lucide-react';
import PatientProfileManager from './PatientProfileManager';
import ClinicalHistoryDocument from './ClinicalHistoryDocument';

const ClinicalHistoryManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState("patient-profile");

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-2xl font-semibold mb-6 text-primary">Gestión de Historias Clínicas</h2>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="patient-profile" className="flex items-center">
              <UserPlus className="mr-2 h-4 w-4" />
              Perfil del Paciente
            </TabsTrigger>
            <TabsTrigger value="clinical-document" className="flex items-center">
              <FileText className="mr-2 h-4 w-4" />
              Documento Completo
            </TabsTrigger>
          </TabsList>

          <TabsContent value="patient-profile" className="mt-6">
            <PatientProfileManager />
          </TabsContent>

          <TabsContent value="clinical-document" className="mt-6">
            <ClinicalHistoryDocument />
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
};

export default ClinicalHistoryManager;