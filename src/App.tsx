import React, { useState, useRef, useCallback, useEffect } from 'react';
import Cropper from 'react-easy-crop';
import * as htmlToImage from 'html-to-image';
import {
  Camera, 
  Upload, 
  Type, 
  Sparkles, 
  ZoomIn,
  X,
  Check,
  ArrowRight,
  Minus,
  Plus,
  Download
} from 'lucide-react';

type Step = 'photo' | 'adjust' | 'name' | 'done';

export default function App() {
  const [step, setStep] = useState<Step>('photo');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Crop state
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [name, setName] = useState('');
  const [templateImage, setTemplateImage] = useState<string | null>('https://scontent.fgau3-7.fna.fbcdn.net/v/t39.30808-6/642269162_25603906742644085_5175159260768895628_n.jpg?_nc_cat=102&ccb=1-7&_nc_sid=13d280&_nc_ohc=qJSiFl1L8yEQ7kNvwEUYeIO&_nc_oc=Adksegubb2kczqMZpRPDNT9NvFWR1j0f0DOvLOBYqQ31iZvCIwQb4TzUH-cujadjBc8&_nc_zt=23&_nc_ht=scontent.fgau3-7.fna&_nc_gid=ZQUqRWoAzZ1XUbdspoEN7Q&oh=00_AftXxMeW95Bd-SoOa0gWbkef3B7LpKEN7gDWr86mJvIhtA&oe=69A1D691');
  const [processedTemplate, setProcessedTemplate] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const templateInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!templateImage) {
      setProcessedTemplate(null);
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      // Define the hole region - center area for photo and bottom area for name
      const minX = canvas.width * 0.20;
      const maxX = canvas.width * 0.80;
      const minY = canvas.height * 0.30;
      const maxY = canvas.height * 0.85; // Extended to cover name area

      for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
          if (x > minX && x < maxX && y > minY && y < maxY) {
            const i = (y * canvas.width + x) * 4;
            const r = data[i];
            const g = data[i+1];
            const b = data[i+2];
            
            // Check if pixel is whitish/light colored
            const isNeutral = Math.abs(r - g) < 25 && Math.abs(r - b) < 25 && Math.abs(g - b) < 25;
            
            // Aggressive removal for light pixels
            if (r > 180 && g > 180 && b > 180 && isNeutral) {
              // Calculate transparency based on brightness
              const avgBrightness = (r + g + b) / 3;
              
              if (avgBrightness > 220) {
                // Very bright - fully transparent
                data[i+3] = 0;
              } else if (avgBrightness > 180) {
                // Moderately bright - gradual transparency
                const transparencyFactor = (avgBrightness - 180) / 40;
                data[i+3] = Math.floor(data[i+3] * (1 - transparencyFactor));
              }
            }
          }
        }
      }
      
      ctx.putImageData(imageData, 0, 0);
      setProcessedTemplate(canvas.toDataURL('image/png'));
    };
    img.onerror = () => {
      setProcessedTemplate(templateImage);
    };
    img.src = templateImage;
  }, [templateImage]);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImage(reader.result as string);
        setStep('adjust');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTemplateUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setTemplateImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const triggerTemplateInput = () => {
    templateInputRef.current?.click();
  };

  const removeImage = () => {
    setUploadedImage(null);
    setStep('photo');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDownload = async () => {
    const posterElement = document.getElementById('final-poster');
    if (!posterElement) return;

    try {
      setIsDownloading(true);
      
      // Wait a moment to ensure fonts and images are fully loaded
      await new Promise(resolve => setTimeout(resolve, 500));

      const dataUrl = await htmlToImage.toPng(posterElement, {
        quality: 1.0,
        pixelRatio: 2, // Higher resolution
        backgroundColor: '#ffffff',
      });

      const link = document.createElement('a');
      link.download = `runWithColour-${name.replace(/\s+/g, '-') || 'poster'}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('Error generating poster:', error);
      alert('There was an error generating your poster. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  const renderStepper = () => {
    const steps = [
      { id: 'photo', icon: Camera, label: 'Photo' },
      { id: 'adjust', icon: ZoomIn, label: 'Adjust' },
      { id: 'name', icon: Type, label: 'Name' },
      { id: 'done', icon: Sparkles, label: 'Done' }
    ];

    const currentIndex = steps.findIndex(s => s.id === step);

    return (
      <div className="flex items-center justify-center gap-8 md:gap-16 mb-12">
        {steps.map((s, index) => {
          const Icon = s.icon;
          const isCompleted = index < currentIndex;
          const isActive = s.id === step;
          
          return (
            <div key={s.id} className="flex flex-col items-center gap-2">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                isCompleted ? 'bg-emerald-500 text-white' :
                isActive ? 'bg-orange-100 border-2 border-[#f96316] text-[#f96316]' :
                'bg-slate-100 text-slate-400'
              }`}>
                {isCompleted ? <Check className="w-6 h-6" /> : <Icon className="w-5 h-5" />}
              </div>
              <span className={`text-xs font-bold ${
                isCompleted ? 'text-emerald-500' :
                isActive ? 'text-[#f96316]' :
                'text-slate-400 font-medium'
              }`}>
                {s.label}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 flex flex-col">
      {/* Main Content */}
      <main className="flex-grow flex flex-col items-center pt-12 pb-24 px-4">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-extrabold text-slate-900 mb-3 flex items-center justify-center gap-3">
            Create Your Poster <span className="text-3xl">🎨</span>
          </h1>
          <p className="text-slate-500 font-medium">3 simple steps • Takes 30 seconds</p>
        </div>

        {renderStepper()}

        {/* Content Area */}
        <div className="w-full max-w-lg bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-slate-100 overflow-hidden flex flex-col">
          <input 
            type="file" 
            accept="image/jpeg, image/png, image/heic" 
            className="hidden" 
            ref={fileInputRef}
            onChange={handleImageUpload}
          />
          
          {step === 'photo' && (
            <div className="p-4 flex flex-col min-h-[400px]">
              <div 
                onClick={triggerFileInput}
                className="flex-grow flex flex-col items-center justify-center py-16 bg-[#f4f7f9] border-2 border-dashed border-transparent rounded-2xl transition-colors hover:border-slate-300 cursor-pointer"
              >
                <div className="w-16 h-16 bg-[#e2e8f0] rounded-full flex items-center justify-center mb-4 text-slate-400">
                  <Camera className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-slate-700 mb-1">Upload Your Photo</h3>
                <p className="text-sm text-slate-400">Your poster preview will appear here</p>
              </div>
              
              <button 
                onClick={triggerFileInput}
                className="w-full bg-[#f96316] hover:bg-[#ea580c] text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-colors mt-4 shadow-md"
              >
                <Upload className="w-5 h-5" />
                Upload Photo
              </button>
            </div>
          )}

          {step === 'adjust' && uploadedImage && (
            <div className="flex flex-col">
              {/* Poster Preview Area */}
              <div className="relative w-full aspect-square bg-slate-900 overflow-hidden">
                {/* User Image (Cropper) at the bottom */}
                <div className="absolute inset-0 z-0">
                  <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[85%] h-[80%]">
                    <Cropper
                      image={uploadedImage}
                      crop={crop}
                      zoom={zoom}
                      aspect={1}
                      onCropChange={setCrop}
                      onZoomChange={setZoom}
                      showGrid={false}
                      style={{
                        containerStyle: {
                          width: '100%',
                          height: '100%',
                          backgroundColor: 'transparent'
                        },
                        cropAreaStyle: {
                          border: 'none',
                          boxShadow: 'none'
                        }
                      }}
                    />
                  </div>
                </div>

                {/* Background Poster Template on top */}
                <div className="absolute inset-0 z-10 pointer-events-none">
                  {processedTemplate ? (
                    <img 
                      src={processedTemplate} 
                      alt="Poster Template" 
                      className="w-full h-full object-cover"
                      id="template-bg"
                    />
                  ) : templateImage ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-100">
                      <div className="animate-pulse flex flex-col items-center">
                        <div className="w-12 h-12 border-4 border-[#f96316] border-t-transparent rounded-full animate-spin mb-4"></div>
                        <p className="text-slate-500 font-medium">Processing template...</p>
                      </div>
                    </div>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center flex-col text-center p-6 bg-slate-200 pointer-events-auto">
                      <p className="text-slate-600 font-bold mb-4">
                        Please upload your poster template background.
                      </p>
                      <button 
                        onClick={triggerTemplateInput}
                        className="bg-[#f96316] hover:bg-[#ea580c] text-white font-bold py-2 px-4 rounded-lg transition-colors shadow-sm text-sm"
                      >
                        Upload Template
                      </button>
                      <input 
                        type="file" 
                        ref={templateInputRef} 
                        onChange={handleTemplateUpload} 
                        accept="image/jpeg, image/png, image/heic" 
                        className="hidden" 
                      />
                    </div>
                  )}
                </div>

                {/* Name Overlay Placeholder */}
                <div className="absolute top-[78%] left-1/2 transform -translate-x-1/2 z-20 pointer-events-none w-full flex flex-col items-center opacity-50">
                  <p className="text-2xl md:text-3xl font-bold text-white mb-1 tracking-wide drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">{name || 'YOUR NAME'}</p>
                </div>
              </div>

              {/* Controls Area */}
              <div className="p-6 bg-white border-t border-slate-100">
                <p className="text-center text-sm text-slate-500 mb-6 flex items-center justify-center gap-2">
                  <span className="text-lg">👆</span> Drag photo to position • Use slider to zoom
                </p>
                
                <div className="flex items-center gap-4 mb-8 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <button 
                    onClick={() => setZoom(z => Math.max(1, z - 0.1))}
                    className="w-10 h-10 flex items-center justify-center bg-white rounded-xl shadow-sm border border-slate-200 text-slate-600 hover:text-slate-900"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <input
                    type="range"
                    value={zoom}
                    min={1}
                    max={3}
                    step={0.1}
                    aria-labelledby="Zoom"
                    onChange={(e) => setZoom(Number(e.target.value))}
                    className="flex-grow h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
                  />
                  <button 
                    onClick={() => setZoom(z => Math.min(3, z + 0.1))}
                    className="w-10 h-10 flex items-center justify-center bg-white rounded-xl shadow-sm border border-slate-200 text-slate-600 hover:text-slate-900"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex gap-3">
                  <button 
                    onClick={removeImage}
                    className="flex-1 bg-white border-2 border-slate-200 hover:border-slate-300 text-slate-700 font-bold py-4 rounded-xl transition-colors"
                  >
                    Back
                  </button>
                  <button 
                    onClick={() => setStep('name')}
                    className="flex-[2] bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-md"
                  >
                    Continue <ArrowRight className="w-5 h-5" /> Add Your Name
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {step === 'name' && (
            <div className="flex flex-col">
              {/* Poster Preview Area */}
              <div className="relative w-full aspect-square bg-slate-900 overflow-hidden">
                {/* User Image (Cropper) at the bottom */}
                <div className="absolute inset-0 z-0">
                  <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[85%] h-[80%]">
                    <Cropper
                      image={uploadedImage}
                      crop={crop}
                      zoom={zoom}
                      aspect={1}
                      onCropChange={() => {}}
                      onZoomChange={() => {}}
                      showGrid={false}
                      style={{
                        containerStyle: {
                          width: '100%',
                          height: '100%',
                          backgroundColor: 'transparent'
                        },
                        cropAreaStyle: {
                          border: 'none',
                          boxShadow: 'none'
                        }
                      }}
                    />
                  </div>
                </div>

                {/* Background Poster Template on top */}
                <div className="absolute inset-0 z-10 pointer-events-none">
                  {processedTemplate && (
                    <img 
                      src={processedTemplate} 
                      alt="Poster Template" 
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>

                {/* Name Overlay Preview */}
                <div className="absolute top-[78%] left-1/2 transform -translate-x-1/2 z-20 pointer-events-none w-full flex flex-col items-center opacity-50">
                  <p className="text-2xl md:text-3xl font-bold text-white mb-1 tracking-wide drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">{name || 'YOUR NAME'}</p>
                </div>
              </div>

              {/* Name Input Area */}
              <div className="p-6 bg-white border-t border-slate-100">
                <label className="block text-left text-sm font-semibold text-slate-700 mb-2">
                  Your Name (as it appears on poster)
                </label>
                <div className="relative mb-4">
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => {
                      if (e.target.value.length <= 30) {
                        setName(e.target.value);
                      }
                    }}
                    placeholder="e.g., Rohan Sharma" 
                    maxLength={30}
                    className="w-full px-4 py-3 rounded-xl border-2 border-[#f96316] focus:border-[#f96316] focus:outline-none text-center text-lg font-medium placeholder:text-slate-400"
                  />
                  <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-sm text-slate-400">
                    {name.length}/30
                  </span>
                </div>
                
                <button 
                  onClick={() => setStep('done')}
                  disabled={!name.trim()}
                  className="w-full bg-[#f96316] hover:bg-[#ea580c] disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-md mb-3"
                >
                  <Download className="w-5 h-5" />
                  Download Poster
                </button>
                
                <div className="flex items-center justify-center gap-4 text-sm">
                  <button 
                    onClick={() => setStep('adjust')}
                    className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
                  >
                    Change photo
                  </button>
                  <span className="text-slate-300">|</span>
                  <button 
                    onClick={removeImage}
                    className="text-slate-500 hover:text-slate-700 font-medium transition-colors"
                  >
                    Start over
                  </button>
                </div>
              </div>
            </div>
          )}

          {step === 'done' && (
            <div className="flex flex-col">
              {/* Final Poster Preview Area */}
              <div className="relative w-full aspect-square bg-slate-900 overflow-hidden" id="final-poster">
                {/* User Image (Cropper) at the bottom */}
                <div className="absolute inset-0 z-0">
                  <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[85%] h-[80%]">
                    {uploadedImage && (
                      <Cropper
                        image={uploadedImage}
                        crop={crop}
                        zoom={zoom}
                        aspect={1}
                        onCropChange={() => {}}
                        onZoomChange={() => {}}
                        showGrid={false}
                        style={{
                          containerStyle: {
                            width: '100%',
                            height: '100%',
                            backgroundColor: 'transparent'
                          },
                          cropAreaStyle: {
                            border: 'none',
                            boxShadow: 'none'
                          }
                        }}
                      />
                    )}
                  </div>
                </div>

                {/* Background Poster Template on top */}
                <div className="absolute inset-0 z-10 pointer-events-none">
                  {processedTemplate && (
                    <img 
                      src={processedTemplate} 
                      alt="Poster Template" 
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>

                {/* Name Overlay */}
                <div className="absolute top-[78%] left-1/2 transform -translate-x-1/2 z-20 pointer-events-none w-full flex flex-col items-center">
                  <p className="text-2xl md:text-3xl font-bold text-white mb-1 tracking-wide drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">{name}</p>
                </div>
              </div>

              <div className="p-6 bg-white border-t border-slate-100 flex flex-col gap-4">
                <button 
                  onClick={handleDownload}
                  disabled={isDownloading}
                  className="w-full bg-[#f96316] hover:bg-[#ea580c] disabled:bg-slate-400 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-colors shadow-md flex items-center justify-center gap-2"
                >
                  {isDownloading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Generating...
                    </>
                  ) : (
                    <>
                      <Download className="w-5 h-5" /> Download Poster
                    </>
                  )}
                </button>
                <button 
                  onClick={removeImage}
                  className="w-full bg-white border border-slate-200 hover:border-slate-300 text-[#0a192f] font-bold py-4 rounded-xl transition-colors shadow-sm"
                >
                  Create Another One
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Helper Text */}
        {step === 'photo' && (
          <div className="mt-6 text-center space-y-1">
            <p className="text-sm text-slate-500 flex items-center justify-center gap-1.5">
              <span className="text-base">💡</span> Use a portrait photo for best results
            </p>
            <p className="text-xs text-slate-400">Supports JPEG, PNG, HEIC</p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-50 border-t border-slate-200 py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-xs text-slate-500">
            Built by <span className="font-semibold text-slate-700">m0ya</span> © 2026
          </p>
        </div>
      </footer>
    </div>
  );
}
