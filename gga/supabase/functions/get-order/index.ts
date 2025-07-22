import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

// إنشاء عميل Supabase بصلاحيات إدارية
const supabaseAdmin = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
})

serve(async (req) => {
  const { orderId } = await req.json()

  // التحقق من وجود معرف الطلب
  if (!orderId) {
    return new Response(JSON.stringify({ error: 'Order ID is required' }), {
      headers: { 'Content-Type': 'application/json' },
      status: 400,
    })
  }

  try {
    // جلب بيانات الطلب مع تفاصيل المنتجات والمتجر في استعلام واحد
    const { data: orderData, error: orderError } = await supabaseAdmin
      .from('orders')
      .select(`
        id,
        order_number,
        total,
        status,
        created_at,
        customer_name,
        customer_phone,
        customer_email,
        delivery_address:delivery_address_id(id, address_line1, city, state, country, postal_code),
        store:assigned_store(id, name, contact_phone, address:store_address_id(id, address_line1, city, state, country, postal_code)),
        order_items(
          id,
          quantity,
          product:product_id(
            id, 
            name, 
            price, 
            discounted_price,
            main_store_name
          )
        )
      `)
      .eq('id', orderId)
      .single()

    if (orderError) {
      console.error('Error fetching order:', orderError.message)
      throw orderError
    }

    // إرجاع البيانات كاستجابة ناجحة
    return new Response(JSON.stringify({
      success: true,
      order: orderData
    }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    })
    
  } catch (error) {
    // معالجة الأخطاء
    console.error('Server error:', error.message)
    return new Response(JSON.stringify({ 
      error: 'Failed to fetch order details',
      details: error.message 
    }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
