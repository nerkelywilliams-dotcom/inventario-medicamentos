import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Send, MessageSquare } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";

type ChatMessage = {
  role: "user" | "assistant";
  text: string;
};

export default function InventoryChat() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      text: "Hola, soy el asistente de inventario. Pregúntame por medicamentos, familias, stock, pediatría o vencimientos.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async () => {
    const prompt = input.trim();
    if (!prompt) return;

    const newMessages = [...messages, { role: "user", text: prompt }];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      const headers: HeadersInit = { "Content-Type": "application/json" };
      if (user) {
        headers["x-user"] = btoa(JSON.stringify(user));
      }

      const response = await fetch("/api/inventory/chat", {
        method: "POST",
        headers,
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({ message: "Error en la consulta" }));
        throw new Error(errorBody.message || "Error en la consulta");
      }

      const { answer } = await response.json();
      setMessages((current) => [...current, { role: "assistant", text: answer }]);
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "No se pudo procesar la consulta.", variant: "destructive" });
      setMessages((current) => [...current, { role: "assistant", text: "Lo siento, no pude procesar tu consulta. Intenta de nuevo." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-4 mb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
            <MessageSquare className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Chat AI de Inventario</h1>
            <p className="text-sm text-slate-500">Haz preguntas sobre tu inventario y obtén respuestas basadas en los medicamentos registrados.</p>
          </div>
        </div>

        <div className="space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`rounded-3xl p-4 ${message.role === "assistant" ? "bg-slate-100 text-slate-900" : "bg-slate-900 text-white"}`}
            >
              <p className="text-sm leading-6 whitespace-pre-line">{message.text}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-[1fr_auto]">
        <Textarea
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Escribe tu pregunta, por ejemplo: 'dime qué medicamentos tenemos para la tos en niños'"
          rows={4}
          className="min-h-[8rem]"
        />

        <Button
          className="h-full self-end"
          onClick={sendMessage}
          disabled={isLoading || !input.trim()}
        >
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
          Enviar
        </Button>
      </div>
    </div>
  );
}
