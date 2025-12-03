import { useSheets } from '@/context/SheetsContext';
import type { ColumnDef } from '@tanstack/react-table';
import { useEffect, useState } from 'react';
import DataTable from '../element/DataTable';
import { CheckCircle, ExternalLink, RefreshCw, DollarSign, Calendar, Receipt, Building, FileText, AlertCircle } from 'lucide-react';
import Heading from '../element/Heading';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';

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
  const [stats, setStats] = useState({
    total: 0,
    totalAmount: 0,
    paidCount: 0,
    pendingCount: 0
  });

  useEffect(() => {
    console.log("=== Payment History Debug ===");
    console.log("Payment History Sheet:", paymentHistorySheet);
    console.log("Total records:", paymentHistorySheet?.length || 0);

    if (!paymentHistorySheet || paymentHistorySheet.length === 0) {
      console.warn("⚠️ No payment history data available");
      setTableData([]);
      setStats({ total: 0, totalAmount: 0, paidCount: 0, pendingCount: 0 });
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

    // Calculate stats
    const totalAmount = mappedData.reduce((sum, item) => sum + item.amountToBePaid, 0);
    const paidCount = mappedData.filter(item => item.status?.toLowerCase() === 'yes').length;
    const pendingCount = mappedData.filter(item => item.status?.toLowerCase() === 'no').length;

    setStats({
      total: mappedData.length,
      totalAmount,
      paidCount,
      pendingCount
    });

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
          <div className="flex items-center gap-2 px-2 whitespace-nowrap min-w-[100px]">
            <Calendar className="h-3 w-3 text-gray-500" />
            <span className="font-medium">
              {value && value !== '-' ? value : '-'}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: 'uniqueNumber',
      header: 'Indent No.',
      cell: ({ getValue }) => (
        <div className="px-2 whitespace-nowrap min-w-[100px]">
          <Badge variant="outline" className="bg-gray-50">
            {(getValue() as string) || '-'}
          </Badge>
        </div>
      ),
    },
    {
      accessorKey: 'fmsName',
      header: 'FMS',
      cell: ({ getValue }) => (
        <div className="flex items-center gap-2 px-2 whitespace-nowrap min-w-[100px]">
          <Building className="h-3 w-3 text-gray-500" />
          <span className="font-medium">{(getValue() as string) || '-'}</span>
        </div>
      ),
    },
    {
      accessorKey: 'payTo',
      header: 'Pay To',
      cell: ({ getValue }) => (
        <div className="px-2 whitespace-nowrap min-w-[120px]">
          <span className="font-medium">{(getValue() as string) || '-'}</span>
        </div>
      ),
    },
    {
      accessorKey: 'amountToBePaid',
      header: 'Amount',
      cell: ({ getValue }) => {
        const value = Number(getValue()) || 0;
        return (
          <div className="flex items-center gap-2 px-2 font-semibold text-green-600 whitespace-nowrap min-w-[100px]">
            <DollarSign className="h-3 w-3" />
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
        const isPaid = status === 'yes';
        
        return (
          <div className="px-2">
            <Badge
              variant={isPaid ? "default" : "outline"}
              className={`inline-flex items-center gap-1 ${
                isPaid
                  ? 'bg-green-100 text-green-800 hover:bg-green-100'
                  : 'bg-amber-100 text-amber-800 hover:bg-amber-100'
              }`}
            >
              {isPaid ? (
                <CheckCircle className="h-3 w-3" />
              ) : (
                <AlertCircle className="h-3 w-3" />
              )}
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Badge>
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
          <div className="px-2 max-w-xs" title={remarks}>
            {remarks && remarks !== '-' ? (
              <div className="flex items-start gap-2">
                <FileText className="h-3 w-3 text-gray-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm truncate">{remarks}</span>
              </div>
            ) : (
              <span className="text-gray-400 text-sm">-</span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'anyAttachments',
      header: 'Attachment',
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
                className="bg-blue-50 hover:bg-blue-100 border-blue-200"
              >
                <ExternalLink size={14} className="mr-1" />
                View Bill
              </Button>
            ) : (
              <span className="text-gray-400 text-sm">-</span>
            )}
          </div>
        );
      },
    },
  ];

  const paidPercentage = stats.total > 0 ? Math.round((stats.paidCount / stats.total) * 100) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50 p-4 md:p-6">
      <div className="mx-auto max-w-7xl">
        {/* Header Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-600 rounded-lg shadow">
                <CheckCircle size={28} className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Payment History</h1>
                <p className="text-gray-600">View and track all payment records and transactions</p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={paymentHistoryLoading}
              className="border-gray-300 hover:bg-gray-50"
            >
              <RefreshCw size={16} className="mr-2" />
              Refresh Data
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="bg-white shadow border-0 hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Payments</p>
                    <p className="text-2xl font-bold text-gray-800 mt-1">{stats.total}</p>
                  </div>
                  <Receipt className="h-10 w-10 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-white shadow border-0 hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Amount</p>
                    <p className="text-2xl font-bold text-green-600 mt-1">
                      ₹{stats.totalAmount.toLocaleString('en-IN')}
                    </p>
                  </div>
                  <DollarSign className="h-10 w-10 text-green-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-white shadow border-0 hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Paid</p>
                    <p className="text-2xl font-bold text-green-600 mt-1">{stats.paidCount}</p>
                  </div>
                  <div className="h-10 w-10 flex items-center justify-center bg-green-100 rounded-full">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                </div>
                <div className="mt-3">
                  {/* <Progress value={paidPercentage} className="h-2" /> */}
                  <p className="text-xs text-gray-500 mt-1">{paidPercentage}% paid</p>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-white shadow border-0 hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Pending</p>
                    <p className="text-2xl font-bold text-amber-600 mt-1">{stats.pendingCount}</p>
                  </div>
                  <div className="h-10 w-10 flex items-center justify-center bg-amber-100 rounded-full">
                    <AlertCircle className="h-6 w-6 text-amber-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Main Content Card */}
        <Card className="bg-white shadow-lg border-0 mb-6">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold text-gray-800">Payment Records</CardTitle>
                <p className="text-gray-600 text-sm mt-1">
                  View all payment transactions with status and attachments
                </p>
              </div>
              {stats.total === 0 ? (
                <Badge variant="outline" className="bg-gray-50 text-gray-700">
                  No Records Found
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-green-50 text-green-700">
                  {stats.total} Records
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {tableData.length === 0 && !paymentHistoryLoading ? (
              <div className="text-center py-12">
                <Receipt className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-700 mb-2">No Payment Records Found</h3>
                <p className="text-gray-500 mb-6">There are no payment history records available.</p>
                <Button 
                  onClick={handleRefresh} 
                  variant="outline"
                  className="border-gray-300"
                >
                  <RefreshCw size={16} className="mr-2" />
                  Refresh Data
                </Button>
              </div>
            ) : (
              <DataTable
                data={tableData}
                columns={columns}
                searchFields={['uniqueNumber', 'fmsName', 'payTo', 'remarks', 'status']}
                dataLoading={paymentHistoryLoading}
                className="border rounded-lg"
              />
            )}
          </CardContent>
        </Card>

        {/* Information Card */}
       
      </div>
    </div>
  );
}