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
import { Tabs, TabsContent } from '../ui/tabs';
import { useAuth } from '@/context/AuthContext';
import Heading from '../element/Heading';
import { Pill } from '../ui/pill';

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
}

export default () => {
    const { tallyEntrySheet, updateAll } = useSheets();
    const { user } = useAuth();

    const [pendingData, setPendingData] = useState<TallyEntryPendingData[]>([]);
    const [historyData, setHistoryData] = useState<TallyEntryHistoryData[]>([]);
    const [selectedItem, setSelectedItem] = useState<TallyEntryPendingData | null>(null);
    const [openDialog, setOpenDialog] = useState(false);

    // useEffect(() => {
    //     setPendingData(
    //         tallyEntrySheet
    //             .filter((i) => i.planned1 !== '' && i.actual1 === '')
    //             .map((i) => ({
    //                 indentNumber: i.indentNumber || '',
    //                 liftNumber: i.liftNumber || '',
    //                 poNumber: i.poNumber || '',
    //                 materialInDate: i.materialInDate || '',
    //                 productName: i.productName || '',
    //                 billNo: i.billNo || '',
    //                 qty: i.qty || 0,
    //                 partyName: i.partyName || '',
    //                 billAmt: i.billAmt || 0,
    //                 billImage: i.billImage || '',
    //                 billReceivedLater: i.billReceivedLater || '',
    //                 notReceivedBillNo: i.notReceivedBillNo || '',
    //                 location: i.location || '',
    //                 typeOfBills: i.typeOfBills || '',
    //                 productImage: i.productImage || '',
    //                 area: i.area || '',
    //                 indentedFor: i.indentedFor || '',
    //                 approvedPartyName: i.approvedPartyName || '',
    //                 rate: i.rate || 0,
    //                 indentQty: i.indentQty || 0,
    //                 totalRate: i.totalRate || 0,
    //             }))
    //     );
    // }, [tallyEntrySheet]);
    // console.log("Pending Data:", pendingData);

    // useEffect(() => {
    //     setHistoryData(
    //         tallyEntrySheet
    //             .filter((i) => i.planned1 !== '' && i.actual1 !== '')
    //             .map((i) => ({
    //                 indentNumber: i.indentNumber || '',
    //                 liftNumber: i.liftNumber || '',
    //                 poNumber: i.poNumber || '',
    //                 materialInDate: i.materialInDate || '',
    //                 productName: i.productName || '',
    //                 billNo: i.billNo || '',
    //                 qty: i.qty || 0,
    //                 partyName: i.partyName || '',
    //                 billAmt: i.billAmt || 0,
    //                 billImage: i.billImage || '',
    //                 billReceivedLater: i.billReceivedLater || '',
    //                 notReceivedBillNo: i.notReceivedBillNo || '',
    //                 location: i.location || '',
    //                 typeOfBills: i.typeOfBills || '',
    //                 productImage: i.productImage || '',
    //                 area: i.area || '',
    //                 indentedFor: i.indentedFor || '',
    //                 approvedPartyName: i.approvedPartyName || '',
    //                 rate: i.rate || 0,
    //                 indentQty: i.indentQty || 0,
    //                 totalRate: i.totalRate || 0,
    //                 status1: i.status1 || '',
    //                 remarks1: i.remarks1 || '',
    //             }))
    //     );
    // }, [tallyEntrySheet]);

    useEffect(() => {
    // Pehle firm name se filter karo (case-insensitive)
    const filteredByFirm = tallyEntrySheet.filter(item => 
        user.firmNameMatch.toLowerCase() === "all" || item.firmNameMatch === user.firmNameMatch
    );
    
    setPendingData(
        filteredByFirm
            .filter((i) => i.planned1 !== '' && i.actual1 === '')
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
            }))
    );
}, [tallyEntrySheet, user.firmNameMatch]);

