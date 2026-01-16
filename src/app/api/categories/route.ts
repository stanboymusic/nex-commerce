import { initPocketBase } from "@/lib/pocketbase";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    try {
        const pb = await initPocketBase(req);
        const userId = pb.authStore.model?.id;

        if (!userId) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const records = await pb.collection('categories').getFullList({
            sort: 'name',
            filter: `user = "${userId}"`,
            requestKey: null
        });

        const categories = records.map(record => ({
            id: record.id,
            name: record.name,
        }));

        return NextResponse.json(categories);
    } catch (error: any) {
        console.error("Error fetching categories:", error);
        return NextResponse.json({ error: "Error al obtener categorías" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const pb = await initPocketBase(req);
        const userId = pb.authStore.model?.id;

        if (!userId) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const data = await req.json();

        if (!data.name) {
            return NextResponse.json({ error: "El nombre es obligatorio" }, { status: 400 });
        }

        const record = await pb.collection('categories').create({
            name: data.name,
            user: userId
        });

        return NextResponse.json({
            id: record.id,
            name: record.name
        });
    } catch (error: any) {
        console.error("Error creating category:", error);
        return NextResponse.json({ error: error.message || "Error al crear categoría" }, { status: 500 });
    }
}
