import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Users } from 'lucide-react';

export default function TeachersManagementPage() {
  return (
    <div className="p-4 md:p-8">
      <Card className="shadow-lg border-green-200 bg-white/80">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-2xl text-green-800">
            <Users className="w-6 h-6" />
            Gerenciamento de Professores
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">
            A seção para adicionar e gerenciar os professores está em construção.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}