import { useSheets } from '@/context/SheetsContext';
import type { ColumnDef, Row } from '@tanstack/react-table';
import { useEffect, useState } from 'react';
import DataTable from '../element/DataTable';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogClose,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel } from '../ui/form';
import { PuffLoader as Loader } from 'react-spinners';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { postToSheet } from '@/lib/fetchers';
import { Calculator } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { useAuth } from '@/context/AuthContext';
import { Badge } from '../ui/badge';

interface TallyEntryPendingData {
    indentNo: string;
    indentDate: string;
    purchaseDate: string;
    materialInDate: string;
    productName: string;
    billNo: string;
    qty: number;
    partyName: string;
    billAmt: number;
    billImage: string;
    billReceivedLater: string;
    notReceivedBillNo: string;
    location: string;
    typeOfBills: string;
    productImage: string;
    area: string;
    indentedFor: string;
    approvedPartyName: string;
    rate: number;
    indentQty: number;
    totalRate: number;
    status1: string;
    remarks1: string;
    status2: string;
    remarks2: string;
    firmNameMatch: string;
}

interface TallyEntryHistoryData {
    indentNo: string;
    indentDate: string;
    purchaseDate: string;
    materialInDate: string;
    productName: string;
    billNo: string;
    qty: number;
    partyName: string;
    billAmt: number;
    billImage: string;
    billReceivedLater: string;
    notReceivedBillNo: string;
    location: string;
    typeOfBills: string;
    productImage: string;
    area: string;
    indentedFor: string;
    approvedPartyName: string;
    rate: number;
    indentQty: number;
    totalRate: number;
    status1: string;
    remarks1: string;
    status2: string;
    remarks2: string;
    status3: string;
    remarks3: string;
    firmNameMatch: string;
}

