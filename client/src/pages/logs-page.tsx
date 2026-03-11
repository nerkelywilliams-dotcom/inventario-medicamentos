import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { ArrowLeft, Search, ArrowDownLeft, ArrowUpRight, FileEdit, Download } from "lucide-react";
import { format, isValid } from "date-fns";
import { es } from "date-fns/locale";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function LogsPage() {
  // ✅ CORRECCIÓN: Definición explícita de la petición para asegurar el flujo de datos
  const { data: logs, isLoading } = useQuery({
    queryKey: ["/api/logs"],
    queryFn: async () => {
      const res = await fetch("/api/logs");
      if (!res.ok) throw new Error("Error al obtener logs");
      return res.json();
    }
  });

  const [search, setSearch] = useState("");

  // ✅ FILTRO ROBUSTO CON PROTECCIÓN DE NULIDAD
  const filteredLogs = (logs || []).filter((log: any) => {
    const medName = (log.medicationName || "").toLowerCase();
    const username = (log.user?.username || "").toLowerCase();
    const details = (log.details || "").toLowerCase();
    const searchTerm = search.toLowerCase();
    
    return medName.includes(searchTerm) || 
           username.includes(searchTerm) || 
           details.includes(searchTerm);
  });

  // ✅ FUNCIÓN DE EXPORTACIÓN PDF
  const exportToPDF = () => {
    const doc = new jsPDF();
    const tableColumn = ["Acción", "Medicamento", "Detalle", "Responsable", "Fecha"];
    const tableRows: any[] = [];

    filteredLogs.forEach((log: any) => {
      const logData = [
        log.action,
        log.medicationName || "N/A",
        log.details || "Sin descripción",
        log.user?.username || "Sistema",
        isValid(new Date(log.timestamp)) ? format(new Date(log.timestamp), 'dd/MM/yyyy HH:mm', { locale: es }) : "Fecha inválida"
      ];
      tableRows.push(logData);
    });

    // --- DISEÑO DE ENCABEZADO ---
    doc.setFillColor(43, 76, 196);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("Sede Magdaleno", 14, 20);
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text("Sistema de Gestión de Inventario Farmacéutico", 14, 28);
    doc.setFontSize(10);
    doc.text(`Fecha: ${format(new Date(), 'dd/MM/yyyy')}`, 160, 20);
    doc.text(`Hora: ${format(new Date(), 'HH:mm')}`, 160, 26);

    doc.setTextColor(26, 43, 75);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("REPORTE DETALLADO DE MOVIMIENTOS", 14, 50);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 55,
      theme: 'striped',
      headStyles: { fillColor: [43, 76, 196], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center' },
      bodyStyles: { textColor: [51, 51, 51], fontSize: 9 },
      alternateRowStyles: { fillColor: [245, 247, 255] },
      margin: { top: 55 }
    });

    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(`Página ${i} de ${pageCount} - Documento generado automáticamente`, 105, 285, { align: "center" });
    }
    doc.save(`bitacora_magdaleno_${format(new Date(), 'yyyyMMdd_HHmm')}.pdf`);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <Link href="/">
              <a className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-[#2b4cc4] mb-2 transition-colors">
                <ArrowLeft className="w-4 h-4 mr-1" /> Volver al Dashboard
              </a>
            </Link>
            <h1 className="text-3xl font-black text-[#1a2b4b] tracking-tight">Historial Completo</h1>
            <p className="text-slate-500 font-medium">Registro detallado de todas las transacciones</p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <button 
              onClick={exportToPDF}
              disabled={filteredLogs.length === 0}
              className="flex items-center gap-2 bg-white text-[#1a2b4b] px-5 py-3 rounded-xl border border-slate-200 font-bold shadow-sm hover:bg-slate-50 transition-all active:scale-95 disabled:opacity-50 w-full sm:w-auto justify-center"
            >
              <Download className="w-4 h-4 text-[#2b4cc4]" /> Exportar PDF
            </button>

            <div className="relative w-full md:w-80">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="text"
                placeholder="Buscar por medicamento, usuario..."
                className="pl-10 pr-4 py-3 w-full rounded-xl border-slate-200 shadow-sm focus:border-[#2b4cc4] focus:ring-[#2b4cc4] transition-all"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50/50">
                <tr className="text-left border-b border-slate-100">
                  <th className="py-5 pl-8 text-xs font-black text-slate-400 uppercase tracking-widest">Acción</th>
                  <th className="py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Medicamento</th>
                  <th className="py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Detalle</th>
                  <th className="py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Responsable</th>
                  <th className="py-5 pr-8 text-right text-xs font-black text-slate-400 uppercase tracking-widest">Fecha y Hora</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {isLoading ? (
                  <tr><td colSpan={5} className="p-10 text-center text-slate-400">Cargando historial...</td></tr>
                ) : filteredLogs.length === 0 ? (
                  <tr><td colSpan={5} className="p-10 text-center text-slate-400 italic">No se encontraron registros.</td></tr>
                ) : (
                  filteredLogs.map((log: any) => {
                    const dateObj = new Date(log.timestamp);
                    const isDateValid = isValid(dateObj);
                    return (
                      <tr key={log.id} className="group hover:bg-blue-50/30 transition-colors">
                        <td className="py-4 pl-8">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm ${log.action === 'INGRESO' ? 'bg-emerald-100 text-emerald-600' : log.action === 'SALIDA' ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'}`}>
                            {log.action === 'INGRESO' && <ArrowDownLeft size={20} />}
                            {log.action === 'SALIDA' && <ArrowUpRight size={20} />}
                            {(log.action !== 'INGRESO' && log.action !== 'SALIDA') && <FileEdit size={20} />}
                          </div>
                        </td>
                        <td className="py-4 font-bold text-[#1a2b4b]">{log.medicationName || "---"}</td>
                        <td className="py-4 text-slate-600 text-sm font-medium">{log.details || "Sin descripción"}</td>
                        <td className="py-4">
                          <span className="inline-flex items-center px-3 py-1 rounded-lg bg-slate-100 text-slate-600 text-xs font-bold border border-slate-200">
                            {log.user?.username || 'Sistema'}
                          </span>
                        </td>
                        <td className="py-4 pr-8 text-right">
                          <div className="flex flex-col items-end">
                            <span className="font-bold text-slate-700">{isDateValid ? format(dateObj, 'dd MMM yyyy', { locale: es }) : '---'}</span>
                            <span className="text-xs text-slate-400 font-medium">{isDateValid ? format(dateObj, 'HH:mm:ss') : '--:--'}</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
