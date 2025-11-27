import { useSheets } from '@/context/SheetsContext';
import type { ColumnDef, Row } from '@tanstack/react-table';
import { useEffect, useState } from 'react';
import DataTable from '../element/DataTable';
import { Button } from '../ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
    DialogTrigger,
    DialogHeader,
    DialogFooter,
    DialogClose,
} from '@/components/ui/dialog';
import { postToSheet, uploadFile } from '@/lib/fetchers';
import { z } from 'zod';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { PuffLoader as Loader } from 'react-spinners';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserCheck, PenSquare, Calendar, X, Search, Filter, Building, Package, User, CalendarDays } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import Heading from '../element/Heading';
import { Pill } from '../ui/pill';

interface VendorUpdateData {
    indentNo: string;
    firmNameMatch?: string;
    indenter: string;
    department: string;
    product: string;
    quantity: number;
    uom: string;
    vendorType: 'Three Party' | 'Regular';
    planned2: string;
    actual2: string;
    specifications: string;
}

interface HistoryData {
    indentNo: string;
    indenter: string;
    department: string;
    product: string;
    quantity: number;
    uom: string;
    rate: number;
    vendorType: 'Three Party' | 'Regular';
    date: string;
    lastUpdated?: string;
    planned2: string;
    actual2: string;
    specifications: string;
    firmNameMatch?: string;
}

