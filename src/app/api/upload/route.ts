import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const { fileName, fileType } = await request.json();

  if (!fileName || !fileType) {
    return new NextResponse(JSON.stringify({ error: 'File name and type are required' }), { status: 400 });
  }

  // Generate a unique path for the file
  const filePath = `public/${user.id}/${uuidv4()}-${fileName}`;

  const { data, error } = await supabase.storage
    .from('post_images')
    .createSignedUploadUrl(filePath);

  if (error) {
    return new NextResponse(JSON.stringify({ error: error.message }), { status: 500 });
  }

  return NextResponse.json(data);
}