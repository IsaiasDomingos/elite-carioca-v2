import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  UserPlus,
  Tv,
  Camera,
  Lock,
  ArrowLeft,
  Home,
  Bell,
  LogOut,
  Save,
  ChevronRight,
  Scissors,
  Crown,
  Trash2,
  Clock,
  Users,
  Scan,
  Eraser,
  Settings,
  UserCheck,
  UserMinus,
  UserX,
  RefreshCw,
  CheckCircle2,
  Play,
  Calendar,
  AlertTriangle,
  X,
  ShieldAlert,
  Zap,
  Loader2,
  Code2,
  Circle,
  Check,
  Info,
  AlertCircle,
  DollarSign,
  Banknote,
  CreditCard,
  TrendingUp,
} from "lucide-react";

// Utilizando a camada de compatibilidade do Firebase
import firebase from "firebase/compat/app";
import "firebase/compat/firestore";

// CONFIGURAÇÃO FIREBASE (Chaves reais extraídas da sua foto)
const firebaseConfig = {
  apiKey: "AIzaSyAU5crOPK6roszFly_pyl0G7CcsYFvjm6U",
  authDomain: "sistema-barbearia-acb02.firebaseapp.com",
  projectId: "sistema-barbearia-acb02",
  storageBucket: "sistema-barbearia-acb02.firebasestorage.app",
  messagingSenderId: "149768423148",
  appId: "1:149768423148:web:59189c3c1912ab98d847c9",
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();

// COMPONENTE: GlassContainer
const GlassContainer = ({ children, className = "", onClick }: any) => {
  const m = motion as any;
  return (
    <m.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={onClick ? { scale: 1.01 } : {}}
      onClick={onClick}
      className={`glass rounded-[2.5rem] p-8 transition-all ${className}`}
    >
      {children}
    </m.div>
  );
};

// COMPONENTE: Assinatura
const ISDSignature = () => (
  <div className="fixed bottom-6 left-0 right-0 flex justify-center items-center pointer-events-none z-50">
    <div className="flex items-center gap-2 isd-signature text-[10px] font-bold text-white/40 uppercase tracking-[0.2em]">
      <Code2 size={12} className="text-blue-500" />
      Developed by <span className="text-blue-400">&lt;ISD Systems /&gt;</span>
    </div>
  </div>
);

const App: React.FC = () => {
  const m = motion as any;

  // Estados de Visualização
  const [modo, setModo] = useState<any>("selecao");

  // Estados de Dados
  const [clientesFila, setClientesFila] = useState<any[]>([]);
  const [profissionais, setProfissionais] = useState<any[]>([]);
  const [historicoAtendimentos, setHistoricoAtendimentos] = useState<any[]>([]);
  const [barbeiroLogado, setBarbeiroLogado] = useState<any | null>(null);

  // Estados Financeiros e Modais
  const [checkoutAtivo, setCheckoutAtivo] = useState<any | null>(null);
  const [valorInput, setValorInput] = useState<string>("50.00");
  const [showGanhosModal, setShowGanhosModal] = useState(false);

  // Estados de Notificação (Toasts)
  const [toasts, setToasts] = useState<any[]>([]);

  const addToast = (
    message: string,
    type: "sucesso" | "erro" | "info" = "info"
  ) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  // Estados de Segurança e Bloqueio
  const [tentativasPIN, setTentativasPIN] = useState(0);
  const [bloqueadoAte, setBloqueadoAte] = useState<number | null>(null);
  const [segundosRestantes, setSegundosRestantes] = useState(0);

  // Estados de Cadastro e Input
  const [novoCliente, setNovoCliente] = useState({
    nome: "",
    sobrenome: "",
    whatsapp: "",
    cpf: "",
    foto: "",
    barbeiroPref: "Sem Preferência",
    servico: "Cabelo",
  });
  const [novoProf, setNovoProf] = useState({ nome: "", matricula: "" });
  const [acessoInput, setAcessoInput] = useState("");
  const [flash, setFlash] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const prevClientesRef = useRef<any[]>([]);

  // Formatação de Dinheiro
  const formatBRL = (val: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(val);

  // Carregar Som
  useEffect(() => {
    audioRef.current = new Audio(
      "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3"
    );
  }, []);

  // --- EFEITOS DE CARREGAMENTO ---
  useEffect(() => {
    const unsubFila = db
      .collection("fila_paiva")
      .orderBy("chegada", "asc")
      .onSnapshot((snap) => {
        const novosClientes = snap.docs.map((d: any) => ({
          id: d.id,
          ...d.data(),
        }));
        if (modo === "painel") {
          const clienteChamado = novosClientes.find((c) => {
            const anterior = prevClientesRef.current.find((p) => p.id === c.id);
            return (
              c.status === "atendendo" &&
              (!anterior || anterior.status === "esperando")
            );
          });
          if (clienteChamado) audioRef.current?.play().catch(() => {});
        }
        prevClientesRef.current = novosClientes;
        setClientesFila(novosClientes);
      });

    const unsubProf = db.collection("profissionais").onSnapshot((snap) => {
      const list = snap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
      setProfissionais(list);
      if (barbeiroLogado) {
        const atual = list.find((p) => p.id === barbeiroLogado.id);
        if (atual) setBarbeiroLogado(atual);
      }
    });

    const unsubHist = db
      .collection("historico_paiva")
      .orderBy("dataConclusao", "desc")
      .limit(100)
      .onSnapshot((snap) => {
        setHistoricoAtendimentos(
          snap.docs.map((d: any) => ({ id: d.id, ...d.data() }))
        );
      });

    return () => {
      unsubFila();
      unsubProf();
      unsubHist();
      pararCamera();
    };
  }, [barbeiroLogado?.id, modo]);

  useEffect(() => {
    if (modo === "biometria") abrirCamera();
    else if (modo === "selecao") pararCamera();
  }, [modo]);

  useEffect(() => {
    let interval: any;
    if (bloqueadoAte) {
      interval = setInterval(() => {
        const rest = Math.ceil((bloqueadoAte - Date.now()) / 1000);
        if (rest <= 0) {
          setBloqueadoAte(null);
          setTentativasPIN(0);
          setSegundosRestantes(0);
        } else setSegundosRestantes(rest);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [bloqueadoAte]);

  // --- FUNÇÕES DE HARDWARE ---
  const abrirCamera = async () => {
    try {
      pararCamera();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });
      streamRef.current = stream;
      setTimeout(() => {
        if (videoRef.current) videoRef.current.srcObject = stream;
      }, 100);
    } catch (err: any) {
      addToast("Erro ao acessar hardware de vídeo.", "erro");
    }
  };

  const pararCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
  };

  const tirarFoto = () => {
    setFlash(true);
    setTimeout(() => setFlash(false), 150);
    if (videoRef.current && canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(videoRef.current, 0, 0, 400, 400);
      setNovoCliente((prev) => ({
        ...prev,
        foto: canvasRef.current!.toDataURL("image/png"),
      }));
      pararCamera();
      setModo("cliente_registro");
      addToast("Biometria capturada.", "sucesso");
    }
  };

  // --- LOGICA DE ACESSO ---
  const handleAcessoUnificado = () => {
    if (bloqueadoAte) return;
    if (acessoInput === "123456") {
      setModo("gestao_master");
      setAcessoInput("");
      setTentativasPIN(0);
      addToast("Modo Master ativado.", "sucesso");
      return;
    }
    const prof = profissionais.find((p) => p.matricula === acessoInput);
    if (prof) {
      setBarbeiroLogado(prof);
      setModo("admin_barbeiro");
      setAcessoInput("");
      setTentativasPIN(0);
      addToast(`Bem-vindo, ${prof.nome}.`, "sucesso");
    } else {
      const nextAttempt = tentativasPIN + 1;
      setTentativasPIN(nextAttempt);
      setAcessoInput("");
      if (nextAttempt >= 3) {
        setBloqueadoAte(Date.now() + 300000);
        addToast("Acesso bloqueado por 5 minutos.", "erro");
      } else
        addToast(
          `Acesso negado. Restam ${3 - nextAttempt} tentativas.`,
          "erro"
        );
    }
  };

  const mudarStatus = async (novoStatus: any) => {
    if (!barbeiroLogado) return;
    try {
      const batch = db.batch();
      batch.update(db.collection("profissionais").doc(barbeiroLogado.id), {
        status: novoStatus,
      });
      if (novoStatus === "ausente") {
        clientesFila
          .filter(
            (c) =>
              c.barbeiroPref === barbeiroLogado.nome && c.status === "esperando"
          )
          .forEach((c) =>
            batch.update(db.collection("fila_paiva").doc(c.id), {
              barbeiroPref: "Sem Preferência",
            })
          );
      }
      await batch.commit();
      addToast(`Status: ${novoStatus.toUpperCase()}`, "info");
    } catch (e) {
      addToast("Falha ao atualizar status.", "erro");
    }
  };

  const cadastrarCliente = async (barbeiro: string) => {
    try {
      await db
        .collection("fila_paiva")
        .add({
          ...novoCliente,
          barbeiroPref: barbeiro,
          chegada: firebase.firestore.Timestamp.now(),
          status: "esperando",
        });
      setModo("selecao");
      setNovoCliente({
        nome: "",
        sobrenome: "",
        whatsapp: "",
        cpf: "",
        foto: "",
        barbeiroPref: "Sem Preferência",
        servico: "Cabelo",
      });
      addToast("Cadastro concluído com sucesso.", "sucesso");
    } catch (e) {
      addToast("Falha no cadastro.", "erro");
    }
  };

  const confirmarFinalizacao = async () => {
    if (!checkoutAtivo) return;
    const valor = parseFloat(valorInput);
    if (isNaN(valor) || valor <= 0) return addToast("Valor inválido.", "erro");
    try {
      await db.collection("historico_paiva").add({
        nome: checkoutAtivo.nome + " " + (checkoutAtivo.sobrenome || ""),
        barbeiro: barbeiroLogado.nome,
        servico: checkoutAtivo.servico || "Cabelo",
        valor: valor,
        dataConclusao: firebase.firestore.Timestamp.now(),
        tempoEspera: Math.floor(
          (Date.now() - checkoutAtivo.chegada.toMillis()) / 60000
        ),
      });
      await db.collection("fila_paiva").doc(checkoutAtivo.id).delete();
      addToast("Finalizado e registrado.", "sucesso");
      setCheckoutAtivo(null);
    } catch (e) {
      addToast("Erro ao processar.", "erro");
    }
  };

  const llamarCliente = async (id: string) => {
    try {
      await db
        .collection("fila_paiva")
        .doc(id)
        .update({ status: "atendendo", barbeiroPref: barbeiroLogado.nome });
      addToast("Cliente chamado.", "info");
    } catch (e) {
      addToast("Erro ao chamar.", "erro");
    }
  };

  const getStats = (barbeiroName?: string) => {
    const agora = new Date();
    const hoje = new Date(
      agora.getFullYear(),
      agora.getMonth(),
      agora.getDate()
    ).getTime();
    const hist = barbeiroName
      ? historicoAtendimentos.filter((h) => h.barbeiro === barbeiroName)
      : historicoAtendimentos;
    return {
      totalHoje: hist
        .filter((h) => h.dataConclusao?.toMillis() >= hoje)
        .reduce((acc, curr) => acc + (curr.valor || 0), 0),
    };
  };

  const ServiceBadge = ({ servico }: { servico: string }) => {
    const colors: any = {
      Cabelo: "bg-blue-500/10 text-blue-400",
      Barba: "bg-orange-500/10 text-orange-400",
      Completo: "bg-emerald-500/10 text-emerald-400",
    };
    return (
      <span
        className={`px-2 py-0.5 rounded-full border text-[8px] font-black uppercase ${
          colors[servico] || "bg-slate-500/10 text-slate-400"
        }`}
      >
        {servico}
      </span>
    );
  };

  // --- RENDERS ---
  if (modo === "selecao")
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-between p-12 text-center text-white relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-yellow-500/5 rounded-full blur-[120px] pointer-events-none" />
        <m.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="relative z-10 pt-10"
        >
          <h1 className="text-8xl font-black uppercase italic tracking-tighter neon-yellow text-white mb-4">
            ELITE CARIOCA
          </h1>
          <p className="text-blue-500 font-bold tracking-[0.8em] uppercase text-sm neon-blue">
            Luxury Barber Experience
          </p>
        </m.div>
        <m.button
          whileHover={{ scale: 1.05 }}
          onClick={() => setModo("cliente_registro")}
          className="relative glass h-80 w-80 md:h-[450px] md:w-[450px] rounded-[5rem] flex flex-col items-center justify-center gap-8 border-2 border-yellow-500/30 shadow-2xl"
        >
          <div className="p-8 bg-yellow-500/10 rounded-full">
            <Scissors size={100} className="text-yellow-500" />
          </div>
          <span className="block font-black text-4xl uppercase tracking-tighter">
            Quero Cortar
          </span>
        </m.button>
        <m.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="relative z-10 w-full flex justify-between items-end"
        >
          <button
            onClick={() => setModo("painel")}
            className="opacity-30 hover:opacity-100 flex flex-col items-center gap-2"
          >
            <Tv size={24} />
            <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">
              Painel TV
            </span>
          </button>
          <div className="glass-slim px-6 py-4 rounded-[2rem] border border-white/5 flex items-center gap-4 bg-slate-900/40">
            <input
              type="password"
              placeholder="PIN"
              className="w-40 bg-transparent text-center font-black text-xs outline-none text-white"
              value={acessoInput}
              onChange={(e) => setAcessoInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAcessoUnificado()}
            />
            <button
              onClick={handleAcessoUnificado}
              className="px-4 py-2 rounded-xl font-black uppercase text-[9px] text-blue-500"
            >
              OK
            </button>
          </div>
        </m.div>
        <ISDSignature />
        <EliteToasts toasts={toasts} />
      </div>
    );

  if (modo === "biometria")
    return (
      <div
        className={`min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center transition-colors ${
          flash ? "bg-white" : ""
        }`}
      >
        <button
          onClick={() => setModo("cliente_registro")}
          className="absolute top-10 left-10 text-slate-600 flex items-center gap-2 font-bold uppercase text-xs transition-colors"
        >
          <ArrowLeft size={16} /> Cancelar
        </button>
        <div className="relative w-80 h-80 rounded-[4rem] border-4 border-yellow-500 overflow-hidden mb-10">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 z-10 scanner-line" />
        </div>
        <button
          onClick={tirarFoto}
          className="bg-yellow-600 px-12 py-5 rounded-3xl font-black uppercase flex items-center gap-3 shadow-xl shadow-yellow-900/40"
        >
          <Camera size={24} /> Escanear Agora
        </button>
        <canvas ref={canvasRef} width="400" height="400" className="hidden" />
        <ISDSignature />
      </div>
    );

  if (modo === "cliente_registro")
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6">
        <GlassContainer className="w-full max-w-lg space-y-8">
          <button
            onClick={() => setModo("selecao")}
            className="text-slate-500 flex items-center gap-2 font-bold uppercase text-[10px] transition-colors"
          >
            <ArrowLeft size={14} /> Início
          </button>
          <h2 className="text-4xl font-black uppercase text-center neon-yellow">
            Cadastro
          </h2>
          <div className="space-y-4">
            <input
              type="text"
              placeholder="NOME"
              className="w-full p-5 bg-slate-950 rounded-2xl text-white font-bold border border-white/5 outline-none focus:border-yellow-500"
              value={novoCliente.nome}
              onChange={(e) =>
                setNovoCliente({ ...novoCliente, nome: e.target.value })
              }
            />
            <input
              type="text"
              placeholder="SOBRENOME"
              className="w-full p-5 bg-slate-950 rounded-2xl text-white font-bold border border-white/5 outline-none focus:border-yellow-500"
              value={novoCliente.sobrenome}
              onChange={(e) =>
                setNovoCliente({ ...novoCliente, sobrenome: e.target.value })
              }
            />
            <input
              type="text"
              placeholder="WHATSAPP"
              className="w-full p-5 bg-slate-950 rounded-2xl text-white font-bold border border-white/5 outline-none focus:border-yellow-500"
              value={novoCliente.whatsapp}
              onChange={(e) =>
                setNovoCliente({ ...novoCliente, whatsapp: e.target.value })
              }
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            {["Cabelo", "Barba", "Completo"].map((s) => (
              <button
                key={s}
                onClick={() => setNovoCliente({ ...novoCliente, servico: s })}
                className={`py-4 rounded-xl font-black uppercase text-[10px] border transition-all ${
                  novoCliente.servico === s
                    ? "bg-yellow-500 text-slate-950"
                    : "bg-slate-900 text-slate-500"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => setModo("biometria")}
              className="p-6 bg-slate-900 border border-white/10 rounded-2xl text-slate-400 flex-1 flex items-center justify-center gap-3"
            >
              <Camera size={24} /> {novoCliente.foto ? "Alterar" : "Biometria"}
            </button>
            {novoCliente.foto && (
              <img
                src={novoCliente.foto}
                className="w-16 h-16 rounded-xl object-cover"
              />
            )}
          </div>
          <m.button
            disabled={!novoCliente.nome}
            onClick={() => setModo("barbeiro_choice")}
            className="w-full p-8 rounded-[2rem] font-black uppercase bg-yellow-600 text-white disabled:opacity-30"
          >
            Prosseguir
          </m.button>
        </GlassContainer>
        <EliteToasts toasts={toasts} />
      </div>
    );

  if (modo === "barbeiro_choice")
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-white text-center">
        <h2 className="text-5xl font-black mb-12 uppercase italic neon-yellow">
          Quem vai te atender?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
          <GlassContainer
            onClick={() => cadastrarCliente("Sem Preferência")}
            className="bg-yellow-600/10 border-yellow-500/20 flex flex-col items-center gap-2 cursor-pointer hover:bg-yellow-600"
          >
            <Zap size={32} className="text-yellow-500" />
            <span className="font-black text-xl uppercase">
              Sem Preferência
            </span>
          </GlassContainer>
          {profissionais
            .filter((p) => p.status === "disponivel")
            .map((p) => (
              <GlassContainer
                key={p.id}
                onClick={() => cadastrarCliente(p.nome)}
                className="flex flex-col items-center gap-2 cursor-pointer hover:border-yellow-500"
              >
                <Scissors size={24} className="text-yellow-500" />
                <span className="font-black text-xl uppercase">{p.nome}</span>
              </GlassContainer>
            ))}
        </div>
        <EliteToasts toasts={toasts} />
      </div>
    );

  if (modo === "painel")
    return (
      <div className="min-h-screen bg-slate-950 p-10 text-white flex flex-col overflow-hidden">
        <div className="flex justify-between items-center mb-12 border-b border-white/5 pb-8">
          <button
            onClick={() => setModo("selecao")}
            className="bg-slate-900 p-4 rounded-3xl text-slate-500"
          >
            <ArrowLeft size={32} />
          </button>
          <h1 className="text-5xl font-black italic neon-yellow">
            ELITE CARIOCA TV
          </h1>
          <div className="text-4xl font-black font-mono">
            {new Date().toLocaleTimeString()}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 flex-1">
          <GlassContainer className="bg-slate-900/30 border-blue-500/20 flex flex-col">
            <h3 className="text-center font-black text-blue-400 mb-8 pb-4 border-b border-white/5">
              Fila Geral
            </h3>
            {clientesFila
              .filter(
                (c) =>
                  c.barbeiroPref === "Sem Preferência" &&
                  c.status === "esperando"
              )
              .map((c) => (
                <div
                  key={c.id}
                  className="p-6 bg-slate-800 rounded-3xl text-center mb-4"
                >
                  <span className="text-2xl font-black block">
                    {c.nome.toUpperCase()}
                  </span>
                  <ServiceBadge servico={c.servico} />
                </div>
              ))}
          </GlassContainer>
          {profissionais
            .filter((p) => p.status !== "ausente")
            .map((p) => (
              <GlassContainer
                key={p.id}
                className="bg-slate-900/30 border-yellow-500/20 flex flex-col"
              >
                <h3 className="text-center font-black text-yellow-400 mb-8 pb-4 border-b border-white/5">
                  {p.nome}
                </h3>
                {clientesFila
                  .filter(
                    (c) => c.barbeiroPref === p.nome && c.status === "esperando"
                  )
                  .map((c, i) => (
                    <div
                      key={c.id}
                      className={`p-6 rounded-3xl text-center mb-4 ${
                        i === 0 ? "bg-yellow-600 shadow-lg" : "bg-slate-800"
                      }`}
                    >
                      <span className="text-2xl block">
                        {c.nome.toUpperCase()}
                      </span>
                      <ServiceBadge servico={c.servico} />
                    </div>
                  ))}
              </GlassContainer>
            ))}
        </div>
        <ISDSignature />
      </div>
    );

  if (modo === "admin_barbeiro" && barbeiroLogado) {
    const stats = getStats(barbeiroLogado.nome);
    return (
      <div className="min-h-screen bg-slate-950 p-8 flex flex-col items-center justify-center text-white">
        <GlassContainer className="w-full max-w-5xl space-y-10">
          <div className="flex justify-between items-center border-b border-white/5 pb-8">
            <h2 className="text-4xl font-black neon-yellow uppercase">
              {barbeiroLogado.nome}
            </h2>
            <div className="flex gap-4">
              <button
                onClick={() => setShowGanhosModal(true)}
                className="p-5 bg-blue-600/10 border border-blue-500/20 rounded-3xl text-blue-400 font-black uppercase text-[10px]"
              >
                Ganhos
              </button>
              <button
                onClick={() => setModo("selecao")}
                className="p-5 bg-slate-900 rounded-3xl text-red-500"
              >
                <LogOut size={24} />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {["disponivel", "ocupado", "ausente"].map((s) => (
              <button
                key={s}
                onClick={() => mudarStatus(s)}
                className={`p-6 rounded-[2rem] font-black uppercase border-2 ${
                  barbeiroLogado.status === s
                    ? "bg-emerald-600"
                    : "bg-slate-900 opacity-40"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-12">
            <div>
              <h3 className="font-black text-slate-500 mb-4 uppercase text-xs">
                Minha Fila
              </h3>
              {clientesFila
                .filter(
                  (c) =>
                    (c.barbeiroPref === barbeiroLogado.nome ||
                      c.barbeiroPref === "Sem Preferência") &&
                    c.status === "esperando"
                )
                .map((c) => (
                  <div
                    key={c.id}
                    className="p-6 bg-slate-900 rounded-3xl mb-4 flex justify-between items-center"
                  >
                    <span>{c.nome}</span>
                    <button
                      onClick={() => llamarCliente(c.id)}
                      className="bg-yellow-600 px-8 py-4 rounded-2xl text-[10px] font-black"
                    >
                      CHAMAR
                    </button>
                  </div>
                ))}
            </div>
            <div>
              <h3 className="font-black text-emerald-500 mb-4 uppercase text-xs">
                Atendimento
              </h3>
              {clientesFila
                .filter(
                  (c) =>
                    c.barbeiroPref === barbeiroLogado.nome &&
                    c.status === "atendendo"
                )
                .map((c) => (
                  <div
                    key={c.id}
                    className="p-10 bg-slate-900 rounded-3xl border-2 border-emerald-500 shadow-xl text-center"
                  >
                    <h4 className="text-4xl font-black mb-4">{c.nome}</h4>
                    <button
                      onClick={() => setCheckoutAtivo(c)}
                      className="w-full bg-emerald-600 p-8 rounded-[2rem] font-black shadow-xl"
                    >
                      FINALIZAR
                    </button>
                  </div>
                ))}
            </div>
          </div>
        </GlassContainer>
        {showGanhosModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
            <GlassContainer className="max-w-md w-full text-center">
              <div className="flex justify-between mb-8">
                <h3 className="text-2xl font-black">MEUS GANHOS</h3>
                <button onClick={() => setShowGanhosModal(false)}>
                  <X />
                </button>
              </div>
              <span className="text-5xl font-black text-emerald-400">
                {formatBRL(stats.totalHoje)}
              </span>
            </GlassContainer>
          </div>
        )}
        {checkoutAtivo && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
            <GlassContainer className="max-w-sm w-full text-center">
              <h3 className="text-3xl font-black mb-2 text-emerald-400">
                Checkout
              </h3>
              <input
                type="number"
                step="0.01"
                autoFocus
                className="bg-transparent text-5xl font-black text-center text-white w-full border-b border-emerald-500 mb-8 outline-none"
                value={valorInput}
                onChange={(e) => setValorInput(e.target.value)}
              />
              <div className="flex gap-4">
                <button
                  onClick={() => setCheckoutAtivo(null)}
                  className="flex-1 p-4 bg-slate-800 rounded-2xl"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmarFinalizacao}
                  className="flex-1 p-4 bg-emerald-600 rounded-2xl font-black shadow-xl"
                >
                  Confirmar
                </button>
              </div>
            </GlassContainer>
          </div>
        )}
        <EliteToasts toasts={toasts} />
      </div>
    );
  }

  if (modo === "gestao_master")
    return (
      <div className="min-h-screen bg-slate-950 p-8 text-white">
        <div className="max-w-7xl mx-auto w-full space-y-10">
          <div className="flex justify-between items-center">
            <button
              onClick={() => setModo("selecao")}
              className="bg-slate-900 px-6 py-4 rounded-3xl font-black uppercase text-[10px]"
            >
              <ArrowLeft size={16} />
            </button>
            <div className="p-4 bg-yellow-600 rounded-3xl">
              <Crown size={24} />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <GlassContainer>
              <h3 className="font-black text-yellow-500 mb-4 uppercase text-xs">
                Novo Barbeiro
              </h3>
              <input
                placeholder="NOME"
                className="w-full bg-slate-950 p-5 rounded-2xl mb-4"
                value={novoProf.nome}
                onChange={(e) =>
                  setNovoProf({ ...novoProf, nome: e.target.value })
                }
              />
              <input
                placeholder="MATRÍCULA"
                className="w-full bg-slate-950 p-5 rounded-2xl mb-4"
                value={novoProf.matricula}
                onChange={(e) =>
                  setNovoProf({ ...novoProf, matricula: e.target.value })
                }
              />
              <button
                onClick={async () => {
                  await db
                    .collection("profissionais")
                    .add({ ...novoProf, status: "ausente" });
                  setNovoProf({ nome: "", matricula: "" });
                  addToast("Barbeiro salvo!", "sucesso");
                }}
                className="w-full bg-yellow-600 p-6 rounded-2xl font-black"
              >
                SALVAR
              </button>
            </GlassContainer>
            <GlassContainer>
              <h3 className="font-black mb-4 uppercase text-xs">Equipe</h3>
              <div className="space-y-4 h-64 overflow-y-auto">
                {profissionais.map((p) => (
                  <div
                    key={p.id}
                    className="p-4 bg-slate-950 rounded-xl flex justify-between items-center"
                  >
                    <span>{p.nome}</span>
                    <button
                      onClick={() =>
                        db.collection("profissionais").doc(p.id).delete()
                      }
                      className="text-red-500"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            </GlassContainer>
          </div>
          <GlassContainer>
            <h3 className="font-black mb-8 uppercase text-xs">
              Histórico Detalhado
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/5 opacity-50 uppercase text-[10px]">
                    <th>Cliente</th>
                    <th>Barbeiro</th>
                    <th>Valor</th>
                    <th>Hora</th>
                  </tr>
                </thead>
                <tbody>
                  {historicoAtendimentos.map((h) => (
                    <tr key={h.id} className="border-b border-white/5 py-4">
                      <td className="py-4 font-black">{h.nome}</td>
                      <td>{h.barbeiro}</td>
                      <td className="text-emerald-400 font-black">
                        {formatBRL(h.valor || 0)}
                      </td>
                      <td className="opacity-50 font-mono">
                        {h.dataConclusao?.toDate().toLocaleTimeString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassContainer>
        </div>
        <EliteToasts toasts={toasts} />
      </div>
    );

  return null;
};

const EliteToasts = ({ toasts }: { toasts: any[] }) => {
  const m = motion as any;
  return (
    <div className="fixed top-10 right-10 z-[200] flex flex-col gap-4">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <m.div
            key={toast.id}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
            className={`glass-slim p-6 rounded-3xl border flex items-center gap-4 ${
              toast.type === "sucesso"
                ? "border-emerald-500/30"
                : toast.type === "erro"
                ? "border-red-500/30"
                : "border-blue-500/30"
            }`}
          >
            <p className="text-xs font-black uppercase text-white/90">
              {toast.message}
            </p>
          </m.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default App;
