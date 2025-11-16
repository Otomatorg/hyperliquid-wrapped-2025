import { api } from '@/lib/axios'

interface UploadResponse {
  url: string
  key: string
}

/**
 * Upload image to S3
 * This assumes you have a backend API endpoint that handles S3 uploads
 * The endpoint should accept a file and return the S3 URL
 */
export const uploadImageToS3 = async (file: File): Promise<string> => {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('type', 'image/png')

  const response = await api.post<UploadResponse>('/upload/image', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })

  return response.data.url
}

/**
 * Get presigned URL for S3 upload
 * Alternative approach: get presigned URL from backend, then upload directly to S3
 */
export const getPresignedUrl = async (fileName: string, fileType: string): Promise<{ url: string; uploadUrl: string }> => {
  const response = await api.post<{ url: string; uploadUrl: string }>('/upload/presigned-url', {
    fileName,
    fileType,
  })

  return response.data
}

/**
 * Upload file to S3 using presigned URL
 */
export const uploadToPresignedUrl = async (presignedUrl: string, file: File): Promise<void> => {
  await fetch(presignedUrl, {
    method: 'PUT',
    body: file,
    headers: {
      'Content-Type': file.type,
    },
  })
}
