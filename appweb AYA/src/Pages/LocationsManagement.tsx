import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { MapPin } from 'lucide-react';

export default function LocationsManagementPage() {
  return (
    <div className="p-4 md:p-8">
      <Card className="shadow-lg border-blue-200 bg-white/80">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-2xl text-blue-800">
            <MapPin className="w-6 h-6" />
            Gerenciamento de Locais
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">
            O painel para gerenciar os locais de treino está sendo finalizado.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}