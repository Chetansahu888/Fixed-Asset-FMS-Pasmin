import Heading from '../element/Heading';
import {
    CalendarIcon,
    ClipboardList,
    LayoutDashboard,
    PackageCheck,
    Truck,
    Warehouse,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { ChartContainer, ChartTooltip, type ChartConfig } from '../ui/chart';
import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from 'recharts';
import { useEffect, useState } from 'react';
import { useSheets } from '@/context/SheetsContext';
import DataTable from '../element/DataTable';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Button } from '../ui/button';
import { format } from 'date-fns';
import { Calendar } from '../ui/calendar';
import { ComboBox } from '../ui/combobox';
import { analyzeData } from '@/lib/filter';

function CustomChartTooltipContent({
    payload,
    label,
}: {
    payload?: { payload: { quantity: number; frequency: number } }[];
    label?: string;
}) {
    if (!payload?.length) return null;

    const data = payload[0].payload;

    return (
        <div className="rounded-lg border-2 border-gray-200 bg-white px-4 py-3 shadow-xl text-sm font-medium">
            <p className="font-bold text-gray-900 mb-2">{label}</p>
            <p className="text-blue-600">Quantity: {data.quantity}</p>
            <p className="text-green-600">Frequency: {data.frequency}</p>
        </div>
    );
}

