import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Building2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const CreateCompany = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    postsPerWeek: 3,
    niche: "",
    city: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await supabase.from("companies").insert({
        name: formData.name,
        posts_per_week: formData.postsPerWeek,
        niche: formData.niche,
        city: formData.city || null,
      });

      if (error) throw error;

      toast({
        title: "Empresa cadastrada com sucesso! 🎉",
        description: "Agora você pode gerar posts para esta empresa",
      });

      navigate("/");
    } catch (error: any) {
      toast({
        title: "Erro ao cadastrar empresa",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container max-w-2xl mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>

        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-12 w-12 rounded-lg bg-gradient-primary flex items-center justify-center">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl font-display">Nova Empresa</CardTitle>
                <CardDescription>
                  Cadastre uma empresa para começar a gerar posts
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Nome da Empresa *</Label>
                <Input
                  id="name"
                  placeholder="Ex: Cafeteria Aroma"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="niche">Nicho / Ramo *</Label>
                <Input
                  id="niche"
                  placeholder="Ex: Cafeteria, Restaurante, Loja de Roupas"
                  value={formData.niche}
                  onChange={(e) => setFormData({ ...formData, niche: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="postsPerWeek">Quantos posts por semana? *</Label>
                <Input
                  id="postsPerWeek"
                  type="number"
                  min="1"
                  max="7"
                  value={formData.postsPerWeek}
                  onChange={(e) => setFormData({ ...formData, postsPerWeek: parseInt(e.target.value) })}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Recomendamos entre 3 e 5 posts por semana
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">Cidade (opcional)</Label>
                <Input
                  id="city"
                  placeholder="Ex: São Paulo"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  Usado para identificar datas comemorativas locais
                </p>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-gradient-primary hover:opacity-90"
                disabled={isSubmitting}
                size="lg"
              >
                {isSubmitting ? "Cadastrando..." : "Cadastrar Empresa"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CreateCompany;