import Heading from '../element/Heading';
import { useEffect, useState } from 'react';
import { useSheets } from '@/context/SheetsContext';
import type { ColumnDef } from '@tanstack/react-table';
import { Badge } from '../ui/badge';
import { Store, Package, DollarSign, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import DataTable from '../element/DataTable';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
// import { Progress } from '../ui/progress';

interface InventoryTable {
    itemName: string;
    groupHead: string;
    uom: string;
    status: string;
    opening: number;
    rate: number;
    indented: number;
    approved: number;
    purchaseQuantity: number;
    outQuantity: number;
    current: number;
    totalPrice: number;
}

export default () => {
    const { inventorySheet, inventoryLoading } = useSheets();
    const [tableData, setTableData] = useState<InventoryTable[]>([]);

    // Calculate inventory statistics
    const calculateStats = () => {
        let totalValue = 0;
        let totalItems = 0;
        let outOfStock = 0;
        let lowStock = 0;
        let inStock = 0;

        tableData.forEach(item => {
            totalValue += item.totalPrice || 0;
            totalItems += 1;
            
            const code = item.status?.toLowerCase();
            if (item.current === 0) {
                outOfStock++;
            } else if (code === 'red') {
                lowStock++;
            } else if (code === 'purple') {
                inStock++;
            } else {
                inStock++;
            }
        });

        return {
            totalValue,
            totalItems,
            outOfStock,
            lowStock,
            inStock,
            averageValue: totalItems > 0 ? totalValue / totalItems : 0
        };
    };

    const stats = calculateStats();

    useEffect(() => {
        setTableData(
            inventorySheet.map((i) => ({
                totalPrice: i.totalPrice || 0,
                approvedIndents: i.approved || 0,
                uom: i.uom || '',
                rate: i.individualRate || 0,
                current: i.current || 0,
                status: i.colorCode || '',
                indented: i.indented || 0,
                opening: i.opening || 0,
                itemName: i.itemName || '',
                groupHead: i.groupHead || '',
                purchaseQuantity: i.purchaseQuantity || 0,
                approved: i.approved || 0,
                outQuantity: i.outQuantity || 0,
            }))
        );
    }, [inventorySheet]);

    const columns: ColumnDef<InventoryTable>[] = [
        {
            accessorKey: 'itemName',
            header: 'Item Name',
            cell: ({ row }) => (
                <div className="text-center min-w-[200px]">
                    <div className="font-semibold text-gray-900">{row.original.itemName}</div>
                    <div className="text-sm text-gray-500">{row.original.groupHead}</div>
                </div>
            ),
        },
        {
            accessorKey: 'status',
            header: 'Status',
            cell: ({ row }) => {
                const code = row.original.status?.toLowerCase();
                const current = row.original.current || 0;
                
                if (current === 0) {
                    return (
                        <div className="flex justify-center">
                            <Badge variant="destructive" className="flex items-center gap-1">
                                <AlertCircle size={12} />
                                Out of Stock
                            </Badge>
                        </div>
                    );
                }
                if (code === 'red') {
                    return (
                        <div className="flex justify-center">
                            <Badge variant="secondary" className="bg-amber-100 text-amber-800 hover:bg-amber-100">
                                <AlertCircle size={12} />
                                Low Stock
                            </Badge>
                        </div>
                    );
                }
                if (code === 'purple') {
                    return (
                        <div className="flex justify-center">
                            <Badge variant="secondary" className="bg-purple-100 text-purple-800 hover:bg-purple-100">
                                Excess
                            </Badge>
                        </div>
                    );
                }
                return (
                    <div className="flex justify-center">
                        <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-100">
                            In Stock
                        </Badge>
                    </div>
                );
            },
        },
        {
            accessorKey: 'current',
            header: 'Quantity',
            cell: ({ row }) => (
                <div className="text-center">
                    <div className="font-bold text-lg text-gray-900">{row.original.current || 0}</div>
                    <div className="text-sm text-gray-500">{row.original.uom || '-'}</div>
                </div>
            ),
        },
        {
            accessorKey: 'rate',
            header: 'Unit Price',
            cell: ({ row }) => (
                <div className="text-center">
                    <div className="font-semibold text-gray-900">
                        ₹{row.original.rate?.toLocaleString() || '0'}
                    </div>
                </div>
            ),
        },
        {
            accessorKey: 'totalPrice',
            header: 'Total Value',
            cell: ({ row }) => (
                <div className="text-center">
                    <div className="font-bold text-gray-900">
                        ₹{row.original.totalPrice?.toLocaleString() || '0'}
                    </div>
                </div>
            ),
        },
        {
            accessorKey: 'indented',
            header: 'Indented',
            cell: ({ row }) => (
                <div className="text-center">
                    {row.original.indented || 0}
                </div>
            ),
        },
        {
            accessorKey: 'approved',
            header: 'Approved',
            cell: ({ row }) => (
                <div className="text-center">
                    {row.original.approved || 0}
                </div>
            ),
        },
        {
            accessorKey: 'purchaseQuantity',
            header: 'Purchased',
            cell: ({ row }) => (
                <div className="text-center">
                    {row.original.purchaseQuantity || 0}
                </div>
            ),
        },
        {
            accessorKey: 'outQuantity',
            header: 'Issued',
            cell: ({ row }) => (
                <div className="text-center">
                    {row.original.outQuantity || 0}
                </div>
            ),
        },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            <div className="p-4 md:p-6">
                <div className="max-w-7xl mx-auto">
                    {/* Header Section */}
                    <div className="mb-8">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-white rounded-xl shadow-sm border">
                                    <Store size={32} className="text-primary" />
                                </div>
                                <div>
                                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                                        Inventory Management
                                    </h1>
                                    <p className="text-gray-600 mt-1">
                                        View and manage inventory across all items
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                            <Card className="border shadow-sm">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-sm font-medium text-gray-500">
                                        Total Inventory Value
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center justify-between">
                                        <div className="text-2xl font-bold text-gray-900">
                                            ₹{stats.totalValue.toLocaleString()}
                                        </div>
                                        <div className="p-2 bg-blue-50 rounded-lg">
                                            <DollarSign className="text-blue-600" size={24} />
                                        </div>
                                    </div>
                                    <div className="mt-2 text-sm text-gray-500">
                                        {stats.totalItems} items in inventory
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border shadow-sm">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-sm font-medium text-gray-500">
                                        Stock Status
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="text-2xl font-bold text-green-600">
                                                {stats.inStock}
                                            </div>
                                            <div className="text-sm text-gray-500">In Stock</div>
                                        </div>
                                        <div className="p-2 bg-green-50 rounded-lg">
                                            <Package className="text-green-600" size={24} />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border shadow-sm">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-sm font-medium text-gray-500">
                                        Low Stock
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="text-2xl font-bold text-amber-600">
                                                {stats.lowStock}
                                            </div>
                                            <div className="text-sm text-gray-500">Require Attention</div>
                                        </div>
                                        <div className="p-2 bg-amber-50 rounded-lg">
                                            <TrendingDown className="text-amber-600" size={24} />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border shadow-sm">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-sm font-medium text-gray-500">
                                        Out of Stock
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="text-2xl font-bold text-red-600">
                                                {stats.outOfStock}
                                            </div>
                                            <div className="text-sm text-gray-500">Need Reorder</div>
                                        </div>
                                        <div className="p-2 bg-red-50 rounded-lg">
                                            <AlertCircle className="text-red-600" size={24} />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Stock Status Overview */}
                        <div className="mb-8">
                            <h3 className="text-lg font-semibold mb-4 text-gray-800">Stock Status Overview</h3>
                            <div className="bg-white p-4 rounded-xl border shadow-sm">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-gray-700">Stock Distribution</span>
                                    <span className="text-sm text-gray-500">{stats.totalItems} items total</span>
                                </div>
                                <div className="flex h-4 rounded-full overflow-hidden bg-gray-100">
                                    <div 
                                        className="bg-green-500" 
                                        style={{ width: `${(stats.inStock / stats.totalItems) * 100}%` }}
                                        title={`In Stock: ${stats.inStock}`}
                                    ></div>
                                    <div 
                                        className="bg-amber-500" 
                                        style={{ width: `${(stats.lowStock / stats.totalItems) * 100}%` }}
                                        title={`Low Stock: ${stats.lowStock}`}
                                    ></div>
                                    <div 
                                        className="bg-red-500" 
                                        style={{ width: `${(stats.outOfStock / stats.totalItems) * 100}%` }}
                                        title={`Out of Stock: ${stats.outOfStock}`}
                                    ></div>
                                </div>
                                <div className="flex justify-between mt-3">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                        <span className="text-sm text-gray-600">In Stock ({stats.inStock})</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                                        <span className="text-sm text-gray-600">Low Stock ({stats.lowStock})</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                        <span className="text-sm text-gray-600">Out of Stock ({stats.outOfStock})</span>
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
                                                Inventory Items
                                            </h3>
                                            <p className="text-gray-600 text-sm">
                                                Detailed view of all inventory items with stock status
                                            </p>
                                        </div>
                                        <div className="text-sm text-gray-500">
                                            Showing {tableData.length} items
                                        </div>
                                    </div>
                                </div>
                                <div className="border rounded-lg overflow-hidden">
                                    <DataTable
                                        data={tableData}
                                        columns={columns}
                                        dataLoading={inventoryLoading}
                                        searchFields={['itemName', 'groupHead', 'uom', 'status']}
                                        className="h-[60dvh]"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Legend */}
                        <div className="mt-6 flex flex-wrap gap-4 justify-center">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                <span className="text-sm text-gray-600">In Stock - Good inventory level</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                                <span className="text-sm text-gray-600">Low Stock - Reorder recommended</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                <span className="text-sm text-gray-600">Out of Stock - Immediate action needed</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                                <span className="text-sm text-gray-600">Excess Stock - More than needed</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};