useEffect(() => {
    // Pehle firm name se filter karo (case-insensitive)
    const filteredByFirm = tallyEntrySheet.filter(item => 
        user.firmNameMatch.toLowerCase() === "all" || item.firmNameMatch === user.firmNameMatch
    );
    
    setHistoryData(
        filteredByFirm
            .filter((i) => i.planned1 !== '' && i.actual1 !== '')
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
            }))
    );
}, [tallyEntrySheet, user.firmNameMatch]);

    const formatDate = (dateString: string) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
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
        { accessorKey: 'indentNumber', header: 'Indent No.' },
        { accessorKey: 'firmNameMatch', header: 'Firm Name' },
        {
            accessorKey: 'liftNumber',
            header: 'Lift Number',
            cell: ({ row }) => row.original.liftNumber || ''
        },

        {
            accessorKey: 'poNumber',
            header: 'Po Number',
            cell: ({ row }) => row.original.poNumber || ''
        },

        {
            accessorKey: 'materialInDate',
            header: 'Material In Date',
            cell: ({ row }) => formatDate(row.original.materialInDate)
        },
        { accessorKey: 'productName', header: 'Product Name' },
        { accessorKey: 'billNo', header: 'Bill No.' },
        { accessorKey: 'qty', header: 'Qty' },
        { accessorKey: 'partyName', header: 'Party Name' },
        { accessorKey: 'billAmt', header: 'Bill Amt' },
        {
            accessorKey: 'billImage',
            header: 'Bill Image',
            cell: ({ row }) => {
                const image = row.original.billImage;
                return image ? (
                    <a href={image} target="_blank" rel="noopener noreferrer">
                        View
                    </a>
                ) : (
                    <></>
                );
            },
        },
        { accessorKey: 'billReceivedLater', header: 'Bill Received Later' },
        { accessorKey: 'notReceivedBillNo', header: 'Not Received Bill No.' },
        { accessorKey: 'location', header: 'Location' },
        { accessorKey: 'typeOfBills', header: 'Type Of Bills' },
        {
            accessorKey: 'productImage',
            header: 'Product Image',
            cell: ({ row }) => {
                const image = row.original.productImage;
                return image ? (
                    <a href={image} target="_blank" rel="noopener noreferrer">
                        View
                    </a>
                ) : (
                    <></>
                );
            },
        },
        { accessorKey: 'area', header: 'Area' },
        { accessorKey: 'indentedFor', header: 'Indented For' },
        { accessorKey: 'approvedPartyName', header: 'Approved Party Name' },
        { accessorKey: 'rate', header: 'Rate' },
        { accessorKey: 'indentQty', header: 'Indent Qty' },
        { accessorKey: 'totalRate', header: 'Total Rate' },
    ];

    const historyColumns: ColumnDef<TallyEntryHistoryData>[] = [
        { accessorKey: 'indentNumber', header: 'Indent No.' },
        {
            accessorKey: 'liftNumber',
            header: 'Lift Number',
            cell: ({ row }) => formatDate(row.original.liftNumber)
        },
        { accessorKey: 'firmNameMatch', header: 'Firm Name' },
        {
            accessorKey: 'poNumber',
            header: 'Po Number',
            cell: ({ row }) => formatDate(row.original.poNumber)
        },
        {
            accessorKey: 'materialInDate',
            header: 'Material In Date',
            cell: ({ row }) => formatDate(row.original.materialInDate)
        },
        { accessorKey: 'productName', header: 'Product Name' },
        { accessorKey: 'billNo', header: 'Bill No.' },
        { accessorKey: 'qty', header: 'Qty' },
        { accessorKey: 'partyName', header: 'Party Name' },
        { accessorKey: 'billAmt', header: 'Bill Amt' },
        {
            accessorKey: 'billImage',
            header: 'Bill Image',
            cell: ({ row }) => {
                const image = row.original.billImage;
                return image ? (
                    <a href={image} target="_blank" rel="noopener noreferrer">
                        View
                    </a>
                ) : (
                    <></>
                );
            },
        },
        { accessorKey: 'billReceivedLater', header: 'Bill Received Later' },
        { accessorKey: 'notReceivedBillNo', header: 'Not Received Bill No.' },
        { accessorKey: 'location', header: 'Location' },
        { accessorKey: 'typeOfBills', header: 'Type Of Bills' },
        {
            accessorKey: 'productImage',
            header: 'Product Image',
            cell: ({ row }) => {
                const image = row.original.productImage;
                return image ? (
                    <a href={image} target="_blank" rel="noopener noreferrer">
                        View
                    </a>
                ) : (
                    <></>
                );
            },
        },
        { accessorKey: 'area', header: 'Area' },
        { accessorKey: 'indentedFor', header: 'Indented For' },
        { accessorKey: 'approvedPartyName', header: 'Approved Party Name' },
        { accessorKey: 'rate', header: 'Rate' },
        { accessorKey: 'indentQty', header: 'Indent Qty' },
        { accessorKey: 'totalRate', header: 'Total Rate' },
        {
            accessorKey: 'status1',
            header: 'Status',
            cell: ({ row }) => {
                const status = row.original.status1;
                const variant = status === 'Done' ? 'secondary' : 'reject';
                return <Pill variant={variant}>{status}</Pill>;
            },
        },
        { accessorKey: 'remarks1', header: 'Remarks' },
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

            // Update the sheet
            await postToSheet(
                tallyEntrySheet
                    .filter((s) => s.indentNumber === selectedItem?.indentNumber)
                    .map((prev) => ({
                        rowIndex: prev.rowIndex,  // ✅ Only rowIndex to identify the row
                        actual1: currentDateTime,  // ✅ New timestamp
                        status1: values.status1,   // ✅ Form field
                        remarks1: values.remarks1, // ✅ Form field
                    })),
                'update',
                'TALLY ENTRY'
            );

            toast.success(`Updated status for ${selectedItem?.indentNumber}`);
            setOpenDialog(false);
            setTimeout(() => updateAll(), 1000);
            console.log("Form values:", values);
            console.log("Current DateTime:", currentDateTime);
            console.log("Selected Item:", selectedItem);
            console.log("Filtered Rows:", tallyEntrySheet.filter(s => s.indentNumber === selectedItem?.indentNumber));

        } catch {
            toast.error('Failed to update status');
        }
    }

    function onError(e: any) {
        console.log(e);
        toast.error('Please fill all required fields');
    }

    return (
        <div>
            <Dialog open={openDialog} onOpenChange={setOpenDialog}>
                <Tabs defaultValue="pending">
                    <Heading
                        heading="Audit Data"
                        subtext="Process tally entries and manage status"
                        tabs
                    >
                        <Calculator size={50} className="text-primary" />
                    </Heading>

                    <TabsContent value="pending">
                        <DataTable
                            data={pendingData}
                            columns={pendingColumns}
                            searchFields={['indentNumber', 'productName', 'partyName', 'billNo']}
                            dataLoading={false}
                        />
                    </TabsContent>
                    <TabsContent value="history">
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
                        />
                    </TabsContent>
                </Tabs>

                {selectedItem && (
                    <DialogContent className="sm:max-w-2xl">
                        <Form {...form}>
                            <form
                                onSubmit={form.handleSubmit(onSubmit, onError)}
                                className="space-y-5"
                            >
                                <DialogHeader className="space-y-1">
                                    <DialogTitle>Process Tally Entry</DialogTitle>
                                    <DialogDescription>
                                        Process entry for indent number{' '}
                                        <span className="font-medium">{selectedItem.indentNumber}</span>
                                    </DialogDescription>
                                </DialogHeader>

                                <div className="bg-muted p-4 rounded-md grid gap-3">
                                    <h3 className="text-lg font-bold">Entry Details</h3>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                        <div className="space-y-1">
                                            <p className="font-medium text-nowrap">Indent No.</p>
                                            <p className="text-sm font-light">
                                                {selectedItem.indentNumber}
                                            </p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="font-medium text-nowrap">Product Name</p>
                                            <p className="text-sm font-light">
                                                {selectedItem.productName}
                                            </p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="font-medium">Party Name</p>
                                            <p className="text-sm font-light">
                                                {selectedItem.partyName}
                                            </p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="font-medium">Bill No.</p>
                                            <p className="text-sm font-light">
                                                {selectedItem.billNo}
                                            </p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="font-medium">Quantity</p>
                                            <p className="text-sm font-light">{selectedItem.qty}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="font-medium">Bill Amount</p>
                                            <p className="text-sm font-light">
                                                {selectedItem.billAmt}
                                            </p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="font-medium">Location</p>
                                            <p className="text-sm font-light">
                                                {selectedItem.location}
                                            </p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="font-medium">Area</p>
                                            <p className="text-sm font-light">
                                                {selectedItem.area}
                                            </p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="font-medium">Rate</p>
                                            <p className="text-sm font-light">
                                                {selectedItem.rate}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid gap-4">
                                    <FormField
                                        control={form.control}
                                        name="status1"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Status *</FormLabel>
                                                <Select
                                                    onValueChange={field.onChange}
                                                    value={field.value}
                                                >
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select status" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="Done">Done</SelectItem>
                                                        <SelectItem value="Not Done">
                                                            Not Done
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
                                                <FormLabel>Remarks *</FormLabel>
                                                <FormControl>
                                                    <Textarea
                                                        placeholder="Enter remarks..."
                                                        {...field}
                                                        rows={4}
                                                    />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <DialogFooter>
                                    <DialogClose asChild>
                                        <Button variant="outline">Close</Button>
                                    </DialogClose>

                                    <Button type="submit" disabled={form.formState.isSubmitting}>
                                        {form.formState.isSubmitting && (
                                            <Loader
                                                size={20}
                                                color="white"
                                                aria-label="Loading Spinner"
                                            />
                                        )}
                                        Update Status
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
