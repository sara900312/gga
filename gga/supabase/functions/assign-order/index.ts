import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Read request body only once and store it
    let requestData
    try {
      requestData = await req.json()
    } catch (error) {
      console.error('Error reading request body:', error)
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid request body or body already read'
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      )
    }

    const { orderId, storeId } = requestData
    
    console.log('Assigning order:', orderId, 'to store:', storeId)
    
    if (!orderId || !storeId) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Order ID and Store ID are required' 
        }),
        { 
          status: 400,
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json' 
          } 
        }
      )
    }

    // Update order with assigned store and change status to assigned
    const { data, error } = await supabaseClient
      .from('orders')
      .update({ 
        assigned_store_id: storeId,
        status: 'assigned',
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)
      .select()

    if (error) {
      console.error('Error assigning order:', error)
      throw error
    }

    console.log('Order assigned successfully:', data)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Order assigned successfully',
        data 
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    )
  } catch (error) {
    console.error('Assignment error:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Internal server error' 
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
})