export default function UsersTable() {
    const { receivedSheet, indentSheet, inventorySheet, inventoryLoading } = useSheets();
    const [chartData, setChartData] = useState<
        {
            name: string;
            quantity: number;
            frequency: number;
        }[]
    >([]);
    const [topVendorsData, setTopVendors] = useState<
        {
            name: string;
            orders: number;
            quantity: number;
        }[]
    >([]);

    // Items
    const [indent, setIndent] = useState({ count: 0, quantity: 0 });
    const [purchase, setPurchase] = useState({ count: 0, quantity: 0 });
    const [out, setOut] = useState({ count: 0, quantity: 0 });
    const [alerts, setAlerts] = useState({ lowStock: 0, outOfStock: 0 });

    const [startDate, setStartDate] = useState<Date>();
    const [endDate, setEndDate] = useState<Date>();
    const [filteredVendors, setFilteredVendors] = useState<string[]>([]);
    const [filteredProducts, setFilteredProducts] = useState<string[]>([]);
    const [allVendors, setAllVendors] = useState<string[]>([]);
    const [allProducts, setAllProducts] = useState<string[]>([]);

    useEffect(() => {
        setAllVendors(Array.from(new Set(indentSheet.map((item) => item.approvedVendorName))));
        setAllProducts(Array.from(new Set(indentSheet.map((item) => item.productName))));
        const {
            topVendors,
            topProducts,
            issuedIndentCount,
            approvedIndentCount,
            totalIssuedQuantity,
            receivedPurchaseCount,
            totalApprovedQuantity,
            totalPurchasedQuantity,
        } = analyzeData(
            { receivedSheet, indentSheet },
            {
                startDate: startDate?.toISOString(),
                endDate: endDate?.toISOString(),
                vendors: filteredVendors,
                products: filteredProducts,
            }
        );

        setChartData(
            topProducts.map((p) => ({ frequency: p.freq, quantity: p.quantity, name: p.name }))
        );
        setTopVendors(topVendors);
        setIndent({ quantity: totalApprovedQuantity, count: approvedIndentCount });
        console.log(totalApprovedQuantity, approvedIndentCount);
        setPurchase({ quantity: totalPurchasedQuantity, count: receivedPurchaseCount });
        setOut({ quantity: totalIssuedQuantity, count: issuedIndentCount });
    }, [startDate, endDate, filteredProducts, filteredVendors, indentSheet, receivedSheet]);

    const chartConfig = {
        quantity: {
            label: 'Quantity',
            color: 'var(--color-primary)',
        },
    } satisfies ChartConfig;
    
    return (
        <div className="bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen p-6">
            <Heading heading="Dashboard" subtext="View your analytics and insights">
                <LayoutDashboard size={50} className="text-blue-600" />
            </Heading>

            <div className="grid gap-6 mt-6">
                {/* Filter Section */}
                <div className="gap-4 grid grid-cols-2 md:grid-cols-4">
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                data-empty={!startDate}
                                className="data-[empty=true]:text-gray-500 w-full min-w-0 justify-start text-left font-semibold border-2 border-gray-300 rounded-xl py-6 bg-white hover:bg-blue-50 hover:border-blue-400 transition-colors"
                            >
                                <CalendarIcon className="text-blue-600 mr-2" />
                                {startDate ? (
                                    format(startDate, 'PPP')
                                ) : (
                                    <span className="text-gray-600">Pick a start date</span>
                                )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 border-2 border-gray-200 rounded-xl shadow-xl">
                            <Calendar mode="single" selected={startDate} onSelect={setStartDate} />
                        </PopoverContent>
                    </Popover>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                data-empty={!endDate}
                                className="data-[empty=true]:text-gray-500 w-full min-w-0 justify-start text-left font-semibold border-2 border-gray-300 rounded-xl py-6 bg-white hover:bg-green-50 hover:border-green-400 transition-colors"
                            >
                                <CalendarIcon className="text-green-600 mr-2" />
                                {endDate ? format(endDate, 'PPP') : <span className="text-gray-600">Pick a end date</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 border-2 border-gray-200 rounded-xl shadow-xl">
                            <Calendar mode="single" selected={endDate} onSelect={setEndDate} />
                        </PopoverContent>
                    </Popover>
                    <ComboBox
                        multiple
                        options={allVendors.map((v) => ({ label: v, value: v }))}
                        value={filteredVendors}
                        onChange={setFilteredVendors}
                        placeholder="Select Vendors"
                        // className="border-2 border-gray-300 rounded-xl bg-white"
                    />
                    <ComboBox
                        multiple
                        options={allProducts.map((v) => ({ label: v, value: v }))}
                        value={filteredProducts}
                        onChange={setFilteredProducts}
                        placeholder="Select Products"
                        // className="border-2 border-gray-300 rounded-xl bg-white"
                    />
                </div>

                {/* Stats Cards */}
                <div className="grid md:grid-cols-4 gap-4">
                    <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-xl rounded-2xl">
                        <CardContent className="p-6">
                            <div className="flex justify-between items-center mb-4">
                                <p className="font-bold text-lg">Total Approved Indents</p>
                                <ClipboardList size={24} className="text-blue-200" />
                            </div>
                            <p className="text-4xl font-black mb-2">{indent.count}</p>
                            <div className="flex justify-between items-center text-blue-100">
                                <p className="text-sm font-semibold">Indented Quantity</p>
                                <p className="font-bold">{indent.quantity}</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0 shadow-xl rounded-2xl">
                        <CardContent className="p-6">
                            <div className="flex justify-between items-center mb-4">
                                <p className="font-bold text-lg">Total Purchases</p>
                                <Truck size={24} className="text-green-200" />
                            </div>
                            <p className="text-4xl font-black mb-2">{purchase.count}</p>
                            <div className="flex justify-between items-center text-green-100">
                                <p className="text-sm font-semibold">Purchased Quantity</p>
                                <p className="font-bold">{purchase.quantity}</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0 shadow-xl rounded-2xl">
                        <CardContent className="p-6">
                            <div className="flex justify-between items-center mb-4">
                                <p className="font-bold text-lg">Total Issued</p>
                                <PackageCheck size={24} className="text-orange-200" />
                            </div>
                            <p className="text-4xl font-black mb-2">{out.count}</p>
                            <div className="flex justify-between items-center text-orange-100">
                                <p className="text-sm font-semibold">Out Quantity</p>
                                <p className="font-bold">{out.quantity}</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-xl rounded-2xl">
                        <CardContent className="p-6">
                            <div className="flex justify-between items-center mb-4">
                                <p className="font-bold text-lg">Stock Alerts</p>
                                <Warehouse size={24} className="text-purple-200" />
                            </div>
                            <p className="text-4xl font-black mb-2">{alerts.outOfStock}</p>
                            <div className="flex justify-between items-center text-purple-100">
                                <p className="text-sm font-semibold">Low in Stock</p>
                                <p className="font-bold">{alerts.lowStock}</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Charts Section */}
                <div className="flex gap-4 flex-wrap">
                    <Card className="w-[55%] md:min-w-150 flex-grow border-2 border-gray-200 shadow-xl rounded-2xl">
                        <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-t-2xl border-b-2 border-gray-200">
                            <CardTitle className="text-2xl font-bold text-gray-800">Top Purchased Products</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <ChartContainer className="max-h-80 w-full" config={chartConfig}>
                                <BarChart
                                    accessibilityLayer
                                    data={chartData}
                                    layout="vertical"
                                    margin={{
                                        right: 16,
                                    }}
                                >
                                    <defs>
                                        <linearGradient
                                            id="barGradient"
                                            x1="0"
                                            y1="0"
                                            x2="1"
                                            y2="0"
                                        >
                                            <stop offset="0%" stopColor="#3b82f6" /> {/* blue-500 */}
                                            <stop offset="100%" stopColor="#1d4ed8" /> {/* blue-700 */}
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid horizontal={false} stroke="#e5e7eb" />
                                    <YAxis
                                        dataKey="name"
                                        type="category"
                                        tickLine={false}
                                        tickMargin={10}
                                        axisLine={false}
                                        tickFormatter={(value: any) => value.slice(0, 3)}
                                        hide
                                    />
                                    <XAxis dataKey="frequency" type="number" hide />
                                    <ChartTooltip
                                        cursor={false}
                                        content={<CustomChartTooltipContent />}
                                    />
                                    <Bar
                                        dataKey="frequency"
                                        layout="vertical"
                                        fill="url(#barGradient)"
                                        radius={8}
                                    >
                                        <LabelList
                                            dataKey="name"
                                            position="insideLeft"
                                            offset={8}
                                            className="fill-white font-bold"
                                            fontSize={12}
                                        />
                                        <LabelList
                                            dataKey="frequency"
                                            position="insideRight"
                                            offset={8}
                                            className="fill-white font-bold"
                                            fontSize={12}
                                        />
                                    </Bar>
                                </BarChart>
                            </ChartContainer>
                        </CardContent>
                    </Card>
                    <Card className="flex-grow min-w-60 w-[40%] border-2 border-gray-200 shadow-xl rounded-2xl">
                        <CardHeader className="bg-gradient-to-r from-gray-50 to-green-50 rounded-t-2xl border-b-2 border-gray-200">
                            <CardTitle className="text-2xl font-bold text-gray-800">Top Vendors</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 text-base grid gap-4">
                            {topVendorsData.map((vendor, i) => (
                                <div className="flex justify-between items-center py-3 px-4 bg-white rounded-xl border-2 border-gray-100 shadow-sm hover:shadow-md transition-shadow" key={i}>
                                    <p className="font-bold text-gray-800 text-lg">{vendor.name}</p>
                                    <div className="flex gap-6">
                                        <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-lg font-bold text-sm">
                                            {vendor.orders} Orders
                                        </span>
                                        <span className="bg-green-100 text-green-800 px-3 py-1 rounded-lg font-bold text-sm">
                                            {vendor.quantity} Items
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}