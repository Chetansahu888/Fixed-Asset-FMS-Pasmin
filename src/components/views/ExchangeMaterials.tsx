import { Package2, FileText, Building, DollarSign, Calendar, Upload, CheckCircle, AlertCircle } from 'lucide-react';
import Heading from '../element/Heading';
import { useSheets } from '@/context/SheetsContext';
import { useEffect, useState } from 'react';
import type { ColumnDef, Row } from '@tanstack/react-table';
import DataTable from '../element/DataTable';
import { useAuth } from '@/context/AuthContext';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { uploadFile } from '@/lib/fetchers';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogClose,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';
import { PuffLoader as Loader } from 'react-spinners';
import { toast } from 'sonner';
import { Input } from '../ui/input';
import { postToSheet } from '@/lib/fetchers';
import type { PIApprovalSheet } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';

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
    
    const [stats, setStats] = useState({
        total: 0,
        totalAmount: 0,
        pendingCount: 0
    });

    useEffect(() => {
        try {
            const safePoMasterSheet: POMasterRecord[] = Array.isArray(poMasterSheet) ? poMasterSheet : [];
            
            // Filter by firm
            const filteredByFirm = safePoMasterSheet.filter((sheet: POMasterRecord) =>
                user?.firmNameMatch?.toLowerCase() === "all" ||
                sheet?.firmNameMatch === user?.firmNameMatch
            );

            // Filter items that are NOT in PI Approval sheet yet
            const approvedPONumbers = new Set(
                (piApprovalSheet || []).map(pi => pi.piNo)
            );

            const pending = filteredByFirm
                .filter((sheet: POMasterRecord) => 
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

            setPendingData(pending);
            
            // Calculate stats
            const totalAmount = pending.reduce((sum, item) => sum + item.totalPoAmount, 0);
            setStats({
                total: pending.length,
                totalAmount,
                pendingCount: pending.length
            });

        } catch (error) {
            console.error('❌ Error in PI Approvals useEffect:', error);
            setPendingData([]);
        }
    }, [poMasterSheet, piApprovalSheet, user?.firmNameMatch]);

    const pendingColumns: ColumnDef<PIPendingData>[] = [
        {
            header: 'Action',
            cell: ({ row }: { row: Row<PIPendingData> }) => (
                <Button
                    variant="default"
                    size="sm"
                    onClick={() => {
                        setSelectedItem(row.original);
                        setOpenDialog(true);
                    }}
                    className="bg-purple-600 hover:bg-purple-700 shadow-sm"
                >
                    <FileText className="mr-2 h-3 w-3" />
                    PI Payment
                </Button>
            ),
        },
        {
            accessorKey: 'poNumber',
            header: 'PO Number',
            cell: ({ row }) => (
                <span className="font-medium text-purple-700">{row.original.poNumber || '-'}</span>
            )
        },
        {
            accessorKey: 'partyName',
            header: 'Party Name',
            cell: ({ row }) => (
                <span className="font-medium">{row.original.partyName || '-'}</span>
            )
        },
        {
            accessorKey: 'internalCode',
            header: 'Indent No.',
            cell: ({ row }) => (
                <Badge variant="outline" className="bg-gray-50">
                    {row.original.internalCode || '-'}
                </Badge>
            )
        },
        {
            accessorKey: 'product',
            header: 'Product',
            cell: ({ row }) => (
                <span className="font-medium">{row.original.product || '-'}</span>
            )
        },
        {
            accessorKey: 'quantity',
            header: 'Qty',
            cell: ({ row }) => (
                <Badge variant="outline" className="bg-blue-50">
                    {row.original.quantity} {row.original.unit}
                </Badge>
            )
        },
        {
            accessorKey: 'rate',
            header: 'Rate',
            cell: ({ row }) => (
                <span className="font-semibold text-gray-800">₹{row.original.rate?.toLocaleString('en-IN')}</span>
            )
        },
        {
            accessorKey: 'amount',
            header: 'Amount',
            cell: ({ row }) => (
                <span className="font-semibold text-green-600">₹{row.original.amount?.toLocaleString('en-IN')}</span>
            )
        },
        {
            accessorKey: 'totalPoAmount',
            header: 'Total PO',
            cell: ({ row }) => (
                <span className="font-bold text-purple-600">₹{row.original.totalPoAmount?.toLocaleString('en-IN')}</span>
            )
        },
        {
            accessorKey: 'paymentTerms',
            header: 'Terms',
            cell: ({ row }) => {
                const terms = row.original.paymentTerms;
                const isAdvance = terms?.toLowerCase().includes('advance');
                return (
                    <Badge variant={isAdvance ? "default" : "outline"} className={isAdvance ? "bg-amber-100 text-amber-800" : ""}>
                        {terms || '-'}
                    </Badge>
                );
            }
        },
        {
            accessorKey: 'firmNameMatch',
            header: 'Firm',
            cell: ({ row }) => (
                <Badge variant="outline" className="bg-gray-50">
                    <Building className="mr-1 h-3 w-3" />
                    {row.original.firmNameMatch || '-'}
                </Badge>
            )
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

        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
        if (!allowedTypes.includes(file.type)) {
            toast.error('Only PDF, JPG, and PNG files are allowed');
            return;
        }

        const maxSize = 10 * 1024 * 1024;
        if (file.size > maxSize) {
            toast.error('File size must be less than 10MB');
            return;
        }

        try {
            setUploadingFile(true);
            const driveLink = await uploadFile({
                file: file,
                folderId: import.meta.env.VITE_BILL_PHOTO_FOLDER
            });
            
            form.setValue('piCopy', driveLink);
            toast.success('File uploaded successfully to Google Drive');
        } catch (error) {
            toast.error('Failed to upload file to Google Drive');
            console.error('Upload error:', error);
        } finally {
            setUploadingFile(false);
        }
    };

    function generatePINumber(): string {
        const existingPICount = (piApprovalSheet || []).length;
        const piNumber = `PI-${existingPICount + 48}`;
        return piNumber;
    }

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

            const piNumber = generatePINumber();

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
                } as Partial<PIApprovalSheet>],
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
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50 p-4 md:p-6">
            <div className="mx-auto max-w-7xl">
                {/* Header Section */}
                <div className="mb-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-purple-600 rounded-lg shadow">
                            <Package2 size={28} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">PI Approvals</h1>
                            <p className="text-gray-600">Process and approve Proforma Invoice payments</p>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <Card className="bg-white shadow border-0 hover:shadow-md transition-shadow">
                            <CardContent className="p-5">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Pending Approvals</p>
                                        <p className="text-2xl font-bold text-purple-600 mt-1">{stats.total}</p>
                                    </div>
                                    <FileText className="h-10 w-10 text-purple-500" />
                                </div>
                            </CardContent>
                        </Card>
                        
                        <Card className="bg-white shadow border-0 hover:shadow-md transition-shadow">
                            <CardContent className="p-5">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Total PO Amount</p>
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
                                        <p className="text-sm font-medium text-gray-600">Approval Status</p>
                                        <p className="text-2xl font-bold text-amber-600 mt-1">
                                            {stats.pendingCount > 0 ? 'Pending' : 'Completed'}
                                        </p>
                                    </div>
                                    <div className={`h-10 w-10 flex items-center justify-center rounded-full ${
                                        stats.pendingCount > 0 ? 'bg-amber-100' : 'bg-green-100'
                                    }`}>
                                        {stats.pendingCount > 0 ? (
                                            <AlertCircle className="h-6 w-6 text-amber-600" />
                                        ) : (
                                            <CheckCircle className="h-6 w-6 text-green-600" />
                                        )}
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
                                <CardTitle className="text-xl font-bold text-gray-800">Pending PI Approvals</CardTitle>
                                <p className="text-gray-600 text-sm mt-1">Click "PI Payment" to process Proforma Invoice approval</p>
                            </div>
                            {stats.total === 0 ? (
                                <Badge variant="outline" className="bg-green-50 text-green-700">
                                    <CheckCircle className="mr-1 h-3 w-3" />
                                    All Approved
                                </Badge>
                            ) : (
                                <Badge variant="outline" className="bg-purple-50 text-purple-700">
                                    <AlertCircle className="mr-1 h-3 w-3" />
                                    {stats.total} Pending
                                </Badge>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent>
                        {pendingData.length > 0 ? (
                            <DataTable
                                data={pendingData}
                                columns={pendingColumns}
                                searchFields={['poNumber', 'partyName', 'product', 'internalCode', 'firmNameMatch']}
                                dataLoading={poMasterLoading}
                                className="border rounded-lg"
                            />
                        ) : (
                            <div className="text-center py-12">
                                <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold text-gray-700 mb-2">No Pending PI Approvals</h3>
                                <p className="text-gray-500">All Proforma Invoices have been approved.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* PI Payment Dialog */}
                <Dialog open={openDialog} onOpenChange={setOpenDialog}>
                    {selectedItem && (
                        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit, onError)} className="space-y-6">
                                    <DialogHeader>
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="p-2 bg-purple-100 rounded-lg">
                                                <FileText className="h-6 w-6 text-purple-600" />
                                            </div>
                                            <div>
                                                <DialogTitle className="text-xl">Process PI Approval</DialogTitle>
                                                <DialogDescription>
                                                    Process Proforma Invoice for PO: <span className="font-semibold text-purple-600">{selectedItem.poNumber}</span>
                                                </DialogDescription>
                                            </div>
                                        </div>
                                    </DialogHeader>

                                    <Separator />

                                    {/* PO Details Card */}
                                    <Card className="bg-purple-50 border-purple-200">
                                        <CardHeader className="pb-3">
                                            <CardTitle className="text-base font-semibold text-purple-800 flex items-center gap-2">
                                                <Package2 className="h-4 w-4" />
                                                PO Details
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                                <div className="space-y-1">
                                                    <p className="text-xs font-medium text-gray-600">PO Number</p>
                                                    <p className="text-sm font-semibold text-gray-800">{selectedItem.poNumber}</p>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-xs font-medium text-gray-600">Party Name</p>
                                                    <p className="text-sm font-semibold text-gray-800">{selectedItem.partyName}</p>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-xs font-medium text-gray-600">Indent No.</p>
                                                    <p className="text-sm font-semibold text-gray-800">{selectedItem.internalCode}</p>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-xs font-medium text-gray-600">Product</p>
                                                    <p className="text-sm font-semibold text-gray-800">{selectedItem.product}</p>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-xs font-medium text-gray-600">Quantity</p>
                                                    <p className="text-sm font-semibold text-gray-800">
                                                        {selectedItem.quantity} {selectedItem.unit}
                                                    </p>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-xs font-medium text-gray-600">Total PO Amount</p>
                                                    <p className="text-sm font-semibold text-green-600">
                                                        ₹{selectedItem.totalPoAmount?.toLocaleString('en-IN')}
                                                    </p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Form Fields */}
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <FormField
                                                control={form.control}
                                                name="qty"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="font-medium">Quantity *</FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                type="number"
                                                                placeholder="Enter quantity"
                                                                className="border-gray-300 focus:border-purple-500"
                                                                {...field}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={form.control}
                                                name="piAmount"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="font-medium flex items-center gap-2">
                                                            <DollarSign className="h-4 w-4" />
                                                            P.I Amount *
                                                        </FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                type="number"
                                                                step="0.01"
                                                                placeholder="Enter PI amount"
                                                                className="border-gray-300 focus:border-purple-500"
                                                                {...field}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>

                                        <FormField
                                            control={form.control}
                                            name="piCopy"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="font-medium flex items-center gap-2">
                                                        <Upload className="h-4 w-4" />
                                                        P.I Copy (Upload File) *
                                                    </FormLabel>
                                                    <FormControl>
                                                        <div className="space-y-2">
                                                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-purple-400 transition-colors">
                                                                <Input
                                                                    type="file"
                                                                    accept=".pdf,.jpg,.jpeg,.png"
                                                                    onChange={handleFileUpload}
                                                                    disabled={uploadingFile}
                                                                    className="border-0 cursor-pointer"
                                                                />
                                                                <p className="text-xs text-gray-500 mt-2">
                                                                    Upload PI copy (PDF, JPG, PNG - Max 10MB)
                                                                </p>
                                                            </div>
                                                            {uploadingFile && (
                                                                <div className="flex items-center gap-2 text-sm text-blue-600">
                                                                    <Loader size={16} color="blue" />
                                                                    Uploading to Google Drive...
                                                                </div>
                                                            )}
                                                            {field.value && !uploadingFile && (
                                                                <div className="space-y-1">
                                                                    <p className="text-sm text-green-600 flex items-center gap-2">
                                                                        <CheckCircle className="h-4 w-4" />
                                                                        File uploaded successfully
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
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="poRateWithoutTax"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="font-medium">PO Rate Without Tax *</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="number"
                                                            step="0.01"
                                                            placeholder="Enter PO rate without tax"
                                                            className="border-gray-300 focus:border-purple-500"
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <Separator />

                                    <DialogFooter className="gap-2">
                                        <DialogClose asChild>
                                            <Button 
                                                variant="outline" 
                                                type="button"
                                                className="border-gray-300"
                                                disabled={form.formState.isSubmitting || uploadingFile}
                                            >
                                                Cancel
                                            </Button>
                                        </DialogClose>
                                        <Button 
                                            type="submit" 
                                            className="bg-purple-600 hover:bg-purple-700 shadow-sm"
                                            disabled={form.formState.isSubmitting || uploadingFile}
                                        >
                                            {form.formState.isSubmitting ? (
                                                <>
                                                    <Loader size={18} className="mr-2" />
                                                    Submitting...
                                                </>
                                            ) : (
                                                <>
                                                    <FileText className="mr-2 h-4 w-4" />
                                                    Submit PI Payment
                                                </>
                                            )}
                                        </Button>
                                    </DialogFooter>
                                </form>
                            </Form>
                        </DialogContent>
                    )}
                </Dialog>
            </div>
        </div>
    );
}