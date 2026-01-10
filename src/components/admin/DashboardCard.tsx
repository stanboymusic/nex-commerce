interface DashboardCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: string;
}

export default function DashboardCard({ title, value, icon, trend, color = "bg-purple" }: DashboardCardProps) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center gap-6 group hover:shadow-md transition-shadow">
      <div className={`w-14 h-14 ${color} rounded-2xl flex items-center justify-center text-white shadow-lg shadow-purple/10 group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
      
      <div className="flex-1">
        <p className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-1">{title}</p>
        <div className="flex items-end gap-3">
          <h3 className="text-3xl font-black text-oxford tracking-tight">{value}</h3>
          {trend && (
            <span className={`text-xs font-bold mb-1.5 ${trend.isPositive ? 'text-green-500' : 'text-red-500'}`}>
              {trend.isPositive ? '+' : '-'}{trend.value}%
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
