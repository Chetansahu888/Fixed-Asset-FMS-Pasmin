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
import Heading from '../element/Heading';
import { Pill } from '../ui/pill';
import { Badge } from '../ui/badge';

interface TallyEntryPendingData {
    indentNumber: string;
    liftNumber: string;
    poNumber: string;
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
    firmNameMatch: string; 
    planned1: string;
    actual1: string;
}

interface TallyEntryHistoryData {
    indentNumber: string;
    liftNumber: string;
    poNumber: string;
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
    firmNameMatch: string;
    planned1: string;
    actual1: string;
}

export default () => {
    const { tallyEntrySheet, updateAll } = useSheets();
    const { user } = useAuth();

    const [pendingData, setPendingData] = useState<TallyEntryPendingData[]>([]);
    const [historyData, setHistoryData] = useState<TallyEntryHistoryData[]>([]);
    const [selectedItem, setSelectedItem] = useState<TallyEntryPendingData | null>(null);
    const [openDialog, setOpenDialog] = useState(false);
    const [activeTab, setActiveTab] = useState('pending');

    // FILTERING CONDITIONS EXPLAINED:
    // 1. First filter by firm name (if user.firmNameMatch is not "all")
    // 2. For PENDING: Items where planned1 is NOT empty AND actual1 IS empty
    //    (This means the task is scheduled but not yet completed)
    // 3. For HISTORY: Items where planned1 is NOT empty AND actual1 is NOT empty
    //    (This means the task was scheduled and has been completed)

    useEffect(() => {
        const filteredByFirm = tallyEntrySheet.filter(item => 
            user.firmNameMatch.toLowerCase() === "all" || 
            item.firmNameMatch?.toLowerCase() === user.firmNameMatch?.toLowerCase()
        );
        
        // Pending items: Planned but not yet executed
        const pendingItems = filteredByFirm
            .filter((i) => i.planned1 && i.planned1.trim() !== '' && 
                    (!i.actual1 || i.actual1.trim() === ''))
            .map((i) => ({
                indentNumber: i.indentNumber || '',
                liftNumber: i.liftNumber || '',
                poNumber: i.poNumber || '',
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
                firmNameMatch: i.firmNameMatch || '',
                planned1: i.planned1 || '',
                actual1: i.actual1 || '',
            }));
        
        setPendingData(pendingItems);
        console.log(`Pending items found: ${pendingItems.length}`, pendingItems);
    }, [tallyEntrySheet, user.firmNameMatch]);

    useEffect(() => {
        const filteredByFirm = tallyEntrySheet.filter(item => 
            user.firmNameMatch.toLowerCase() === "all" || 
            item.firmNameMatch?.toLowerCase() === user.firmNameMatch?.toLowerCase()
        );
        
        // History items: Planned and already executed
        const historyItems = filteredByFirm
            .filter((i) => i.planned1 && i.planned1.trim() !== '' && 
                    i.actual1 && i.actual1.trim() !== '')
            .map((i) => ({
                indentNumber: i.indentNumber || '',
                liftNumber: i.liftNumber || '',
                poNumber: i.poNumber || '',
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
                firmNameMatch: i.firmNameMatch || '',
                planned1: i.planned1 || '',
                actual1: i.actual1 || '',
            }));
        
        setHistoryData(historyItems);
        console.log(`History items found: ${historyItems.length}`, historyItems);
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
                        const item = row.original;

                        return (
                            <DialogTrigger asChild>
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setSelectedItem(item);
                                    }}
                                >
                                    Process
                                </Button>
                            </DialogTrigger>
                        );
                    },
                },
            ]
            : []),
        { 
            accessorKey: 'indentNumber', 
            header: 'Indent No.',
            cell: ({ row }) => (
                <div className="text-center">
                    {row.original.indentNumber}
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
            accessorKey: 'liftNumber',
            header: 'Lift Number',
            cell: ({ row }) => (
                <div className="text-center">
                    {row.original.liftNumber || ''}
                </div>
            )
        },
        {
            accessorKey: 'poNumber',
            header: 'PO Number',
            cell: ({ row }) => (
                <div className="text-center">
                    {row.original.poNumber || ''}
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
            accessorKey: 'billAmt', 
            header: 'Bill Amt',
            cell: ({ row }) => (
                <div className="text-center">
                    {row.original.billAmt}
                </div>
            )
        },
    ];

    const historyColumns: ColumnDef<TallyEntryHistoryData>[] = [
        { 
            accessorKey: 'indentNumber', 
            header: 'Indent No.',
            cell: ({ row }) => (
                <div className="text-center">
                    {row.original.indentNumber}
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
            accessorKey: 'poNumber',
            header: 'PO Number',
            cell: ({ row }) => (
                <div className="text-center">
                    {row.original.poNumber || ''}
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
            accessorKey: 'status1',
            header: 'Status',
            cell: ({ row }) => {
                const status = row.original.status1;
                const variant = status === 'Done' ? 'secondary' : 'destructive';
                return (
                    <div className="flex justify-center">
                        <Badge variant={variant}>
                            {status}
                        </Badge>
                    </div>
                );
            },
        },
        { 
            accessorKey: 'remarks1', 
            header: 'Remarks',
            cell: ({ row }) => (
                <div className="text-center">
                    {row.original.remarks1}
                </div>
            )
        },
    ];

    const schema = z.object({
        status1: z
            .enum(['Done', 'Not Done'], {
                required_error: 'Please select a status',
            })
            .optional()
            .refine((val) => val !== undefined, {
                message: 'Please select a status',
            }),
        remarks1: z.string().min(1, 'Remarks are required'),
    });

    const form = useForm({
        resolver: zodResolver(schema),
        defaultValues: {
            status1: undefined as 'Done' | 'Not Done' | undefined,
            remarks1: '',
        },
    });

    useEffect(() => {
        if (!openDialog) {
            form.reset({
                status1: undefined,
                remarks1: '',
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
                    .filter((s) => s.indentNumber === selectedItem?.indentNumber)
                    .map((prev) => ({
                        rowIndex: prev.rowIndex,
                        actual1: currentDateTime,
                        status1: values.status1,
                        remarks1: values.remarks1,
                    })),
                'update',
                'TALLY ENTRY'
            );

            toast.success(`Updated status for ${selectedItem?.indentNumber}`);
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
                                            Audit Data
                                        </h1>
                                        <p className="text-gray-600 mt-1">
                                            Process tally entries and manage status
                                        </p>
                                    </div>
                                </div>
                                
                                {/* Stats Cards */}
                                <div className="flex gap-4">
                                    <div className="bg-white p-4 rounded-xl shadow-sm border min-w-[140px]">
                                        <div className="text-sm font-medium text-gray-500">Pending</div>
                                        <div className="text-2xl font-bold text-amber-600 mt-1">
                                            {pendingData.length}
                                        </div>
                                    </div>
                                    <div className="bg-white p-4 rounded-xl shadow-sm border min-w-[140px]">
                                        <div className="text-sm font-medium text-gray-500">Completed</div>
                                        <div className="text-2xl font-bold text-green-600 mt-1">
                                            {historyData.length}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Tabs */}
                            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                                <div className="border-b">
                                    <TabsList className="bg-transparent p-0 h-auto">
                                        <TabsTrigger 
                                            value="pending" 
                                            className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none px-6 py-3"
                                        >
                                            <span className="flex items-center gap-2">
                                                <span>Pending</span>
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
                                                <span>History</span>
                                                {historyData.length > 0 && (
                                                    <Badge variant="outline" className="ml-2">
                                                        {historyData.length}
                                                    </Badge>
                                                )}
                                            </span>
                                        </TabsTrigger>
                                    </TabsList>
                                </div>

                                <TabsContent value="pending" className="mt-6">
                                    <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                                        <div className="p-4 border-b">
                                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                <div>
                                                    <h3 className="text-lg font-semibold">
                                                        Pending Tally Entries
                                                    </h3>
                                                    <p className="text-gray-600 text-sm">
                                                        Items scheduled but not yet processed
                                                    </p>
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    Showing {pendingData.length} entries
                                                </div>
                                            </div>
                                        </div>
                                        <DataTable
                                            data={pendingData}
                                            columns={pendingColumns}
                                            searchFields={['indentNumber', 'productName', 'partyName', 'billNo']}
                                            dataLoading={false}
                                            className="border-none"
                                        />
                                    </div>
                                </TabsContent>

                                <TabsContent value="history" className="mt-6">
                                    <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                                        <div className="p-4 border-b">
                                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                <div>
                                                    <h3 className="text-lg font-semibold">
                                                        Completed Tally Entries
                                                    </h3>
                                                    <p className="text-gray-600 text-sm">
                                                        Items that have been processed
                                                    </p>
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    Showing {historyData.length} entries
                                                </div>
                                            </div>
                                        </div>
                                        <DataTable
                                            data={historyData}
                                            columns={historyColumns}
                                            searchFields={[
                                                'indentNumber',
                                                'productName',
                                                'partyName',
                                                'billNo',
                                                'status1',
                                            ]}
                                            dataLoading={false}
                                            className="border-none"
                                        />
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </div>
                    </div>
                </div>

                {/* Dialog for Processing */}
                {selectedItem && (
                    <DialogContent className="sm:max-w-2xl">
                        <Form {...form}>
                            <form
                                onSubmit={form.handleSubmit(onSubmit, onError)}
                                className="space-y-6"
                            >
                                <DialogHeader className="text-center">
                                    <DialogTitle className="text-2xl">Process Tally Entry</DialogTitle>
                                    <DialogDescription>
                                        Process entry for indent number{' '}
                                        <span className="font-bold text-primary">{selectedItem.indentNumber}</span>
                                    </DialogDescription>
                                </DialogHeader>

                                <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-5 rounded-lg border">
                                    <h3 className="text-lg font-bold mb-4 text-gray-800">Entry Details</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {[
                                            { label: 'Indent No.', value: selectedItem.indentNumber },
                                            { label: 'Product Name', value: selectedItem.productName },
                                            { label: 'Party Name', value: selectedItem.partyName },
                                            { label: 'Bill No.', value: selectedItem.billNo },
                                            { label: 'Quantity', value: selectedItem.qty },
                                            { label: 'Bill Amount', value: selectedItem.billAmt },
                                            { label: 'Location', value: selectedItem.location },
                                            { label: 'Area', value: selectedItem.area },
                                            { label: 'Rate', value: selectedItem.rate },
                                            { label: 'Firm', value: selectedItem.firmNameMatch },
                                        ].map((item, index) => (
                                            <div key={index} className="space-y-1">
                                                <p className="text-sm font-medium text-gray-500">{item.label}</p>
                                                <p className="text-base font-semibold text-gray-800">
                                                    {item.value || 'N/A'}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-5">
                                    <FormField
                                        control={form.control}
                                        name="status1"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-base">Status *</FormLabel>
                                                <Select
                                                    onValueChange={field.onChange}
                                                    value={field.value}
                                                >
                                                    <FormControl>
                                                        <SelectTrigger className="h-12">
                                                            <SelectValue placeholder="Select status" />
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
                                        name="remarks1"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-base">Remarks *</FormLabel>
                                                <FormControl>
                                                    <Textarea
                                                        placeholder="Enter your remarks here..."
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
                                        {form.formState.isSubmitting ? 'Processing...' : 'Update Status'}
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