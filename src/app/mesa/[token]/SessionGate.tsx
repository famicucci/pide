"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/ui/logo";
import { MenuClient } from "./MenuClient";

interface Props {
  tableId: number;
  tableName: string;
  tableToken: string;
}

interface StoredSession {
  name: string;
  sessionId: string;
}

function storageKey(token: string) {
  return `mesa-session-${token}`;
}

function getStored(token: string): StoredSession | null {
  try {
    const raw = sessionStorage.getItem(storageKey(token));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveStored(token: string, session: StoredSession) {
  sessionStorage.setItem(storageKey(token), JSON.stringify(session));
}

function clearStored(token: string) {
  sessionStorage.removeItem(storageKey(token));
}

type State = "loading" | "gate" | "verified";

export function SessionGate({ tableId, tableName, tableToken }: Props) {
  const [state, setState] = useState<State>("loading");
  const [tableOpen, setTableOpen] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function check() {
      const stored = getStored(tableToken);

      if (stored) {
        // Re-validate: send both name and sessionId
        // If the table was closed and reopened with the same name, the sessionId will differ → 403
        const res = await fetch(`/api/mesa/${tableToken}/session`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: stored.name, sessionId: stored.sessionId }),
        });
        if (res.ok) {
          setState("verified");
          return;
        }
        clearStored(tableToken);
      }

      // Check if table is open or closed to show the right prompt
      const statusRes = await fetch(`/api/mesa/${tableToken}/status`);
      if (statusRes.ok) {
        const data = await statusRes.json();
        setTableOpen(data.is_open === 1);
      }
      setState("gate");
    }

    check().catch(() => setState("gate"));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tableToken]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    setError("");

    const res = await fetch(`/api/mesa/${tableToken}/session`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim() }),
    });

    setSubmitting(false);

    if (res.ok) {
      const data = await res.json();
      saveStored(tableToken, { name: name.trim().toLowerCase(), sessionId: data.sessionId });
      setState("verified");
    } else {
      setError("Nombre incorrecto. Preguntale a quien abrió la mesa.");
    }
  }

  if (state === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (state === "verified") {
    return <MenuClient tableId={tableId} tableName={tableName} tableToken={tableToken} />;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center space-y-2">
          <Logo className="mx-auto mb-4" />
          <p className="text-muted-foreground text-sm font-medium">{tableName}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <p className="font-semibold text-lg text-center">
              {tableOpen ? "¿Cuál es el nombre de tu mesa?" : "Creá un nombre para tu grupo"}
            </p>
            <p className="text-muted-foreground text-sm text-center">
              {tableOpen
                ? "Preguntale a quien la abrió."
                : "Toda la mesa va a necesitarlo para pedir."}
            </p>
          </div>

          <Input
            autoFocus
            placeholder={tableOpen ? "Nombre del grupo..." : "Ej: Martinez, cumple, mesa5..."}
            value={name}
            onChange={(e) => { setName(e.target.value); setError(""); }}
          />

          {error && (
            <p className="text-destructive text-sm text-center">{error}</p>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={!name.trim() || submitting}
          >
            {submitting ? "Verificando..." : tableOpen ? "Entrar" : "Abrir mesa"}
          </Button>
        </form>
      </div>
    </div>
  );
}
