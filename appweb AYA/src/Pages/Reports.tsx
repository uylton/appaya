import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, Download, Loader2 } from 'lucide-react';
import { Attendance } from '@/entities/Attendance';
import { User } from '@/entities/User';
import { Session } from '@/entities/Session';
import { format } from 'date-fns';

const exportToCSV = (data, filename) => {
    if (data.length === 0) {
        alert("Nenhum dado para exportar.");
        return;
    }
    const header = Object.keys(data[0]).join(',');
    const rows = data.map(row => Object.values(row).join(',')).join('\n');
    const csvContent = `data:text/csv;charset=utf-8,${header}\n${rows}`;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

export default function ReportsPage() {
  const [reportData, setReportData] = useState([]);
  const [users, setUsers] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchInitialData = async () => {
        const [usersData, sessionsData] = await Promise.all([User.list(), Session.list()]);
        setUsers(usersData);
        setSessions(sessionsData);
    };
    fetchInitialData();
  }, []);

  const generateReport = async () => {
    if(!startDate || !endDate) {
        alert("Por favor, selecione as datas de início e fim.");
        return;
    }
    setIsLoading(true);
    const attendances = await Attendance.filter({
        created_date: {
            '$gte': new Date(startDate).toISOString(),
            '$lte': new Date(endDate).toISOString(),
        }
    });

    const usersMap = new Map(users.map(u => [u.id, u.nickname || u.full_name]));
    const sessionsMap = new Map(sessions.map(s => [s.id, s.title]));

    const formattedData = attendances.map(att => ({
        Aluno: usersMap.get(att.student_id) || 'Desconhecido',
        Sessão: sessionsMap.get(att.session_id) || 'Desconhecida',
        Data: format(new Date(att.created_date), 'dd/MM/yyyy HH:mm'),
        Status: att.status === 'present' ? 'Presente' : 'Falta'
    }));

    setReportData(formattedData);
    setIsLoading(false);
  };
  
  const handleExport = () => {
      if(reportData.length === 0) {
          alert("Nenhum dado para exportar. Gere um relatório primeiro.");
          return;
      }
      exportToCSV(reportData, `relatorio_presenca_${startDate}_a_${endDate}.csv`);
  }

  return (
    <div className="p-4 md:p-8">
      <Card className="shadow-lg border-slate-200 bg-white/80">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-2xl text-slate-800">
            <FileText className="w-6 h-6" />
            Relatórios de Presença
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="grid md:grid-cols-4 gap-4 items-end p-4 border rounded-lg bg-gray-50">
                <div className="space-y-2">
                    <Label htmlFor="start-date">Data de Início</Label>
                    <Input id="start-date" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="end-date">Data de Fim</Label>
                    <Input id="end-date" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
                </div>
                <Button onClick={generateReport} disabled={isLoading} className="md:col-span-1">
                    {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                    Gerar Relatório
                </Button>
                 <Button onClick={handleExport} variant="outline" className="md:col-span-1">
                    <Download className="w-4 h-4 mr-2" />
                    Exportar para CSV
                </Button>
            </div>
            
            <div className="max-h-[50vh] overflow-y-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Aluno</TableHead>
                            <TableHead>Sessão</TableHead>
                            <TableHead>Data</TableHead>
                            <TableHead>Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow><TableCell colSpan={4} className="text-center h-24"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></TableCell></TableRow>
                        ) : reportData.length > 0 ? reportData.map((row, index) => (
                            <TableRow key={index}>
                                <TableCell>{row.Aluno}</TableCell>
                                <TableCell>{row.Sessão}</TableCell>
                                <TableCell>{row.Data}</TableCell>
                                <TableCell>
                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${row.Status === 'Presente' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                        {row.Status}
                                    </span>
                                </TableCell>
                            </TableRow>
                        )) : (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center h-24">Nenhum dado para exibir. Gere um relatório acima.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

        </CardContent>
      </Card>
    </div>
  );
}