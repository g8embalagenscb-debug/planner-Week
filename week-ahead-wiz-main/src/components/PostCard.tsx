import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, Image, Star } from "lucide-react";
import { useState } from "react";

interface PostCardProps {
  id: string;
  title: string;
  imageDescription: string;
  format: string;
  caption: string;
  isSpecialDate: boolean;
  onMarkAsPosted: () => void;
  onUpdateCaption: (newCaption: string) => void;
}

export const PostCard = ({ 
  title, 
  imageDescription, 
  format, 
  caption, 
  isSpecialDate,
  onMarkAsPosted,
  onUpdateCaption 
}: PostCardProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedCaption, setEditedCaption] = useState(caption);

  const handleSave = () => {
    onUpdateCaption(editedCaption);
    setIsEditing(false);
  };

  const formatBadgeColor = {
    foto: "bg-blue-100 text-blue-800 border-blue-200",
    carrossel: "bg-purple-100 text-purple-800 border-purple-200",
    video: "bg-red-100 text-red-800 border-red-200",
    story: "bg-green-100 text-green-800 border-green-200",
  };

  return (
    <Card className="card-hover">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <CardTitle className="text-lg font-display flex items-center gap-2">
              {isSpecialDate && <Star className="h-5 w-5 text-warning fill-warning" />}
              {title}
            </CardTitle>
            <div className="flex gap-2 flex-wrap">
              <Badge variant="outline" className={formatBadgeColor[format as keyof typeof formatBadgeColor]}>
                {format.toUpperCase()}
              </Badge>
              {isSpecialDate && (
                <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">
                  Data Especial
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Image className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Descrição da Imagem</span>
          </div>
          <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
            {imageDescription}
          </p>
        </div>
        
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Legenda</span>
            {!isEditing && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setIsEditing(true)}
              >
                Editar
              </Button>
            )}
          </div>
          {isEditing ? (
            <div className="space-y-2">
              <Textarea
                value={editedCaption}
                onChange={(e) => setEditedCaption(e.target.value)}
                className="min-h-[150px] resize-none"
              />
              <div className="flex gap-2 justify-end">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setEditedCaption(caption);
                    setIsEditing(false);
                  }}
                >
                  Cancelar
                </Button>
                <Button 
                  size="sm"
                  onClick={handleSave}
                  className="bg-primary"
                >
                  Salvar
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-foreground whitespace-pre-wrap bg-muted p-3 rounded-lg max-h-[200px] overflow-y-auto">
              {caption}
            </p>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={onMarkAsPosted}
          className="w-full bg-success hover:bg-success/90"
        >
          <CheckCircle className="h-4 w-4 mr-2" />
          Marcar como Postado
        </Button>
      </CardFooter>
    </Card>
  );
};