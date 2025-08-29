import { supabase } from '../lib/supabase'

export async function testGalleryUpload() {
  console.log('Testing gallery upload functionality...')
  
  try {
    // Test 1: Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      console.error('❌ Authentication failed:', authError)
      return { success: false, error: 'User not authenticated' }
    }
    console.log('✅ User authenticated:', user.id)

    // Test 2: Check if profile exists
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    
    if (profileError || !profile) {
      console.error('❌ Profile not found:', profileError)
      return { success: false, error: 'User profile not found' }
    }
    console.log('✅ Profile found:', profile.current_team)

    // Test 3: Check storage bucket
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets()
    if (bucketError) {
      console.error('❌ Failed to list buckets:', bucketError)
      return { success: false, error: 'Failed to access storage' }
    }
    
    const galleryBucket = buckets?.find(bucket => bucket.name === 'gallery-photos')
    if (!galleryBucket) {
      console.error('❌ Gallery bucket not found')
      return { success: false, error: 'Gallery storage bucket does not exist' }
    }
    console.log('✅ Gallery bucket found:', galleryBucket.name)

    // Test 4: Check database permissions
    const { data: testInsert, error: insertError } = await supabase
      .from('gallery_photos')
      .insert({
        user_id: user.id,
        team_id: profile.current_team,
        image_url: 'test-url',
        storage_path: 'test-path',
        caption: 'Test upload'
      })
      .select()
      .single()

    if (insertError) {
      console.error('❌ Database insert test failed:', insertError)
      return { success: false, error: `Database insert failed: ${insertError.message}` }
    }
    console.log('✅ Database insert test successful')

    // Clean up test record
    await supabase
      .from('gallery_photos')
      .delete()
      .eq('id', testInsert.id)

    console.log('✅ Gallery upload test completed successfully')
    return { success: true }
  } catch (error) {
    console.error('❌ Test failed with error:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

export function logGalleryUploadDebug() {
  console.log('=== Gallery Upload Debug Info ===')
  console.log('Current time:', new Date().toISOString())
  console.log('User agent:', navigator.userAgent)
  console.log('Online status:', navigator.onLine)
  console.log('Storage quota:', navigator.storage ? 'Available' : 'Not available')
  console.log('================================')
}
