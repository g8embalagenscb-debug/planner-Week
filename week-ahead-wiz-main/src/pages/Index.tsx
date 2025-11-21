import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { CompanyCard } from "@/components/CompanyCard";
import { Button } from "@/components/ui/button";
import { Plus, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Company {
  id: string;
  name: string;
  niche: string;
  posts_per_week: number;
  city?: string;
}

const Index = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [generatingCompanyId, setGeneratingCompanyId] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    const { data, error } = await supabase
      .from("companies")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Erro ao carregar empresas",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    setCompanies(data || []);
  };

  const getNextMonday = () => {
    const today = new Date();
    const nextMonday = new Date(today);
    nextMonday.setDate(today.getDate() + ((1 + 7 - today.getDay()) % 7 || 7));
    return nextMonday.toLocaleDateString("pt-BR", { day: "2-digit", month: "long" });
  };

  const handleGeneratePosts = async (companyId: string, companyName: string) => {
    setGeneratingCompanyId(companyId);

    try {
      const { data, error } = await supabase.functions.invoke("generate-posts", {
        body: { companyId },
      });

      if (error) throw error;

      if (data.error) {
        toast({
          title: "Aviso",
          description: data.error,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Posts gerados com sucesso! 🎉",
        description: `${data.postsCount} posts criados para ${companyName}`,
      });

      navigate(`/company/${companyId}`);
    } catch (error: any) {
      toast({
        title: "Erro ao gerar posts",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setGeneratingCompanyId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-12 animate-in">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-display font-bold mb-2 bg-gradient-primary bg-clip-text text-transparent">
                Social Media Manager
              </h1>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <p>Próxima semana: {getNextMonday()}</p>
              </div>
            </div>
            <Button 
              onClick={() => navigate("/create-company")}
              className="bg-gradient-primary hover:opacity-90"
              size="lg"
            >
              <Plus className="h-5 w-5 mr-2" />
              Nova Empresa
            </Button>
          </div>
        </div>

        {/* Companies Grid */}
        {companies.length === 0 ? (
          <div className="text-center py-20 animate-in">
            <div className="bg-card p-12 rounded-2xl shadow-card max-w-md mx-auto">
              <h2 className="text-2xl font-display font-semibold mb-4">
                Nenhuma empresa cadastrada
              </h2>
              <p className="text-muted-foreground mb-6">
                Comece cadastrando sua primeira empresa para gerar posts automáticos
              </p>
              <Button 
                onClick={() => navigate("/create-company")}
                className="bg-gradient-primary hover:opacity-90"
              >
                <Plus className="h-5 w-5 mr-2" />
                Cadastrar Primeira Empresa
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {companies.map((company) => (
              <CompanyCard
                key={company.id}
                id={company.id}
                name={company.name}
                niche={company.niche}
                postsPerWeek={company.posts_per_week}
                city={company.city}
                onGenerate={() => handleGeneratePosts(company.id, company.name)}
                isGenerating={generatingCompanyId === company.id}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;