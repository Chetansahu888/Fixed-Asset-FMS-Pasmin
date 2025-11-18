import { Package2 } from 'lucide-react';
import Heading from '../element/Heading';
import { useSheets } from '@/context/SheetsContext';
import { useEffect, useState } from 'react';
import type { ColumnDef, Row } from '@tanstack/react-table';
import DataTable from '../element/DataTable';
import { useAuth } from '@/context/AuthContext';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {  uploadFile } from '@/lib/fetchers';

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
import { Input } from '../ui/input';
import { postToSheet } from '@/lib/fetchers';
import type { PIApprovalSheet } from '@/types';

interface PIPendingData {
    rowIndex: number;
    timestamp: string;
    partyName: string;
    poNumber: string;
    internalCode: string;
    product: string;
    description: string;
    quantity: number;
    unit: string;
    rate: number;
    gstPercent: number;
    discountPercent: number;
    amount: number;
    totalPoAmount: number;
    deliveryDate: string;
    paymentTerms: string;
    firmNameMatch: string;
}

interface POMasterRecord {
    rowIndex?: number;
    timestamp?: string;
    partyName?: string;
    poNumber?: string;
    quotationNumber?: string;
    quotationDate?: string;
    enquiryNumber?: string;
    enquiryDate?: string;
    internalCode?: string;
    product?: string;
    description?: string;
    quantity?: string | number;
    unit?: string;
    rate?: string | number;
    gstPercent?: string | number;
    discountPercent?: string | number;
    amount?: string | number;
    totalPoAmount?: string | number;
    preparedBy?: string;
    approvedBy?: string;
    pdf?: string;
    deliveryDate?: string;
    paymentTerms?: string;
    numberOfDays?: string | number;
    term1?: string;
    term2?: string;
    term3?: string;
    term4?: string;
    term5?: string;
    term6?: string;
    term7?: string;
    term8?: string;
    term9?: string;
    term10?: string;
    emailSendStatus?: string;
    deliveryDays?: string | number;
    deliveryType?: string;
    firmNameMatch?: string;
    piApprovalTimestamp?: string;
    piQty?: string | number;
    piAmount?: string | number;
    piCopy?: string;
    poRateWithoutTax?: string | number;
}

