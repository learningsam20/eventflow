import React, { useRef, useState } from 'react'
import api from '../api/client'
import toast from 'react-hot-toast'

export default function MediaCapture({ eventId, onUploadSuccess }) {
  const fileInputRef = useRef(null)
  const [uploading, setUploading] = useState(false)

  const handleFileChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file')
      return
    }

    const formData = new FormData()
    formData.append('file', file)
    formData.append('event_id', eventId)
    formData.append('media_type', 'fan_photo')
    formData.append('caption', 'Fan shot from the event')

    setUploading(true)
    const toastId = toast.loading('Uploading & Analyzing Moment...')

    try {
      const res = await api.post('/api/media/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      toast.success('Moment Captured! AI is narrating...', { id: toastId })
      if (onUploadSuccess) onUploadSuccess(res.data)
    } catch (err) {
      console.error(err)
      toast.error('Upload failed. Try again!', { id: toastId })
    } finally {
      setUploading(false)
    }
  }

  return (
    <>
      <input 
        type="file" 
        accept="image/*" 
        capture="environment"
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
      
      <button 
        className="fab-btn"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        title="Capture Moment"
      >
        <span style={{ fontSize: 24 }}>📸</span>
        {uploading && <div className="fab-spinner" />}
      </button>

      <style>{`
        .fab-btn {
          position: fixed;
          bottom: 30px;
          right: 30px;
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background: var(--primary);
          color: white;
          border: none;
          box-shadow: 0 8px 32px rgba(108, 99, 255, 0.4);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        .fab-btn:hover {
          transform: scale(1.1) rotate(5deg);
          box-shadow: 0 12px 40px rgba(108, 99, 255, 0.5);
        }
        .fab-btn:active {
          transform: scale(0.95);
        }
        .fab-btn:disabled {
          background: var(--bg-secondary);
          cursor: not-allowed;
        }
        .fab-spinner {
          position: absolute;
          inset: -4px;
          border: 4px solid transparent;
          border-top-color: var(--accent);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  )
}
