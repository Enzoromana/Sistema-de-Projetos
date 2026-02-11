import { useState } from "react";
import { Upload, X } from "lucide-react";
import { Button } from "@/modules/SheetToSlide/components/ui/button";
import { Card } from "@/modules/SheetToSlide/components/ui/card";

interface LogoUploadProps {
  onLogoChange: (logoUrl: string | null) => void;
  currentLogo: string | null;
}

export const LogoUpload = ({ onLogoChange, currentLogo }: LogoUploadProps) => {
  const [preview, setPreview] = useState<string | null>(currentLogo);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setPreview(result);
        onLogoChange(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    setPreview(null);
    onLogoChange(null);
  };

  return (
    <Card className="p-4 border-2 border-dashed border-primary/30 bg-white/50 backdrop-blur-sm">
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <h4 className="font-semibold text-[#1D7874] mb-3 flex items-center gap-2">
            🖼️ Capa da Proposta
          </h4>
          {preview ? (
            <div className="space-y-4">
              <div className="relative group overflow-hidden rounded-lg border border-border bg-gray-100 shadow-md max-w-[200px]">
                <img
                  src={preview}
                  alt="Capa preview"
                  className="w-full h-auto object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => window.open(preview, '_blank')}
                    className="h-8 text-xs bg-white/90 hover:bg-white text-gray-800"
                  >
                    Visualizar
                  </Button>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <label htmlFor="logo-upload">
                  <Button variant="outline" size="sm" className="h-8 text-xs cursor-pointer" asChild>
                    <span>Trocar Imagem</span>
                  </Button>
                  <input
                    id="logo-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRemoveLogo}
                  className="h-8 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <X className="h-4 w-4 mr-1" />
                  Remover
                </Button>
              </div>
            </div>
          ) : (
            <label htmlFor="logo-upload" className="block">
              <div className="flex flex-col items-center justify-center py-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-[#F7931E] hover:bg-[#FFF8F0] transition-all duration-300 cursor-pointer group">
                <Upload className="h-8 w-8 text-gray-400 group-hover:text-[#F7931E] mb-2" />
                <span className="text-sm font-medium text-gray-600 group-hover:text-gray-900">
                  Upload da Capa
                </span>
                <input
                  id="logo-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>
            </label>
          )}
        </div>
      </div>
    </Card>
  );
};

