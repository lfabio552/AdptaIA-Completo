import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://orxwfidvidpuksdfgeip.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9yeHdmaWR2aWRwdWtzZGZnZWlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM0OTAzNzEsImV4cCI6MjA3OTA2NjM3MX0.GllkQAAIGFNWNq9NPbvZq-9uNA2pBCjOyKD21hcM0wg'

export const supabase = createClient(supabaseUrl, supabaseKey)