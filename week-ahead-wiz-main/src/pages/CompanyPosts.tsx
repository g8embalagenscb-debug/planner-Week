import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { PostCard } from "@/components/PostCard";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Sparkles, Calendar, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Post {
  id: string;
  title: string;
  image_description: string;
  format: string;
  caption: string;
  is_special_date: boolean;
  week_start: string;
}

interface Company {
  id: string;
  name: string;
  niche: string;
  city?: string;
}

const CompanyPosts = () => {
  const { companyId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [company, setCompany] = useState<Company | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (companyId) {
      fetchCompanyAndPosts();
    }
  }, [companyId]);

  const fetchCompanyAndPosts = async () => {
    setIsLoading(true);
    
    // Fetch company
    const { data: companyData, error: companyError } = await supabase
      .from("companies")
      .select("*")
      .eq("id", companyId)
      .single();

    if (companyError) {
      toast({
        title: "Erro ao carregar empresa",
        description: companyError.message,
        variant: "destructive",
      });
      navigate("/");
      return;
    }

    setCompany(companyData);

    // Calculate next Monday
    const today = new Date();
    const nextMonday = new Date(today);
    nextMonday.setDate(today.getDate() + ((1 + 7 - today.getDay()) % 7 || 7));
    const weekStart = nextMonday.toISOString().split("T")[0];

    // Fetch posts for next week
    const { data: postsData, error: postsError } = await supabase
      .from("weekly_posts")
      .select("*")
      .eq("company_id", companyId)
      .eq("week_start", weekStart)
      .eq("status", "pending")
      .order("is_special_date", { ascending: false })
      .order("created_at", { ascending: true });

    if (postsError) {
      toast({
        title: "Erro ao carregar posts",
        description: postsError.message,
        variant: "destructive",
      });
    }

    setPosts(postsData || []);
    setIsLoading(false);
  };

  const handleGeneratePosts = async () => {
    setIsGenerating(true);

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
        description: `${data.postsCount} posts criados`,
      });

      fetchCompanyAndPosts();
    } catch (error: any) {
      toast({
        title: "Erro ao gerar posts",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleMarkAsPosted = async (postId: string) => {
    const post = posts.find((p) => p.id === postId);
    if (!post) return;

    try {
      // Move to history
      const { error: historyError } = await supabase.from("history_posts").insert({
        company_id: companyId,
        title: post.title,
        caption: post.caption,
        format: post.format,
        theme: post.title, // Using title as theme
      });

      if (historyError) throw historyError;

      // Delete from weekly_posts
      const { error: deleteError } = await supabase
        .from("weekly_posts")
        .delete()
        .eq("id", postId);

      if (deleteError) throw deleteError;

      toast({
        title: "Post marcado como postado! ✅",
        description: "Post movido para o histórico",
      });

      // Update local state
      setPosts(posts.filter((p) => p.id !== postId));

      // If all posts are done, show completion message
      if (posts.length === 1) {
        toast({
          title: "Semana concluída! 🎉",
          description: "Todos os posts foram marcados como postados",
        });
      }
    } catch (error: any) {
      toast({
        title: "Erro ao marcar post",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleUpdateCaption = async (postId: string, newCaption: string) => {
    try {
      const { error } = await supabase
        .from("weekly_posts")
        .update({ caption: newCaption })
        .eq("id", postId);

      if (error) throw error;

      toast({
        title: "Legenda atualizada! ✅",
      });

      // Update local state
      setPosts(posts.map((p) => (p.id === postId ? { ...p, caption: newCaption } : p)));
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar legenda",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getNextMonday = () => {
    if (posts.length > 0 && posts[0].week_start) {
      const date = new Date(posts[0].week_start);
      return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "long" });
    }
    const today = new Date();
    const nextMonday = new Date(today);
    nextMonday.setDate(today.getDate() + ((1 + 7 - today.getDay()) % 7 || 7));
    return nextMonday.toLocaleDateString("pt-BR", { day: "2-digit", month: "long" });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container max-w-7xl mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>

        {/* Header */}
        <div className="mb-8 animate-in">
          <h1 className="text-3xl font-display font-bold mb-2">
            {company?.name}
          </h1>
          <div className="flex items-center gap-4 text-muted-foreground">
            <span>{company?.niche}</span>
            {company?.city && <span>• {company.city}</span>}
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>Semana de {getNextMonday()}</span>
            </div>
          </div>
        </div>

        {/* Posts */}
        {posts.length === 0 ? (
          <div className="text-center py-20 animate-in">
            <div className="bg-card p-12 rounded-2xl shadow-card max-w-md mx-auto">
              <h2 className="text-2xl font-display font-semibold mb-4">
                Nenhum post para esta semana
              </h2>
              <p className="text-muted-foreground mb-6">
                Gere posts automáticos com IA para começar a planejar sua semana
              </p>
              <Button 
                onClick={handleGeneratePosts}
                disabled={isGenerating}
                className="bg-gradient-primary hover:opacity-90"
                size="lg"
              >
                <Sparkles className="h-5 w-5 mr-2" />
                {isGenerating ? "Gerando Posts..." : "Gerar Posts com IA"}
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-success" />
                <span className="text-muted-foreground">
                  {posts.length} {posts.length === 1 ? "post pendente" : "posts pendentes"}
                </span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {posts.map((post) => (
                <PostCard
                  key={post.id}
                  id={post.id}
                  title={post.title}
                  imageDescription={post.image_description}
                  format={post.format}
                  caption={post.caption}
                  isSpecialDate={post.is_special_date}
                  onMarkAsPosted={() => handleMarkAsPosted(post.id)}
                  onUpdateCaption={(newCaption) => handleUpdateCaption(post.id, newCaption)}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CompanyPosts;