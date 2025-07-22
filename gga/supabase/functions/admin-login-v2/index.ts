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

    const { email, password } = requestData
    
    console.log('Admin login attempt for:', email)
    
    // Fixed admin credentials
    const ADMIN_EMAIL = 'hetking12231@gmail.com'
    const ADMIN_PASSWORD = 'p0p0uopiy318'
    
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      console.log('Admin login successful')
      
      // Create Supabase client
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      const supabase = createClient(supabaseUrl, supabaseServiceKey)
      
      // Try to sign up/sign in the admin user
      let authResult = await supabase.auth.signUp({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
      })
      
      if (authResult.error && authResult.error.message === 'User already registered') {
        authResult = await supabase.auth.signInWithPassword({
          email: ADMIN_EMAIL,
          password: ADMIN_PASSWORD,
        })
      }
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Admin authenticated successfully',
          role: 'admin',
          session: authResult.data.session
        }),
        { 
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json' 
          } 
        }
      )
    } else {
      console.log('Admin login failed - invalid credentials')
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid admin credentials' 
        }),
        { 
          status: 401,
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json' 
          } 
        }
      )
    }
  } catch (error) {
    console.error('Admin login error:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Internal server error' 
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
