import AdminLayout from "@/components/admin/AdminLayout";
import { getAdminPocketBase } from "@/lib/admin";
import { Bell, Package, User, Clock } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function AdminNotificationsPage() {
  const pb = await getAdminPocketBase();

  // Fetch stock requests using PocketBase
  const stockRequestsRecords = await pb.collection("stock_requests").getFullList({
    sort: "-created",
    expand: "user,product",
  });

  const stockRequests = stockRequestsRecords.map((r) => ({
    id: r.id,
    user: r.expand?.user || { name: "Anónimo" },
    product: r.expand?.product || { name: "Producto desconocido" },
    status: r.status,
    createdAt: r.created,
  }));

  // Fetch stock alerts using PocketBase
  const stockAlertsRecords = await pb.collection("stock_alerts").getFullList({
    sort: "-created",
    expand: "product",
  });

  const stockAlerts = stockAlertsRecords.map((r) => ({
    id: r.id,
    product: r.expand?.product || { name: "Producto desconocido" },
    email: r.email,
    phone: r.phone,
    createdAt: r.created,
  }));

  return (
    <AdminLayout>
      <div className="mb-10">
        <h1 className="text-4xl font-black text-oxford tracking-tight">Notificaciones</h1>
        <p className="text-gray-400 font-medium mt-1">Alertas de stock y solicitudes de clientes.</p>
      </div>

      <div className="space-y-12">
        {/* Stock Requests Section */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <User className="h-6 w-6 text-purple" />
            <h2 className="text-2xl font-bold text-oxford">Solicitudes de Clientes</h2>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {stockRequests.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-gray-100">
                <p className="text-gray-400 font-medium">No hay solicitudes pendientes.</p>
              </div>
            ) : (
              stockRequests.map((req) => (
                <div key={req.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-purple/10 text-purple rounded-xl flex items-center justify-center font-black">
                      {req.user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-oxford">
                        {req.user.name} <span className="text-gray-400 font-medium text-xs ml-2">está interesado en:</span>
                      </p>
                      <p className="text-lg font-black text-purple">{req.product.name}</p>
                    </div>
                  </div>

                  <div className="flex flex-col md:items-end gap-1">
                    <div className="flex items-center gap-2 text-gray-400 text-xs font-bold">
                      <Clock className="h-3.5 w-3.5" />
                      {new Date(req.createdAt).toLocaleString()}
                    </div>
                    <p className="text-xs font-bold text-gray-500 bg-gray-100 px-3 py-1 rounded-full w-fit">
                      Estado: {req.status}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button className="bg-purple text-white px-4 py-2 rounded-xl text-xs font-bold hover:scale-105 transition-transform active:scale-95 shadow-lg shadow-purple/10">
                      Atender
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Guest Stock Alerts Section */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <Bell className="h-6 w-6 text-blue-500" />
            <h2 className="text-2xl font-bold text-oxford">Alertas de Stock (Invitados)</h2>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100">
                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Producto</th>
                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Contacto</th>
                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Fecha</th>
                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {stockAlerts.map((alert) => (
                    <tr key={alert.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                          <Package className="h-5 w-5 text-gray-300" />
                          <span className="font-bold text-oxford">{alert.product.name}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-sm text-gray-500 font-medium">
                        {alert.email || alert.phone}
                      </td>
                      <td className="px-8 py-6 text-xs text-gray-400 font-bold">
                        {new Date(alert.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-8 py-6 text-right">
                        <button className="text-blue-500 hover:text-blue-700 font-bold text-xs uppercase tracking-widest">
                          Notificar
                        </button>
                      </td>
                    </tr>
                  ))}
                  {stockAlerts.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-8 py-12 text-center text-gray-400">
                        No hay alertas de stock para invitados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </AdminLayout>
  );
}