export default function PIApprovals() {
    const { poMasterLoading, poMasterSheet, piApprovalSheet, updateAll } = useSheets();
    const { user } = useAuth();
    const [pendingData, setPendingData] = useState<PIPendingData[]>([]);
    const [selectedItem, setSelectedItem] = useState<PIPendingData | null>(null);
    const [openDialog, setOpenDialog] = useState(false);
    const [uploadingFile, setUploadingFile] = useState(false);

    useEffect(() => {
        try {
            console.log('=== PI APPROVALS PAGE ===');
            console.log('poMasterSheet:', poMasterSheet);
            console.log('Total records:', poMasterSheet?.length || 0);

            const safePoMasterSheet: POMasterRecord[] = Array.isArray(poMasterSheet) ? poMasterSheet : [];

            if (safePoMasterSheet.length > 0) {
                console.log('First record:', safePoMasterSheet[0]);
                console.log('Field names:', Object.keys(safePoMasterSheet[0]));
            }

            // Filter by firm
            const filteredByFirm = safePoMasterSheet.filter((sheet: POMasterRecord) =>
                user?.firmNameMatch?.toLowerCase() === "all" ||
                sheet?.firmNameMatch === user?.firmNameMatch
            );

            console.log('Filtered by firm:', filteredByFirm.length);

            // ✅ CHANGED: Filter items that are NOT in PI Approval sheet yet
            const approvedPONumbers = new Set(
                (piApprovalSheet || []).map(pi => pi.piNo)
            );

            const pending = filteredByFirm
                .filter((sheet: POMasterRecord) => 
                    // Not yet in PI Approval sheet
                    !approvedPONumbers.has(sheet?.poNumber || '')
                )
                .map((sheet: POMasterRecord) => ({
                    rowIndex: sheet?.rowIndex || 0,
                    timestamp: sheet?.timestamp || '',
                    partyName: sheet?.partyName || '',
                    poNumber: sheet?.poNumber || '',
                    internalCode: sheet?.internalCode || '',
                    product: sheet?.product || '',
                    description: sheet?.description || '',
                    quantity: Number(sheet?.quantity || 0),
                    unit: sheet?.unit || '',
                    rate: Number(sheet?.rate || 0),
                    gstPercent: Number(sheet?.gstPercent || 0),
                    discountPercent: Number(sheet?.discountPercent || 0),
                    amount: Number(sheet?.amount || 0),
                    totalPoAmount: Number(sheet?.totalPoAmount || 0),
                    deliveryDate: sheet?.deliveryDate || '',
                    paymentTerms: sheet?.paymentTerms || '',
                    firmNameMatch: sheet?.firmNameMatch || '',
                }));

            console.log('Pending items:', pending.length);
            console.log('Pending data:', pending);
            setPendingData(pending);

        } catch (error) {
            console.error('❌ Error in PI Approvals useEffect:', error);
            setPendingData([]);
        }
    }, [poMasterSheet, piApprovalSheet, user?.firmNameMatch]);

    const pendingColumns: ColumnDef<PIPendingData>[] = [
        {
            header: 'Action',
            cell: ({ row }: { row: Row<PIPendingData> }) => (
                <DialogTrigger asChild>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedItem(row.original)}
                    >
                        PI Payment
                    </Button>
                </DialogTrigger>
            ),
        },
        {
            accessorKey: 'poNumber',
            header: 'PO Number',
            cell: ({ getValue }) => <div>{getValue() as string || '-'}</div>
        },
        {
            accessorKey: 'partyName',
            header: 'Party Name',
            cell: ({ getValue }) => <div>{getValue() as string || '-'}</div>
        },
        {
            accessorKey: 'internalCode',
            header: 'Internal Code',
            cell: ({ getValue }) => <div>{getValue() as string || '-'}</div>
        },
        {
            accessorKey: 'product',
            header: 'Product',
            cell: ({ getValue }) => <div>{getValue() as string || '-'}</div>
        },
        {
            accessorKey: 'quantity',
            header: 'Quantity',
            cell: ({ getValue }) => <div>{getValue() as number || 0}</div>
        },
        {
            accessorKey: 'unit',
            header: 'Unit',
            cell: ({ getValue }) => <div>{getValue() as string || '-'}</div>
        },
        {
            accessorKey: 'rate',
            header: 'Rate',
            cell: ({ row }) => <div>₹{(row.original.rate || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
        },
        {
            accessorKey: 'amount',
            header: 'Amount',
            cell: ({ row }) => <div>₹{(row.original.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
        },
        {
            accessorKey: 'totalPoAmount',
            header: 'Total PO Amount',
            cell: ({ row }) => <div>₹{(row.original.totalPoAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
        },
        {
            accessorKey: 'paymentTerms',
            header: 'Payment Terms',
            cell: ({ getValue }) => <div>{getValue() as string || '-'}</div>
        },
        {
            accessorKey: 'firmNameMatch',
            header: 'Firm Name',
            cell: ({ getValue }) => <div>{getValue() as string || '-'}</div>
        },
    ];

    const schema = z.object({
        qty: z.string().min(1, 'Quantity is required'),
        piAmount: z.string().min(1, 'P.I Amount is required'),
        piCopy: z.string().min(1, 'P.I Copy is required'),
        poRateWithoutTax: z.string().min(1, 'PO Rate Without Tax is required'),
    });

    const form = useForm({
        resolver: zodResolver(schema),
        defaultValues: {
            qty: '',
            piAmount: '',
            piCopy: '',
            poRateWithoutTax: '',
        },
    });

    useEffect(() => {
        if (!openDialog) {
            form.reset();
        }
    }, [openDialog, form]);

   const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
        toast.error('Only PDF, JPG, and PNG files are allowed');
        return;
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
        toast.error('File size must be less than 10MB');
        return;
    }

    try {
        setUploadingFile(true);
        
        // ✅ Use the uploadFile function from fetchers (same as reference code)
        const driveLink = await uploadFile({
            file: file,
            folderId: import.meta.env.VITE_BILL_PHOTO_FOLDER // Use your PI Copy folder ID
        });
        
        // Set the Google Drive link to the form
        form.setValue('piCopy', driveLink);
        toast.success('File uploaded successfully to Google Drive');
    } catch (error) {
        toast.error('Failed to upload file to Google Drive');
        console.error('Upload error:', error);
    } finally {
        setUploadingFile(false);
    }
};

    // ✅ GENERATE PI NUMBER
    function generatePINumber(): string {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        
        // Format: PI-48 or similar based on existing pattern
        const existingPICount = (piApprovalSheet || []).length;
        const piNumber = `PI-${existingPICount + 48}`; // Starts from PI-48 based on your sheet
        
        return piNumber;
    }

    // ✅ FIXED: Submit to PI APPROVAL sheet
    async function onSubmit(values: z.infer<typeof schema>) {
        try {
            // Generate timestamp in the format matching your sheet
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

            // Generate PI Number
            const piNumber = generatePINumber();

            // ✅ CHANGED: Submit to PI APPROVAL sheet (not PO MASTER)
            await postToSheet(
    [{
        timestamp: currentDateTime,
        piNo: piNumber,
        indentNo: selectedItem?.internalCode,
        partyName: selectedItem?.partyName,
        productName: selectedItem?.product,
        qty: values.qty && !isNaN(Number(values.qty)) ? Number(values.qty) : 0,
        piAmount: values.piAmount && !isNaN(Number(values.piAmount)) ? Number(values.piAmount) : 0,
        piCopy: values.piCopy,
        poRateWithoutTax: values.poRateWithoutTax && !isNaN(Number(values.poRateWithoutTax)) ? Number(values.poRateWithoutTax) : 0,
        planned: '',
        actual: '',
        delay: '',
        status: '',
        approvalAmount: 0,
    } as Partial<PIApprovalSheet>],  // ✅ TYPE ASSERTION
    'insert',
    'PI APPROVAL'
);

            toast.success(`PI Payment submitted for PO: ${selectedItem?.poNumber}`);
            setOpenDialog(false);
            setTimeout(() => updateAll(), 1000);
        } catch (error) {
            toast.error('Failed to process PI approval');
            console.error(error);
        }
    }

    function onError(e: any) {
        console.log(e);
        toast.error('Please fill all required fields');
    }

    return (
        <div>
            <Dialog open={openDialog} onOpenChange={setOpenDialog}>
                <Heading heading="PI Approvals" subtext="Process PI Payments and Approvals">
                    <Package2 size={50} className="text-primary" />
                </Heading>

                <DataTable
                    data={pendingData}
                    columns={pendingColumns}
                    searchFields={['poNumber', 'partyName', 'product', 'internalCode']}
                    dataLoading={poMasterLoading}
                    className='h-[80dvh]'
                />

                {selectedItem && (
                    <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
                        <Form {...form}>
                            <form
                                onSubmit={form.handleSubmit(onSubmit, onError)}
                                className="space-y-5"
                            >
                                <DialogHeader className="space-y-1">
                                    <DialogTitle>Process PI Approval</DialogTitle>
                                    <DialogDescription>
                                        Process payment for PO Number{' '}
                                        <span className="font-medium">
                                            {selectedItem.poNumber}
                                        </span>
                                    </DialogDescription>
                                </DialogHeader>

                                <div className="bg-muted p-4 rounded-md grid gap-3">
                                    <h3 className="text-lg font-bold">Pre-filled Details from PO Master</h3>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <p className="font-medium">PO Number</p>
                                            <p className="text-sm font-light">
                                                {selectedItem.poNumber}
                                            </p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="font-medium">Party Name</p>
                                            <p className="text-sm font-light">
                                                {selectedItem.partyName}
                                            </p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="font-medium">Indent No. (Internal Code)</p>
                                            <p className="text-sm font-light">
                                                {selectedItem.internalCode}
                                            </p>
                                        </div>
                                        <div className="space-y-1 col-span-2">
                                            <p className="font-medium">Product Name</p>
                                            <p className="text-sm font-light">
                                                {selectedItem.product}
                                            </p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="font-medium">Quantity</p>
                                            <p className="text-sm font-light">
                                                {selectedItem.quantity} {selectedItem.unit}
                                            </p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="font-medium">Rate</p>
                                            <p className="text-sm font-light">
                                                ₹{selectedItem.rate.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                            </p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="font-medium">Amount</p>
                                            <p className="text-sm font-light">
                                                ₹{selectedItem.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                            </p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="font-medium">Total PO Amount</p>
                                            <p className="text-sm font-light">
                                                ₹{selectedItem.totalPoAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid gap-4">
                                    <FormField
                                        control={form.control}
                                        name="qty"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Quantity *</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        placeholder="Enter quantity"
                                                        {...field}
                                                    />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="piAmount"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>P.I Amount *</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        step="0.01"
                                                        placeholder="Enter PI amount"
                                                        {...field}
                                                    />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
    control={form.control}
    name="piCopy"
    render={({ field }) => (
        <FormItem>
            <FormLabel>P.I Copy (Upload File) *</FormLabel>
            <FormControl>
                <div className="space-y-2">
                    <Input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={handleFileUpload}
                        disabled={uploadingFile}
                    />
                    {uploadingFile && (
                        <p className="text-sm text-blue-600 flex items-center gap-2">
                            <Loader size={16} color="blue" />
                            Uploading to Google Drive...
                        </p>
                    )}
                    {field.value && !uploadingFile && (
                        <div className="space-y-1">
                            <p className="text-sm text-green-600">
                                ✓ File uploaded successfully
                            </p>
                            <a 
                                href={field.value} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                            >
                                View uploaded file →
                            </a>
                        </div>
                    )}
                </div>
            </FormControl>
        </FormItem>
    )}
/>


                                    <FormField
                                        control={form.control}
                                        name="poRateWithoutTax"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>PO Rate Without Tax *</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        step="0.01"
                                                        placeholder="Enter PO rate without tax"
                                                        {...field}
                                                    />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <DialogFooter>
                                    <DialogClose asChild>
                                        <Button variant="outline" type="button">Cancel</Button>
                                    </DialogClose>

                                    <Button type="submit" disabled={form.formState.isSubmitting || uploadingFile}>
                                        {form.formState.isSubmitting && (
                                            <Loader
                                                size={20}
                                                color="white"
                                                aria-label="Loading Spinner"
                                                className="mr-2"
                                            />
                                        )}
                                        Submit Payment
                                    </Button>
                                </DialogFooter>
                            </form>
                        </Form>
                    </DialogContent>
                )}
            </Dialog>
        </div>
    );
}
