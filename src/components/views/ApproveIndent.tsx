import { type ColumnDef, type Row } from '@tanstack/react-table';
import DataTable from '../element/DataTable';
import { useEffect, useState } from 'react';
import { useSheets } from '@/context/SheetsContext';
import { DownloadOutlined } from "@ant-design/icons";

import {
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '../ui/button';
import { Dialog } from '@radix-ui/react-dialog';
import { z } from 'zod';
import { useForm, type FieldErrors } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel } from '../ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { postToSheet } from '@/lib/fetchers';
import { toast } from 'sonner';
import { PuffLoader as Loader } from 'react-spinners';
import { Tabs, TabsContent } from '../ui/tabs';
import { ClipboardCheck, PenSquare, FileText, Calendar, User, Building } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import Heading from '../element/Heading';
import { Pill } from '../ui/pill';
import { Input } from '../ui/input';

const statuses = ['Pending', 'Reject', 'New Vendor', 'Regular'];

interface ApproveTableData {
    indentNo: string;
    indenter: string;
    department: string;
    product: string;
    quantity: number;
    uom: string;
    vendorType: 'Pending' | 'Reject' | 'New Vendor' | 'Regular';
    date: string;
    attachment: string;
    specifications: string;
    indentStatus: string;
    noDay: number;
    planned1: string;
}

interface HistoryData {
    indentNo: string;
    indenter: string;
    department: string;
    product: string;
    uom: string;
    approvedQuantity: number;
    vendorType: 'Reject' | 'New Vendor' | 'Regular';
    date: string;
    approvedDate: string;
    specifications: string;
    lastUpdated?: string;
    indentStatus: string;
    noDay: number;
    planned1: string;
    actual1: string;
}

