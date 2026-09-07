import { requireAuth } from "@/utils/serverAuth";

export default async function AdminPage() {
    // Esto se ejecuta en el servidor. Si no hay token o no es admin,
    // redirigirá instantáneamente a /login sin enviar HTML al navegador.
    // ¡Cero parpadeos garantizado!
    const user = await requireAuth(['ADMIN']);

    return (
        <div className="min-h-screen bg-zinc-950 text-white p-8">
            <h1 className="text-3xl font-bold text-emerald-500 mb-4">Admin Dashboard</h1>
            <p>Bienvenido, admin {user.email || 'usuario'}. Solo tú puedes ver esto.</p>
        </div>
    );
}