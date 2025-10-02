"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useDropzone } from "react-dropzone"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { 
  Upload, 
  Image, 
  FileText, 
  X, 
  Check, 
  AlertCircle,
  Download,
  Eye
} from "lucide-react"

interface UploadedFile {
  id: string
  file: File
  preview: string
  progress: number
  status: "uploading" | "completed" | "error"
  url?: string
}

interface ImageUploadProps {
  onFilesUpload?: (files: UploadedFile[]) => void
  maxFiles?: number
  maxSize?: number // in bytes
  acceptedTypes?: string[]
  className?: string
  multiple?: boolean
  showPreview?: boolean
  uploadText?: string
}

export function ImageUpload({
  onFilesUpload,
  maxFiles = 5,
  maxSize = 5 * 1024 * 1024, // 5MB
  acceptedTypes = ["image/*"],
  className,
  multiple = true,
  showPreview = true,
  uploadText = "Drag & drop images here, or click to select"
}: ImageUploadProps) {
  const [uploadedFiles, setUploadedFiles] = React.useState<UploadedFile[]>([])

  const onDrop = React.useCallback((acceptedFiles: File[]) => {
    const newFiles: UploadedFile[] = acceptedFiles.map((file) => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      preview: URL.createObjectURL(file),
      progress: 0,
      status: "uploading" as const,
    }))

    setUploadedFiles(prev => [...prev, ...newFiles])
    
    // Simulate upload progress
    newFiles.forEach((uploadFile) => {
      simulateUpload(uploadFile.id)
    })

    onFilesUpload?.(newFiles)
  }, [onFilesUpload])

  const simulateUpload = (fileId: string) => {
    let progress = 0
    const interval = setInterval(() => {
      progress += Math.random() * 15
      if (progress >= 100) {
        progress = 100
        clearInterval(interval)
        setUploadedFiles(prev =>
          prev.map(file =>
            file.id === fileId
              ? { ...file, progress: 100, status: "completed", url: file.preview }
              : file
          )
        )
      } else {
        setUploadedFiles(prev =>
          prev.map(file =>
            file.id === fileId ? { ...file, progress } : file
          )
        )
      }
    }, 300)
  }

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => {
      const file = prev.find(f => f.id === fileId)
      if (file?.preview) {
        URL.revokeObjectURL(file.preview)
      }
      return prev.filter(f => f.id !== fileId)
    })
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedTypes.reduce((acc, type) => ({ ...acc, [type]: [] }), {}),
    maxFiles,
    maxSize,
    multiple,
  })

  return (
    <div className={cn("space-y-4", className)}>
      {/* Upload Zone */}
      <Card
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed transition-colors cursor-pointer hover:bg-muted/50",
          isDragActive ? "border-primary bg-primary/10" : "border-muted-foreground/25"
        )}
      >
        <CardContent className="flex flex-col items-center justify-center py-12 px-6 text-center">
          <input {...getInputProps()} data-testid="file-input" />
          <motion.div
            animate={isDragActive ? { scale: 1.05 } : { scale: 1 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Upload className="w-8 h-8 text-primary" />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">
                {uploadText}
              </p>
              <p className="text-xs text-muted-foreground">
                PNG, JPG, GIF up to {Math.floor(maxSize / 1024 / 1024)}MB
              </p>
            </div>
          </motion.div>
        </CardContent>
      </Card>

      {/* File Preview Grid */}
      {showPreview && uploadedFiles.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <AnimatePresence>
            {uploadedFiles.map((file) => (
              <motion.div
                key={file.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
              >
                <FilePreviewCard 
                  file={file} 
                  onRemove={() => removeFile(file.id)}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}

interface FilePreviewCardProps {
  file: UploadedFile
  onRemove: () => void
}

function FilePreviewCard({ file, onRemove }: FilePreviewCardProps) {
  const isImage = file.file.type.startsWith("image/")

  return (
    <Card className="relative group overflow-hidden">
      <div className="aspect-square relative">
        {isImage ? (
          <img
            src={file.preview}
            alt={file.file.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <FileText className="w-8 h-8 text-muted-foreground" />
          </div>
        )}
        
        {/* Status Overlay */}
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex space-x-2">
            {file.status === "completed" && file.url && (
              <Button
                size="sm"
                variant="secondary"
                onClick={(e) => {
                  e.stopPropagation()
                  window.open(file.url, '_blank')
                }}
                data-testid={`button-view-${file.id}`}
              >
                <Eye className="w-4 h-4" />
              </Button>
            )}
            <Button
              size="sm"
              variant="destructive"
              onClick={(e) => {
                e.stopPropagation()
                onRemove()
              }}
              data-testid={`button-remove-${file.id}`}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Progress Bar */}
        {file.status === "uploading" && (
          <div className="absolute bottom-0 left-0 right-0 p-2">
            <Progress value={file.progress} className="h-1" />
          </div>
        )}

        {/* Status Badge */}
        <div className="absolute top-2 right-2">
          {file.status === "completed" && (
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              <Check className="w-3 h-3 mr-1" />
              Done
            </Badge>
          )}
          {file.status === "error" && (
            <Badge variant="destructive">
              <AlertCircle className="w-3 h-3 mr-1" />
              Error
            </Badge>
          )}
          {file.status === "uploading" && (
            <Badge variant="secondary">
              <Upload className="w-3 h-3 mr-1 animate-pulse" />
              {Math.round(file.progress)}%
            </Badge>
          )}
        </div>
      </div>

      {/* File Info */}
      <CardContent className="p-3">
        <div className="space-y-1">
          <p className="text-sm font-medium truncate" title={file.file.name}>
            {file.file.name}
          </p>
          <p className="text-xs text-muted-foreground">
            {(file.file.size / 1024).toFixed(1)} KB
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

// Bulk image operations component
interface BulkImageActionsProps {
  files: UploadedFile[]
  onDownloadAll?: () => void
  onRemoveAll?: () => void
  onSelectAll?: () => void
  className?: string
}

export function BulkImageActions({
  files,
  onDownloadAll,
  onRemoveAll,
  onSelectAll,
  className
}: BulkImageActionsProps) {
  const completedFiles = files.filter(f => f.status === "completed")

  return (
    <div className={cn("flex items-center space-x-2", className)}>
      <Button
        variant="outline"
        size="sm"
        onClick={onSelectAll}
        disabled={files.length === 0}
      >
        Select All ({files.length})
      </Button>
      
      <Button
        variant="outline"
        size="sm"
        onClick={onDownloadAll}
        disabled={completedFiles.length === 0}
      >
        <Download className="w-4 h-4 mr-2" />
        Download All ({completedFiles.length})
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={onRemoveAll}
        disabled={files.length === 0}
      >
        <X className="w-4 h-4 mr-2" />
        Remove All
      </Button>
    </div>
  )
}