export default () => {
    const { indentSheet, indentLoading, updateIndentSheet } = useSheets();
    const { user } = useAuth();

    console.log("user.firmNameMatch:", user.firmNameMatch);
    console.log("user object:", user);

    const [selectedIndent, setSelectedIndent] = useState<ApproveTableData | null>(null);
    const [tableData, setTableData] = useState<ApproveTableData[]>([]);
    const [historyData, setHistoryData] = useState<HistoryData[]>([]);
    const [openDialog, setOpenDialog] = useState(false);
    const [editingRow, setEditingRow] = useState<string | null>(null);
    const [editValues, setEditValues] = useState<Partial<HistoryData>>({});
    const [loading, setLoading] = useState(false);

    // Fetching table data
    useEffect(() => {
        const filteredByFirm = indentSheet.filter(sheet => 
            user.firmNameMatch.toLowerCase() === "all" || sheet.firmName === user.firmNameMatch
        );
        
        setTableData(
            filteredByFirm
                .filter(
                    (sheet) =>
                        sheet.planned1 !== '' &&
                        sheet.actual1 === '' 
                )
                .map((sheet) => ({
                    indentNo: sheet.indentNumber,
                    firmNameMatch: sheet.firmNameMatch || '',
                    indenter: sheet.indenterName,
                    department: sheet.department,
                    product: sheet.productName,
                    quantity: sheet.quantity,
                    uom: sheet.uom,
                    attachment: sheet.attachment,
                    specifications: sheet.specifications || '',
                    vendorType: sheet.vendorType as ApproveTableData['vendorType'],
                    date: formatDate(new Date(sheet.timestamp)),
                    indentStatus: sheet.indentStatus || '',
                    noDay: sheet.noDay || 0,
                    planned1: sheet.planned1,
                }))
        );
    }, [indentSheet, user.firmNameMatch]);

    useEffect(() => {
        const filteredByFirm = indentSheet.filter(sheet => 
            user.firmNameMatch.toLowerCase() === "all" || sheet.firmName === user.firmNameMatch
        );
        
        setHistoryData(
            filteredByFirm
                .filter(
                    (sheet) =>
                        sheet.planned1 !== '' &&
                        sheet.actual1 !== '' 
                )
                .map((sheet) => ({
                    indentNo: sheet.indentNumber,
                    firmNameMatch: sheet.firmNameMatch || '',
                    indenter: sheet.indenterName,
                    department: sheet.department,
                    product: sheet.productName,
                    approvedQuantity: sheet.approvedQuantity || sheet.quantity,
                    vendorType: sheet.vendorType as HistoryData['vendorType'],
                    uom: sheet.uom,
                    specifications: sheet.specifications || '',
                    date: formatDate(new Date(sheet.timestamp)),
                    approvedDate: formatDate(new Date(sheet.actual1)),
                    indentStatus: sheet.indentStatus || '',
                    noDay: sheet.noDay || 0,
                    planned1: sheet.planned1,
                    actual1: sheet.actual1,
                }))
                .sort((a, b) => b.indentNo.localeCompare(a.indentNo))
        );
    }, [indentSheet, user.firmNameMatch]);

    const handleDownload = (data: any[]) => {
        if (!data || data.length === 0) {
            toast.error("No data to download");
            return;
        }

        const headers = Object.keys(data[0]);
        const csvRows = [
            headers.join(","),
            ...data.map(row =>
                headers.map(h => `"${String(row[h] ?? "").replace(/"/g, '""')}"`).join(",")
            )
        ];

        const csvContent = csvRows.join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `pending-indents-${Date.now()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const onDownloadClick = async () => {
        setLoading(true);
        try {
            await handleDownload(tableData);
        } finally {
            setLoading(false);
        }
    };

    const handleEditClick = (row: HistoryData) => {
        setEditingRow(row.indentNo);
        setEditValues({
            approvedQuantity: row.approvedQuantity,
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
                        approvedQuantity: editValues.approvedQuantity,
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
        setEditValues(prev => ({ ...prev, [field]: value }));
    };

    // Creating table columns
    const columns: ColumnDef<ApproveTableData>[] = [
        ...(user.indentApprovalAction
            ? [
                {
                    header: 'Action',
                    id: 'action',
                    cell: ({ row }: { row: Row<ApproveTableData> }) => {
                        const indent = row.original;
                        return (
                            <div className="flex justify-center">
                                <DialogTrigger asChild>
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            setSelectedIndent(indent);
                                        }}
                                        className="bg-green-600 hover:bg-green-700 text-white border-0 font-semibold rounded-lg"
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
                <div className="text-center font-semibold text-blue-700">
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
                <div className="max-w-[150px] break-words whitespace-normal text-center">
                    <FileText className="inline mr-2 h-4 w-4 text-gray-600" />
                    {getValue() as string}
                </div>
            ),
        },
        { 
            accessorKey: 'quantity', 
            header: 'Quantity',
            cell: ({ getValue }) => (
                <div className="text-center font-semibold">
                    {getValue() as number}
                </div>
            )
        },
        { 
            accessorKey: 'uom', 
            header: 'UOM',
            cell: ({ getValue }) => (
                <div className="text-center">
                    {getValue() as string}
                </div>
            )
        },
        {
            accessorKey: 'specifications',
            header: 'Specifications',
            cell: ({ row, getValue }) => {
                const [value, setValue] = useState(getValue() as string);
                const [isEditing, setIsEditing] = useState(false);
                const indentNo = row.original.indentNo;

                const handleBlur = async () => {
                    setIsEditing(false);
                    try {
                        await postToSheet(
                            indentSheet
                                .filter((s) => s.indentNumber === indentNo)
                                .map((prev) => ({
                                    rowIndex: prev.rowIndex,
                                    specifications: value,
                                })),
                            'update'
                        );
                        toast.success(`Updated specifications for ${indentNo}`);
                        updateIndentSheet();
                    } catch {
                        toast.error('Failed to update specifications');
                    }
                };

                const handleFocus = () => {
                    setIsEditing(true);
                };

                return (
                    <div className="max-w-[150px] mx-auto">
                        {isEditing ? (
                            <Input
                                value={value}
                                onChange={(e) => setValue(e.target.value)}
                                onBlur={handleBlur}
                                autoFocus
                                className="border-2 border-green-500 rounded-lg text-center"
                            />
                        ) : (
                            <div 
                                className="break-words whitespace-normal cursor-pointer p-2 hover:bg-green-50 rounded-lg text-center border-2 border-transparent hover:border-green-200 transition-all"
                                onClick={handleFocus}
                                onFocus={handleFocus}
                                tabIndex={0}
                            >
                                {value || 'Click to edit...'}
                            </div>
                        )}
                    </div>
                );
            },
        },
        {
            accessorKey: 'vendorType',
            header: 'Vendor Type',
            cell: ({ row }: { row: Row<ApproveTableData> }) => {
                const status = row.original.vendorType;
                return (
                    <div className="flex justify-center">
                        <Pill
                            variant={
                                status === 'Reject'
                                    ? 'reject'
                                    : status === 'Regular'
                                        ? 'primary'
                                        : 'secondary'
                            }
                        >
                            {status}
                        </Pill>
                    </div>
                );
            },
        },
        {
            accessorKey: 'indentStatus',
            header: 'Priority',
            cell: ({ row }: { row: Row<ApproveTableData> }) => {
                const status = row.original.indentStatus;
                return (
                    <div className="flex justify-center">
                        <Pill variant={status === 'Critical' ? 'reject' : 'secondary'}>
                            {status}
                        </Pill>
                    </div>
                );
            },
        },
        {
            accessorKey: 'noDay',
            header: 'Days',
            cell: ({ getValue }) => (
                <div className="text-center font-semibold text-orange-600">
                    {getValue() as number}
                </div>
            ),
        },
        {
            accessorKey: 'attachment',
            header: 'Attachment',
            cell: ({ row }: { row: Row<ApproveTableData> }) => {
                const attachment = row.original.attachment;
                return attachment ? (
                    <div className="flex justify-center">
                        <a 
                            href={attachment} 
                            target="_blank"
                            className="text-blue-600 hover:text-blue-800 font-semibold underline"
                        >
                            <FileText className="inline mr-2 h-4 w-4" />
                            View
                        </a>
                    </div>
                ) : (
                    <div className="text-center text-gray-400">-</div>
                );
            },
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
            accessorKey: 'planned1',
            header: 'Planned Date',
            cell: ({ row }) => (
                <div className="text-center">
                    {row.original.planned1
                        ? formatDateTime(row.original.planned1)
                        : '-'}
                </div>
            )
        }
    ];

    const historyColumns: ColumnDef<HistoryData>[] = [
        { 
            accessorKey: 'indentNo', 
            header: 'Indent No.',
            cell: ({ getValue }) => (
                <div className="text-center font-semibold text-blue-700">
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
                <div className="max-w-[150px] break-words whitespace-normal text-center">
                    <FileText className="inline mr-2 h-4 w-4 text-gray-600" />
                    {getValue() as string}
                </div>
            ),
        },
        {
            accessorKey: 'approvedQuantity',
            header: 'Quantity',
            cell: ({ row }) => {
                const isEditing = editingRow === row.original.indentNo;
                return (
                    <div className="flex justify-center items-center gap-2">
                        {isEditing ? (
                            <Input
                                type="number"
                                value={editValues.approvedQuantity ?? row.original.approvedQuantity}
                                onChange={(e) => handleInputChange('approvedQuantity', Number(e.target.value))}
                                className="w-20 text-center border-2 border-green-500 rounded-lg"
                            />
                        ) : (
                            <>
                                <span className="font-semibold">{row.original.approvedQuantity}</span>
                                {user.indentApprovalAction && (
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
                                <span>{row.original.uom}</span>
                                {user.indentApprovalAction && editingRow !== row.original.indentNo && (
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
            accessorKey: 'specifications',
            header: 'Specifications',
            cell: ({ getValue }) => (
                <div className="max-w-[150px] break-words whitespace-normal text-center">
                    {getValue() as string}
                </div>
            ),
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
                                    <SelectItem value="New Vendor">New Vendor</SelectItem>
                                    <SelectItem value="Reject">Reject</SelectItem>
                                </SelectContent>
                            </Select>
                        ) : (
                            <>
                                <Pill
                                    variant={
                                        row.original.vendorType === 'Reject'
                                            ? 'reject'
                                            : row.original.vendorType === 'Regular'
                                                ? 'primary'
                                                : 'secondary'
                                    }
                                >
                                    {row.original.vendorType}
                                </Pill>
                                {user.indentApprovalAction && editingRow !== row.original.indentNo && (
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
            accessorKey: 'indentStatus',
            header: 'Priority',
            cell: ({ row }: { row: Row<HistoryData> }) => {
                const status = row.original.indentStatus;
                return (
                    <div className="flex justify-center">
                        <Pill variant={status === 'Critical' ? 'reject' : 'secondary'}>
                            {status}
                        </Pill>
                    </div>
                );
            },
        },
        {
            accessorKey: 'noDay',
            header: 'Days',
            cell: ({ getValue }) => (
                <div className="text-center font-semibold text-orange-600">
                    {getValue() as number}
                </div>
            ),
        },
        { 
            accessorKey: 'date', 
            header: 'Request Date',
            cell: ({ getValue }) => (
                <div className="text-center">
                    <Calendar className="inline mr-2 h-4 w-4 text-gray-600" />
                    {getValue() as string}
                </div>
            )
        },
        { 
            accessorKey: 'approvedDate', 
            header: 'Approval Date',
            cell: ({ getValue }) => (
                <div className="text-center">
                    <Calendar className="inline mr-2 h-4 w-4 text-green-600" />
                    {getValue() as string}
                </div>
            )
        },
        {
            accessorKey: 'planned1',
            header: 'Planned Date',
            cell: ({ row }) => (
                <div className="text-center">
                    {row.original.planned1
                        ? formatDateTime(row.original.planned1)
                        : '-'}
                </div>
            )
        },
        {
            accessorKey: 'actual1',
            header: 'Actual Date',
            cell: ({ row }) => (
                <div className="text-center">
                    {row.original.actual1
                        ? formatDateTime(row.original.actual1)
                        : '-'}
                </div>
            )
        },
        ...(user.indentApprovalAction
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
                                    className="bg-green-600 hover:bg-green-700 text-white"
                                >
                                    Save
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={handleCancelEdit}
                                    className="border-red-500 text-red-600 hover:bg-red-50"
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

    // Creating Form
    const schema = z
        .object({
            approval: z.enum(['Reject', 'Three Party', 'Regular']),
            approvedQuantity: z.coerce.number().optional(),
        })
        .superRefine((data, ctx) => {
            if (data.approval !== 'Reject') {
                if (!data.approvedQuantity || data.approvedQuantity === 0) {
                    ctx.addIssue({
                        path: ['approvedQuantity'],
                        code: z.ZodIssueCode.custom,
                    });
                }
            }
        });

    const form = useForm<z.infer<typeof schema>>({
        resolver: zodResolver(schema),
        defaultValues: { approvedQuantity: undefined, approval: undefined },
    });

    const approval = form.watch('approval');

    useEffect(() => {
        if (selectedIndent) {
            form.setValue("approvedQuantity", selectedIndent.quantity)
        }
    }, [selectedIndent]);

    async function onSubmit(values: z.infer<typeof schema>) {
        try {
            await postToSheet(
                indentSheet
                    .filter((s) => s.indentNumber === selectedIndent?.indentNo)
                    .map((prev) => ({
                        rowIndex: prev.rowIndex,
                        vendorType: values.approval,
                        approvedQuantity: values.approvedQuantity,
                        actual1: new Date().toISOString(),
                        lastUpdated: new Date().toISOString(),
                    })),
                'update'
            );
            toast.success(`Updated approval status of ${selectedIndent?.indentNo}`);
            setOpenDialog(false);
            form.reset();
            setTimeout(() => updateIndentSheet(), 1000);
        } catch {
            toast.error('Failed to approve indent');
        }
    }

    function onError(e: FieldErrors<z.infer<typeof schema>>) {
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
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-6">
            <div className="max-w-7xl mx-auto">
                <Dialog open={openDialog} onOpenChange={setOpenDialog}>
                    <Tabs defaultValue="pending">
                        <Heading
                            heading="Approve Indent"
                            subtext="Update Indent status to Approve or Reject them"
                            tabs
                        >
                            <ClipboardCheck size={50} className="text-green-600" />
                        </Heading>
                        
                        <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-100 p-6">
                            <TabsContent value="pending" className="mt-0">
                                <DataTable
                                    data={tableData}
                                    columns={columns}
                                    searchFields={['product', 'department', 'indenter', 'vendorType','firmNameMatch']}
                                    dataLoading={indentLoading}
                                    extraActions={
                                        <Button
                                            onClick={onDownloadClick}
                                            className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold py-3 px-6 rounded-xl shadow-lg transition-all duration-300 border-0"
                                        >
                                            <DownloadOutlined className="mr-2" />
                                            {loading ? "Downloading..." : "Download CSV"}
                                        </Button>
                                    }
                                />
                            </TabsContent>
                            
                            <TabsContent value="history" className="mt-0">
                                <DataTable
                                    data={historyData}
                                    columns={historyColumns}
                                    searchFields={['product', 'department', 'indenter', 'vendorType']}
                                    dataLoading={indentLoading}
                                />
                            </TabsContent>
                        </div>
                    </Tabs>

                    {selectedIndent && (
                        <DialogContent className="bg-white rounded-2xl border-2 border-gray-200 shadow-2xl max-w-md mx-auto">
                            <Form {...form}>
                                <form
                                    onSubmit={form.handleSubmit(onSubmit, onError)}
                                    className="grid gap-6 p-6"
                                >
                                    <DialogHeader className="text-center">
                                        <DialogTitle className="text-2xl font-bold text-gray-800">
                                            Approve Indent
                                        </DialogTitle>
                                        <DialogDescription className="text-lg text-gray-600">
                                            Approve indent{' '}
                                            <span className="font-bold text-green-600">
                                                {selectedIndent.indentNo}
                                            </span>
                                        </DialogDescription>
                                    </DialogHeader>

                                    <div className="grid gap-4">
                                        <FormField
                                            control={form.control}
                                            name="approval"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="font-semibold text-gray-700 text-lg">
                                                        Vendor Type
                                                    </FormLabel>
                                                    <Select
                                                        onValueChange={field.onChange}
                                                        value={field.value}
                                                    >
                                                        <FormControl>
                                                            <SelectTrigger className="h-12 border-2 border-gray-300 rounded-xl focus:border-green-500 text-lg">
                                                                <SelectValue placeholder="Select approval status" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent className="border-2 border-gray-200 rounded-xl">
                                                            <SelectItem value="Three Party" className="text-lg py-3">
                                                                Three Party
                                                            </SelectItem>
                                                            <SelectItem value="Reject" className="text-lg py-3 text-red-600">
                                                                Reject
                                                            </SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="approvedQuantity"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="font-semibold text-gray-700 text-lg">
                                                        Quantity
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            {...field}
                                                            disabled={approval === 'Reject'}
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
                                            disabled={form.formState.isSubmitting}
                                            className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-xl px-8 py-3 text-lg font-semibold border-0"
                                        >
                                            {form.formState.isSubmitting && (
                                                <Loader
                                                    size={20}
                                                    color="white"
                                                    aria-label="Loading Spinner"
                                                    className="mr-2"
                                                />
                                            )}
                                            Approve
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