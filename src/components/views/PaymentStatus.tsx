import { useSheets } from '@/context/SheetsContext';
import type { ColumnDef } from '@tanstack/react-table';
import { useEffect, useState } from 'react';
import DataTable from '../element/DataTable';
import { CheckCircle, ExternalLink, RefreshCw } from 'lucide-react';
import Heading from '../element/Heading';
import { Button } from '../ui/button';

interface PaymentHistoryData {
  timestamp: string;
  apPaymentNumber: number;
  status: string;
  uniqueNumber: string;
  fmsName: string;
  payTo: string;
  amountToBePaid: number;
  remarks: string;
  anyAttachments: string;
}

export default function PaymentHistory() {
  const { paymentHistorySheet = [], paymentHistoryLoading, updatePaymentHistorySheet } = useSheets();
  const [tableData, setTableData] = useState<PaymentHistoryData[]>([]);

  useEffect(() => {
    console.log("=== Payment History Debug ===");
    console.log("Payment History Sheet:", paymentHistorySheet);
    console.log("Total records:", paymentHistorySheet?.length || 0);

    if (!paymentHistorySheet || paymentHistorySheet.length === 0) {
      console.warn("⚠️ No payment history data available");
      setTableData([]);
      return;
    }

    // Enhanced mapping with proper property names
    const mappedData = paymentHistorySheet.map((record: any, index: number) => {
      console.log(`Record ${index}:`, record);

      // ✅ FIXED: Use the exact property names from your debug data
      let timestamp = record.timestamp || record.Timestamp || '';
      let apPaymentNumber = record.appaymentNumber || record['AP-Payment Number'] || record.apPaymentNumber || '';
      let status = record.status || record.Status || 'Yes';
      let uniqueNumber = record.uniquenumber || record['Unique Number'] || record.uniqueNumber || '';
      let fmsName = record.fmsName || record['Fms Name'] || '';
      let payTo = record.payTo || record['Pay To'] || '';
      let amountToBePaid = record.amountToBepaid || record['Amount To Be Paid'] || record.amountToBePaid || 0;
      let remarks = record.remarks || record.Remarks || '';
      let anyAttachments = record.anyAttachments || record['Any Attachments'] || '';

      console.log(`AP-Payment Number from data: "${apPaymentNumber}"`);

      // ✅ FIXED: Format timestamp from ISO to DD/MM/YYYY
      let formattedDate = '';
      if (timestamp) {
        try {
          // Handle ISO format like "2025-11-05T07:32:27.109Z"
          if (timestamp.includes('T')) {
            const date = new Date(timestamp);
            if (!isNaN(date.getTime())) {
              const day = date.getDate().toString().padStart(2, '0');
              const month = (date.getMonth() + 1).toString().padStart(2, '0');
              const year = date.getFullYear();
              formattedDate = `${day}/${month}/${year}`;
            } else {
              formattedDate = timestamp.split('T')[0]; // Fallback to just the date part
            }
          } else {
            formattedDate = timestamp;
          }
        } catch (error) {
          console.warn('Date parsing error:', error);
          formattedDate = timestamp;
        }
      }

      // Handle amount conversion
      let amountValue = 0;
      if (typeof amountToBePaid === 'string') {
        amountValue = parseFloat(amountToBePaid.replace(/[^\d.]/g, '')) || 0;
      } else {
        amountValue = Number(amountToBePaid) || 0;
      }

      // Clean up unique number (remove tab character)
      if (uniqueNumber && uniqueNumber.includes('\t')) {
        uniqueNumber = uniqueNumber.replace('\t', '').trim();
      }

      const result = {
        timestamp: formattedDate,
        apPaymentNumber: apPaymentNumber || 'AP-XXXX', // Fallback if empty
        status: status || 'Yes',
        uniqueNumber: uniqueNumber || '-',
        fmsName: fmsName || '-',
        payTo: payTo || '-',
        amountToBePaid: amountValue,
        remarks: remarks || '-',
        anyAttachments: anyAttachments || '-',
      };

      console.log(`Processed record:`, result);
      return result;
    }).filter(record => 
      // Only include records that have some data
      record.timestamp || 
      record.uniqueNumber !== '-' || 
      record.payTo !== '-'
    );

    console.log("✅ Final mapped data count:", mappedData.length);
    if (mappedData.length > 0) {
      console.log("📦 Sample processed data:", mappedData[0]);
    }

    setTableData(mappedData);
  }, [paymentHistorySheet, paymentHistoryLoading]);

  const handleRefresh = () => {
    if (updatePaymentHistorySheet) {
      updatePaymentHistorySheet();
      console.log("🔄 Refreshing payment history data...");
    }
  };

  const columns: ColumnDef<PaymentHistoryData>[] = [
    {
      accessorKey: 'timestamp',
      header: 'Date',
      cell: ({ getValue }) => {
        const value = getValue() as string;
        return (
          <div className="px-2 whitespace-nowrap min-w-[100px] font-medium">
            {value && value !== '-' ? value : '-'}
          </div>
        );
      },
    },
   
   
    {
      accessorKey: 'uniqueNumber',
      header: 'Indent Number',
      cell: ({ getValue }) => (
        <div className="px-2 whitespace-nowrap min-w-[100px]">{(getValue() as string) || '-'}</div>
      ),
    },
    {
      accessorKey: 'fmsName',
      header: 'Fms Name',
      cell: ({ getValue }) => (
        <div className="px-2 whitespace-nowrap min-w-[100px]">{(getValue() as string) || '-'}</div>
      ),
    },
    {
      accessorKey: 'payTo',
      header: 'Pay To',
      cell: ({ getValue }) => (
        <div className="px-2 whitespace-nowrap min-w-[120px]">{(getValue() as string) || '-'}</div>
      ),
    },
    {
      accessorKey: 'amountToBePaid',
      header: 'Amount To Be Paid',
      cell: ({ getValue }) => {
        const value = Number(getValue()) || 0;
        return (
          <div className="px-2 font-semibold text-green-600 whitespace-nowrap min-w-[100px]">
            {value > 0 ? `₹${value.toLocaleString('en-IN')}` : '-'}
          </div>
        );
      },
    },
     {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ getValue }) => {
        const status = ((getValue() as string) || 'Yes').toLowerCase();
        const isYes = status === 'yes';
        
        return (
          <div className="px-2">
            <span
              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                isYes
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: 'remarks',
      header: 'Remarks',
      cell: ({ getValue }) => {
        const remarks = (getValue() as string) || '';
        return (
          <div className="px-2 max-w-xs truncate" title={remarks}>
            {remarks && remarks !== '-' ? remarks : '-'}
          </div>
        );
      },
    },
    {
      accessorKey: 'anyAttachments',
      header: 'Bill Attachment',
      cell: ({ getValue }) => {
        const attachmentUrl = getValue() as string;
        const isValidUrl = attachmentUrl && 
                          attachmentUrl.trim() !== '' && 
                          attachmentUrl !== '-' && 
                          attachmentUrl.startsWith('http');
        
        return (
          <div className="px-2">
            {isValidUrl ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(attachmentUrl, '_blank')}
              >
                <ExternalLink size={16} className="mr-1" />
                View
              </Button>
            ) : (
              <span className="text-gray-400 text-sm">-</span>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div>
      <Heading heading="Payment History" subtext="View all payment records">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={paymentHistoryLoading}
          >
            <RefreshCw size={16} className="mr-1" />
            Refresh
          </Button>
          <CheckCircle size={50} className="text-green-600" />
        </div>
      </Heading>

      {tableData.length === 0 && !paymentHistoryLoading && (
        <div className="text-center py-10">
          <p className="text-gray-500">No payment history records found</p>
          <Button 
            onClick={handleRefresh} 
            className="mt-4"
            variant="outline"
          >
            <RefreshCw size={16} className="mr-2" />
            Retry Loading Data
          </Button>
        </div>
      )}

      <DataTable
        data={tableData}
        columns={columns}
        searchFields={['apPaymentNumber', 'uniqueNumber', 'fmsName', 'payTo', 'remarks']}
        dataLoading={paymentHistoryLoading}
      />
    </div>
  );
}