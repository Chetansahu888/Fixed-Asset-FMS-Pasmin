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
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { postToSheet, uploadFile } from '@/lib/fetchers';
import type { ReceivedSheet } from '@/types';
import { Truck, Download } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { useAuth } from '@/context/AuthContext';
import { Badge } from '../ui/badge';

interface StoreInPendingData {
    liftNumber: string;
    indentNo: string;
    billNo: string;
    vendorName: string;
    productName: string;
    qty: number;
    typeOfBill: string;
    billAmount: number;
    paymentType: string;
    advanceAmountIfAny: string;
    photoOfBill: string;
    transportationInclude: string;
    transporterName: string;
    amount: number;
    // Add missing properties that are used in columns
    poDate: string;
    poNumber: string;
    vendor: string;
    indentNumber: string;
    product: string;
    uom: string;
    quantity: number;
    poCopy: string;

    billStatus: string;
    leadTimeToLiftMaterial: number;
    discountAmount: number;
    rowIndex?: number; // Added to fix the error
    firmNameMatch: string;
}

// Fix type names to match usage
type RecieveItemsData = StoreInPendingData;

export default () => {
    const { storeInSheet, indentSheet, updateAll } = useSheets();
    const { user } = useAuth();

    const [tableData, setTableData] = useState<StoreInPendingData[]>([]);
    const [selectedIndent, setSelectedIndent] = useState<StoreInPendingData | null>(null);
    const [openDialog, setOpenDialog] = useState(false);
    const [activeTab, setActiveTab] = useState('pending');

    // Add loading states
    const [indentLoading, setIndentLoading] = useState(false);
    const [receivedLoading, setReceivedLoading] = useState(false);

    useEffect(() => {
        // Pehle firm name se filter karo (case-insensitive)
        const filteredByFirm = storeInSheet.filter(item =>
            user.firmNameMatch.toLowerCase() === "all" || item.firmNameMatch === user.firmNameMatch
        );

        setTableData(
            filteredByFirm
                .filter((i) => i.planned11 !== '' && i.actual11 === '')
                .map((i) => ({
                    liftNumber: i.liftNumber || '',
                    indentNo: i.indentNo || '',
                    billNo: String(i.billNo) || '',
                    vendorName: i.vendorName || '',
                    productName: i.productName || '',
                    qty: i.qty || 0,
                    typeOfBill: i.typeOfBill || '',
                    billAmount: i.billAmount || 0,
                    paymentType: i.paymentType || '',
                    advanceAmountIfAny: i.advanceAmountIfAny || '',
                    photoOfBill: i.photoOfBill || '',
                    transportationInclude: i.transportationInclude || '',
                    transporterName: i.transporterName || '',
                    amount: i.amount || 0,
                    // Add missing mapped properties
                    poDate: i.poDate || '',
                    poNumber: i.poNumber || '',
                    vendor: i.vendor || '',
                    indentNumber: i.indentNumber || '',
                    product: i.product || '',
                    uom: i.uom || '',
                    quantity: i.quantity || 0,
                    poCopy: i.poCopy || '',

                    billStatus: i.billStatus || '',
                    leadTimeToLiftMaterial: i.leadTimeToLiftMaterial || 0,
                    discountAmount: i.discountAmount || 0,
                    rowIndex: i.rowIndex,
                    firmNameMatch: i.firmNameMatch || '',
                }))
        );
    }, [storeInSheet, user.firmNameMatch]);

    useEffect(() => {
        if (!openDialog) {
            form.reset({ status: undefined });
        }
    }, [openDialog]);

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

    const schema = z.object({
        status: z.enum(['ok']),
        billImageStatus: z.instanceof(File).optional().refine((file) => {
            if (!file) return true;
            return file.size <= 5 * 1024 * 1024; // 5MB max
        }, 'File size should be less than 5MB'),
    });

    const form = useForm({
        resolver: zodResolver(schema),
        defaultValues: {
            status: undefined,
            billImageStatus: undefined,
        },
    });

    const columns: ColumnDef<RecieveItemsData>[] = [
        ...(user.receiveItemView
            ? [
                {
                    header: 'Action',
                    cell: ({ row }: { row: Row<RecieveItemsData> }) => {
                        const indent = row.original;
                        return (
                            <div className="flex justify-center">
                                <DialogTrigger asChild>
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            setSelectedIndent(indent);
                                        }}
                                        className="min-w-[100px]"
                                    >
                                        Action
                                    </Button>
                                </DialogTrigger>
                            </div>
                        );
                    },
                },
            ]
            : []),
        {
            accessorKey: 'liftNumber',
            header: 'Lift Number',
            cell: ({ row }) => (
                <div className="text-center">
                    {row.original.liftNumber}
                </div>
            )
        },
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
            accessorKey: 'poNumber',
            header: 'PO Number',
            cell: ({ row }) => (
                <div className="text-center">
                    {row.original.poNumber}
                </div>
            )
        },
        {
            accessorKey: 'vendorName',
            header: 'Vendor Name',
            cell: ({ row }) => (
                <div className="text-center">
                    {row.original.vendorName}
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
            accessorKey: 'productName',
            header: 'Product Name',
            cell: ({ row }) => (
                <div className="text-center">
                    {row.original.productName}
                </div>
            )
        },
        {
            accessorKey: 'billStatus',
            header: 'Bill Status',
            cell: ({ row }) => (
                <div className="text-center">
                    {row.original.billStatus || '-'}
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
            accessorKey: 'leadTimeToLiftMaterial',
            header: 'Lead Time To Lift Material',
            cell: ({ row }) => (
                <div className="text-center">
                    {row.original.leadTimeToLiftMaterial || '-'}
                </div>
            )
        },
        {
            accessorKey: 'typeOfBill',
            header: 'Type Of Bill',
            cell: ({ row }) => (
                <div className="text-center">
                    {row.original.typeOfBill}
                </div>
            )
        },
        {
            accessorKey: 'billAmount',
            header: 'Bill Amount',
            cell: ({ row }) => (
                <div className="text-center">
                    {row.original.billAmount}
                </div>
            )
        },
        {
            accessorKey: 'discountAmount',
            header: 'Discount Amount',
            cell: ({ row }) => (
                <div className="text-center">
                    {row.original.discountAmount || '-'}
                </div>
            )
        },
        {
            accessorKey: 'paymentType',
            header: 'Payment Type',
            cell: ({ row }) => (
                <div className="text-center">
                    {row.original.paymentType}
                </div>
            )
        },
        {
            accessorKey: 'advanceAmountIfAny',
            header: 'Advance Amount If Any',
            cell: ({ row }) => (
                <div className="text-center">
                    {row.original.advanceAmountIfAny ? formatDate(row.original.advanceAmountIfAny) : '-'}
                </div>
            )
        },
        {
            accessorKey: 'photoOfBill',
            header: 'Photo Of Bill',
            cell: ({ row }) => {
                const photo = row.original.photoOfBill;
                return (
                    <div className="text-center">
                        {photo ? (
                            <a
                                href={photo}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline inline-flex items-center gap-1"
                            >
                                <Download size={14} />
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
            accessorKey: 'transportationInclude',
            header: 'Transportation Include',
            cell: ({ row }) => (
                <div className="text-center">
                    {row.original.transportationInclude || '-'}
                </div>
            )
        },
        {
            accessorKey: 'transporterName',
            header: 'Transporter Name',
            cell: ({ row }) => (
                <div className="text-center">
                    {row.original.transporterName || '-'}
                </div>
            )
        },
        {
            accessorKey: 'amount',
            header: 'Amount',
            cell: ({ row }) => (
                <div className="text-center">
                    {row.original.amount || '-'}
                </div>
            )
        },
    ];

    async function onSubmit(values: z.infer<typeof schema>) {
        try {
            let billImageUrl = '';

            // Upload image if provided
            if (values.billImageStatus) {
                const uploadedUrl = await uploadFile(
                    // values.billImageStatus
                    import.meta.env.VITE_BILL_PHOTO_FOLDER
                );
                billImageUrl = uploadedUrl;
            }

            const mappedData = [
                {
                    indentNo: selectedIndent!.indentNo,
                    actual11: new Date().toISOString(),
                    billStatusNew: values.status,
                    billImageStatus: billImageUrl,
                    rowIndex: selectedIndent!.rowIndex,
                }
            ];

            console.log('Mapped data to post:', mappedData);

            await postToSheet(mappedData, 'update', 'STORE IN');

            toast.success(`Bill status updated for ${selectedIndent?.indentNo}`);
            setOpenDialog(false);
            setTimeout(() => updateAll(), 1000);
        } catch (err) {
            console.error("Error:", err);
            toast.error('Failed to update');
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
                                        <Truck size={32} className="text-primary" />
                                    </div>
                                    <div>
                                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                                            Bill Status
                                        </h1>
                                        <p className="text-gray-600 mt-1">
                                            Receive items from purchase orders
                                        </p>
                                    </div>
                                </div>

                                {/* Stats Card */}
                                <div className="flex gap-4">
                                    <div className="bg-white p-4 rounded-xl shadow-sm border min-w-[140px]">
                                        <div className="text-sm font-medium text-gray-500">Pending Bills</div>
                                        <div className="text-2xl font-bold text-amber-600 mt-1">
                                            {tableData.length}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Table Section */}
                            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                                <div className="p-6">
                                    <div className="mb-4">
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                            <div>
                                                <h3 className="text-lg font-semibold">
                                                    Pending Bill Processing
                                                </h3>
                                                <p className="text-gray-600 text-sm">
                                                    Process bill status updates for received items
                                                </p>
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                Showing {tableData.length} entries
                                            </div>
                                        </div>
                                    </div>
                                    <div className="border rounded-lg overflow-hidden">
                                        <DataTable
                                            data={tableData}
                                            columns={columns}
                                            searchFields={[
                                                'liftNumber',
                                                'indentNo',
                                                'poNumber',
                                                'vendorName',
                                                'productName',
                                                'billStatus',
                                                'billNo',
                                                'qty',
                                                'leadTimeToLiftMaterial',
                                                'typeOfBill',
                                                'billAmount',
                                                'discountAmount',
                                                'paymentType',
                                                'advanceAmountIfAny',
                                                'transportationInclude',
                                                'transporterName',
                                                'amount',
                                                'firmNameMatch'
                                            ]}
                                            dataLoading={indentLoading}
                                            className="h-[70dvh]"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Dialog for Processing */}
                {selectedIndent && (
                    <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
                        <Form {...form}>
                            <form
                                onSubmit={form.handleSubmit(onSubmit, onError)}
                                className="space-y-6"
                            >
                                <DialogHeader className="text-center">
                                    <DialogTitle className="text-2xl">Update Bill Status</DialogTitle>
                                    <DialogDescription>
                                        Process bill for indent number{' '}
                                        <span className="font-bold text-primary">{selectedIndent.indentNo}</span>
                                    </DialogDescription>
                                </DialogHeader>

                                <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-5 rounded-lg border">
                                    <h3 className="text-lg font-bold mb-4 text-gray-800">Bill Details</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {[
                                            { label: 'Lift Number', value: selectedIndent.liftNumber },
                                            { label: 'Indent Number', value: selectedIndent.indentNo },
                                            { label: 'PO Number', value: selectedIndent.poNumber },
                                            { label: 'Vendor Name', value: selectedIndent.vendorName },
                                            { label: 'Firm Name', value: selectedIndent.firmNameMatch },
                                            { label: 'Product Name', value: selectedIndent.productName },
                                            { label: 'Bill Status', value: selectedIndent.billStatus || 'N/A' },
                                            { label: 'Bill No.', value: selectedIndent.billNo },
                                            { label: 'Quantity', value: selectedIndent.qty },
                                            { label: 'Lead Time', value: selectedIndent.leadTimeToLiftMaterial || 'N/A' },
                                            { label: 'Type of Bill', value: selectedIndent.typeOfBill },
                                            { label: 'Bill Amount', value: selectedIndent.billAmount },
                                            { label: 'Discount Amount', value: selectedIndent.discountAmount || 'N/A' },
                                            { label: 'Payment Type', value: selectedIndent.paymentType },
                                            { label: 'Advance Amount', value: selectedIndent.advanceAmountIfAny ? formatDate(selectedIndent.advanceAmountIfAny) : 'N/A' },
                                            { label: 'Transportation Include', value: selectedIndent.transportationInclude || 'N/A' },
                                            { label: 'Transporter Name', value: selectedIndent.transporterName || 'N/A' },
                                            { label: 'Amount', value: selectedIndent.amount || 'N/A' },
                                            { label: 'UOM', value: selectedIndent.uom || 'N/A' },
                                            { label: 'Ordered Quantity', value: selectedIndent.quantity || 'N/A' },
                                        ].map((item, index) => (
                                            <div key={index} className="space-y-1">
                                                <p className="text-sm font-medium text-gray-500">{item.label}</p>
                                                <p className="text-base font-semibold text-gray-800 break-words">
                                                    {item.value || 'N/A'}
                                                </p>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Image Link */}
                                    {selectedIndent.photoOfBill && (
                                        <div className="mt-4 pt-4 border-t">
                                            <div className="space-y-1">
                                                <p className="text-sm font-medium text-gray-500">Current Bill Image</p>
                                                <a
                                                    href={selectedIndent.photoOfBill}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-2 text-primary hover:underline font-semibold"
                                                >
                                                    <Download size={16} />
                                                    View Current Bill Image
                                                </a>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-5">
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="status"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-base">Bill Status *</FormLabel>
                                                    <Select
                                                        onValueChange={field.onChange}
                                                        value={field.value}
                                                    >
                                                        <FormControl>
                                                            <SelectTrigger className="h-12">
                                                                <SelectValue placeholder="Select bill status" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            <SelectItem value="ok" className="py-3">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                                                    <span>OK</span>
                                                                </div>
                                                            </SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </FormItem>
                                            )}
                                        />

                                        {form.watch('status') === 'ok' && (
                                            <FormField
                                                control={form.control}
                                                name="billImageStatus"
                                                render={({ field: { onChange, value, ...field } }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-base">Upload New Bill Image (Optional)</FormLabel>
                                                        <FormControl>
                                                            <div className="space-y-2">
                                                                <Input
                                                                    type="file"
                                                                    accept="image/*"
                                                                    onChange={(e) => {
                                                                        const file = e.target.files?.[0];
                                                                        if (file) onChange(file);
                                                                    }}
                                                                    className="h-12"
                                                                    {...field}
                                                                />
                                                                <p className="text-sm text-gray-500">
                                                                    Maximum file size: 5MB
                                                                </p>
                                                            </div>
                                                        </FormControl>
                                                    </FormItem>
                                                )}
                                            />
                                        )}
                                    </div>
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
                                        {form.formState.isSubmitting ? 'Processing...' : 'Update Bill Status'}
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