import AdminLayout from "@/components/admin/AdminLayout";
import prisma from "@/lib/prisma";
import { User, Mail, Phone, Shield, MoreVertical } from "lucide-react";

export default async function AdminUsersPage() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' }
  });

  return (
    <AdminLayout>
      <div className="mb-10">
        <h1 className="text-4xl font-black text-oxford tracking-tight">Usuarios</h1>
        <p className="text-gray-400 font-medium mt-1">Gestiona los permisos y perfiles de NexCommerce.</p>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Usuario</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Contacto</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Rol</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Registro</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-almond rounded-xl flex items-center justify-center text-purple font-black shadow-sm">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-oxford">{user.name}</p>
                        <p className="text-[10px] text-gray-400 font-medium font-mono">ID: {user.id.slice(-8)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-sm">
                    <div className="flex flex-col gap-1">
                      {user.email && (
                        <div className="flex items-center gap-2 text-gray-500">
                          <Mail className="h-3.5 w-3.5" />
                          {user.email}
                        </div>
                      )}
                      {user.phone && (
                        <div className="flex items-center gap-2 text-gray-500">
                          <Phone className="h-3.5 w-3.5" />
                          {user.phone}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black tracking-wider uppercase ${
                      user.role === 'ADMIN' ? 'bg-purple/10 text-purple' : 'bg-blue-50 text-blue-600'
                    }`}>
                      <Shield className="h-3 w-3" />
                      {user.role}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-sm text-gray-400 font-medium">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-8 py-6 text-right">
                    <button aria-label="Más opciones" className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-400">
                      <MoreVertical className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
