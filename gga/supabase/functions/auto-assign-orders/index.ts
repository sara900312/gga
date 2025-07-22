import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Read request body safely (might be empty for this function)
    let requestData = {}
    try {
      if (req.body) {
        requestData = await req.json()
      }
    } catch (error) {
      console.log('No body to read or body already read, proceeding with empty data')
      requestData = {}
    }

    console.log('Auto-assign function called')

    // Check if auto-assignment is enabled
    const { data: settingsData, error: settingsError } = await supabase
      .from('settings')
      .select('key_value')
      .eq('key_name', 'auto_assign_orders')
      .single()

    if (settingsError || settingsData?.key_value !== 'true') {
      console.log('Auto-assignment is disabled')
      return new Response(
        JSON.stringify({ success: false, message: 'Auto-assignment is disabled' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    }

    // Get pending orders
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .is('assigned_store_id', null)
      .eq('status', 'pending')

    if (ordersError) {
      console.error('Error fetching pending orders:', ordersError)
      throw ordersError
    }

    console.log(`Found ${orders?.length || 0} pending orders`)

    // Get all stores
    const { data: stores, error: storesError } = await supabase
      .from('stores')
      .select('*')

    if (storesError) {
      console.error('Error fetching stores:', storesError)
      throw storesError
    }

    console.log(`Found ${stores?.length || 0} stores`)

    let assignedCount = 0

    // Process each order
    for (const order of orders || []) {
      if (!order.main_store_name) continue

      // Find matching store by name
      const matchingStore = stores?.find(store => 
        store.name.toLowerCase() === order.main_store_name.toLowerCase()
      )

      if (matchingStore) {
        console.log(`Assigning order ${order.id} to store ${matchingStore.name}`)
        
        // Update the order with assigned store
        const { error: updateError } = await supabase
          .from('orders')
          .update({
            assigned_store_id: matchingStore.id,
            status: 'assigned',
            updated_at: new Date().toISOString()
          })
          .eq('id', order.id)

        if (updateError) {
          console.error(`Error assigning order ${order.id}:`, updateError)
          continue
        }

        assignedCount++
      } else {
        console.log(`No matching store found for: ${order.main_store_name}`)
      }
    }

    console.log(`Successfully assigned ${assignedCount} orders`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Successfully assigned ${assignedCount} orders`,
        assignedCount 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error in auto-assign function:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})
