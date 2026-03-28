import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://cxlgykkjpbytonkxmoir.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4bGd5a2tqcGJ5dG9ua3htb2lyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3MTAzNzgsImV4cCI6MjA4OTI4NjM3OH0.84J_V8hgy9gazfsNEGbZ2qOPUos-y_4QVZdWF7n39rc'

export const supabase = createClient(supabaseUrl, supabaseKey, {
  global: {
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
    },
  },
})