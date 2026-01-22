import { NextRequest, NextResponse } from "next/server";
import { initPocketBase } from "@/lib/pocketbase";

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const pb = await initPocketBase(req);

        // RBAC: Only ADMIN can update exchange rates
        if (!pb.authStore.isValid || (pb.authStore.model as any).role !== 'ADMIN') {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const record = await pb.collection("exchange_rates").update(id, body);
        
        return NextResponse.json(record);
    } catch (err: any) {
        console.error("UPDATE_EXCHANGE_RATE_ERROR:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const pb = await initPocketBase(req);

        // RBAC: Only ADMIN can delete exchange rates
        if (!pb.authStore.isValid || (pb.authStore.model as any).role !== 'ADMIN') {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await pb.collection("exchange_rates").delete(id);
        return new NextResponse(null, { status: 204 });
    } catch (err: any) {
        console.error("DELETE_EXCHANGE_RATE_ERROR:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
