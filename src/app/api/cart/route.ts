import { initPocketBase } from "@/lib/pocketbase";
import { NextResponse } from "next/server";
import { type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
    const pb = await initPocketBase(request);

    if (!pb.authStore.isValid) {
        return NextResponse.json({ items: [] });
    }

    try {
        const userId = pb.authStore.model?.id;
        // Find the user's active cart. If not found, return empty.
        // Based on schema, we have a 'cart' collection.
        // It seems 'cart' collection items are individual cart entries? 
        // Looking at schema: 'cart' has 'user', 'product', 'quantity'.
        // Yes, 'cart' is a collection of cart items.

        const records = await pb.collection('cart').getFullList({
            filter: `user = "${userId}"`,
            expand: 'product',
            sort: '-created'
        });

        const items = records.map(record => {
            const product = record.expand?.product;
            const images = product?.images ? product.images.map((filename: string) =>
                pb.files.getUrl(product, filename)
            ) : [];

            return {
                id: product?.id, // Use product ID as cart item ID for frontend consistency? 
                // Or use record.id? Store uses product ID usually. 
                // Let's check store: store uses item.id. 
                // If we use product ID, we need to map it back to record ID for updates.
                // Actually, the store seems to assume item.id is the product ID (based on ProductCard used in Catalog).
                productId: product?.id,
                cartItemId: record.id,
                name: product?.name,
                price: product?.price,
                quantity: record.quantity,
                stock: product?.stock,
                isPreorder: product?.isPreorder,
                image: images[0] || ''
            };
        });

        return NextResponse.json({ items });
    } catch (error) {
        console.error("Error fetching cart:", error);
        return NextResponse.json({ error: "Error fetching cart" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    const pb = await initPocketBase(request);

    if (!pb.authStore.isValid) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { productId, quantity } = body;
        const userId = pb.authStore.model?.id;

        if (!productId || !userId) {
            return NextResponse.json({ error: "Product ID and valid session required" }, { status: 400 });
        }

        // Check if item already exists in cart
        try {
            const existingItems = await pb.collection('cart').getList(1, 1, {
                filter: `user = "${userId}" && product = "${productId}"`
            });

            if (existingItems.items.length > 0) {
                // Update quantity
                const item = existingItems.items[0];
                const newQuantity = (item.quantity || 0) + quantity;
                await pb.collection('cart').update(item.id, { quantity: newQuantity });
                return NextResponse.json({ success: true, action: 'updated', id: item.id });
            }
        } catch (existingError: any) {
            console.warn("Cart check failed (will try creating):", existingError.message);
        }

        // Create new item
        try {
            const newItem = await pb.collection('cart').create({
                user: userId,
                product: productId,
                quantity: quantity
            });
            return NextResponse.json({ success: true, action: 'created', id: newItem.id });
        } catch (createError: any) {
            console.error("PB Cart Creation Error:", createError.data || createError.message);
            return NextResponse.json({ error: `Failed to create cart item: ${createError.message}` }, { status: 500 });
        }

    } catch (error: any) {
        console.error("Cart sync POST error:", error);
        return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    const pb = await initPocketBase(request);

    if (!pb.authStore.isValid) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { productId, quantity } = body;
        const userId = pb.authStore.model?.id;

        if (!productId || !userId) {
            return NextResponse.json({ error: "Product ID and valid session required" }, { status: 400 });
        }

        // Find cart item by product and user
        const existingItems = await pb.collection('cart').getList(1, 1, {
            filter: `user = "${userId}" && product = "${productId}"`
        });

        if (existingItems.items.length === 0) {
            return NextResponse.json({ error: "Item not found in cart" }, { status: 404 });
        }

        const item = existingItems.items[0];
        await pb.collection('cart').update(item.id, { quantity });

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error("Cart sync PUT error:", error);
        return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    const pb = await initPocketBase(request);

    if (!pb.authStore.isValid) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const url = new URL(request.url);
        const productId = url.searchParams.get('productId');
        const userId = pb.authStore.model?.id;

        if (!productId || !userId) {
            return NextResponse.json({ error: "Product ID required" }, { status: 400 });
        }

        // Find cart item by product and user
        const existingItems = await pb.collection('cart').getList(1, 1, {
            filter: `user = "${userId}" && product = "${productId}"`
        });

        if (existingItems.items.length > 0) {
            const item = existingItems.items[0];
            await pb.collection('cart').delete(item.id);
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error("Cart sync DELETE error:", error);
        return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
    }
}
