export const loader = () => { return new Response("Server is alive!", { status: 200 }); };
export const action = async ({ request }: any) => {
  // 1. اطبع أي حاجة أول ما الطلب يلمس السيرفر
  console.log("🚀 شوبيفاي خبط على الباب حالا!");

  try {
    const payload = await request.json();
    console.log("📦 البيانات اللي وصلت من شوبيفاي:", payload.name);

    // كود إرسال الـ Firebase اللي كتبناه قبل كدة...
    // (تأكد إنك واخد نسخة منه عشان ترجعه)
    
    return new Response(null, { status: 200 }); // لازم نرد بـ 200 عشان شوبيفاي ميزعلش
  } catch (err) {
    console.error("❌ حصل مشكلة في استلام البيانات:", err);
    return new Response(null, { status: 400 });
  }
};