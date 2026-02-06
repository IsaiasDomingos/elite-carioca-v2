import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Tv,
  Camera,
  Lock,
  ArrowLeft,
  LogOut,
  Scissors,
  Crown,
  Trash2,
  Clock,
  Users,
  Zap,
  Code2,
  Circle,
  Check,
  Info,
  AlertCircle,
  Banknote,
  Calendar,
  TrendingUp,
  X,
} from "lucide-react";
import firebase from "firebase/compat/app";
import "firebase/compat/firestore";

// Chaves extraídas da sua foto real do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAU5crOPK6roszFly_pyl0G7CcsYFvjm6U",
  authDomain: "sistema-barbearia-acb02.firebaseapp.com",
  projectId: "sistema-barbearia-acb02",
  storageBucket: "sistema-barbearia-acb02.firebasestorage.app",
  messagingSenderId: "149768423148",
  appId: "1:149768423148:web:59189c3c1912ab98d847c9",
};

if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

const GlassContainer = ({ children, className = "", onClick }: any) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.98 }}
    animate={{ opacity: 1, scale: 1 }}
    onClick={onClick}
    className={`glass rounded-[2.5rem] p-8 transition-all ${className}`}
  >
    {children}
  </motion.div>
);

const App: React.FC = () => {
  const [modo, setModo] = useState<any>("selecao");
  const [clientesFila, setClientesFila] = useState<any[]>([]);
  const [profissionais, setProfissionais] = useState<any[]>([]);
  const [historicoAtendimentos, setHistoricoAtendimentos] = useState<any[]>([]);
  const [barbeiroLogado, setBarbeiroLogado] = useState<any>(null);
  const [checkoutAtivo, setCheckoutAtivo] = useState<any>(null);
  const [valorInput, setValorInput] = useState("50.00");
  const [showGanhosModal, setShowGanhosModal] = useState(false);
  const [toasts, setToasts] = useState<any[]>([]);
  const [acessoInput, setAcessoInput] = useState("");
  const [novoCliente, setNovoCliente] = useState({
    nome: "",
    sobrenome: "",
    whatsapp: "",
    foto: "",
    barbeiroPref: "Sem Preferência",
    servico: "Cabelo",
  });
  const [novoProf, setNovoProf] = useState({ nome: "", matricula: "" });
  const audioRef = useRef<any>(null);

  const addToast = (m: string, t: any = "info") => {
    const id = Date.now();
    setToasts((p) => [...p, { id, message: m, type: t }]);
    setTimeout(() => setToasts((p) => p.filter((x) => x.id !== id)), 4000);
  };

  useEffect(() => {
    audioRef.current = new Audio(
      "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3"
    );
    db.collection("fila_paiva")
      .orderBy("chegada", "asc")
      .onSnapshot((s) =>
        setClientesFila(s.docs.map((d) => ({ id: d.id, ...d.data() })))
      );
    db.collection("profissionais").onSnapshot((s) =>
      setProfissionais(s.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    db.collection("historico_paiva")
      .orderBy("dataConclusao", "desc")
      .limit(50)
      .onSnapshot((s) =>
        setHistoricoAtendimentos(s.docs.map((d) => ({ id: d.id, ...d.data() })))
      );
  }, []);

  const handleAcesso = () => {
    if (acessoInput === "123456") {
      setModo("gestao_master");
      setAcessoInput("");
      return;
    }
    const p = profissionais.find((x) => x.matricula === acessoInput);
    if (p) {
      setBarbeiroLogado(p);
      setModo("admin_barbeiro");
      setAcessoInput("");
    } else addToast("Acesso Negado", "erro");
  };

  // --- RENDERS DAS TELAS ---
  if (modo === "selecao")
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-between p-12 text-white text-center">
        <div className="pt-10">
          <h1 className="text-7xl font-black neon-yellow">ELITE CARIOCA</h1>
          <p className="text-blue-500 tracking-widest uppercase text-xs">
            Luxury Barber Experience
          </p>
        </div>
        <button
          onClick={() => setModo("cliente_registro")}
          className="glass h-64 w-64 rounded-[4rem] flex flex-col items-center justify-center border-2 border-yellow-500/30"
        >
          <Scissors size={80} className="text-yellow-500 mb-4" />
          <span className="font-black text-2xl uppercase">Quero Cortar</span>
        </button>
        <div className="w-full flex justify-between items-end">
          <button
            onClick={() => setModo("painel")}
            className="opacity-20 hover:opacity-100"
          >
            <Tv />
          </button>
          <div className="glass px-4 py-2 rounded-2xl flex gap-2">
            <input
              type="password"
              placeholder="PIN"
              className="w-20 bg-transparent outline-none text-xs"
              value={acessoInput}
              onChange={(e) => setAcessoInput(e.target.value)}
              onKeyDown={(k) => k.key === "Enter" && handleAcesso()}
            />
            <button
              onClick={handleAcesso}
              className="text-blue-500 font-black text-xs"
            >
              OK
            </button>
          </div>
        </div>
      </div>
    );

  if (modo === "cliente_registro")
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-white">
        <GlassContainer className="w-full max-w-lg space-y-6">
          <button
            onClick={() => setModo("selecao")}
            className="text-xs flex items-center gap-2"
          >
            <ArrowLeft size={14} /> VOLTAR
          </button>
          <h2 className="text-4xl font-black neon-yellow text-center uppercase">
            Cadastro
          </h2>
          <input
            type="text"
            placeholder="NOME"
            className="w-full p-4 bg-slate-900 rounded-xl outline-none"
            value={novoCliente.nome}
            onChange={(e) =>
              setNovoCliente({ ...novoCliente, nome: e.target.value })
            }
          />
          <div className="grid grid-cols-3 gap-2">
            {["Cabelo", "Barba", "Completo"].map((s) => (
              <button
                key={s}
                onClick={() => setNovoCliente({ ...novoCliente, servico: s })}
                className={`py-3 rounded-xl font-bold text-xs ${
                  novoCliente.servico === s
                    ? "bg-yellow-500 text-black"
                    : "bg-slate-800"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
          <button
            disabled={!novoCliente.nome}
            onClick={() => setModo("barbeiro_choice")}
            className="w-full p-6 bg-yellow-600 rounded-2xl font-black uppercase disabled:opacity-30"
          >
            Prosseguir
          </button>
        </GlassContainer>
      </div>
    );

  if (modo === "barbeiro_choice")
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-white text-center">
        <h2 className="text-4xl font-black mb-10 neon-yellow">
          ESCOLHA O BARBEIRO
        </h2>
        <div className="grid grid-cols-2 gap-4 w-full max-w-lg">
          <button
            onClick={() => {
              db.collection("fila_paiva").add({
                ...novoCliente,
                barbeiroPref: "Sem Preferência",
                chegada: firebase.firestore.Timestamp.now(),
                status: "esperando",
              });
              setModo("selecao");
              addToast("Você entrou na fila!", "sucesso");
            }}
            className="glass p-8 flex flex-col items-center gap-2"
          >
            <Zap className="text-yellow-500" /> Sem Preferência
          </button>
          {profissionais
            .filter((p) => p.status === "disponivel")
            .map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  db.collection("fila_paiva").add({
                    ...novoCliente,
                    barbeiroPref: p.nome,
                    chegada: firebase.firestore.Timestamp.now(),
                    status: "esperando",
                  });
                  setModo("selecao");
                  addToast(`Fila de ${p.nome}`, "sucesso");
                }}
                className="glass p-8 flex flex-col items-center gap-2"
              >
                <Scissors className="text-yellow-500" /> {p.nome}
              </button>
            ))}
        </div>
      </div>
    );

  if (modo === "painel")
    return (
      <div className="min-h-screen bg-slate-950 p-10 text-white flex flex-col">
        <div className="flex justify-between items-center mb-10">
          <button onClick={() => setModo("selecao")}>
            <ArrowLeft />
          </button>
          <h1 className="text-5xl font-black neon-yellow uppercase">
            TV Dashboard
          </h1>
        </div>
        <div className="grid grid-cols-4 gap-6">
          <GlassContainer className="border-blue-500/20">
            <h3>GERAL</h3>
            {clientesFila
              .filter(
                (c) =>
                  c.barbeiroPref === "Sem Preferência" &&
                  c.status === "esperando"
              )
              .map((c) => (
                <div key={c.id} className="p-4 bg-slate-800 rounded-xl mt-2">
                  {c.nome}
                </div>
              ))}
          </GlassContainer>
          {profissionais
            .filter((p) => p.status !== "ausente")
            .map((p) => (
              <GlassContainer key={p.id}>
                <h3>{p.nome}</h3>
                {clientesFila
                  .filter(
                    (c) => c.barbeiroPref === p.nome && c.status === "esperando"
                  )
                  .map((c) => (
                    <div
                      key={c.id}
                      className="p-4 bg-yellow-600 rounded-xl mt-2"
                    >
                      {c.nome}
                    </div>
                  ))}
              </GlassContainer>
            ))}
        </div>
      </div>
    );

  if (modo === "gestao_master")
    return (
      <div className="min-h-screen bg-slate-950 p-10 text-white">
        <button
          onClick={() => setModo("selecao")}
          className="mb-6 flex items-center gap-2 uppercase text-xs font-bold"
        >
          <ArrowLeft size={14} /> VOLTAR
        </button>
        <div className="grid grid-cols-2 gap-10">
          <GlassContainer>
            <h3 className="neon-yellow mb-4 uppercase text-xs font-black">
              Novo Barbeiro
            </h3>
            <input
              placeholder="NOME"
              className="w-full p-4 bg-slate-900 rounded-xl mb-4"
              value={novoProf.nome}
              onChange={(e) =>
                setNovoProf({ ...novoProf, nome: e.target.value })
              }
            />
            <input
              placeholder="MATRÍCULA"
              className="w-full p-4 bg-slate-900 rounded-xl mb-4"
              value={novoProf.matricula}
              onChange={(e) =>
                setNovoProf({ ...novoProf, matricula: e.target.value })
              }
            />
            <button
              onClick={() => {
                db.collection("profissionais").add({
                  ...novoProf,
                  status: "ausente",
                });
                setNovoProf({ nome: "", matricula: "" });
                addToast("Salvo!");
              }}
              className="w-full p-4 bg-yellow-600 rounded-xl font-bold uppercase"
            >
              SALVAR
            </button>
          </GlassContainer>
          <GlassContainer>
            <h3 className="mb-4 uppercase text-xs font-black">
              Histórico Financeiro
            </h3>
            <button
              onClick={() => {
                if (confirm("Limpar histórico?"))
                  db.collection("historico_paiva")
                    .get()
                    .then((s) => s.docs.forEach((d) => d.ref.delete()));
              }}
              className="text-red-500 text-[10px] mb-4 uppercase font-bold"
            >
              Zerar Histórico
            </button>
            <div className="h-64 overflow-auto text-xs">
              {historicoAtendimentos.map((h) => (
                <div
                  key={h.id}
                  className="border-b border-white/5 py-2 flex justify-between"
                >
                  <span>{h.nome}</span>
                  <span className="text-emerald-400">R$ {h.valor}</span>
                </div>
              ))}
            </div>
          </GlassContainer>
        </div>
      </div>
    );

  if (modo === "admin_barbeiro" && barbeiroLogado)
    return (
      <div className="min-h-screen bg-slate-950 p-10 text-white uppercase font-black">
        <div className="flex justify-between items-center mb-8">
          <h2>{barbeiroLogado.nome}</h2>
          <button onClick={() => setModo("selecao")}>
            <LogOut />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-8">
          <GlassContainer>
            <h3>FILA</h3>
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
                  className="p-4 bg-slate-900 mt-2 flex justify-between items-center"
                >
                  {c.nome}
                  <button
                    onClick={() =>
                      db
                        .collection("fila_paiva")
                        .doc(c.id)
                        .update({
                          status: "atendendo",
                          barbeiroPref: barbeiroLogado.nome,
                        })
                    }
                    className="bg-yellow-600 px-3 py-1 rounded text-xs"
                  >
                    CHAMAR
                  </button>
                </div>
              ))}
          </GlassContainer>
          <GlassContainer>
            <h3>EM ATENDIMENTO</h3>
            {clientesFila
              .filter(
                (c) =>
                  c.barbeiroPref === barbeiroLogado.nome &&
                  c.status === "atendendo"
              )
              .map((c) => (
                <div
                  key={c.id}
                  className="p-6 bg-slate-800 border-2 border-emerald-500 rounded-2xl"
                >
                  <h4>{c.nome}</h4>
                  <button
                    onClick={() => setCheckoutAtivo(c)}
                    className="w-full bg-emerald-600 p-4 mt-4 rounded-xl"
                  >
                    FINALIZAR
                  </button>
                </div>
              ))}
          </GlassContainer>
        </div>
        {checkoutAtivo && (
          <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-6">
            <div className="glass p-10 text-center">
              <h3 className="mb-4">VALOR DO SERVIÇO</h3>
              <input
                type="number"
                className="bg-transparent text-4xl text-center border-b mb-6 outline-none"
                value={valorInput}
                onChange={(e) => setValorInput(e.target.value)}
              />
              <div className="flex gap-4">
                <button onClick={() => setCheckoutAtivo(null)}>CANCELAR</button>
                <button
                  onClick={() => {
                    db.collection("historico_paiva").add({
                      nome: checkoutAtivo.nome,
                      barbeiro: barbeiroLogado.nome,
                      valor: parseFloat(valorInput),
                      dataConclusao: firebase.firestore.Timestamp.now(),
                    });
                    db.collection("fila_paiva").doc(checkoutAtivo.id).delete();
                    setCheckoutAtivo(null);
                    addToast("Finalizado!");
                  }}
                  className="bg-emerald-600 p-4 rounded-xl"
                >
                  CONFIRMAR
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );

  return null;
};
export default App;
