import { NextResponse } from "next/server";
import { getAdminPocketBase } from "@/lib/admin";

export async function GET() {
    try {
        const pb = await getAdminPocketBase();
        // Return all rates, sorted by updated time
        const records = await pb.collection("exchange_rates").getFullList({
            sort: "-updated",
        });

        // Map to simple format expected by UI
        const rates = records.map((r: any) => ({
            id: r.id,
            from: r.baseCurrency,
            to: r.targetCurrency,
            rate: r.rate,
            updated: r.updated,
            active: r.active
        }));

        return NextResponse.json(rates);
    } catch (error) {
        console.error("Error fetching admin rates:", error);
        return NextResponse.json({ error: "Failed to fetch rates" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const pb = await getAdminPocketBase();
        const body = await req.json();

        // Validate body
        if (!body.from || !body.to || !body.rate) {
            return NextResponse.json({ error: "Missing fields (from, to, rate)" }, { status: 400 });
        }

        // Check if one already exists for this pair and update it or create new?
        // User wants to create defaults.
        // Let's check for existing first to avoid duplicates if that's preferred, 
        // or just create new. The UI logic suggests creating defaults.
        // We'll update if exists, or create if not.

        const existing = await pb.collection("exchange_rates").getList(1, 1, {
            filter: `baseCurrency = "${body.from}" && targetCurrency = "${body.to}"`
        });

        let record;
        if (existing.items.length > 0) {
            record = await pb.collection("exchange_rates").update(existing.items[0].id, {
                rate: body.rate,
                active: true
            });
        } else {
            record = await pb.collection("exchange_rates").create({
                baseCurrency: body.from,
                targetCurrency: body.to,
                rate: body.rate,
                active: true
            });
        }

        return NextResponse.json({
            id: record.id,
            from: record.baseCurrency,
            to: record.targetCurrency,
            rate: record.rate,
            updated: record.updated
        });
    } catch (error) {
        console.error("Error creating/updating rate:", error);
        return NextResponse.json({ error: "Failed to create rate" }, { status: 500 });
    }
}
