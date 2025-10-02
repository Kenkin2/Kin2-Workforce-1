import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useCameraFeatures, useHapticFeedback } from '@/hooks/useMobileFeatures';
import { Camera, CameraOff, SwitchCamera, Download, X, CheckCircle } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface CameraCaptureProps {
  onPhotoCapture?: (blob: Blob) => void;
  jobId?: string;
  shiftId?: string;
}

export function CameraCapture({ onPhotoCapture, jobId, shiftId }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  
  const {
    isOpen: cameraIsOpen,
    stream,
    isSupported,
    facingMode,
    openCamera,
    closeCamera,
    capturePhoto,
    switchCamera,
  } = useCameraFeatures();

  const { lightTap, success } = useHapticFeedback();

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.play();
    }
  }, [stream]);

  useEffect(() => {
    if (!isOpen) {
      closeCamera();
      setCapturedImage(null);
      setCapturedBlob(null);
    }
  }, [isOpen, closeCamera]);

  const uploadPhotoMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const endpoint = jobId 
        ? `/api/jobs/${jobId}/photo`
        : shiftId 
        ? `/api/shifts/${shiftId}/photo`
        : '/api/mobile/photo';
      
      return apiRequest('POST', endpoint, formData);
    },
    onSuccess: () => {
      success(); // Haptic feedback
    },
  });

  const handleOpenCamera = async () => {
    lightTap();
    const opened = await openCamera();
    if (!opened) {
      alert('Unable to access camera. Please check permissions.');
    }
  };

  const handleCapturePhoto = async () => {
    lightTap();
    const blob = await capturePhoto();
    if (blob) {
      const imageUrl = URL.createObjectURL(blob);
      setCapturedImage(imageUrl);
      setCapturedBlob(blob);
      
      if (onPhotoCapture) {
        onPhotoCapture(blob);
      }
    }
  };

  const handleSavePhoto = async () => {
    if (!capturedBlob) return;

    const formData = new FormData();
    formData.append('photo', capturedBlob, 'captured-photo.jpg');
    formData.append('jobId', jobId || '');
    formData.append('shiftId', shiftId || '');
    formData.append('timestamp', new Date().toISOString());

    await uploadPhotoMutation.mutateAsync(formData);
    setIsOpen(false);
  };

  const handleRetakePhoto = () => {
    lightTap();
    setCapturedImage(null);
    setCapturedBlob(null);
  };

  if (!isSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <CameraOff className="w-5 h-5 mr-2" />
            Camera
          </CardTitle>
          <CardDescription>Camera is not supported on this device</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" data-testid="button-open-camera">
          <Camera className="w-4 h-4 mr-2" />
          Take Photo
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md p-0">
        <DialogHeader className="p-4 pb-0">
          <DialogTitle>Camera</DialogTitle>
          <DialogDescription>
            {jobId || shiftId ? 'Document your work with a photo' : 'Capture a photo'}
          </DialogDescription>
        </DialogHeader>

        <div className="relative bg-black">
          {!cameraIsOpen && !capturedImage && (
            <div className="aspect-video flex items-center justify-center">
              <Button onClick={handleOpenCamera} data-testid="button-start-camera">
                <Camera className="w-6 h-6 mr-2" />
                Start Camera
              </Button>
            </div>
          )}

          {cameraIsOpen && !capturedImage && (
            <div className="relative aspect-video">
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                autoPlay
                muted
                playsInline
              />
              
              {/* Camera controls overlay */}
              <div className="absolute bottom-4 left-0 right-0 flex justify-center items-center space-x-4">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={switchCamera}
                  data-testid="button-switch-camera"
                >
                  <SwitchCamera className="w-4 h-4" />
                </Button>
                
                <Button
                  size="lg"
                  className="rounded-full w-16 h-16 p-0"
                  onClick={handleCapturePhoto}
                  data-testid="button-capture-photo"
                >
                  <div className="w-12 h-12 border-4 border-white rounded-full" />
                </Button>
                
                <Badge variant="secondary" className="bg-black/50 text-white">
                  {facingMode === 'user' ? 'Front' : 'Back'}
                </Badge>
              </div>
            </div>
          )}

          {capturedImage && (
            <div className="relative aspect-video">
              <img
                src={capturedImage}
                alt="Captured"
                className="w-full h-full object-cover"
              />
              
              {/* Preview controls overlay */}
              <div className="absolute bottom-4 left-0 right-0 flex justify-center items-center space-x-4">
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={handleRetakePhoto}
                  data-testid="button-retake-photo"
                >
                  <X className="w-4 h-4 mr-2" />
                  Retake
                </Button>
                
                <Button
                  size="sm"
                  onClick={handleSavePhoto}
                  disabled={uploadPhotoMutation.isPending}
                  data-testid="button-save-photo"
                >
                  {uploadPhotoMutation.isPending ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  ) : (
                    <CheckCircle className="w-4 h-4 mr-2" />
                  )}
                  Save
                </Button>
              </div>
            </div>
          )}
        </div>

        <canvas
          ref={canvasRef}
          className="hidden"
        />
      </DialogContent>
    </Dialog>
  );
}

export function PhotoGallery({ jobId, shiftId }: { jobId?: string; shiftId?: string }) {
  const [photos, setPhotos] = useState<string[]>([]);

  // Load photos from API
  useEffect(() => {
    const loadPhotos = async () => {
      try {
        const endpoint = jobId 
          ? `/api/jobs/${jobId}/photos`
          : shiftId 
          ? `/api/shifts/${shiftId}/photos`
          : '/api/mobile/photos';
        
        const response = await apiRequest('GET', endpoint) as { photos?: string[] };
        setPhotos(response.photos || []);
      } catch (error) {
        console.error('Failed to load photos:', error);
      }
    };

    if (jobId || shiftId) {
      loadPhotos();
    }
  }, [jobId, shiftId]);

  if (photos.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Photo Documentation</CardTitle>
        <CardDescription>{photos.length} photos captured</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-2">
          {photos.map((photo, index) => (
            <div key={index} className="aspect-square">
              <img
                src={photo}
                alt={`Photo ${index + 1}`}
                className="w-full h-full object-cover rounded-lg"
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function QuickPhotoButton({ 
  onPhotoCapture,
  jobId,
  shiftId,
  className = ""
}: {
  onPhotoCapture?: (blob: Blob) => void;
  jobId?: string;
  shiftId?: string;
  className?: string;
}) {
  const { lightTap } = useHapticFeedback();

  const handleClick = () => {
    lightTap();
  };

  return (
    <div className={className}>
      <CameraCapture
        onPhotoCapture={onPhotoCapture}
        jobId={jobId}
        shiftId={shiftId}
      />
    </div>
  );
}