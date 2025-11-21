import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, Calendar, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface CompanyCardProps {
  id: string;
  name: string;
  niche: string;
  postsPerWeek: number;
  city?: string;
  onGenerate: () => void;
  isGenerating: boolean;
}

export const CompanyCard = ({ 
  id, 
  name, 
  niche, 
  postsPerWeek, 
  city,
  onGenerate,
  isGenerating 
}: CompanyCardProps) => {
  const navigate = useNavigate();

  return (
    <Card className="card-hover overflow-hidden">
      <div className="h-2 bg-gradient-primary" />
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-xl font-display flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              {name}
            </CardTitle>
            <CardDescription className="text-sm">
              {niche} {city && `• ${city}`}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>{postsPerWeek} posts por semana</span>
        </div>
        
        <div className="flex gap-2">
          <Button 
            onClick={() => navigate(`/company/${id}`)}
            variant="outline"
            className="flex-1"
          >
            Ver Posts
          </Button>
          <Button 
            onClick={onGenerate}
            disabled={isGenerating}
            className="flex-1 bg-gradient-primary hover:opacity-90"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            {isGenerating ? "Gerando..." : "Gerar Semana"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};