export default () => {
    const { indentSheet, indentLoading, updateIndentSheet, masterSheet: options } = useSheets();
    const { user } = useAuth();

    const [selectedIndent, setSelectedIndent] = useState<VendorUpdateData | null>(null);
    const [selectedHistory, setSelectedHistory] = useState<HistoryData | null>(null);
    const [historyData, setHistoryData] = useState<HistoryData[]>([]);
    const [tableData, setTableData] = useState<VendorUpdateData[]>([]);
    const [filteredTableData, setFilteredTableData] = useState<VendorUpdateData[]>([]);
    const [filteredHistoryData, setFilteredHistoryData] = useState<HistoryData[]>([]);
    const [openDialog, setOpenDialog] = useState(false);
    const [editingRow, setEditingRow] = useState<string | null>(null);
    const [editValues, setEditValues] = useState<Partial<HistoryData>>({});
    
    // Filter states
    const [selectedDate, setSelectedDate] = useState<string>('');
    const [selectedUOM, setSelectedUOM] = useState<string>('');
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [selectedHistoryDate, setSelectedHistoryDate] = useState<string>('');
    const [selectedHistoryUOM, setSelectedHistoryUOM] = useState<string>('');
    const [historySearchQuery, setHistorySearchQuery] = useState<string>('');

    // Fetching table data
    useEffect(() => {
        const filteredByFirm = indentSheet.filter((sheet) =>
            user.firmNameMatch.toLowerCase() === "all" ||
            sheet.firmName === user.firmNameMatch
        );

        const data = filteredByFirm
            .filter((sheet) => sheet.planned2 && sheet.planned2 !== null && !sheet.actual2)
            .map((sheet) => ({
                indentNo: sheet.indentNumber,
                firmNameMatch: sheet.firmNameMatch,
                indenter: sheet.indenterName,
                department: sheet.department,
                product: sheet.productName,
                quantity: sheet.approvedQuantity,
                uom: sheet.uom,
                vendorType: sheet.vendorType as VendorUpdateData['vendorType'],
                planned2: sheet.planned2,
                actual2: sheet.actual2,
                specifications: sheet.specifications,
            }));

        setTableData(data);
        setFilteredTableData(data);
    }, [indentSheet, user.firmNameMatch]);

    // Fetching history data
    useEffect(() => {
        const filteredByFirm = indentSheet.filter((sheet) =>
            user.firmNameMatch.toLowerCase() === "all" ||
            sheet.firmName === user.firmNameMatch
        );

        const data = filteredByFirm
            .filter((sheet) => sheet.planned2 && sheet.actual2)
            .map((sheet: any) => ({
                indentNo: sheet.indentNumber,
                firmNameMatch: sheet.firmNameMatch || '',
                indenter: sheet.indenterName,
                department: sheet.department,
                product: sheet.productName,
                quantity: sheet.approvedQuantity,
                uom: sheet.uom,
                rate: sheet.approvedRate || 0,
                vendorType: sheet.vendorType as VendorUpdateData['vendorType'],
                date: new Date(sheet.timestamp).toDateString(),
                lastUpdated: sheet.lastUpdated,
                planned2: sheet.planned2,
                actual2: sheet.actual2,
                specifications: sheet.specifications,
            }));

        setHistoryData(data);
        setFilteredHistoryData(data);
    }, [indentSheet, user.firmNameMatch]);

    // Filter pending data by date, UOM, and search query
    useEffect(() => {
        let filtered = [...tableData];

        if (selectedDate) {
            filtered = filtered.filter(item => {
                const itemDate = new Date(item.planned2).toISOString().split('T')[0];
                return itemDate === selectedDate;
            });
        }

        if (selectedUOM && selectedUOM !== '__all__') {
            filtered = filtered.filter(item => item.uom === selectedUOM);
        }

        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(item => 
                item.indentNo.toLowerCase().includes(query) ||
                item.firmNameMatch?.toLowerCase().includes(query) ||
                item.indenter.toLowerCase().includes(query) ||
                item.department.toLowerCase().includes(query) ||
                item.product.toLowerCase().includes(query) ||
                item.specifications.toLowerCase().includes(query)
            );
        }

        setFilteredTableData(filtered);
    }, [selectedDate, selectedUOM, searchQuery, tableData]);

    // Filter history data by date, UOM, and search query
    useEffect(() => {
        let filtered = [...historyData];

        if (selectedHistoryDate) {
            filtered = filtered.filter(item => {
                const itemDate = new Date(item.actual2).toISOString().split('T')[0];
                return itemDate === selectedHistoryDate;
            });
        }

        if (selectedHistoryUOM && selectedHistoryUOM !== '__all__') {
            filtered = filtered.filter(item => item.uom === selectedHistoryUOM);
        }

        if (historySearchQuery.trim()) {
            const query = historySearchQuery.toLowerCase();
            filtered = filtered.filter(item => 
                item.indentNo.toLowerCase().includes(query) ||
                item.firmNameMatch?.toLowerCase().includes(query) ||
                item.indenter.toLowerCase().includes(query) ||
                item.department.toLowerCase().includes(query) ||
                item.product.toLowerCase().includes(query) ||
                item.specifications.toLowerCase().includes(query)
            );
        }

        setFilteredHistoryData(filtered);
    }, [selectedHistoryDate, selectedHistoryUOM, historySearchQuery, historyData]);

    // Get unique UOMs for filter dropdown
    const uniqueUOMs = Array.from(new Set(tableData.map(item => item.uom))).sort();
    const uniqueHistoryUOMs = Array.from(new Set(historyData.map(item => item.uom))).sort();

    const handleEditClick = (row: HistoryData) => {
        setEditingRow(row.indentNo);
        setEditValues({
            quantity: row.quantity,
            uom: row.uom,
            vendorType: row.vendorType,
        });
    };

    const handleCancelEdit = () => {
        setEditingRow(null);
        setEditValues({});
    };

    const handleSaveEdit = async (indentNo: string) => {
        try {
            await postToSheet(
                indentSheet
                    .filter((s) => s.indentNumber === indentNo)
                    .map((prev) => ({
                        rowIndex: prev.rowIndex,
                        quantity: editValues.quantity,
                        uom: editValues.uom,
                        vendorType: editValues.vendorType,
                        lastUpdated: new Date().toISOString(),
                    })),
                'update'
            );
            toast.success(`Updated indent ${indentNo}`);
            updateIndentSheet();
            setEditingRow(null);
            setEditValues({});
        } catch {
            toast.error('Failed to update indent');
        }
    };

    const handleInputChange = (field: keyof HistoryData, value: any) => {
        setEditValues((prev) => ({ ...prev, [field]: value }));
    };

    // Clear all filters function
    const clearAllFilters = () => {
        setSelectedDate('');
        setSelectedUOM('');
        setSearchQuery('');
    };

    const clearAllHistoryFilters = () => {
        setSelectedHistoryDate('');
        setSelectedHistoryUOM('');
        setHistorySearchQuery('');
    };

    // Creating table columns with enhanced styling
    const columns: ColumnDef<VendorUpdateData>[] = [
        ...(user.updateVendorAction
            ? [
                {
                    header: 'Action',
                    cell: ({ row }: { row: Row<VendorUpdateData> }) => {
                        const indent = row.original;
                        return (
                            <div className="flex justify-center">
                                <DialogTrigger asChild>
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            setSelectedIndent(indent);
                                            setOpenDialog(true);
                                        }}
                                        className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white border-0 font-semibold rounded-lg shadow-md"
                                    >
                                        Update
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
            accessorKey: 'specifications',
            header: 'Specifications',
            cell: ({ getValue }) => (
                <div className="max-w-[200px] break-words whitespace-normal text-center bg-gray-50 p-2 rounded-lg">
                    {getValue() as string}
                </div>
            ),
        },
        {
            accessorKey: 'product',
            header: 'Product',
            cell: ({ getValue }) => (
                <div className="max-w-[150px] break-words whitespace-normal text-center">
                    <Package className="inline mr-2 h-4 w-4 text-gray-600" />
                    {getValue() as string}
                </div>
            ),
        },
        {
            accessorKey: 'quantity',
            header: 'Quantity',
            cell: ({ getValue }) => (
                <div className="text-center font-semibold text-green-700">
                    {getValue() as number}
                </div>
            )
        },
        {
            accessorKey: 'uom',
            header: 'UOM',
            cell: ({ getValue }) => (
                <div className="text-center font-medium">
                    {getValue() as string}
                </div>
            )
        },
        {
            accessorKey: 'vendorType',
            header: 'Vendor Type',
            cell: ({ row }) => {
                const status = row.original.vendorType;
                const variant = status === 'Regular' ? 'primary' : 'secondary';
                return (
                    <div className="flex justify-center">
                        <Pill variant={variant} className="font-bold">
                            {status}
                        </Pill>
                    </div>
                );
            },
        },
        { 
            accessorKey: 'planned2', 
            header: 'Planned Date',
            cell: ({ row }) => (
                <div className="text-center">
                    <CalendarDays className="inline mr-2 h-4 w-4 text-gray-600" />
                    {formatDateTime(row.original.planned2)}
                </div>
            )
        },
    ];

    const historyColumns: ColumnDef<HistoryData>[] = [
        ...(user.updateVendorAction
            ? [
                {
                    header: 'Action',
                    cell: ({ row }: { row: Row<HistoryData> }) => {
                        const indent = row.original;
                        return (
                            <div className="flex justify-center">
                                <DialogTrigger asChild>
                                    <Button
                                        variant="outline"
                                        disabled={indent.vendorType === 'Three Party'}
                                        onClick={() => {
                                            setSelectedHistory(indent);
                                            setOpenDialog(true);
                                        }}
                                        className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white border-0 font-semibold rounded-lg shadow-md disabled:opacity-50"
                                    >
                                        Update
                                    </Button>
                                </DialogTrigger>
                            </div>
                        );
                    },
                },
            ]
            : []),
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
            accessorKey: 'specifications',
            header: 'Specifications',
            cell: ({ getValue }) => (
                <div className="max-w-[200px] break-words whitespace-normal text-center bg-gray-50 p-2 rounded-lg">
                    {getValue() as string}
                </div>
            ),
        },
        {
            accessorKey: 'product',
            header: 'Product',
            cell: ({ getValue }) => (
                <div className="max-w-[150px] break-words whitespace-normal text-center">
                    <Package className="inline mr-2 h-4 w-4 text-gray-600" />
                    {getValue() as string}
                </div>
            ),
        },
        {
            accessorKey: 'quantity',
            header: 'Quantity',
            cell: ({ row }) => {
                const isEditing = editingRow === row.original.indentNo;
                return (
                    <div className="flex justify-center items-center gap-2">
                        {isEditing ? (
                            <Input
                                type="number"
                                value={editValues.quantity ?? row.original.quantity}
                                onChange={(e) => handleInputChange('quantity', Number(e.target.value))}
                                className="w-20 text-center border-2 border-green-500 rounded-lg"
                            />
                        ) : (
                            <>
                                <span className="font-semibold text-green-700">{row.original.quantity}</span>
                                {user.updateVendorAction && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 hover:bg-green-100"
                                        onClick={() => handleEditClick(row.original)}
                                    >
                                        <PenSquare className="h-3 w-3 text-green-600" />
                                    </Button>
                                )}
                            </>
                        )}
                    </div>
                );
            },
        },
        {
            accessorKey: 'rate',
            header: 'Rate',
            cell: ({ row }) => {
                const rate = row.original.rate;
                const vendorType = row.original.vendorType;

                if (!rate && vendorType === 'Three Party') {
                    return <span className="text-muted-foreground text-center">Not Decided</span>;
                }
                return (
                    <div className="text-center font-bold text-orange-600">
                        &#8377;{rate}
                    </div>
                );
            },
        },
        {
            accessorKey: 'uom',
            header: 'UOM',
            cell: ({ row }) => {
                const isEditing = editingRow === row.original.indentNo;
                return (
                    <div className="flex justify-center items-center gap-2">
                        {isEditing ? (
                            <Input
                                value={editValues.uom ?? row.original.uom}
                                onChange={(e) => handleInputChange('uom', e.target.value)}
                                className="w-20 text-center border-2 border-green-500 rounded-lg"
                            />
                        ) : (
                            <>
                                <span className="font-medium">{row.original.uom}</span>
                                {user.updateVendorAction && editingRow !== row.original.indentNo && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 hover:bg-green-100"
                                        onClick={() => handleEditClick(row.original)}
                                    >
                                        <PenSquare className="h-3 w-3 text-green-600" />
                                    </Button>
                                )}
                            </>
                        )}
                    </div>
                );
            },
        },
        {
            accessorKey: 'vendorType',
            header: 'Vendor Type',
            cell: ({ row }) => {
                const isEditing = editingRow === row.original.indentNo;
                return (
                    <div className="flex justify-center items-center gap-2">
                        {isEditing ? (
                            <Select
                                value={editValues.vendorType ?? row.original.vendorType}
                                onValueChange={(value) => handleInputChange('vendorType', value)}
                            >
                                <SelectTrigger className="w-[150px] border-2 border-green-500">
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Regular Vendor">Regular</SelectItem>
                                    <SelectItem value="Three Party">Three Party</SelectItem>
                                </SelectContent>
                            </Select>
                        ) : (
                            <>
                                <Pill
                                    variant={
                                        row.original.vendorType === 'Regular' ? 'primary' : 'secondary'
                                    }
                                    className="font-bold"
                                >
                                    {row.original.vendorType}
                                </Pill>
                                {user.updateVendorAction && editingRow !== row.original.indentNo && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 hover:bg-green-100"
                                        onClick={() => handleEditClick(row.original)}
                                    >
                                        <PenSquare className="h-3 w-3 text-green-600" />
                                    </Button>
                                )}
                            </>
                        )}
                    </div>
                );
            },
        },
        {
            accessorKey: 'planned2',
            header: 'Planned Date',
            cell: ({ row }) => (
                <div className="text-center">
                    <CalendarDays className="inline mr-2 h-4 w-4 text-gray-600" />
                    {row.original.planned2
                        ? formatDateTime(row.original.planned2)
                        : '-'}
                </div>
            )
        },
        {
            accessorKey: 'actual2',
            header: 'Actual Date',
            cell: ({ row }) => (
                <div className="text-center">
                    <CalendarDays className="inline mr-2 h-4 w-4 text-green-600" />
                    {row.original.actual2
                        ? formatDateTime(row.original.actual2)
                        : '-'}
                </div>
            )
        },
        ...(user.updateVendorAction
            ? [
                {
                    id: 'editActions',
                    cell: ({ row }: { row: Row<HistoryData> }) => {
                        const isEditing = editingRow === row.original.indentNo;
                        return isEditing ? (
                            <div className="flex justify-center gap-2">
                                <Button
                                    size="sm"
                                    onClick={() => handleSaveEdit(row.original.indentNo)}
                                    className="bg-green-600 hover:bg-green-700 text-white font-semibold"
                                >
                                    Save
                                </Button>
                                <Button 
                                    size="sm" 
                                    variant="outline" 
                                    onClick={handleCancelEdit}
                                    className="border-red-500 text-red-600 hover:bg-red-50 font-semibold"
                                >
                                    Cancel
                                </Button>
                            </div>
                        ) : null;
                    },
                },
            ]
            : []),
    ];

    // Creating Regular Vendor form
    const regularSchema = z.object({
        vendorName: z.string().min(1, "Vendor name is required"),
        rateType: z.enum(['basic', 'withTax']),
        rate: z.coerce.number().gt(0, "Rate must be greater than 0"),
        withTax: z.enum(['yes', 'no']).optional(),
        gstPercent: z.coerce.number().optional(),
        paymentTerm: z.string().min(1, "Payment term is required"),
    });

    type RegularFormValues = z.infer<typeof regularSchema>;

    const regularForm = useForm<RegularFormValues>({
        resolver: zodResolver(regularSchema),
        defaultValues: {
            vendorName: '',
            rateType: 'basic',
            rate: 0,
            withTax: 'no',
            gstPercent: 0,
            paymentTerm: '',
        },
    });

    const watchRateType = regularForm.watch('rateType');
    const watchWithTax = regularForm.watch('withTax');

    async function onSubmitRegular(values: z.infer<typeof regularSchema>) {
        try {
            const rateTypeText = values.rateType === 'basic' ? 'Basic Rate' : 'With Tax';
            let withTaxOrNot = '';
            let taxValue = 0;
            let finalRate = values.rate;
            
            if (values.rateType === 'basic') {
                if (values.withTax === 'yes') {
                    withTaxOrNot = 'Yes';
                    taxValue = 0;
                } else if (values.withTax === 'no') {
                    withTaxOrNot = 'No';
                    taxValue = values.gstPercent || 0;
                    finalRate = values.rate * (1 + taxValue / 100);
                }
            } else {
                withTaxOrNot = 'Yes';
                taxValue = 0;
            }

            await postToSheet(
                indentSheet
                    .filter((s) => s.indentNumber === selectedIndent?.indentNo)
                    .map((prev) => ({
                        rowIndex: prev.rowIndex,
                        actual2: new Date().toISOString(),
                        vendorName1: values.vendorName,
                        selectRateType1: rateTypeText,
                        rate1: values.rate.toString(),
                        withTaxOrNot1: withTaxOrNot,
                        taxValue1: taxValue.toString(),
                        paymentTerm1: values.paymentTerm,
                        approvedVendorName: values.vendorName,
                        approvedRate: finalRate,
                        approvedPaymentTerm: values.paymentTerm,
                        lastUpdated: new Date().toISOString(),
                    })),
                'update'
            );
            
            toast.success(`Updated vendor of ${selectedIndent?.indentNo}`);
            setOpenDialog(false);
            regularForm.reset();
            setTimeout(() => updateIndentSheet(), 1000);
        } catch (error) {
            console.error('Error updating vendor:', error);
            toast.error('Failed to update vendor');
        }
    }

    // Creating Three Party Vendor form
    const threePartySchema = z.object({
        comparisonSheet: z.instanceof(File).optional(),
        productCode: z.string().optional(),
        vendors: z
            .array(
                z.object({
                    vendorName: z.string().nonempty(),
                    rateType: z.enum(['basic', 'withTax']),
                    rate: z.coerce.number().gt(0),
                    withTax: z.enum(['yes', 'no']).optional(),
                    gstPercent: z.coerce.number().optional(),
                    paymentTerm: z.string().nonempty(),
                    whatsappNumber: z.string().nonempty(),
                    emailId: z.string().email().nonempty(),
                })
            )
            .max(3)
            .min(3),
    });

    const threePartyForm = useForm<z.infer<typeof threePartySchema>>({
        resolver: zodResolver(threePartySchema),
        defaultValues: {
            productCode: '',
            vendors: [
                {
                    vendorName: '',
                    rateType: 'basic',
                    rate: 0,
                    withTax: 'no',
                    gstPercent: 0,
                    paymentTerm: '',
                    whatsappNumber: '',
                    emailId: '',
                },
                {
                    vendorName: '',
                    rateType: 'basic',
                    rate: 0,
                    withTax: 'no',
                    gstPercent: 0,
                    paymentTerm: '',
                    whatsappNumber: '',
                    emailId: '',
                },
                {
                    vendorName: '',
                    rateType: 'basic',
                    rate: 0,
                    withTax: 'no',
                    gstPercent: 0,
                    paymentTerm: '',
                    whatsappNumber: '',
                    emailId: '',
                },
            ],
        },
    });

    const { fields } = useFieldArray({
        control: threePartyForm.control,
        name: 'vendors',
    });

    async function onSubmitThreeParty(values: z.infer<typeof threePartySchema>) {
        try {
            let url: string = '';

            if (values.comparisonSheet) {
                url = await uploadFile({
                    file: values.comparisonSheet,
                    folderId: import.meta.env.VITE_COMPARISON_SHEET_FOLDER,
                });
            }

            const processVendorData = (vendor: typeof values.vendors[0]) => {
                const rateTypeText = vendor.rateType === 'basic' ? 'Basic Rate' : 'With Tax';
                let withTaxOrNot = '';
                let taxValue = 0;
                
                if (vendor.rateType === 'basic') {
                    if (vendor.withTax === 'yes') {
                        withTaxOrNot = 'Yes';
                        taxValue = 0;
                    } else if (vendor.withTax === 'no') {
                        withTaxOrNot = 'No';
                        taxValue = vendor.gstPercent || 0;
                    }
                } else {
                    withTaxOrNot = 'Yes';
                    taxValue = 0;
                }

                return {
                    rateType: rateTypeText,
                    rate: vendor.rate,
                    withTaxOrNot,
                    taxValue,
                };
            };

            const vendor1Data = processVendorData(values.vendors[0]);
            const vendor2Data = processVendorData(values.vendors[1]);
            const vendor3Data = processVendorData(values.vendors[2]);

            await postToSheet(
                indentSheet
                    .filter((s) => s.indentNumber === selectedIndent?.indentNo)
                    .map((prev) => ({
                        rowIndex: prev.rowIndex,
                        actual2: new Date().toISOString(),
                        
                        // Vendor 1
                        vendorName1: values.vendors[0].vendorName,
                        selectRateType1: vendor1Data.rateType,
                        rate1: vendor1Data.rate.toString(),
                        withTaxOrNot1: vendor1Data.withTaxOrNot,
                        taxValue1: vendor1Data.taxValue.toString(),
                        paymentTerm1: values.vendors[0].paymentTerm,
                        whatsappNumber1: values.vendors[0].whatsappNumber,
                        emailId1: values.vendors[0].emailId,
                        
                        // Vendor 2
                        vendorName2: values.vendors[1].vendorName,
                        selectRateType2: vendor2Data.rateType,
                        rate2: vendor2Data.rate.toString(),
                        withTaxOrNot2: vendor2Data.withTaxOrNot,
                        taxValue2: vendor2Data.taxValue.toString(),
                        paymentTerm2: values.vendors[1].paymentTerm,
                        whatsappNumber2: values.vendors[1].whatsappNumber,
                        emailId2: values.vendors[1].emailId,
                        
                        // Vendor 3
                        vendorName3: values.vendors[2].vendorName,
                        selectRateType3: vendor3Data.rateType,
                        rate3: vendor3Data.rate.toString(),
                        withTaxOrNot3: vendor3Data.withTaxOrNot,
                        taxValue3: vendor3Data.taxValue.toString(),
                        paymentTerm3: values.vendors[2].paymentTerm,
                        whatsappNumber3: values.vendors[2].whatsappNumber,
                        emailId3: values.vendors[2].emailId,
                        
                        comparisonSheet: url,
                        productCode: values.productCode || '',
                        lastUpdated: new Date().toISOString(),
                    })),
                'update'
            );
            
            toast.success(`Updated vendors of ${selectedIndent?.indentNo}`);
            setOpenDialog(false);
            threePartyForm.reset();
            setTimeout(() => updateIndentSheet(), 1000);
        } catch (error) {
            console.error('Error updating vendors:', error);
            toast.error('Failed to update vendors');
        }
    }

    // History Update form
    const historyUpdateSchema = z.object({
        rate: z.coerce.number(),
    });

    const historyUpdateForm = useForm({
        resolver: zodResolver(historyUpdateSchema),
        defaultValues: {
            rate: 0,
        },
    });

    useEffect(() => {
        if (selectedHistory) {
            historyUpdateForm.reset({ rate: selectedHistory.rate });
        }
    }, [selectedHistory]);

    async function onSubmitHistoryUpdate(values: z.infer<typeof historyUpdateSchema>) {
        try {
            await postToSheet(
                indentSheet
                    .filter((s) => s.indentNumber === selectedHistory?.indentNo)
                    .map((prev) => ({
                        rowIndex: prev.rowIndex,
                        rate1: values.rate.toString(),
                        approvedRate: values.rate,
                        lastUpdated: new Date().toISOString(),
                    })),
                'update'
            );
            toast.success(`Updated rate of ${selectedHistory?.indentNo}`);
            setOpenDialog(false);
            historyUpdateForm.reset({ rate: 0 });
            setTimeout(() => updateIndentSheet(), 1000);
        } catch {
            toast.error('Failed to update vendor');
        }
    }

    function onError(e: any) {
        console.log(e);
        toast.error('Please fill all required fields');
    }

    const formatDateTime = (isoString?: string) => {
        if (!isoString) return '-';
        const date = new Date(isoString);
        const day = date.getDate().toString().padStart(2, "0");
        const month = (date.getMonth() + 1).toString().padStart(2, "0");
        const year = date.getFullYear();
        const hours = date.getHours().toString().padStart(2, "0");
        const minutes = date.getMinutes().toString().padStart(2, "0");
        const seconds = date.getSeconds().toString().padStart(2, "0");
        return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-6">
            <div className="max-w-7xl mx-auto">
                <Dialog open={openDialog} onOpenChange={setOpenDialog}>
                    <Tabs defaultValue="pending">
                        <Heading
                            heading="Vendor Rate Update"
                            subtext="Update vendors for Regular and Three Party indents"
                            tabs
                        >
                            <UserCheck size={50} className="text-blue-600" />
                        </Heading>
                        
                        <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-100 p-6 mb-6">
                            <TabsContent value="pending" className="mt-0">
                                {/* Enhanced Filter Section */}
                                <div className="flex flex-col sm:flex-row gap-3 mb-6 items-center justify-center p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-xl border-2 border-gray-200">
                                    {/* Date Filter */}
                                    <div className="w-full sm:w-auto">
                                        <div className="flex gap-2 items-center">
                                            <Input
                                                type="date"
                                                value={selectedDate}
                                                onChange={(e) => setSelectedDate(e.target.value)}
                                                className="w-32 sm:w-36 border-2 border-gray-300 rounded-lg"
                                                placeholder="Select Date"
                                            />
                                            {selectedDate && (
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    onClick={() => setSelectedDate('')}
                                                    className="h-9 w-9 border-2 border-gray-300"
                                                >
                                                    <X className="h-3 w-3" />
                                                </Button>
                                            )}
                                        </div>
                                    </div>

                                    {/* UOM Filter */}
                                    <div className="w-full sm:w-auto">
                                        <Select value={selectedUOM} onValueChange={setSelectedUOM}>
                                            <SelectTrigger className="w-32 sm:w-36 border-2 border-gray-300 rounded-lg">
                                                <SelectValue placeholder="UOM" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="__all__">All UOMs</SelectItem>
                                                {uniqueUOMs.map((uom) => (
                                                    <SelectItem key={uom} value={uom}>
                                                        {uom}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Search */}
                                    <div className="w-full sm:flex-1 max-w-md">
                                        <div className="relative">
                                            <Input
                                                placeholder="Search..."
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                className="pr-9 border-2 border-gray-300 rounded-lg"
                                            />
                                            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                                        </div>
                                    </div>

                                    {/* Clear All Button */}
                                    {(selectedDate || selectedUOM || searchQuery) && (
                                        <Button
                                            variant="outline"
                                            onClick={clearAllFilters}
                                            className="w-full sm:w-auto flex items-center gap-2 border-2 border-gray-300 rounded-lg"
                                        >
                                            <Filter className="h-3 w-3" />
                                            Clear
                                        </Button>
                                    )}
                                </div>

                                <DataTable
                                    data={filteredTableData}
                                    columns={columns}
                                    searchFields={[]}
                                    dataLoading={indentLoading}
                                />
                            </TabsContent>

                            <TabsContent value="history" className="mt-0">
                                {/* Enhanced Filter Section for History */}
                                <div className="flex flex-col sm:flex-row gap-3 mb-6 items-center justify-center p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl border-2 border-gray-200">
                                    {/* Date Filter */}
                                    <div className="w-full sm:w-auto">
                                        <div className="flex gap-2 items-center">
                                            <Input
                                                type="date"
                                                value={selectedHistoryDate}
                                                onChange={(e) => setSelectedHistoryDate(e.target.value)}
                                                className="w-32 sm:w-36 border-2 border-gray-300 rounded-lg"
                                                placeholder="Select Date"
                                            />
                                            {selectedHistoryDate && (
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    onClick={() => setSelectedHistoryDate('')}
                                                    className="h-9 w-9 border-2 border-gray-300"
                                                >
                                                    <X className="h-3 w-3" />
                                                </Button>
                                            )}
                                        </div>
                                    </div>

                                    {/* UOM Filter */}
                                    <div className="w-full sm:w-auto">
                                        <Select value={selectedHistoryUOM} onValueChange={setSelectedHistoryUOM}>
                                            <SelectTrigger className="w-32 sm:w-36 border-2 border-gray-300 rounded-lg">
                                                <SelectValue placeholder="UOM" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="__all__">All UOMs</SelectItem>
                                                {uniqueHistoryUOMs.map((uom) => (
                                                    <SelectItem key={uom} value={uom}>
                                                        {uom}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Search */}
                                    <div className="w-full sm:flex-1 max-w-md">
                                        <div className="relative">
                                            <Input
                                                placeholder="Search..."
                                                value={historySearchQuery}
                                                onChange={(e) => setHistorySearchQuery(e.target.value)}
                                                className="pr-9 border-2 border-gray-300 rounded-lg"
                                            />
                                            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                                        </div>
                                    </div>

                                    {/* Clear All Button */}
                                    {(selectedHistoryDate || selectedHistoryUOM || historySearchQuery) && (
                                        <Button
                                            variant="outline"
                                            onClick={clearAllHistoryFilters}
                                            className="w-full sm:w-auto flex items-center gap-2 border-2 border-gray-300 rounded-lg"
                                        >
                                            <Filter className="h-3 w-3" />
                                            Clear
                                        </Button>
                                    )}
                                </div>

                                <DataTable
                                    data={filteredHistoryData}
                                    columns={historyColumns}
                                    searchFields={[]}
                                    dataLoading={indentLoading}
                                />
                            </TabsContent>
                        </div>
                    </Tabs>

                    {/* Regular Vendor Dialog */}
                    {selectedIndent && selectedIndent.vendorType === 'Regular' && (
                        <DialogContent className="bg-white rounded-2xl border-2 border-gray-200 shadow-2xl max-w-2xl">
                            <Form {...regularForm}>
                                <form
                                    onSubmit={regularForm.handleSubmit(onSubmitRegular, onError)}
                                    className="space-y-6 p-6"
                                >
                                    <DialogHeader className="text-center">
                                        <DialogTitle className="text-2xl font-bold text-gray-800">
                                            Regular Vendor
                                        </DialogTitle>
                                        <DialogDescription className="text-lg text-gray-600">
                                            Update vendor for{' '}
                                            <span className="font-bold text-blue-600">
                                                {selectedIndent.indentNo}
                                            </span>
                                        </DialogDescription>
                                    </DialogHeader>

                                    <div className="grid grid-cols-2 gap-4 bg-gradient-to-r from-blue-50 to-green-50 py-4 px-6 rounded-xl border-2 border-gray-200">
                                        <div className="space-y-1">
                                            <p className="font-semibold text-gray-700">Indenter</p>
                                            <p className="text-sm font-light">{selectedIndent.indenter}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="font-semibold text-gray-700">Department</p>
                                            <p className="text-sm font-light">{selectedIndent.department}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="font-semibold text-gray-700">Product</p>
                                            <p className="text-sm font-light">{selectedIndent.product}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="font-semibold text-gray-700">Quantity</p>
                                            <p className="text-sm font-light">{selectedIndent.quantity} {selectedIndent.uom}</p>
                                        </div>
                                    </div>

                                    <div className="grid gap-4">
                                        <FormField
                                            control={regularForm.control}
                                            name="vendorName"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="font-semibold text-gray-700 text-lg">Vendor Name</FormLabel>
                                                    <Select onValueChange={field.onChange} value={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger className="h-12 border-2 border-gray-300 rounded-xl">
                                                                <SelectValue placeholder="Select vendor" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            <Input
                                                                placeholder="Search vendor..."
                                                                className="mb-2 border-2 border-gray-300 rounded-lg"
                                                                onChange={(e) => {
                                                                    const searchValue = e.target.value.toLowerCase();
                                                                    const items = document.querySelectorAll('[role="option"]');
                                                                    items.forEach((item) => {
                                                                        const text = item.textContent?.toLowerCase() || '';
                                                                        (item as HTMLElement).style.display =
                                                                            text.includes(searchValue) ? 'flex' : 'none';
                                                                    });
                                                                }}
                                                            />
                                                            {options?.vendors?.map(({ vendorName }, i) => (
                                                                <SelectItem key={i} value={vendorName}>
                                                                    {vendorName}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={regularForm.control}
                                            name="rateType"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="font-semibold text-gray-700 text-lg">Rate Type</FormLabel>
                                                    <Select onValueChange={field.onChange} value={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger className="h-12 border-2 border-gray-300 rounded-xl">
                                                                <SelectValue placeholder="Select rate type" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            <SelectItem value="basic">Basic Rate</SelectItem>
                                                            <SelectItem value="withTax">With Tax</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={regularForm.control}
                                            name="rate"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="font-semibold text-gray-700 text-lg">
                                                        {watchRateType === 'basic' ? 'Basic Rate' : 'Rate (With Tax)'}
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input 
                                                            type="number" 
                                                            className="h-12 border-2 border-gray-300 rounded-xl text-lg" 
                                                            {...field} 
                                                        />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />

                                        {watchRateType === 'basic' && (
                                            <>
                                                <FormField
                                                    control={regularForm.control}
                                                    name="withTax"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className="font-semibold text-gray-700 text-lg">With Tax?</FormLabel>
                                                            <Select onValueChange={field.onChange} value={field.value}>
                                                                <FormControl>
                                                                    <SelectTrigger className="h-12 border-2 border-gray-300 rounded-xl">
                                                                        <SelectValue placeholder="Select option" />
                                                                    </SelectTrigger>
                                                                </FormControl>
                                                                <SelectContent>
                                                                    <SelectItem value="yes">Yes</SelectItem>
                                                                    <SelectItem value="no">No</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </FormItem>
                                                    )}
                                                />

                                                {watchWithTax === 'no' && (
                                                    <FormField
                                                        control={regularForm.control}
                                                        name="gstPercent"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel className="font-semibold text-gray-700 text-lg">GST %</FormLabel>
                                                                <Select 
                                                                    onValueChange={(value) => field.onChange(Number(value))} 
                                                                    value={field.value?.toString()}
                                                                >
                                                                    <FormControl>
                                                                        <SelectTrigger className="h-12 border-2 border-gray-300 rounded-xl">
                                                                            <SelectValue placeholder="Select GST %" />
                                                                        </SelectTrigger>
                                                                    </FormControl>
                                                                    <SelectContent>
                                                                        <SelectItem value="5">5%</SelectItem>
                                                                        <SelectItem value="18">18%</SelectItem>
                                                                        <SelectItem value="40">40%</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                            </FormItem>
                                                        )}
                                                    />
                                                )}
                                            </>
                                        )}

                                        <FormField
                                            control={regularForm.control}
                                            name="paymentTerm"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="font-semibold text-gray-700 text-lg">Payment Term</FormLabel>
                                                    <Select onValueChange={field.onChange} value={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger className="h-12 border-2 border-gray-300 rounded-xl">
                                                                <SelectValue placeholder="Select payment term" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            {options?.paymentTerms?.map((term, i) => (
                                                                <SelectItem key={i} value={term}>
                                                                    {term}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
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
                                            disabled={regularForm.formState.isSubmitting}
                                            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl px-8 py-3 text-lg font-semibold border-0"
                                        >
                                            {regularForm.formState.isSubmitting && (
                                                <Loader
                                                    size={20}
                                                    color="white"
                                                    aria-label="Loading Spinner"
                                                    className="mr-2"
                                                />
                                            )}
                                            Update Vendor
                                        </Button>
                                    </DialogFooter>
                                </form>
                            </Form>
                        </DialogContent>
                    )}

                    {/* Three Party Vendor Dialog */}
                    {selectedIndent && selectedIndent.vendorType === 'Three Party' && (
                        <DialogContent className="bg-white rounded-2xl border-2 border-gray-200 shadow-2xl max-w-4xl">
                            <Form {...threePartyForm}>
                                <form
                                    onSubmit={threePartyForm.handleSubmit(onSubmitThreeParty, onError)}
                                    className="space-y-6 p-6"
                                >
                                    <DialogHeader className="text-center">
                                        <DialogTitle className="text-2xl font-bold text-gray-800">
                                            Three Party Vendors
                                        </DialogTitle>
                                        <DialogDescription className="text-lg text-gray-600">
                                            Update vendors for{' '}
                                            <span className="font-bold text-blue-600">
                                                {selectedIndent.indentNo}
                                            </span>
                                        </DialogDescription>
                                    </DialogHeader>

                                    <div className="grid grid-cols-3 gap-4 bg-gradient-to-r from-purple-50 to-pink-50 py-4 px-6 rounded-xl border-2 border-gray-200">
                                        <div className="space-y-1">
                                            <p className="font-semibold text-gray-700">Indenter</p>
                                            <p className="text-sm font-light">{selectedIndent.indenter}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="font-semibold text-gray-700">Department</p>
                                            <p className="text-sm font-light">{selectedIndent.department}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="font-semibold text-gray-700">Product</p>
                                            <p className="text-sm font-light">{selectedIndent.product}</p>
                                        </div>
                                    </div>

                                    <Tabs defaultValue="0" className="grid gap-5 p-6 border-2 border-gray-200 rounded-xl">
                                        <TabsList className="w-full p-1 bg-gray-100 rounded-lg">
                                            <TabsTrigger value="0" className="rounded-md data-[state=active]:bg-blue-600 data-[state=active]:text-white">Vendor 1</TabsTrigger>
                                            <TabsTrigger value="1" className="rounded-md data-[state=active]:bg-blue-600 data-[state=active]:text-white">Vendor 2</TabsTrigger>
                                            <TabsTrigger value="2" className="rounded-md data-[state=active]:bg-blue-600 data-[state=active]:text-white">Vendor 3</TabsTrigger>
                                        </TabsList>
                                        
                                        {fields.map((field, index) => {
                                            const watchVendorRateType = threePartyForm.watch(`vendors.${index}.rateType`);
                                            const watchVendorWithTax = threePartyForm.watch(`vendors.${index}.withTax`);
                                            
                                            return (
                                                <TabsContent value={`${index}`} key={field.id} className="space-y-4">
                                                    <div className="grid gap-4">
                                                        {/* Vendor Name */}
                                                        <FormField
                                                            control={threePartyForm.control}
                                                            name={`vendors.${index}.vendorName`}
                                                            render={({ field }) => (
                                                                <FormItem>
                                                                    <FormLabel className="font-semibold text-gray-700">Vendor Name</FormLabel>
                                                                    <FormControl>
                                                                        <Input
                                                                            placeholder="Enter vendor name"
                                                                            {...field}
                                                                            className="h-12 border-2 border-gray-300 rounded-xl"
                                                                        />
                                                                    </FormControl>
                                                                </FormItem>
                                                            )}
                                                        />

                                                        {/* Rate Type and Rate */}
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <FormField
                                                                control={threePartyForm.control}
                                                                name={`vendors.${index}.rateType`}
                                                                render={({ field }) => (
                                                                    <FormItem>
                                                                        <FormLabel className="font-semibold text-gray-700">Rate Type</FormLabel>
                                                                        <Select onValueChange={field.onChange} value={field.value}>
                                                                            <FormControl>
                                                                                <SelectTrigger className="h-12 border-2 border-gray-300 rounded-xl">
                                                                                    <SelectValue placeholder="Select rate type" />
                                                                                </SelectTrigger>
                                                                            </FormControl>
                                                                            <SelectContent>
                                                                                <SelectItem value="basic">Basic Rate</SelectItem>
                                                                                <SelectItem value="withTax">With Tax</SelectItem>
                                                                            </SelectContent>
                                                                        </Select>
                                                                    </FormItem>
                                                                )}
                                                            />

                                                            <FormField
                                                                control={threePartyForm.control}
                                                                name={`vendors.${index}.rate`}
                                                                render={({ field }) => (
                                                                    <FormItem>
                                                                        <FormLabel className="font-semibold text-gray-700">
                                                                            {watchVendorRateType === 'basic' ? 'Basic Rate' : 'Rate (With Tax)'}
                                                                        </FormLabel>
                                                                        <FormControl>
                                                                            <Input 
                                                                                type="number" 
                                                                                {...field} 
                                                                                className="h-12 border-2 border-gray-300 rounded-xl"
                                                                            />
                                                                        </FormControl>
                                                                    </FormItem>
                                                                )}
                                                            />
                                                        </div>

                                                        {/* With Tax and GST % */}
                                                        {watchVendorRateType === 'basic' && (
                                                            <div className="grid grid-cols-2 gap-4">
                                                                <FormField
                                                                    control={threePartyForm.control}
                                                                    name={`vendors.${index}.withTax`}
                                                                    render={({ field }) => (
                                                                        <FormItem>
                                                                            <FormLabel className="font-semibold text-gray-700">With Tax?</FormLabel>
                                                                            <Select onValueChange={field.onChange} value={field.value}>
                                                                                <FormControl>
                                                                                    <SelectTrigger className="h-12 border-2 border-gray-300 rounded-xl">
                                                                                        <SelectValue placeholder="Select option" />
                                                                                    </SelectTrigger>
                                                                                </FormControl>
                                                                                <SelectContent>
                                                                                    <SelectItem value="yes">Yes</SelectItem>
                                                                                    <SelectItem value="no">No</SelectItem>
                                                                                </SelectContent>
                                                                            </Select>
                                                                        </FormItem>
                                                                    )}
                                                                />

                                                                {watchVendorWithTax === 'no' && (
                                                                    <FormField
                                                                        control={threePartyForm.control}
                                                                        name={`vendors.${index}.gstPercent`}
                                                                        render={({ field }) => (
                                                                            <FormItem>
                                                                                <FormLabel className="font-semibold text-gray-700">GST %</FormLabel>
                                                                                <Select 
                                                                                    onValueChange={(value) => field.onChange(Number(value))} 
                                                                                    value={field.value?.toString()}
                                                                                >
                                                                                    <FormControl>
                                                                                        <SelectTrigger className="h-12 border-2 border-gray-300 rounded-xl">
                                                                                            <SelectValue placeholder="Select GST %" />
                                                                                        </SelectTrigger>
                                                                                    </FormControl>
                                                                                    <SelectContent>
                                                                                        <SelectItem value="5">5%</SelectItem>
                                                                                        <SelectItem value="18">18%</SelectItem>
                                                                                        <SelectItem value="40">40%</SelectItem>
                                                                                    </SelectContent>
                                                                                </Select>
                                                                            </FormItem>
                                                                        )}
                                                                    />
                                                                )}
                                                            </div>
                                                        )}

                                                        {/* Payment Term */}
                                                        <FormField
                                                            control={threePartyForm.control}
                                                            name={`vendors.${index}.paymentTerm`}
                                                            render={({ field }) => (
                                                                <FormItem>
                                                                    <FormLabel className="font-semibold text-gray-700">Payment Term</FormLabel>
                                                                    <Select onValueChange={field.onChange} value={field.value}>
                                                                        <FormControl>
                                                                            <SelectTrigger className="h-12 border-2 border-gray-300 rounded-xl">
                                                                                <SelectValue placeholder="Select payment term" />
                                                                            </SelectTrigger>
                                                                        </FormControl>
                                                                        <SelectContent>
                                                                            {options?.paymentTerms?.map((term, i) => (
                                                                                <SelectItem key={i} value={term}>
                                                                                    {term}
                                                                                </SelectItem>
                                                                            ))}
                                                                        </SelectContent>
                                                                    </Select>
                                                                </FormItem>
                                                            )}
                                                        />

                                                        {/* WhatsApp Number */}
                                                        <FormField
                                                            control={threePartyForm.control}
                                                            name={`vendors.${index}.whatsappNumber`}
                                                            render={({ field }) => (
                                                                <FormItem>
                                                                    <FormLabel className="font-semibold text-gray-700">WhatsApp Number</FormLabel>
                                                                    <FormControl>
                                                                        <Input
                                                                            type="number"
                                                                            placeholder="Enter WhatsApp number"
                                                                            {...field}
                                                                            className="h-12 border-2 border-gray-300 rounded-xl"
                                                                        />
                                                                    </FormControl>
                                                                </FormItem>
                                                            )}
                                                        />

                                                        {/* Email ID */}
                                                        <FormField
                                                            control={threePartyForm.control}
                                                            name={`vendors.${index}.emailId`}
                                                            render={({ field }) => (
                                                                <FormItem>
                                                                    <FormLabel className="font-semibold text-gray-700">Email ID</FormLabel>
                                                                    <FormControl>
                                                                        <Input
                                                                            type="email"
                                                                            placeholder="Enter email ID"
                                                                            {...field}
                                                                            className="h-12 border-2 border-gray-300 rounded-xl"
                                                                        />
                                                                    </FormControl>
                                                                </FormItem>
                                                            )}
                                                        />
                                                    </div>
                                                </TabsContent>
                                            );
                                        })}
                                    </Tabs>

                                    {/* Comparison Sheet */}
                                    <FormField
                                        control={threePartyForm.control}
                                        name="comparisonSheet"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="font-semibold text-gray-700 text-lg">Comparison Sheet</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="file"
                                                        onChange={(e) => field.onChange(e.target.files?.[0])}
                                                        className="border-2 border-gray-300 rounded-xl py-3"
                                                    />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />

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
                                            disabled={threePartyForm.formState.isSubmitting}
                                            className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-xl px-8 py-3 text-lg font-semibold border-0"
                                        >
                                            {threePartyForm.formState.isSubmitting && (
                                                <Loader
                                                    size={20}
                                                    color="white"
                                                    aria-label="Loading Spinner"
                                                    className="mr-2"
                                                />
                                            )}
                                            Update Vendors
                                        </Button>
                                    </DialogFooter>
                                </form>
                            </Form>
                        </DialogContent>
                    )}

                    {/* History Update Dialog */}
                    {selectedHistory && selectedHistory.vendorType === 'Regular' && (
                        <DialogContent className="bg-white rounded-2xl border-2 border-gray-200 shadow-2xl max-w-md">
                            <Form {...historyUpdateForm}>
                                <form
                                    onSubmit={historyUpdateForm.handleSubmit(onSubmitHistoryUpdate, onError)}
                                    className="space-y-6 p-6"
                                >
                                    <DialogHeader className="text-center">
                                        <DialogTitle className="text-2xl font-bold text-gray-800">
                                            Update Rate
                                        </DialogTitle>
                                        <DialogDescription className="text-lg text-gray-600">
                                            Update rate for{' '}
                                            <span className="font-bold text-blue-600">
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