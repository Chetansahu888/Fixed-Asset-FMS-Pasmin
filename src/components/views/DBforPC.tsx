
import { Package2 } from 'lucide-react';
import Heading from '../element/Heading';
import { useSheets } from '@/context/SheetsContext';
import { useEffect, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import DataTable from '../element/DataTable';
import { Pill } from '../ui/pill';
import type { PcReportSheet } from '@/types';
import { useAuth } from '@/context/AuthContext';



export default function PcReportTable() {
    const { pcReportSheet, poMasterLoading } = useSheets(); // Assuming pcReportLoading is same as poMasterLoading
    const [historyData, setHistoryData] = useState<PcReportSheet[]>([]);
          const { user } = useAuth();
    

    // Update table data whenever pcReportSheet changes
    // useEffect(() => {
    //     console.log("PC Report Sheet:", pcReportSheet);
    //     setHistoryData(pcReportSheet);
    // }, [pcReportSheet]);

    // Update table data whenever pcReportSheet changes
useEffect(() => {
    console.log("PC Report Sheet:", pcReportSheet);
    
    // Pehle firm name se filter karo (case-insensitive)
    const filteredByFirm = pcReportSheet.filter(item => 
        user.firmNameMatch.toLowerCase() === "all" || item.firmNameMatch === user.firmNameMatch
    );
    
    setHistoryData(filteredByFirm);
}, [pcReportSheet, user.firmNameMatch]);


    // Columns for PcReportSheet
   const historyColumns: ColumnDef<PcReportSheet>[] = [
    { accessorKey: 'stage', header: 'Stage' },
    { accessorKey: 'totalPending', header: 'Total Pending' },
    { accessorKey: 'totalComplete', header: 'Total Complete' },
    { accessorKey: 'pendingPmpl', header: 'Pending PMPL' },
    { accessorKey: 'pendingPurab', header: 'Pending PURAB' },
    { accessorKey: 'pendingPmmpl', header: 'Pending PMMPL' },
    { accessorKey: 'pendingRefrasynth', header: 'Pending REFRASYNTH' },
];




    return (
        <div>
            <Heading heading="PC Report" subtext="">
                <Package2 size={50} className="text-primary" />
            </Heading>

            <DataTable
    data={historyData}
    columns={historyColumns}
    searchFields={['stage', 'firmName', 'totalPending', 'totalComplete']}  // All columns
    dataLoading={poMasterLoading}
    className='h-[80dvh]'
/>
        </div>
    );
}
