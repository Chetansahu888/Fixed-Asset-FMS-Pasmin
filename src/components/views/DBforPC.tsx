import { Package2, BarChart3, TrendingUp, Clock, CheckCircle } from 'lucide-react';
import Heading from '../element/Heading';
import { useSheets } from '@/context/SheetsContext';
import { useEffect, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import DataTable from '../element/DataTable';
import { Badge } from '../ui/badge';
import type { PcReportSheet } from '@/types';
import { useAuth } from '@/context/AuthContext';

export default function PcReportTable() {
    const { pcReportSheet, poMasterLoading } = useSheets();
    const [historyData, setHistoryData] = useState<PcReportSheet[]>([]);
    const { user } = useAuth();

    // Calculate totals
    const calculateTotals = () => {
        const totals = {
            totalPending: 0,
            totalComplete: 0,
            totalPmpl: 0,
            totalPurab: 0,
            totalPmmpl: 0,
            totalRefrasynth: 0
        };

        historyData.forEach(item => {
            totals.totalPending += Number(item.totalPending) || 0;
            totals.totalComplete += Number(item.totalComplete) || 0;
            totals.totalPmpl += Number(item.pendingPmpl) || 0;
            totals.totalPurab += Number(item.pendingPurab) || 0;
            totals.totalPmmpl += Number(item.pendingPmmpl) || 0;
            totals.totalRefrasynth += Number(item.pendingRefrasynth) || 0;
        });

        return totals;
    };

    const totals = calculateTotals();

    useEffect(() => {
        console.log("PC Report Sheet:", pcReportSheet);
        
        // Filter by firm name (case-insensitive)
        const filteredByFirm = pcReportSheet.filter(item => 
            user.firmNameMatch.toLowerCase() === "all" || item.firmNameMatch === user.firmNameMatch
        );
        
        setHistoryData(filteredByFirm);
    }, [pcReportSheet, user.firmNameMatch]);

    // Columns for PcReportSheet
    const historyColumns: ColumnDef<PcReportSheet>[] = [
        { 
            accessorKey: 'stage', 
            header: 'Stage',
            cell: ({ row }) => (
                <div className="text-center">
                    {row.original.stage}
                </div>
            )
        },
        { 
            accessorKey: 'totalPending', 
            header: 'Total Pending',
            cell: ({ row }) => {
                const value = Number(row.original.totalPending) || 0;
                return (
                    <div className="text-center">
                        <Badge variant={value > 0 ? "destructive" : "outline"}>
                            {value}
                        </Badge>
                    </div>
                );
            }
        },
        { 
            accessorKey: 'totalComplete', 
            header: 'Total Complete',
            cell: ({ row }) => {
                const value = Number(row.original.totalComplete) || 0;
                return (
                    <div className="text-center">
                        <Badge variant={value > 0 ? "default" : "outline"}>
                            {value}
                        </Badge>
                    </div>
                );
            }
        },
        { 
            accessorKey: 'pendingPmpl', 
            header: 'Pending PMPL',
            cell: ({ row }) => {
                const value = Number(row.original.pendingPmpl) || 0;
                return (
                    <div className="text-center">
                        <Badge variant={value > 0 ? "secondary" : "outline"}>
                            {value}
                        </Badge>
                    </div>
                );
            }
        },
        { 
            accessorKey: 'pendingPurab', 
            header: 'Pending PURAB',
            cell: ({ row }) => {
                const value = Number(row.original.pendingPurab) || 0;
                return (
                    <div className="text-center">
                        <Badge variant={value > 0 ? "secondary" : "outline"}>
                            {value}
                        </Badge>
                    </div>
                );
            }
        },
        { 
            accessorKey: 'pendingPmmpl', 
            header: 'Pending PMMPL',
            cell: ({ row }) => {
                const value = Number(row.original.pendingPmmpl) || 0;
                return (
                    <div className="text-center">
                        <Badge variant={value > 0 ? "secondary" : "outline"}>
                            {value}
                        </Badge>
                    </div>
                );
            }
        },
        { 
            accessorKey: 'pendingRefrasynth', 
            header: 'Pending REFRASYNTH',
            cell: ({ row }) => {
                const value = Number(row.original.pendingRefrasynth) || 0;
                return (
                    <div className="text-center">
                        <Badge variant={value > 0 ? "secondary" : "outline"}>
                            {value}
                        </Badge>
                    </div>
                );
            }
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
                                    <Package2 size={32} className="text-primary" />
                                </div>
                                <div>
                                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                                        PC Report
                                    </h1>
                                    <p className="text-gray-600 mt-1">
                                        Overview of procurement status across all stages
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                            <div className="bg-white p-5 rounded-xl shadow-sm border">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Total Pending</p>
                                        <p className="text-3xl font-bold text-amber-600 mt-2">
                                            {totals.totalPending}
                                        </p>
                                    </div>
                                    <div className="p-3 bg-amber-50 rounded-lg">
                                        <Clock className="text-amber-600" size={24} />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white p-5 rounded-xl shadow-sm border">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Total Complete</p>
                                        <p className="text-3xl font-bold text-green-600 mt-2">
                                            {totals.totalComplete}
                                        </p>
                                    </div>
                                    <div className="p-3 bg-green-50 rounded-lg">
                                        <CheckCircle className="text-green-600" size={24} />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white p-5 rounded-xl shadow-sm border">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Overall Progress</p>
                                        <p className="text-3xl font-bold text-blue-600 mt-2">
                                            {historyData.length} Stages
                                        </p>
                                    </div>
                                    <div className="p-3 bg-blue-50 rounded-lg">
                                        <BarChart3 className="text-blue-600" size={24} />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white p-5 rounded-xl shadow-sm border">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Firm Pending</p>
                                        <p className="text-3xl font-bold text-purple-600 mt-2">
                                            {totals.totalPmpl + totals.totalPurab + totals.totalPmmpl + totals.totalRefrasynth}
                                        </p>
                                    </div>
                                    <div className="p-3 bg-purple-50 rounded-lg">
                                        <TrendingUp className="text-purple-600" size={24} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Firm-wise Breakdown */}
                        <div className="mb-8">
                            <h3 className="text-lg font-semibold mb-4 text-gray-800">Firm-wise Pending Breakdown</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
                                    <p className="text-sm font-medium text-gray-600">PMPL</p>
                                    <p className="text-2xl font-bold text-blue-700 mt-1">{totals.totalPmpl}</p>
                                </div>
                                <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
                                    <p className="text-sm font-medium text-gray-600">PURAB</p>
                                    <p className="text-2xl font-bold text-green-700 mt-1">{totals.totalPurab}</p>
                                </div>
                                <div className="bg-gradient-to-r from-amber-50 to-amber-100 p-4 rounded-lg border border-amber-200">
                                    <p className="text-sm font-medium text-gray-600">PMMPL</p>
                                    <p className="text-2xl font-bold text-amber-700 mt-1">{totals.totalPmmpl}</p>
                                </div>
                                <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
                                    <p className="text-sm font-medium text-gray-600">REFRASYNTH</p>
                                    <p className="text-2xl font-bold text-purple-700 mt-1">{totals.totalRefrasynth}</p>
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
                                                Stage-wise Status Report
                                            </h3>
                                            <p className="text-gray-600 text-sm">
                                                Detailed breakdown of pending and completed items by stage
                                            </p>
                                        </div>
                                        <div className="text-sm text-gray-500">
                                            Showing {historyData.length} stages
                                        </div>
                                    </div>
                                </div>
                                <div className="border rounded-lg overflow-hidden">
                                    <DataTable
                                        data={historyData}
                                        columns={historyColumns}
                                        searchFields={['stage', 'firmName', 'totalPending', 'totalComplete']}
                                        dataLoading={poMasterLoading}
                                        className="h-[60dvh]"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Legend */}
                        <div className="mt-6 flex flex-wrap gap-4 justify-center">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                <span className="text-sm text-gray-600">Pending Items</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                <span className="text-sm text-gray-600">Completed Items</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                                <span className="text-sm text-gray-600">Firm-wise Pending</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}