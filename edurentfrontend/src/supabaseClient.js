import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://faeumfwnvnndehpdznch.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZhZXVtZndudm5uZGVocGR6bmNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEyMjgzNjMsImV4cCI6MjA3NjgwNDM2M30.-pgpkITg1CchJe-frVynXhAvHyb3mNsfRL0C_uVupgs'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)