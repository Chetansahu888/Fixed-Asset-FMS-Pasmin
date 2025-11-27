import type { ColumnDef, Row } from '@tanstack/react-table';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '../ui/dialog';
import { useEffect, useState } from 'react';
import { useSheets } from '@/context/SheetsContext';
import DataTable from '../element/DataTable';
import { Button } from '../ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel } from '../ui/form';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { postToSheet } from '@/lib/fetchers';
import { toast } from 'sonner';
import { PuffLoader as Loader } from 'react-spinners';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Users, Building, User, Package, Calendar, FileText, IndianRupee } from 'lucide-react';
import { Tabs, TabsContent } from '../ui/tabs';
import { useAuth } from '@/context/AuthContext';
import Heading from '../element/Heading';
import { formatDate } from '@/lib/utils';
import { Input } from '../ui/input';

interface RateApprovalData {
    indentNo: string;
    indenter: string;
    department: string;
    product: string;
    comparisonSheet: string;
    vendors: [string, string, string, string, string, string][];
    date: string;
    firmNameMatch?: string;
}

interface HistoryData {
    indentNo: string;
    indenter: string;
    department: string;
    product: string;
    vendor: [string, string];
    date: string;
    firmNameMatch?: string;
}

export default () => {
    const { indentLoading, indentSheet, updateIndentSheet } = useSheets();
    const { user } = useAuth();

    const [selectedIndent, setSelectedIndent] = useState<RateApprovalData | null>(null);
    const [selectedHistory, setSelectedHistory] = useState<HistoryData | null>(null);
    const [tableData, setTableData] = useState<RateApprovalData[]>([]);
    const [historyData, setHistoryData] = useState<HistoryData[]>([]);
    const [openDialog, setOpenDialog] = useState(false);

    // ✅ CHANGED: Filter for pending - planned1 not empty, actual1 empty
    useEffect(() => {
        console.log('=== RATE APPROVAL - PENDING ===');
        console.log('Total indent records:', indentSheet.length);
        
        const filteredByFirm = indentSheet.filter(sheet => 
            user.firmNameMatch.toLowerCase() === "all" || sheet.firmName === user.firmNameMatch
        );
        
        console.log('Filtered by firm:', filteredByFirm.length);
        
        const pending = filteredByFirm.filter((sheet) => {
            const hasPlanned3 = sheet.planned3 && sheet.planned3 !== '';
            const noActual3 = !sheet.actual3 || sheet.actual3 === '';
            
            if (hasPlanned3 && noActual3) {
                console.log('✅ Pending item:', {
                    indent: sheet.indentNumber,
                    planned3: sheet.planned3,
                    actual3: sheet.actual3
                });
            }
            
            return hasPlanned3 && noActual3;
        });
        
        console.log('Pending items count:', pending.length);
        
        setTableData(
            pending.map((sheet: any) => ({
                indentNo: sheet.indentNumber,
                firmNameMatch: sheet.firmNameMatch || '',
                indenter: sheet.indenterName,
                department: sheet.department,
                product: sheet.productName,
                comparisonSheet: sheet.comparisonSheet || '',
                date: formatDate(new Date(sheet.timestamp)),
                vendors: [
                    [
                        sheet.vendorName1, 
                        sheet.rate1?.toString() || '0', 
                        sheet.paymentTerm1,
                        sheet.selectRateType1 || 'With Tax',
                        sheet.withTaxOrNot1 || 'Yes',
                        sheet.taxValue1?.toString() || '0'
                    ],
                    [
                        sheet.vendorName2, 
                        sheet.rate2?.toString() || '0', 
                        sheet.paymentTerm2,
                        sheet.selectRateType2 || 'With Tax',
                        sheet.withTaxOrNot2 || 'Yes',
                        sheet.taxValue2?.toString() || '0'
                    ],
                    [
                        sheet.vendorName3, 
                        sheet.rate3?.toString() || '0', 
                        sheet.paymentTerm3,
                        sheet.selectRateType3 || 'With Tax',
                        sheet.withTaxOrNot3 || 'Yes',
                        sheet.taxValue3?.toString() || '0'
                    ],
                ],
            }))
        );
    }, [indentSheet, user.firmNameMatch]);

    // ✅ CHANGED: Filter for history - planned1 not empty, actual1 not empty
    useEffect(() => {
        console.log('=== RATE APPROVAL - HISTORY ===');
        
        const filteredByFirm = indentSheet.filter(sheet => 
            user.firmNameMatch.toLowerCase() === "all" || sheet.firmName === user.firmNameMatch
        );
        
        const history = filteredByFirm.filter((sheet) => {
            const hasPlanned3 = sheet.planned3 && sheet.planned3 !== '';
            const hasActual3 = sheet.actual3 && sheet.actual3 !== '';
            
            if (hasPlanned3 && hasActual3) {
                console.log('✅ History item:', {
                    indent: sheet.indentNumber,
                    planned3: sheet.planned3,
                    actual3: sheet.actual3
                });
            }
            
            return hasPlanned3 && hasActual3;
        });
        
        console.log('History items count:', history.length);
        
        setHistoryData(
            history.map((sheet: any) => ({
                indentNo: sheet.indentNumber,
                firmNameMatch: sheet.firmNameMatch || '',
                indenter: sheet.indenterName,
                department: sheet.department,
                product: sheet.productName,
                date: new Date(sheet.timestamp).toDateString(),
                vendor: [sheet.approvedVendorName, sheet.approvedRate?.toString() || '0'],
            }))
        );
    }, [indentSheet, user.firmNameMatch]);

    const columns: ColumnDef<RateApprovalData>[] = [
        ...(user.threePartyApprovalAction
            ? [
                {
                    header: 'Action',
                    id: 'action',
                    cell: ({ row }: { row: Row<RateApprovalData> }) => {
                        const indent = row.original;

                        return (
                            <div className="flex justify-center">
                                <DialogTrigger asChild>
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            setSelectedIndent(indent);
                                        }}
                                        className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white border-0 font-semibold rounded-lg shadow-md"
                                    >
                                        Approve
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
            cell: ({ getValue }) => (
                <div className="text-center font-bold text-blue-700">
                    {getValue() as string}
                </div>
            )
        },
        { 
            accessorKey: 'firmNameMatch', 
            header: 'Firm Name',
            cell: ({ getValue }) => (
                <div className="text-center">
                    <Building className="inline mr-2 h-4 w-4 text-gray-600" />
                    {getValue() as string}
                </div>
            )
        },
        { 
            accessorKey: 'indenter', 
            header: 'Indenter',
            cell: ({ getValue }) => (
                <div className="text-center">
                    <User className="inline mr-2 h-4 w-4 text-gray-600" />
                    {getValue() as string}
                </div>
            )
        },
        { 
            accessorKey: 'department', 
            header: 'Department',
            cell: ({ getValue }) => (
                <div className="text-center">
                    <Building className="inline mr-2 h-4 w-4 text-gray-600" />
                    {getValue() as string}
                </div>
            )
        },
        { 
            accessorKey: 'product', 
            header: 'Product',
            cell: ({ getValue }) => (
                <div className="text-center">
                    <Package className="inline mr-2 h-4 w-4 text-gray-600" />
                    {getValue() as string}
                </div>
            )
        },
        { 
            accessorKey: 'date', 
            header: 'Date',
            cell: ({ getValue }) => (
                <div className="text-center">
                    <Calendar className="inline mr-2 h-4 w-4 text-gray-600" />
                    {getValue() as string}
                </div>
            )
        },
        {
            accessorKey: 'vendors',
            header: 'Vendors',
            cell: ({ row }) => {
                const vendors = row.original.vendors;
                return (
                    <div className="grid place-items-center">
                        <div className="flex flex-col gap-2">
                            {vendors.map((vendor, index) => (
                                <span key={index} className="rounded-full text-xs px-3 py-2 bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 border border-blue-300 font-medium">
                                    {vendor[0]} - <IndianRupee className="inline h-3 w-3" />{vendor[1]}
                                </span>
                            ))}
                        </div>
                    </div>
                );
            },
        },
        {
            accessorKey: 'comparisonSheet',
            header: 'Comparison Sheet',
            cell: ({ row }) => {
                const sheet = row.original.comparisonSheet;
                return sheet ? (
                    <div className="flex justify-center">
                        <a 
                            href={sheet} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 font-semibold underline flex items-center gap-1"
                        >
                            <FileText className="h-4 w-4" />
                            View Sheet
                        </a>
                    </div>
                ) : (
                    <div className="text-center text-gray-400">-</div>
                );
            },
        },
    ];

    const historyColumns: ColumnDef<HistoryData>[] = [
        ...(user.updateVendorAction ? [
            {
                header: 'Action',
                cell: ({ row }: { row: Row<HistoryData> }) => {
                    const indent = row.original;

                    return (
                        <div className="flex justify-center">
                            <DialogTrigger asChild>
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setSelectedHistory(indent);
                                    }}
                                    className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white border-0 font-semibold rounded-lg shadow-md"
                                >
                                    Update
                                </Button>
                            </DialogTrigger>
                        </div>
                    );
                },
            },
        ] : []),
        { 
            accessorKey: 'indentNo', 
            header: 'Indent No.',
            cell: ({ getValue }) => (
                <div className="text-center font-bold text-blue-700">
                    {getValue() as string}
                </div>
            )
        },
        { 
            accessorKey: 'firmNameMatch', 
            header: 'Firm Name',
            cell: ({ getValue }) => (
                <div className="text-center">
                    <Building className="inline mr-2 h-4 w-4 text-gray-600" />
                    {getValue() as string}
                </div>
            )
        },
        { 
            accessorKey: 'indenter', 
            header: 'Indenter',
            cell: ({ getValue }) => (
                <div className="text-center">
                    <User className="inline mr-2 h-4 w-4 text-gray-600" />
                    {getValue() as string}
                </div>
            )
        },
        { 
            accessorKey: 'department', 
            header: 'Department',
            cell: ({ getValue }) => (
                <div className="text-center">
                    <Building className="inline mr-2 h-4 w-4 text-gray-600" />
                    {getValue() as string}
                </div>
            )
        },
        { 
            accessorKey: 'product', 
            header: 'Product',
            cell: ({ getValue }) => (
                <div className="text-center">
                    <Package className="inline mr-2 h-4 w-4 text-gray-600" />
                    {getValue() as string}
                </div>
            )
        },
        { 
            accessorKey: 'date', 
            header: 'Date',
            cell: ({ getValue }) => (
                <div className="text-center">
                    <Calendar className="inline mr-2 h-4 w-4 text-gray-600" />
                    {getValue() as string}
                </div>
            )
        },
        {
            accessorKey: 'vendor',
            header: 'Vendor',
            cell: ({ row }) => {
                const vendor = row.original.vendor;
                return (
                    <div className="grid place-items-center">
                        <div className="flex flex-col gap-1">
                            <span className="rounded-full text-xs px-3 py-2 bg-gradient-to-r from-green-100 to-blue-100 text-green-800 border border-green-300 font-medium">
                                {vendor[0]} - <IndianRupee className="inline h-3 w-3" />{vendor[1]}
                            </span>
                        </div>
                    </div>
                );
            },
        },
    ];

    const schema = z.object({
        vendor: z.coerce.number(),
    });

    const form = useForm<z.infer<typeof schema>>({
        resolver: zodResolver(schema),
        defaultValues: {
            vendor: undefined,
        },
    });

    async function onSubmit(values: z.infer<typeof schema>) {
        try {
            const filtered = indentSheet.filter((s) => s.indentNumber === selectedIndent?.indentNo);
            console.log("🔍 Filtered data:", filtered);
            console.log("🔍 First item rowIndex:", filtered[0]?.rowIndex);
            
            const selectedVendor = selectedIndent?.vendors[values.vendor];
            
            const updatedRows = filtered.map((prev: any) => ({
                rowIndex: prev.rowIndex,
                actual3: new Date().toISOString(),
                approvedVendorName: selectedVendor?.[0] || '',
                approvedRate: selectedVendor?.[1] || '0',
                approvedPaymentTerm: selectedVendor?.[2] || '',
                withTaxOrNot4: selectedVendor?.[4] || 'Yes',
                taxValue4: selectedVendor?.[5] || '0',
            }));
            
            console.log("📤 Sending to backend:", updatedRows);
            
            await postToSheet(updatedRows, 'update');
            
            toast.success(`Approved vendor for ${selectedIndent?.indentNo}`);
            setOpenDialog(false);
            form.reset();
            setTimeout(() => updateIndentSheet(), 1000);
        } catch (error) {
            console.error("❌ Full error:", error);
            toast.error('Failed to update vendor');
        }
    }

    const historyUpdateSchema = z.object({
        rate: z.coerce.number(),
    })

    const historyUpdateForm = useForm<z.infer<typeof historyUpdateSchema>>({
        resolver: zodResolver(historyUpdateSchema),
        defaultValues: {
            rate: 0,
        },
    })

    useEffect(() => {
        if (selectedHistory) {
            historyUpdateForm.reset({ rate: parseInt(selectedHistory.vendor[1]) || 0 })
        }
    }, [selectedHistory, historyUpdateForm])

    async function onSubmitHistoryUpdate(values: z.infer<typeof historyUpdateSchema>) {
        try {
            console.log("✅ Submitted Values:", values);
            console.log("✅ Selected History:", selectedHistory);

            const filtered = indentSheet.filter(
                (s) => s.indentNumber === selectedHistory?.indentNo
            );
            console.log("✅ Filtered Sheet Rows:", filtered);

            const updatedRows = filtered.map((prev: any) => ({
                rowIndex: prev.rowIndex,
                approvedRate: values.rate,
            }));
            console.log("✅ Updated Rows Before Sending:", updatedRows);

            await postToSheet(updatedRows, 'update');
            console.log("✅ postToSheet completed");

            toast.success(`Updated rate of ${selectedHistory?.indentNo}`);
            setOpenDialog(false);

            historyUpdateForm.reset({ rate: 0 });
            console.log("✅ Form reset");

            setTimeout(() => {
                console.log("🔄 Refreshing indent sheet...");
                updateIndentSheet();
            }, 1000);
        } catch (err) {
            console.error("❌ Error in onSubmitHistoryUpdate:", err);
            toast.error('Failed to update vendor');
        }
    }

    function onError(e: any) {
        console.log(e);
        toast.error('Please fill all required fields');
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-6">
            <div className="max-w-7xl mx-auto">
                <Dialog open={openDialog} onOpenChange={setOpenDialog}>
                    <Tabs defaultValue="pending">
                        <Heading
                            heading="Three Party Rate Approval"
                            subtext="Approve rates for three party vendors"
                            tabs
                        >
                            <Users size={50} className="text-purple-600" />
                        </Heading>
                        
                        <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-100 p-6 mb-6">
                            <TabsContent value="pending" className="mt-0">
                                <DataTable
                                    data={tableData}
                                    columns={columns}
                                    searchFields={['product', 'department', 'indenter', 'firmNameMatch']}
                                    dataLoading={indentLoading}
                                />
                            </TabsContent>
                            <TabsContent value="history" className="mt-0">
                                <DataTable
                                    data={historyData}
                                    columns={historyColumns}
                                    searchFields={['product', 'department', 'indenter', 'firmNameMatch']}
                                    dataLoading={indentLoading}
                                />
                            </TabsContent>
                        </div>
                    </Tabs>

                    {selectedIndent && (
                        <DialogContent className="bg-white rounded-2xl border-2 border-gray-200 shadow-2xl max-w-2xl">
                            <Form {...form}>
                                <form
                                    onSubmit={form.handleSubmit(onSubmit, onError)}
                                    className="space-y-6 p-6"
                                >
                                    <DialogHeader className="text-center">
                                        <DialogTitle className="text-2xl font-bold text-gray-800">
                                            Rate Approval
                                        </DialogTitle>
                                        <DialogDescription className="text-lg text-gray-600">
                                            Update vendor for{' '}
                                            <span className="font-bold text-purple-600">
                                                {selectedIndent.indentNo}
                                            </span>
                                        </DialogDescription>
                                    </DialogHeader>
                                    
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 bg-gradient-to-r from-purple-50 to-blue-50 py-4 px-6 rounded-xl border-2 border-gray-200">
                                        <div className="space-y-1">
                                            <p className="font-semibold text-gray-700">Indenter</p>
                                            <p className="text-sm font-light">
                                                {selectedIndent.indenter}
                                            </p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="font-semibold text-gray-700">Department</p>
                                            <p className="text-sm font-light">
                                                {selectedIndent.department}
                                            </p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="font-semibold text-gray-700">Product</p>
                                            <p className="text-sm font-light">
                                                {selectedIndent.product}
                                            </p>
                                        </div>
                                    </div>
                                    
                                    <div className="grid gap-4">
                                        <FormField
                                            control={form.control}
                                            name="vendor"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="font-semibold text-gray-700 text-lg">Select a vendor</FormLabel>
                                                    <FormControl>
                                                        <RadioGroup onValueChange={field.onChange} value={field.value?.toString()} className="space-y-3">
                                                            {selectedIndent.vendors.map(
                                                                (vendor, index) => {
                                                                    return (
                                                                        <FormItem key={index}>
                                                                            <FormLabel className="flex items-center gap-4 border-2 border-gray-200 hover:border-purple-300 hover:bg-purple-50 p-4 rounded-xl cursor-pointer transition-all duration-200">
                                                                                <FormControl>
                                                                                    <RadioGroupItem value={`${index}`} className="text-purple-600" />
                                                                                </FormControl>
                                                                                <div className="font-normal w-full">
                                                                                    <div className="flex justify-between items-center w-full">
                                                                                        <div className="flex-1">
                                                                                            <p className="font-bold text-lg text-gray-800">
                                                                                                {vendor[0]}
                                                                                            </p>
                                                                                            <p className="text-sm text-muted-foreground">
                                                                                                Payment Term: {vendor[2]}
                                                                                            </p>
                                                                                            
                                                                                            {vendor[3] === 'Basic Rate' && vendor[4] === 'No' ? (
                                                                                                <p className="text-xs text-orange-600 font-medium mt-1 bg-orange-100 px-2 py-1 rounded-full inline-block">
                                                                                                📊 Without Tax - GST: {vendor[5]}%
                                                                                                </p>
                                                                                            ) : vendor[3] === 'With Tax' && vendor[4] === 'Yes' ? (
                                                                                                <p className="text-xs text-green-600 font-medium mt-1 bg-green-100 px-2 py-1 rounded-full inline-block">
                                                                                                ✅ With Tax
                                                                                                </p>
                                                                                            ) : (
                                                                                                <p className="text-xs text-green-600 font-medium mt-1 bg-green-100 px-2 py-1 rounded-full inline-block">
                                                                                                ✅ With Tax
                                                                                                </p>
                                                                                            )}
                                                                                        </div>
                                                                                        <div className="text-right">
                                                                                            <p className="text-xl font-bold text-purple-700 flex items-center gap-1">
                                                                                                <IndianRupee className="h-4 w-4" />
                                                                                                {vendor[1]}
                                                                                            </p>
                                                                                            {vendor[3] === 'Basic Rate' && vendor[4] === 'No' && (
                                                                                                <p className="text-xs text-muted-foreground">
                                                                                                    Basic Rate
                                                                                                </p>
                                                                                            )}
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            </FormLabel>
                                                                        </FormItem>
                                                                    );
                                                                }
                                                            )}
                                                        </RadioGroup>
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    
                                    <DialogFooter className="flex justify-center gap-4 pt-6">
                                        <DialogClose asChild>
                                            <Button 
                                                variant="outline" 
                                                className="border-2 border-gray-300 rounded-xl px-8 py-3 text-lg font-semibold"
                                            >
                                                Close
                                            </Button>
                                        </DialogClose>

                                        <Button 
                                            type="submit" 
                                            disabled={form.formState.isSubmitting}
                                            className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-xl px-8 py-3 text-lg font-semibold border-0"
                                        >
                                            {form.formState.isSubmitting && (
                                                <Loader
                                                    size={20}
                                                    color="white"
                                                    aria-label="Loading Spinner"
                                                    className="mr-2"
                                                />
                                            )}
                                            Approve Vendor
                                        </Button>
                                    </DialogFooter>
                                </form>
                            </Form>
                        </DialogContent>
                    )}

                    {selectedHistory && (
                        <DialogContent className="bg-white rounded-2xl border-2 border-gray-200 shadow-2xl max-w-md">
                            <Form {...historyUpdateForm}>
                                <form onSubmit={historyUpdateForm.handleSubmit(onSubmitHistoryUpdate, onError)} className="space-y-6 p-6">
                                    <DialogHeader className="text-center">
                                        <DialogTitle className="text-2xl font-bold text-gray-800">
                                            Update Rate
                                        </DialogTitle>
                                        <DialogDescription className="text-lg text-gray-600">
                                            Update rate for{' '}
                                            <span className="font-bold text-green-600">
                                                {selectedHistory.indentNo}
                                            </span>
                                        </DialogDescription>
                                    </DialogHeader>
                                    
                                    <div className="grid gap-4">
                                        <FormField
                                            control={historyUpdateForm.control}
                                            name="rate"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="font-semibold text-gray-700 text-lg">Rate</FormLabel>
                                                    <FormControl>
                                                        <Input 
                                                            type="number" 
                                                            {...field} 
                                                            className="h-12 border-2 border-gray-300 rounded-xl text-lg text-center"
                                                        />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <DialogFooter className="flex justify-center gap-4">
                                        <DialogClose asChild>
                                            <Button 
                                                variant="outline" 
                                                className="border-2 border-gray-300 rounded-xl px-8 py-3 text-lg font-semibold"
                                            >
                                                Close
                                            </Button>
                                        </DialogClose>

                                        <Button
                                            type="submit"
                                            disabled={historyUpdateForm.formState.isSubmitting}
                                            className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-xl px-8 py-3 text-lg font-semibold border-0"
                                        >
                                            {historyUpdateForm.formState.isSubmitting && (
                                                <Loader
                                                    size={20}
                                                    color="white"
                                                    aria-label="Loading Spinner"
                                                    className="mr-2"
                                                />
                                            )}
                                            Update Rate
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
};