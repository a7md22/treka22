import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server"; // المكتبة الرسمية
import admin from "firebase-admin";
import serviceAccount from "../serviceAccountKey.json"; 
import db from "../db.server";

// تهيئة Firebase خارج الـ Action لمنع التكرار
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as any),
  });
}

export const action = async ({ request }: any) => {
  // 1. التحقق من صحة الطلب وأنه قادم من شوبيفاي (Security)
  // ستقوم هذه الدالة بالتحقق من الـ HMAC أوتوماتيكياً
  const { topic, shop, payload }: any = await authenticate.webhook(request);

  console.log(`🚀 تم استلام Webhook بنجاح من محل: ${shop} بخصوص: ${topic}`);

  try {
    // 2. معالجة البيانات بناءً على نوع الـ Webhook (كود نظيف)
    if (topic === "ORDERS_CREATE") {
      const firstName = String(payload.customer?.first_name ?? "").trim();
      const lastName = String(payload.customer?.last_name ?? "").trim();
      const fullName = `${firstName} ${lastName}`.trim();
      const customerName = payload.customer ? (fullName || "Guest Customer") : "Guest Customer";

      const amountValue = Number(payload.total_price ?? 0);
      const orderAmount = Number.isFinite(amountValue)
        ? new Intl.NumberFormat("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }).format(amountValue)
        : "0.00";

      // 3. البحث عن التوكن الخاص بهذا المحل تحديداً
      const shopData = await db.shop.findFirst({
        where: { shopUrl: shop }
      });

      if (shopData?.firebaseToken) {
        const message = {
          data: {
            orderNumber: String(payload.name),
            customer: String(customerName),
            amount: String(orderAmount),
            shopName: String(shop)
          },
          token: shopData.firebaseToken,
        };

        await admin.messaging().send(message);
        console.log("✅ إشعار أرسل بنجاح!");
      }
    }

    return new Response(null, { status: 200 });
  } catch (error) {
    console.error("❌ خطأ في معالجة الـ Webhook:", error);
    return json({ success: true, message: "Webhook received" }, { status: 200 });  }
};