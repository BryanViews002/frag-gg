import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupStorage() {
  console.log('Setting up storage buckets...');
  
  const buckets = ['avatars', 'banners'];
  
  for (const bucket of buckets) {
    const { data, error } = await supabase.storage.getBucket(bucket);
    if (error && error.message.includes('not found')) {
      console.log(`Bucket ${bucket} not found. Creating...`);
      const { data: createData, error: createError } = await supabase.storage.createBucket(bucket, {
        public: true,
        fileSizeLimit: 5242880, // 5MB
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
      });
      if (createError) {
        console.error(`Error creating ${bucket}:`, createError);
      } else {
        console.log(`Bucket ${bucket} created!`);
      }
    } else if (error) {
      console.error(`Error checking ${bucket}:`, error);
    } else {
      console.log(`Bucket ${bucket} already exists.`);
      // Update it to be public
      await supabase.storage.updateBucket(bucket, {
        public: true,
        fileSizeLimit: 10485760, // 10MB
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
      });
    }
  }
  console.log('Done.');
}

setupStorage();