export default () => {
    const { tallyEntrySheet, updateAll } = useSheets();
    const { user } = useAuth();

    const [pendingData, setPendingData] = useState<TallyEntryPendingData[]>([]);
    const [historyData, setHistoryData] = useState<TallyEntryHistoryData[]>([]);
    const [selectedItem, setSelectedItem] = useState<TallyEntryPendingData | null>(null);
    const [openDialog, setOpenDialog] = useState(false);
    const [activeTab, setActiveTab] = useState('pending');

    useEffect(() => {
        const filteredByFirm = tallyEntrySheet.filter(item => 
            user.firmNameMatch.toLowerCase() === "all" || item.firmNameMatch === user.firmNameMatch
        );
        
        setPendingData(
            filteredByFirm
                .filter((i) => i.planned3 !== '' && i.actual3 === '')
                .map((i) => ({
                    indentNo: i.indentNo || '',
                    indentDate: i.indentDate || '',
                    purchaseDate: i.purchaseDate || '',
                    materialInDate: i.materialInDate || '',
                    productName: i.productName || '',
                    billNo: i.billNo || '',
                    qty: i.qty || 0,
                    partyName: i.partyName || '',
                    billAmt: i.billAmt || 0,
                    billImage: i.billImage || '',
                    billReceivedLater: i.billReceivedLater || '',
                    notReceivedBillNo: i.notReceivedBillNo || '',
                    location: i.location || '',
                    typeOfBills: i.typeOfBills || '',
                    productImage: i.productImage || '',
                    area: i.area || '',
                    indentedFor: i.indentedFor || '',
                    approvedPartyName: i.approvedPartyName || '',
                    rate: i.rate || 0,
                    indentQty: i.indentQty || 0,
                    totalRate: i.totalRate || 0,
                    status1: i.status1 || '',
                    remarks1: i.remarks1 || '',
                    status2: i.status2 || '',
                    remarks2: i.remarks2 || '',
                    firmNameMatch: i.firmNameMatch || '',
                }))
        );
    }, [tallyEntrySheet, user.firmNameMatch]);

    useEffect(() => {
        const filteredByFirm = tallyEntrySheet.filter(item => 
            user.firmNameMatch.toLowerCase() === "all" || item.firmNameMatch === user.firmNameMatch
        );
        
        setHistoryData(
            filteredByFirm
                .filter((i) => i.planned3 !== '' && i.actual3 !== '')
                .map((i) => ({
                    indentNo: i.indentNo || '',
                    indentDate: i.indentDate || '',
                    purchaseDate: i.purchaseDate || '',
                    materialInDate: i.materialInDate || '',
                    productName: i.productName || '',
                    billNo: i.billNo || '',
                    qty: i.qty || 0,
                    partyName: i.partyName || '',
                    billAmt: i.billAmt || 0,
                    billImage: i.billImage || '',
                    billReceivedLater: i.billReceivedLater || '',
                    notReceivedBillNo: i.notReceivedBillNo || '',
                    location: i.location || '',
                    typeOfBills: i.typeOfBills || '',
                    productImage: i.productImage || '',
                    area: i.area || '',
                    indentedFor: i.indentedFor || '',
                    approvedPartyName: i.approvedPartyName || '',
                    rate: i.rate || 0,
                    indentQty: i.indentQty || 0,
                    totalRate: i.totalRate || 0,
                    status1: i.status1 || '',
                    remarks1: i.remarks1 || '',
                    status2: i.status2 || '',
                    remarks2: i.remarks2 || '',
                    status3: i.status3 || '',
                    remarks3: i.remarks3 || '',
                    firmNameMatch: i.firmNameMatch || '',
                }))
        );
    }, [tallyEntrySheet, user.firmNameMatch]);

    const formatDate = (dateString: string) => {
        if (!dateString) return '';
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return dateString;
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            return `${day}/${month}/${year}`;
        } catch {
            return dateString;
        }
    };

    const pendingColumns: ColumnDef<TallyEntryPendingData>[] = [
        ...(user.receiveItemView
            ? [
                  {
                      header: 'Action',
                      cell: ({ row }: { row: Row<TallyEntryPendingData> }) => {
                          return (
                              <div className="flex justify-center">
                                  <DialogTrigger asChild>
                                      <Button
                                          variant="outline"
                                          onClick={() => {
                                              setSelectedItem(row.original);
                                          }}
                                          className="min-w-[100px]"
                                      >
                                          Process
                                      </Button>
                                  </DialogTrigger>
                              </div>
                          );
                      },
                  },
              ]
            : []),
        { 
            accessorKey: 'indentNo', 
            header: 'Indent No.',
            cell: ({ row }) => (
                <div className="text-center">
                    {row.original.indentNo}
                </div>
            )
        },
        { 
            accessorKey: 'indentDate', 
            header: 'Indent Date',
            cell: ({ row }) => (
                <div className="text-center">
                    {formatDate(row.original.indentDate)}
                </div>
            )
        },
        { 
            accessorKey: 'purchaseDate', 
            header: 'Purchase Date',
            cell: ({ row }) => (
                <div className="text-center">
                    {formatDate(row.original.purchaseDate)}
                </div>
            )
        },
        { 
            accessorKey: 'materialInDate', 
            header: 'Material In Date',
            cell: ({ row }) => (
                <div className="text-center">
                    {formatDate(row.original.materialInDate)}
                </div>
            )
        },
        { 
            accessorKey: 'productName', 
            header: 'Product Name',
            cell: ({ row }) => (
                <div className="text-center">
                    {row.original.productName}
                </div>
            )
        },
        { 
            accessorKey: 'billNo', 
            header: 'Bill No.',
            cell: ({ row }) => (
                <div className="text-center">
                    {row.original.billNo}
                </div>
            )
        },
        { 
            accessorKey: 'firmNameMatch', 
            header: 'Firm Name',
            cell: ({ row }) => (
                <div className="text-center">
                    {row.original.firmNameMatch}
                </div>
            )
        },
        { 
            accessorKey: 'qty', 
            header: 'Qty',
            cell: ({ row }) => (
                <div className="text-center">
                    {row.original.qty}
                </div>
            )
        },
        { 
            accessorKey: 'partyName', 
            header: 'Party Name',
            cell: ({ row }) => (
                <div className="text-center">
                    {row.original.partyName}
                </div>
            )
        },
        { 
            accessorKey: 'billAmt', 
            header: 'Bill Amt',
            cell: ({ row }) => (
                <div className="text-center">
                    {row.original.billAmt}
                </div>
            )
        },
        {
            accessorKey: 'billImage',
            header: 'Bill Image',
            cell: ({ row }) => {
                const image = row.original.billImage;
                return (
                    <div className="text-center">
                        {image ? (
                            <a href={image} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                                View
                            </a>
                        ) : (
                            <span className="text-gray-400">-</span>
                        )}
                    </div>
                );
            },
        },
        { 
            accessorKey: 'billReceivedLater', 
            header: 'Bill Received Later',
            cell: ({ row }) => (
                <div className="text-center">
                    {row.original.billReceivedLater || '-'}
                </div>
            )
        },
        { 
            accessorKey: 'notReceivedBillNo', 
            header: 'Not Received Bill No.',
            cell: ({ row }) => (
                <div className="text-center">
                    {row.original.notReceivedBillNo || '-'}
                </div>
            )
        },
        { 
            accessorKey: 'location', 
            header: 'Location',
            cell: ({ row }) => (
                <div className="text-center">
                    {row.original.location}
                </div>
            )
        },
        { 
            accessorKey: 'typeOfBills', 
            header: 'Type Of Bills',
            cell: ({ row }) => (
                <div className="text-center">
                    {row.original.typeOfBills}
                </div>
            )
        },
        {
            accessorKey: 'productImage',
            header: 'Product Image',
            cell: ({ row }) => {
                const image = row.original.productImage;
                return (
                    <div className="text-center">
                        {image ? (
                            <a href={image} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                                View
                            </a>
                        ) : (
                            <span className="text-gray-400">-</span>
                        )}
                    </div>
                );
            },
        },
        { 
            accessorKey: 'area', 
            header: 'Area',
            cell: ({ row }) => (
                <div className="text-center">
                    {row.original.area}
                </div>
            )
        },
        { 
            accessorKey: 'indentedFor', 
            header: 'Indented For',
            cell: ({ row }) => (
                <div className="text-center">
                    {row.original.indentedFor}
                </div>
            )
        },
        { 
            accessorKey: 'approvedPartyName', 
            header: 'Approved Party Name',
            cell: ({ row }) => (
                <div className="text-center">
                    {row.original.approvedPartyName}
                </div>
            )
        },
        { 
            accessorKey: 'rate', 
            header: 'Rate',
            cell: ({ row }) => (
                <div className="text-center">
                    {row.original.rate}
                </div>
            )
        },
        { 
            accessorKey: 'indentQty', 
            header: 'Indent Qty',
            cell: ({ row }) => (
                <div className="text-center">
                    {row.original.indentQty}
                </div>
            )
        },
        { 
            accessorKey: 'totalRate', 
            header: 'Total Rate',
            cell: ({ row }) => (
                <div className="text-center">
                    {row.original.totalRate}
                </div>
            )
        },
        { 
            accessorKey: 'status1', 
            header: 'Status 1',
            cell: ({ row }) => {
                const status = row.original.status1;
                const variant = status === 'Done' ? 'default' : 'destructive';
                return (
                    <div className="flex justify-center">
                        <Badge variant={variant}>
                            {status || 'Pending'}
                        </Badge>
                    </div>
                );
            }
        },
        { 
            accessorKey: 'remarks1', 
            header: 'Remarks 1',
            cell: ({ row }) => (
                <div className="text-center">
                    {row.original.remarks1 || '-'}
                </div>
            )
        },
        { 
            accessorKey: 'status2', 
            header: 'Status 2',
            cell: ({ row }) => {
                const status = row.original.status2;
                const variant = status === 'Done' ? 'default' : 'destructive';
                return (
                    <div className="flex justify-center">
                        <Badge variant={variant}>
                            {status || 'Pending'}
                        </Badge>
                    </div>
                );
            }
        },
        { 
            accessorKey: 'remarks2', 
            header: 'Remarks 2',
            cell: ({ row }) => (
                <div className="text-center">
                    {row.original.remarks2 || '-'}
                </div>
            )
        },
    ];

    const historyColumns: ColumnDef<TallyEntryHistoryData>[] = [
        { 
            accessorKey: 'indentNo', 
            header: 'Indent No.',
            cell: ({ row }) => (
                <div className="text-center">
                    {row.original.indentNo}
                </div>
            )
        },
        { 
            accessorKey: 'indentDate', 
            header: 'Indent Date',
            cell: ({ row }) => (
                <div className="text-center">
                    {formatDate(row.original.indentDate)}
                </div>
            )
        },
        { 
            accessorKey: 'firmNameMatch', 
            header: 'Firm Name',
            cell: ({ row }) => (
                <div className="text-center">
                    {row.original.firmNameMatch}
                </div>
            )
        },
        { 
            accessorKey: 'purchaseDate', 
            header: 'Purchase Date',
            cell: ({ row }) => (
                <div className="text-center">
                    {formatDate(row.original.purchaseDate)}
                </div>
            )
        },
        { 
            accessorKey: 'materialInDate', 
            header: 'Material In Date',
            cell: ({ row }) => (
                <div className="text-center">
                    {formatDate(row.original.materialInDate)}
                </div>
            )
        },
        { 
            accessorKey: 'productName', 
            header: 'Product Name',
            cell: ({ row }) => (
                <div className="text-center">
                    {row.original.productName}
                </div>
            )
        },
        { 
            accessorKey: 'billNo', 
            header: 'Bill No.',
            cell: ({ row }) => (
                <div className="text-center">
                    {row.original.billNo}
                </div>
            )
        },
        { 
            accessorKey: 'qty', 
            header: 'Qty',
            cell: ({ row }) => (
                <div className="text-center">
                    {row.original.qty}
                </div>
            )
        },
        { 
            accessorKey: 'partyName', 
            header: 'Party Name',
            cell: ({ row }) => (
                <div className="text-center">
                    {row.original.partyName}
                </div>
            )
        },
        { 
            accessorKey: 'billAmt', 
            header: 'Bill Amt',
            cell: ({ row }) => (
                <div className="text-center">
                    {row.original.billAmt}
                </div>
            )
        },
        {
            accessorKey: 'billImage',
            header: 'Bill Image',
            cell: ({ row }) => {
                const image = row.original.billImage;
                return (
                    <div className="text-center">
                        {image ? (
                            <a href={image} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                                View
                            </a>
                        ) : (
                            <span className="text-gray-400">-</span>
                        )}
                    </div>
                );
            },
        },
        { 
            accessorKey: 'billReceivedLater', 
            header: 'Bill Received Later',
            cell: ({ row }) => (
                <div className="text-center">
                    {row.original.billReceivedLater || '-'}
                </div>
            )
        },
        { 
            accessorKey: 'notReceivedBillNo', 
            header: 'Not Received Bill No.',
            cell: ({ row }) => (
                <div className="text-center">
                    {row.original.notReceivedBillNo || '-'}
                </div>
            )
        },
        { 
            accessorKey: 'location', 
            header: 'Location',
            cell: ({ row }) => (
                <div className="text-center">
                    {row.original.location}
                </div>
            )
        },
        { 
            accessorKey: 'typeOfBills', 
            header: 'Type Of Bills',
            cell: ({ row }) => (
                <div className="text-center">
                    {row.original.typeOfBills}
                </div>
            )
        },
        {
            accessorKey: 'productImage',
            header: 'Product Image',
            cell: ({ row }) => {
                const image = row.original.productImage;
                return (
                    <div className="text-center">
                        {image ? (
                            <a href={image} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                                View
                            </a>
                        ) : (
                            <span className="text-gray-400">-</span>
                        )}
                    </div>
                );
            },
        },
        { 
            accessorKey: 'area', 
            header: 'Area',
            cell: ({ row }) => (
                <div className="text-center">
                    {row.original.area}
                </div>
            )
        },
        { 
            accessorKey: 'indentedFor', 
            header: 'Indented For',
            cell: ({ row }) => (
                <div className="text-center">
                    {row.original.indentedFor}
                </div>
            )
        },
        { 
            accessorKey: 'approvedPartyName', 
            header: 'Approved Party Name',
            cell: ({ row }) => (
                <div className="text-center">
                    {row.original.approvedPartyName}
                </div>
            )
        },
        { 
            accessorKey: 'rate', 
            header: 'Rate',
            cell: ({ row }) => (
                <div className="text-center">
                    {row.original.rate}
                </div>
            )
        },
        { 
            accessorKey: 'indentQty', 
            header: 'Indent Qty',
            cell: ({ row }) => (
                <div className="text-center">
                    {row.original.indentQty}
                </div>
            )
        },
        { 
            accessorKey: 'totalRate', 
            header: 'Total Rate',
            cell: ({ row }) => (
                <div className="text-center">
                    {row.original.totalRate}
                </div>
            )
        },
        { 
            accessorKey: 'status1', 
            header: 'Status',
            cell: ({ row }) => {
                const status = row.original.status1;
                const variant = status === 'Done' ? 'default' : 'destructive';
                return (
                    <div className="flex justify-center">
                        <Badge variant={variant}>
                            {status || '-'}
                        </Badge>
                    </div>
                );
            }
        },
        { 
            accessorKey: 'remarks1', 
            header: 'Remarks',
            cell: ({ row }) => (
                <div className="text-center">
                    {row.original.remarks1 || '-'}
                </div>
            )
        },
        { 
            accessorKey: 'status2', 
            header: 'Status 2',
            cell: ({ row }) => {
                const status = row.original.status2;
                const variant = status === 'Done' ? 'default' : 'destructive';
                return (
                    <div className="flex justify-center">
                        <Badge variant={variant}>
                            {status || '-'}
                        </Badge>
                    </div>
                );
            }
        },
        { 
            accessorKey: 'remarks2', 
            header: 'Remarks 2',
            cell: ({ row }) => (
                <div className="text-center">
                    {row.original.remarks2 || '-'}
                </div>
            )
        },
        { 
            accessorKey: 'status3', 
            header: 'Status 3',
            cell: ({ row }) => {
                const status = row.original.status3;
                const variant = status === 'Done' ? 'default' : 'destructive';
                return (
                    <div className="flex justify-center">
                        <Badge variant={variant}>
                            {status || '-'}
                        </Badge>
                    </div>
                );
            }
        },
        { 
            accessorKey: 'remarks3', 
            header: 'Remarks 3',
            cell: ({ row }) => (
                <div className="text-center">
                    {row.original.remarks3 || '-'}
                </div>
            )
        },
    ];

    const schema = z.object({
        status3: z
            .enum(['Done', 'Not Done'], {
                required_error: 'Please select a status',
            })
            .optional()
            .refine((val) => val !== undefined, {
                message: 'Please select a status',
            }),
        remarks3: z.string().min(1, 'Remarks are required'),
    });

    const form = useForm({
        resolver: zodResolver(schema),
        defaultValues: {
            status3: undefined as 'Done' | 'Not Done' | undefined,
            remarks3: '',
        },
    });

    useEffect(() => {
        if (!openDialog) {
            form.reset({
                status3: undefined,
                remarks3: '',
            });
        }
    }, [openDialog, form]);

    async function onSubmit(values: z.infer<typeof schema>) {
        try {
            const currentDateTime = new Date()
                .toLocaleString('en-GB', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: false,
                })
                .replace(',', '');

            await postToSheet(
                tallyEntrySheet
                    .filter((s) => s.indentNo === selectedItem?.indentNo)
                    .map((prev) => ({
                        rowIndex: prev.rowIndex,
                        actual3: currentDateTime,
                        status3: values.status3,
                        remarks3: values.remarks3,
                    })),
                'update',
                'TALLY ENTRY'
            );

            toast.success(`Updated status for ${selectedItem?.indentNo}`);
            setOpenDialog(false);
            setTimeout(() => updateAll(), 1000);
        } catch {
            toast.error('Failed to update status');
        }
    }

    function onError(e: any) {
        console.log(e);
        toast.error('Please fill all required fields');
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            <Dialog open={openDialog} onOpenChange={setOpenDialog}>
                <div className="p-4 md:p-6">
                    <div className="max-w-7xl mx-auto">
                        {/* Header Section */}
                        <div className="mb-8">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-white rounded-xl shadow-sm border">
                                        <Calculator size={32} className="text-primary" />
                                    </div>
                                    <div>
                                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                                            Reauditing Data
                                        </h1>
                                        <p className="text-gray-600 mt-1">
                                            Process reauditing entries and manage status
                                        </p>
                                    </div>
                                </div>
                                
                                {/* Stats Cards */}
                                <div className="flex gap-4">
                                    <div className="bg-white p-4 rounded-xl shadow-sm border min-w-[140px]">
                                        <div className="text-sm font-medium text-gray-500">Pending Reaudit</div>
                                        <div className="text-2xl font-bold text-amber-600 mt-1">
                                            {pendingData.length}
                                        </div>
                                    </div>
                                    <div className="bg-white p-4 rounded-xl shadow-sm border min-w-[140px]">
                                        <div className="text-sm font-medium text-gray-500">Reaudited</div>
                                        <div className="text-2xl font-bold text-green-600 mt-1">
                                            {historyData.length}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Tabs */}
                            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                                    <div className="border-b px-6">
                                        <TabsList className="bg-transparent p-0 h-auto">
                                            <TabsTrigger 
                                                value="pending" 
                                                className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none px-6 py-3"
                                            >
                                                <span className="flex items-center gap-2">
                                                    <span>Pending Reaudit</span>
                                                    {pendingData.length > 0 && (
                                                        <Badge variant="secondary" className="ml-2">
                                                            {pendingData.length}
                                                        </Badge>
                                                    )}
                                                </span>
                                            </TabsTrigger>
                                            <TabsTrigger 
                                                value="history" 
                                                className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none px-6 py-3"
                                            >
                                                <span className="flex items-center gap-2">
                                                    <span>Reaudit History</span>
                                                    {historyData.length > 0 && (
                                                        <Badge variant="outline" className="ml-2">
                                                            {historyData.length}
                                                        </Badge>
                                                    )}
                                                </span>
                                            </TabsTrigger>
                                        </TabsList>
                                    </div>

                                    <div className="p-6">
                                        <TabsContent value="pending" className="mt-0">
                                            <div className="mb-4">
                                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                    <div>
                                                        <h3 className="text-lg font-semibold">
                                                            Pending Reaudit Entries
                                                        </h3>
                                                        <p className="text-gray-600 text-sm">
                                                            Items requiring reauditing after rectification
                                                        </p>
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        Showing {pendingData.length} entries
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="border rounded-lg overflow-hidden">
                                                <DataTable
                                                    data={pendingData}
                                                    columns={pendingColumns}
                                                    searchFields={['indentNo', 'productName', 'partyName', 'billNo', 'firmNameMatch']}
                                                    dataLoading={false}
                                                />
                                            </div>
                                        </TabsContent>

                                        <TabsContent value="history" className="mt-0">
                                            <div className="mb-4">
                                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                    <div>
                                                        <h3 className="text-lg font-semibold">
                                                            Reaudit History
                                                        </h3>
                                                        <p className="text-gray-600 text-sm">
                                                            Items that have been reaudited
                                                        </p>
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        Showing {historyData.length} entries
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="border rounded-lg overflow-hidden">
                                                <DataTable
                                                    data={historyData}
                                                    columns={historyColumns}
                                                    searchFields={[
                                                        'indentNo',
                                                        'productName',
                                                        'partyName',
                                                        'billNo',
                                                        'firmNameMatch',
                                                        'status1',
                                                        'status2',
                                                        'status3',
                                                    ]}
                                                    dataLoading={false}
                                                />
                                            </div>
                                        </TabsContent>
                                    </div>
                                </Tabs>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Dialog for Processing */}
                {selectedItem && (
                    <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
                        <Form {...form}>
                            <form
                                onSubmit={form.handleSubmit(onSubmit, onError)}
                                className="space-y-6"
                            >
                                <DialogHeader className="text-center">
                                    <DialogTitle className="text-2xl">Process Reaudit</DialogTitle>
                                    <DialogDescription>
                                        Process reaudit for indent number{' '}
                                        <span className="font-bold text-primary">{selectedItem.indentNo}</span>
                                    </DialogDescription>
                                </DialogHeader>

                                <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-5 rounded-lg border">
                                    <h3 className="text-lg font-bold mb-4 text-gray-800">Entry Details</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {[
                                            { label: 'Indent No.', value: selectedItem.indentNo },
                                            { label: 'Indent Date', value: formatDate(selectedItem.indentDate) },
                                            { label: 'Purchase Date', value: formatDate(selectedItem.purchaseDate) },
                                            { label: 'Material In Date', value: formatDate(selectedItem.materialInDate) },
                                            { label: 'Product Name', value: selectedItem.productName },
                                            { label: 'Bill No.', value: selectedItem.billNo },
                                            { label: 'Firm Name', value: selectedItem.firmNameMatch },
                                            { label: 'Quantity', value: selectedItem.qty },
                                            { label: 'Party Name', value: selectedItem.partyName },
                                            { label: 'Bill Amount', value: selectedItem.billAmt },
                                            { label: 'Bill Received Later', value: selectedItem.billReceivedLater || 'N/A' },
                                            { label: 'Not Received Bill No.', value: selectedItem.notReceivedBillNo || 'N/A' },
                                            { label: 'Location', value: selectedItem.location },
                                            { label: 'Type Of Bills', value: selectedItem.typeOfBills },
                                            { label: 'Area', value: selectedItem.area },
                                            { label: 'Indented For', value: selectedItem.indentedFor },
                                            { label: 'Approved Party Name', value: selectedItem.approvedPartyName },
                                            { label: 'Rate', value: selectedItem.rate },
                                            { label: 'Indent Qty', value: selectedItem.indentQty },
                                            { label: 'Total Rate', value: selectedItem.totalRate },
                                            { label: 'Audit Status (Status 1)', value: selectedItem.status1 },
                                            { label: 'Audit Remarks (Remarks 1)', value: selectedItem.remarks1 || 'N/A' },
                                            { label: 'Rectification Status (Status 2)', value: selectedItem.status2 },
                                            { label: 'Rectification Remarks (Remarks 2)', value: selectedItem.remarks2 || 'N/A' },
                                        ].map((item, index) => (
                                            <div key={index} className="space-y-1">
                                                <p className="text-sm font-medium text-gray-500">{item.label}</p>
                                                <p className="text-base font-semibold text-gray-800 break-words">
                                                    {item.value || 'N/A'}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                    
                                    {/* Image Links */}
                                    <div className="mt-4 pt-4 border-t">
                                        <div className="flex gap-6">
                                            {selectedItem.billImage && (
                                                <div className="space-y-1">
                                                    <p className="text-sm font-medium text-gray-500">Bill Image</p>
                                                    <a 
                                                        href={selectedItem.billImage} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer"
                                                        className="text-primary hover:underline font-semibold"
                                                    >
                                                        View Bill Image
                                                    </a>
                                                </div>
                                            )}
                                            {selectedItem.productImage && (
                                                <div className="space-y-1">
                                                    <p className="text-sm font-medium text-gray-500">Product Image</p>
                                                    <a 
                                                        href={selectedItem.productImage} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer"
                                                        className="text-primary hover:underline font-semibold"
                                                    >
                                                        View Product Image
                                                    </a>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-5">
                                    <FormField
                                        control={form.control}
                                        name="status3"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-base">Reaudit Status *</FormLabel>
                                                <Select
                                                    onValueChange={field.onChange}
                                                    value={field.value}
                                                >
                                                    <FormControl>
                                                        <SelectTrigger className="h-12">
                                                            <SelectValue placeholder="Select reaudit status" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="Done" className="py-3">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                                                <span>Done</span>
                                                            </div>
                                                        </SelectItem>
                                                        <SelectItem value="Not Done" className="py-3">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                                                <span>Not Done</span>
                                                            </div>
                                                        </SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="remarks3"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-base">Reaudit Remarks *</FormLabel>
                                                <FormControl>
                                                    <Textarea
                                                        placeholder="Enter reaudit remarks here..."
                                                        {...field}
                                                        rows={4}
                                                        className="resize-none"
                                                    />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <DialogFooter className="flex flex-col sm:flex-row gap-3">
                                    <DialogClose asChild>
                                        <Button variant="outline" className="w-full sm:w-auto">
                                            Cancel
                                        </Button>
                                    </DialogClose>

                                    <Button 
                                        type="submit" 
                                        disabled={form.formState.isSubmitting}
                                        className="w-full sm:w-auto bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary"
                                    >
                                        {form.formState.isSubmitting && (
                                            <Loader
                                                size={20}
                                                color="white"
                                                className="mr-2"
                                            />
                                        )}
                                        {form.formState.isSubmitting ? 'Processing...' : 'Update Reaudit'}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </Form>
                    </DialogContent>
                )}
            </Dialog>
        </div>
    );
};