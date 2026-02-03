"use server";

import { getAdminPB } from "@/lib/pb-admin";
import { revalidatePath } from "next/cache";

export async function getProducts() {
    try {
        const pb = await getAdminPB();
        const records = await pb.collection("products").getFullList({
            sort: "-created",
            expand: "category"
        });

        return records.map(r => ({
            id: r.id,
            name: r.name,
            price: r.price,
            stock: r.stock,
            category: r.category,
            categoryName: r.expand?.category?.name || "S/N",
            isPreorder: r.isPreorder,
            estimatedArrivalDate: r.estimatedArrivalDate,
            description: r.description,
            image: r.image,
            images: r.images,
            created: r.created
        }));
    } catch (error) {
        console.error("Error fetching products:", error);
        return [];
    }
}

export async function saveProduct(formData: FormData) {
    try {
        const pb = await getAdminPB();
        const id = formData.get("id") as string;
        // PB does not accept "id" as an updatable field
        formData.delete("id");

        // Remove ID from formData before sending to PB if we are creating
        if (!id) {
            await pb.collection("products").create(formData);
        } else {
            await pb.collection("products").update(id, formData);
        }

        revalidatePath("/(admin)/products");
        return { success: true };
    } catch (error: any) {
        const details = error?.data || error?.response?.data;
        console.error("Error saving product:", details || error);
        return { success: false, error: details?.message || error.message, details };
    }
}

export async function deleteProduct(id: string) {
    try {
        const pb = await getAdminPB();
        await pb.collection("products").delete(id);
        revalidatePath("/(admin)/products");
        return { success: true };
    } catch (error: any) {
        console.error("Error deleting product:", error);
        return { success: false, error: error.message };
    }
}

export async function getCategories() {
    try {
        const pb = await getAdminPB();
        const records = await pb.collection("categories").getFullList({ sort: "name" });
        return records.map(r => ({ id: r.id, name: r.name }));
    } catch (error) {
        console.error("Error fetching categories:", error);
        return [];
    }
}
