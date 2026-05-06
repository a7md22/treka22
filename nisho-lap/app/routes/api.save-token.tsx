import { json, type ActionFunctionArgs } from "@remix-run/node";
import db from "../db.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  if (request.method !== "POST") return json({ message: "Method not allowed" }, { status: 405 });

  try {
    const { shop, token } = await request.json();

    if (!shop || !token) {
      return json({ message: "Missing data" }, { status: 400 });
    }

    // تحديث التوكن في الداتابيز للمحل ده
    await db.shop.updateMany({
      where: { shopUrl: shop }, // اتأكدنا إن الاسم shopUrl زي ما حلنا المشكلة اللي فاتت
      data: { firebaseToken: token }
    });

    console.log(`✅ تم تحديث التوكن لمحلي: ${shop}`);
    return json({ success: true });
  } catch (error) {
    return json({ success: false }, { status: 500 });
  }
};